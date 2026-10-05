#!/usr/bin/env node
/**
 * Build the museum directory from Wikidata and upsert it into Supabase.
 *
 * Runs monthly from .github/workflows/update-museums.yml, or by hand:
 *
 *   SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node tools/update-museums.mjs
 *
 *   node tools/update-museums.mjs --dry-run      # build only, print a summary
 *   node tools/update-museums.mjs --min 268      # a different painting floor
 *
 * What it does, in order:
 *   1. One SPARQL aggregate: paintings per collection (P195), collections with
 *      >= MIN paintings. A second aggregate counts those with an image (P18).
 *   2. wbgetentities in batches of 50 for each collection: label, coordinates
 *      (P625), country (P17), city (P131, its label), website (P856), kind (P31).
 *   3. Keep the ones that are places: coordinates present, not dissolved
 *      (P576 absent). This drops agencies, auction houses and private
 *      collections that hold paintings but cannot be visited.
 *   4. Upsert into public.museums (service role) and write src/data/museums.json
 *      as the offline fallback the app ships.
 *
 * No dependencies beyond Node 20 (global fetch).
 */

import { writeFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const USER_AGENT =
  'PaletteMuseumDirectory/1.0 (https://github.com/zoha-rakotomalala/Mithra; monthly museum directory)';
const SPARQL = 'https://query.wikidata.org/sparql';
const API = 'https://www.wikidata.org/w/api.php';
const LANGUAGES = ['en', 'fr', 'nl', 'de', 'es', 'it'];
const BATCH = 50;
const BACKOFF_MS = [90_000, 180_000, 360_000, 600_000];

/**
 * P131 ("located in the administrative territorial entity") points at the
 * lowest unit Wikidata has: Manhattan, a Beijing subdistrict, a Warsaw
 * district. Walk up the P131 chain until an item of a city-like class.
 */
const CITY_CLASSES = new Set([
  'Q515', // city
  'Q1549591', // big city
  'Q5119', // capital city
  'Q1637706', // million city
  'Q3957', // town
  'Q7930989', // city or town
  'Q532', // village
  'Q15284', // municipality
  'Q484170', // commune of France
  'Q2039348', // municipality of the Netherlands
  'Q262166', // municipality in Germany
  'Q747074', // comune of Italy
  'Q2074737', // municipality of Spain
  'Q70208', // municipality of Switzerland
  'Q493522', // municipality of Belgium
  'Q2616791', // urban municipality of Poland
  'Q1093829', // city in the United States
  'Q15127012', // town in the United States
]);
const CITY_CLIMB_LEVELS = 5;
const CITY_CLIMB_WIDTH = 4; // P131 parents followed per item per level

/** Collections that hold paintings but are not places a visitor can enter. */
const NOT_A_MUSEUM = new Set([
  'Q2668072', // collection (a holding, not a building)
  'Q7328910', // art collection
  'Q327333', // government agency
  'Q2659904', // government organization
  'Q4830453', // business
  'Q783794', // company
  'Q708676', // charitable organization
  'Q7210356', // political organization
  'Q31855', // research institute
  'Q3918', // university (campus galleries are listed separately)
]);

/**
 * Collections that are not the place but a part of it: the Louvre files its
 * paintings under "Department of Paintings of the Louvre", the Louvre itself
 * carries 8. Their counts roll up to the museum they are part of (P361), and
 * their Q-id joins the museum's collection_qids, which is what the Wikidata
 * search filter needs to find the paintings.
 */
const UMBRELLA_KINDS = new Set([
  'Q7328910', // art collection
  'Q11681271', // curatorial department of the Louvre
]);
const MUSEUM_KINDS = new Set([
  'Q33506', // museum
  'Q207694', // art museum
  'Q17431399', // national museum
  'Q3329412', // archaeological museum
]);
const isUmbrella = (m) =>
  m.kinds.some((k) => UMBRELLA_KINDS.has(k)) ||
  (m.partOf !== undefined && !m.kinds.some((k) => MUSEUM_KINDS.has(k)));

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const MIN = Number.parseInt(args[args.indexOf('--min') + 1], 10) || 100; // paintings per museum

const here = path.dirname(fileURLToPath(import.meta.url));
const FALLBACK_PATH = path.resolve(here, '..', 'src', 'data', 'museums.json');

// ---------------------------------------------------------------------------
// HTTP with a wall-clock deadline and escalating back-off on 429 / 5xx
// ---------------------------------------------------------------------------

async function fetchWithRetry(url, init, { deadlineMs = 120_000 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), deadlineMs);
    try {
      const response = await fetch(url, {
        ...init,
        headers: { 'User-Agent': USER_AGENT, ...(init?.headers ?? {}) },
        signal: controller.signal,
      });
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get('retry-after')) * 1000;
        const wait =
          retryAfter || BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
        if (attempt >= BACKOFF_MS.length) {
          throw new Error(
            `${response.status} from ${url} after ${attempt} retries`,
          );
        }
        console.warn(`  ${response.status}, sleeping ${wait / 1000}s`);
        await sleep(wait);
        continue;
      }
      if (!response.ok) {
        throw new Error(
          `${response.status} ${response.statusText} from ${url}`,
        );
      }
      return response;
    } finally {
      clearTimeout(timer);
    }
  }
}

async function sparql(query) {
  const started = Date.now();
  const response = await fetchWithRetry(SPARQL, {
    method: 'POST',
    headers: {
      Accept: 'application/sparql-results+json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `query=${encodeURIComponent(query)}`,
  });
  const data = await response.json();
  console.log(`  sparql ${((Date.now() - started) / 1000).toFixed(1)}s`);
  return data.results.bindings;
}

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  const response = await fetchWithRetry(
    url,
    { headers: { Accept: 'application/json' } },
    {
      deadlineMs: 60_000,
    },
  );
  return response.json();
}

const qidOf = (uri) => uri.slice(uri.lastIndexOf('/') + 1);

// ---------------------------------------------------------------------------
// 1. Counts per collection
// ---------------------------------------------------------------------------

async function paintingCounts() {
  console.log(`1. paintings per collection (>= ${MIN})`);
  const rows = await sparql(`
    SELECT ?museum (COUNT(?p) AS ?n) WHERE { ?p wdt:P31 wd:Q3305213; wdt:P195 ?museum. }
    GROUP BY ?museum HAVING (COUNT(?p) >= ${MIN}) ORDER BY DESC(?n)`);
  const counts = new Map(
    rows.map((r) => [qidOf(r.museum.value), Number(r.n.value)]),
  );
  console.log(`   ${counts.size} collections`);

  console.log('   ...with an image');
  const withImage = await sparql(`
    SELECT ?museum (COUNT(?p) AS ?n) WHERE { ?p wdt:P31 wd:Q3305213; wdt:P195 ?museum; wdt:P18 ?i. }
    GROUP BY ?museum HAVING (COUNT(?p) >= ${Math.max(1, Math.floor(MIN / 10))})`);
  const images = new Map(
    withImage.map((r) => [qidOf(r.museum.value), Number(r.n.value)]),
  );
  return { counts, images };
}

// ---------------------------------------------------------------------------
// 2. Details per collection
// ---------------------------------------------------------------------------

function firstClaim(entity, property) {
  const claims = (entity.claims?.[property] ?? []).filter(
    (c) => c.rank !== 'deprecated',
  );
  const preferred = claims.find((c) => c.rank === 'preferred');
  return (preferred ?? claims[0])?.mainsnak?.datavalue?.value;
}

function pickLabel(labels) {
  for (const lang of LANGUAGES)
    if (labels?.[lang]?.value) return labels[lang].value;
  return Object.values(labels ?? {})[0]?.value;
}

async function entities(ids, props) {
  const out = {};
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const data = await api({
      action: 'wbgetentities',
      ids: batch.join('|'),
      props,
      languages: LANGUAGES.join('|'),
    });
    Object.assign(out, data.entities ?? {});
  }
  return out;
}

async function museumDetails(qids) {
  console.log(`2. details for ${qids.length} collections`);
  const records = await entities(qids, 'labels|claims');

  const referenced = new Set();
  const raw = [];
  for (const qid of qids) {
    const entity = records[qid];
    if (!entity || entity.missing !== undefined) continue;
    const coords = firstClaim(entity, 'P625');
    const countryId = firstClaim(entity, 'P17')?.id;
    const cityId = firstClaim(entity, 'P131')?.id;
    // P576 dissolved, or P582 end time: the Munich Central Collecting Point
    // closed in 1951 and still holds 14,767 paintings on Wikidata.
    const dissolved =
      firstClaim(entity, 'P576') !== undefined ||
      firstClaim(entity, 'P582') !== undefined;
    const kinds = (entity.claims?.P31 ?? [])
      .map((c) => c.mainsnak?.datavalue?.value?.id)
      .filter(Boolean);
    if (countryId) referenced.add(countryId);
    raw.push({
      qid,
      name: pickLabel(entity.labels),
      lat: coords?.latitude,
      lng: coords?.longitude,
      countryId,
      cityId,
      kinds,
      partOf: firstClaim(entity, 'P361')?.id,
      hasParts: (entity.claims?.P527 ?? [])
        .map((c) => c.mainsnak?.datavalue?.value?.id)
        .filter(Boolean),
      website: firstClaim(entity, 'P856'),
      dissolved,
    });
  }

  const cityOf = await climbToCities(raw.map((m) => m.cityId).filter(Boolean));
  for (const id of Object.values(cityOf)) referenced.add(id);

  console.log(`   labels for ${referenced.size} countries and cities`);
  const labels = await entities([...referenced], 'labels');
  const labelOf = (id) => (id ? pickLabel(labels[id]?.labels) : undefined);

  return raw.map((m) => ({
    qid: m.qid,
    name: m.name,
    city: labelOf(m.cityId ? cityOf[m.cityId] : undefined),
    country: labelOf(m.countryId),
    lat: m.lat,
    lng: m.lng,
    kinds: m.kinds,
    partOf: m.partOf,
    hasParts: m.hasParts,
    website: m.website,
    dissolved: m.dissolved,
  }));
}

/**
 * Fold umbrella collections into the museums they belong to. Returns the
 * museums list with counts adjusted and collection_qids filled; umbrellas
 * with a parent are removed, parents missing from the list are fetched.
 */
async function rollUpUmbrellas(museums, counts, images) {
  const byQid = new Map(
    museums.map((m) => [m.qid, { ...m, collectionQids: [m.qid] }]),
  );
  const umbrellas = museums.filter(isUmbrella);

  const missingParents = [
    ...new Set(
      umbrellas.map((u) => u.partOf).filter((p) => p && !byQid.has(p)),
    ),
  ];
  if (missingParents.length > 0) {
    console.log(
      `   fetching ${missingParents.length} parent museums below the floor`,
    );
    for (const parent of await museumDetails(missingParents)) {
      byQid.set(parent.qid, { ...parent, collectionQids: [parent.qid] });
    }
  }

  let rolled = 0;
  let shared = 0;
  for (const u of umbrellas) {
    if (u.partOf && byQid.has(u.partOf)) {
      const parent = byQid.get(u.partOf);
      counts.set(
        parent.qid,
        (counts.get(parent.qid) ?? 0) + (counts.get(u.qid) ?? 0),
      );
      images.set(
        parent.qid,
        (images.get(parent.qid) ?? 0) + (images.get(u.qid) ?? 0),
      );
      parent.collectionQids.push(u.qid);
      byQid.delete(u.qid);
      rolled++;
    } else if (u.hasParts.length > 0) {
      // A collection spread over several museums (the Bavarian State Painting
      // Collections over the Pinakotheken): each part searches it too. The
      // count cannot be split, so the parts keep their own counts.
      for (const part of u.hasParts) {
        if (byQid.has(part)) {
          byQid.get(part).collectionQids.push(u.qid);
          shared++;
        }
      }
      byQid.delete(u.qid);
    }
    // An umbrella with neither a parent nor parts falls through to the place
    // check, where it is kept if it has coordinates and is not an agency.
  }
  console.log(
    `   rolled ${rolled} departments into their museum, ${shared} shared collections attached`,
  );
  return [...byQid.values()];
}

/**
 * For each starting P131 item, the first item up its P131 chain whose P31 is
 * a city-like class; the starting item itself when none is found within
 * CITY_CLIMB_LEVELS. Returns { startId: cityId }.
 */
async function climbToCities(startIds) {
  const unique = [...new Set(startIds)];
  const resolved = {};
  // startId -> candidate items at the current level. An arrondissement lists
  // both Paris and "Paris Centre" as P131, so every parent is followed, not
  // only the preferred one.
  let frontier = new Map(unique.map((id) => [id, [id]]));
  for (let level = 0; level < CITY_CLIMB_LEVELS && frontier.size > 0; level++) {
    const ids = [...new Set([...frontier.values()].flat())];
    const items = await entities(ids, 'claims');
    const next = new Map();
    for (const [startId, candidates] of frontier) {
      const city = candidates.find((id) =>
        (items[id]?.claims?.P31 ?? []).some((c) =>
          CITY_CLASSES.has(c.mainsnak?.datavalue?.value?.id),
        ),
      );
      if (city) {
        resolved[startId] = city;
        continue;
      }
      const parents = candidates
        .flatMap((id) =>
          (items[id]?.claims?.P131 ?? []).map(
            (c) => c.mainsnak?.datavalue?.value?.id,
          ),
        )
        .filter(Boolean)
        .slice(0, CITY_CLIMB_WIDTH);
      if (parents.length > 0) next.set(startId, [...new Set(parents)]);
      else resolved[startId] = startId;
    }
    frontier = next;
  }
  for (const startId of frontier.keys()) resolved[startId] = startId; // gave up: keep the original
  const climbed = Object.entries(resolved).filter(
    ([start, city]) => start !== city,
  ).length;
  console.log(`   cities: ${climbed} of ${unique.length} climbed to a city`);
  return resolved;
}

// ---------------------------------------------------------------------------
// 3. Keep the places
// ---------------------------------------------------------------------------

function keepVisitable(museums, counts, images) {
  const kept = [];
  const dropped = { noName: 0, noCoordinates: 0, dissolved: 0, notAMuseum: 0 };
  for (const m of museums) {
    if (!m.name) dropped.noName++;
    else if (m.lat === undefined || m.lng === undefined)
      dropped.noCoordinates++;
    else if (m.dissolved) dropped.dissolved++;
    else if (
      m.kinds.some((k) => NOT_A_MUSEUM.has(k)) &&
      !m.kinds.some((k) => MUSEUM_KINDS.has(k))
    )
      dropped.notAMuseum++;
    else {
      kept.push({
        qid: m.qid,
        name: m.name,
        city: m.city ?? null,
        country: m.country ?? null,
        lat: m.lat,
        lng: m.lng,
        painting_count: counts.get(m.qid) ?? 0,
        image_count: images.get(m.qid) ?? 0,
        collection_qids: m.collectionQids,
        website: m.website ?? null,
      });
    }
  }
  kept.sort((a, b) => b.painting_count - a.painting_count);
  console.log(`3. kept ${kept.length}; dropped ${JSON.stringify(dropped)}`);
  return kept;
}

// ---------------------------------------------------------------------------
// 4. Write
// ---------------------------------------------------------------------------

async function upsert(rows) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (or pass --dry-run)',
    );
  }
  console.log(
    `4. upserting ${rows.length} rows into ${new URL(url).host}/museums`,
  );
  const now = new Date().toISOString();
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows
      .slice(i, i + 500)
      .map((r) => ({ ...r, updated_at: now }));
    const response = await fetch(`${url}/rest/v1/museums?on_conflict=qid`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(batch),
    });
    if (!response.ok) {
      throw new Error(
        `upsert failed: ${response.status} ${await response.text()}`,
      );
    }
  }
  // Rows no longer meeting the floor are kept, not deleted: a museum that
  // dips under MIN one month should not vanish from users' directories.
}

async function main() {
  const started = Date.now();
  const { counts, images } = await paintingCounts();
  const details = await museumDetails([...counts.keys()]);
  const folded = await rollUpUmbrellas(details, counts, images);
  const museums = keepVisitable(folded, counts, images);

  await writeFile(
    FALLBACK_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), minPaintings: MIN, museums }, null, 1)}\n`,
  );
  console.log(`   wrote ${path.relative(process.cwd(), FALLBACK_PATH)}`);

  if (DRY_RUN) {
    console.log('   --dry-run: not writing to Supabase');
  } else {
    await upsert(museums);
  }

  console.log(`done in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  for (const m of museums.slice(0, 10)) {
    console.log(
      `  ${String(m.painting_count).padStart(6)}  ${m.name}  (${m.city ?? '?'}, ${m.country ?? '?'})`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

# Palette: every museum, scan first. Design note

Date: 2026-10-02. Status: proposal, no app code changed.
Replaces `shipped-catalog-design.md` (rejected: a shipped catalog is a second database to maintain,
and not solid enough for a public app).

## 1. The problem, in Zoha's words

- More than half of the 14 museum APIs do not work. Growing the app means more APIs, and most
  museums do not have one. An app that works in three museums cannot be marketed.
- As a user, taking a photo and having the painting recognised is easier than searching by name.

## 2. What Wikidata knows (measured 2026-10-02)

Wikidata is a free, keyless, public database. Every entry has a stable id (a *Q-id*, like
`Q219831` for *The Night Watch*). Paintings are entries of type `painting` (`P31 = Q3305213`).
Each painting can carry: painter (`P170`), date (`P571`), collection it belongs to (`P195`),
inventory number (`P217`), image (`P18`, hosted on Wikimedia Commons), dimensions, medium.

Counts, run from this Mac with `prompts/wikidata_museums.py` (SPARQL, read-only):

| | Count |
|---|---|
| Paintings on Wikidata | **1,083,945** |
| ... with a collection (`P195`) | 1,012,365 (93%) |
| ... with an image (`P18`) | 408,431 (**38%**) |
| Collections holding 268 or more paintings | 500+ (query capped at 500) |

Sample, paintings per collection: Met 13,052 · Louvre (Department of Paintings) 10,239 · Hermitage
8,219 · Prado 6,423 · Rijksmuseum 5,827 · Belvedere 5,536 · Tate 5,129 · Cleveland 5,010 ·
Musée d'Orsay 4,899 · National Gallery London 4,850 · National Gallery of Art 4,324.

Depth beyond the famous: **France has 32 collections with 268+ paintings** (Carnavalet 2,222,
Marseille 1,413, Fabre 1,027, Lille 748, Rennes 551, Dijon 514, Lyon 459, Nantes 455, Grenoble 455,
Besançon 394 ...). **The Netherlands has 41** (Amsterdam Museum 3,180, Groninger 2,631, Frans Hals
2,055, Dordrechts 1,725, Lakenhal 1,286 ...). None of these has an API Palette can use today.

Speed, from `prompts/wikidata_probe.py`, 15 calls each:

| Route | Latency | Rank preserved |
|---|---|---|
| Palette today: search wrapped in SPARQL on `query.wikidata.org` | 0.36 to 1.43 s, one spike 4.3 s | no |
| Plain MediaWiki search API on `www.wikidata.org` | 0.26 to 0.37 s, one at 0.63 s | yes |

Same results both ways. The plain route is 2 to 4 times faster and does not depend on the SPARQL
service, which is the one that throttles and times out.

Two facts that shape the design:

1. **Coverage is near-universal; images are not.** 62% of paintings have no image on Wikidata.
   The UI must be good with imageless entries, and images must come from elsewhere when possible
   (museum API, Commons category, the user's own photo).
2. **A museum filter turns noise into one answer.** "Night Watch" alone: 20 homonyms.
   "Benares Bauer" alone: 4 results. "Benares Bauer" inside the Rijksmuseum (`P195 = Q190804`):
   **1 result**.

## 3. How search works today

```
Search screen ──query, type (artist|title), selected museums──▶ searchAllMuseums
                                                                   │
                      phase 1: Supabase cache per (museum, query)  │
                      phase 2: each selected adapter's API ◀───────┘  (14 adapters, 3 tiers)
                      dedupe (id, or title+artist) ─▶ quality filter ─▶ sortByRelevance
```

- The user picks museums from a fixed list of 14 (`museumRegistry.ts`). Tier 1 is on by default
  (Met, Rijks, Chicago, Cleveland). Wikidata is tier 3, "Advanced", off by default.
- A museum with a broken API returns nothing, silently. A museum not in the 14 does not exist.
- Scan: photo → identifier (Google Vision: web detection + placard text; Bedrock only if a proxy is
  configured, none is) → up to 3 text candidates → the same `searchAllMuseums` → "No match found"
  if the APIs return nothing. In a museum without an API, every scan fails at the last step.

The weak link is the same in both flows: **the last step searches the 14 APIs**, and the user is
usually standing somewhere else.

## 4. Target model: Wikidata first, museum APIs as enrichment

```
                    ┌──────────────────────────────┐
  user ──▶ museum ─▶│  Wikidata (plain API)        │──▶ painting (Q-id, title, painter, date,
  (picked or near)  │  search inside P195=museum   │     inventory no., image if any)
                    └──────────────────────────────┘        │
                                                             ▼
                    ┌──────────────────────────────┐   enrich if available:
                    │  museum API adapter (14)     │──▶ better image, curator text, deep link
                    └──────────────────────────────┘   else: Commons image, or user's photo
```

### 4.1 Museum directory, from Wikidata

Yes, the list of museums can come from Wikidata. Rule for "a museum the user can stand in":

- appears as a `P195` collection on at least N paintings (N = 100 is a reasonable floor), **and**
- has coordinates (`P625`), so it is a place, not an agency or a private collection, **and**
- is not a dissolved body (no `P576`).

This filters out *Munich Central Collecting Point*, *National Trust*, *Cultural Heritage Agency*
and keeps every visitable museum. Sub-collections are a known wrinkle: the Louvre's paintings sit
under *Department of Paintings of the Louvre* (`Q3044768`), not the Louvre itself; the directory
needs a `P361` (part of) roll-up so the user sees "Louvre".

The directory is small: about 2,000 rows × (Q-id, name, city, country, lat, lon, painting count,
parent) ≈ 150 KB. It can be:

- **(a) built monthly by a script and shipped as a static JSON** in the app bundle. This is not a
  painting database; it is a list of places. It changes slowly. Cheap to keep.
- **(b) queried live** at first launch and cached. Needs SPARQL once (the count query took 16 s
  today). Fragile on a phone network.

Recommendation: **(a)**. Paintings stay live; only the place list is shipped.

### 4.2 Search, rewritten on the plain API

Two calls instead of one slow one:

1. `action=query&generator=search&gsrsearch=<text> haswbstatement:P31=Q3305213
   haswbstatement:P195=<museum Q-id>` → ranked Q-ids, 0.3 s.
2. `action=wbgetentities&ids=Q1|Q2|...` (50 per call) → painter, date, image, inventory number,
   dimensions, labels in several languages.

Rules carried over from heure-bleue: a contact URL in the User-Agent (Wikimedia's robot policy;
without it the client is in the throttled class), a wall-clock deadline per request, escalating
back-off on 429. Label fallback: English, then French, Dutch, German, Spanish, Italian; drop rows
with no label in any of these (one of Bauer's four *Benares* results had none).

The Wikidata adapter already exists (`wikidataService.ts`, ~400 lines). This is a rewrite of that
file and a change of its tier, not a new adapter.

### 4.3 Enrichment, where an API exists

For a Q-id from the Rijksmuseum, Met, Cleveland, Chicago, SMK, Harvard, the museum API gives a
better image and text. Wikidata stores the museum's own inventory number (`P217`), which most
museum APIs accept as a lookup key. So enrichment is `inventory number → museum record`, a single
exact call, instead of today's fuzzy title search across 14 APIs. Broken adapters stop mattering:
if the call fails, the Wikidata record stands.

### 4.4 Images: the honest part

62% of paintings have no Wikidata image. Order of fallbacks:

1. `P18` image (Commons), when present. Public-domain paintings photographed by the museum are
   usually fine; CC-BY photographer uploads need a credit line (heure-bleue's `licence`/`credit`
   handling applies).
2. Museum API image via inventory number, where an adapter exists.
3. **The user's own photo**, when the painting arrived through Scan. This is the natural case in a
   museum: the user just took it.
4. A text card: title, painter, date, museum colour. Designed, not an error state.

## 5. User journeys

### Journey A: in the museum (the one to market)

1. Open Palette. It knows where I am (location permission, or I pick the museum from the directory;
   nearest museums are shown first).
2. I point the camera at the wall label, or the painting.
3. One card: title, painter, date, the museum's inventory number. "Add to palette" / "Not this one".
4. Added. My photo is the image until a better one is found.

Why the label: the placard carries title, painter, date and inventory number in printed text.
OCR of printed text is far more reliable than recognising a painting from a phone photo, and the
inventory number is an exact key (`P217`) inside the museum (`P195`). Vision already returns the
placard text (`TEXT_DETECTION`); today it is used only as a loose search string.

Never dead-end: if nothing resolves, "Keep it anyway" saves photo + label text as my own entry.
The palette fills. Resolution can be retried later, offline queue style, which Palette already has.

### Journey B: at home, planning or remembering

1. Museum directory: nearest, or search by city or name. "Musée Fabre, Montpellier, 1,027 paintings".
2. Browse that collection: by painter, by century, most-linked first.
3. Tap a painting → detail → add to palette or to a visit.

### Journey C: I remember a painting, not where it is

Global search, as today, but on Wikidata with no museum filter: "wanderer sea of fog" → one result,
Hamburger Kunsthalle. The museum is part of the answer.

## 6. UI options

Three directions, deliberately different. Each is drawn as the home tab.

### Option 1: Museum first

The museum is the frame. Home opens on "where you are".

```
┌────────────────────────────────┐
│  You are near                  │
│  ┌──────────────────────────┐  │
│  │ Rijksmuseum  · 5,827     │  │  ← tap: enter the museum
│  │ Amsterdam · 400 m        │  │
│  └──────────────────────────┘  │
│  Amsterdam Museum · 3,180      │
│  Stedelijk Museum · 2,780      │
│  Van Gogh Museum · 391         │
│                                │
│  ▸ Search all museums          │
│                                │
│          ┌─────────┐           │
│          │   📷    │  big      │  ← scan inside the selected museum
│          └─────────┘           │
└────────────────────────────────┘
Inside a museum:  [Scan]  [Browse collection]  [Search here]  [My visit: 4 paintings]
```

Pros: the museum filter is always on, so scan and search hit one answer. The museum frame is the
**visit** frame: entering a museum opens or continues a visit and its palette (both already exist
in Palette's schema). Marketing sentence is true: "works in every museum".
Cons: at home the first screen is less useful; needs a clear "I am not in a museum" path.

### Option 2: Camera first

The camera is the app. Everything else is behind it.

```
┌────────────────────────────────┐
│ ◀ Rijksmuseum ▾        ⚙  👤   │  ← museum chip, auto from location, tap to change
│                                │
│                                │
│        [ live camera ]         │
│                                │
│   "Point at the painting or    │
│    its label"                  │
│                                │
│  ┌──────────────────────────┐  │
│  │ 🖼 The Milkmaid          │  │  ← result card slides up over the camera
│  │ Johannes Vermeer · 1660  │  │
│  │ SK-A-2344 · Rijksmuseum  │  │
│  │  [Add to palette] [Not it]│  │
│  └──────────────────────────┘  │
│  ○ Palette   ○ Visits   ○ Search│
└────────────────────────────────┘
```

Pros: shortest path for Journey A, the one Zoha describes as what a user wants. One gesture.
Cons: Journey B (at home) is buried; a camera-first app feels empty on the couch. Battery and
permission prompt on launch.

### Option 3: Keep the tabs, replace the museum list

Minimal change. The existing Search and Museum Browser tabs stay; the fixed list of 14 becomes the
Wikidata directory, and search gains a museum scope chip.

```
Search tab                            Museums tab (was Museum Browser)
┌────────────────────────────┐        ┌────────────────────────────┐
│ 🔍 benares bauer           │        │ 🔍 city or museum          │
│ in: [Rijksmuseum ▾] [All]  │        │ Near you                   │
│                            │        │  Rijksmuseum       5,827   │
│ Benares, 1913              │        │  Amsterdam Museum  3,180   │
│ Marius Bauer · Rijksmuseum │        │ France                      │
│ SK-A-...                   │        │  Musée d'Orsay     4,899   │
│                            │        │  Musée Fabre       1,027   │
│                            │        │  Lille · Rennes · Dijon ...│
└────────────────────────────┘        └────────────────────────────┘
Scan tab: unchanged layout, result resolved through Wikidata inside the chosen museum.
```

Pros: smallest change; every existing screen survives; ships in steps. Cons: the app still *feels*
like a search tool; the scan-first story is not told by the layout.

### Recommendation

**Option 3 first, as the plumbing, then Option 1 as the face.** Option 3 is the same backend
work Option 1 needs (directory, scoped search, scan resolution) and can ship without redesigning
navigation. Once scan-in-museum resolves reliably, the home screen can move to Option 1, where the
museum frame makes the "every museum" claim visible. Option 2 is the right *moment* (the camera),
but as the whole app it hides the collection side that Palette is actually about.

## 7. Scan resolution, in detail

```
photo ─▶ Vision ─▶ placard text ─┬─▶ parse: title / painter / year / inventory number
                 ─▶ web entities ─┤
                 ─▶ best guess ───┘
                                  ▼
          1. inventory number + museum  (P217 inside P195)      exact, 1 call
          2. title + painter inside museum (search, P195 filter) ranked, 1 call
          3. web entity Q-id if Vision returns a Wikidata/KG id   exact
          4. title + painter, all museums                         ranked, 1 call
                                  ▼
          0 results ─▶ "Keep it anyway" (photo + text, local entry, retry later)
          1 result  ─▶ card, Add / Not it
          2+ results ─▶ short list, images where available, user picks
```

Each step is one request on the plain API. The whole chain stays under two seconds on the probe's
numbers, before image loading.

## 8. Phases

| Phase | Work | What to measure |
|---|---|---|
| 0 | Probe all 14 adapters, read-only. Table: works / broken / needs key. | Which "enrichment" sources are real. |
| 1 | Rewrite `wikidataService.ts` on the plain API: contact UA, deadline, back-off, batching, label fallback, `P195` filter. Move to tier 1. | Latency, failure rate vs today, on device. |
| 2 | Museum directory script (`tools/`), monthly; shipped JSON; Museums tab reads it; nearest-first with location. | Directory size; how many museums have coordinates. |
| 3 | Scan resolution chain (section 7); "Keep it anyway" local entry. | Scan success rate in a museum without an API. Test in Orsay or Carnavalet. |
| 4 | Enrichment by inventory number for adapters that work (from phase 0). Retire the broken ones. | Fewer adapters, same or better images. |
| 5 | Home screen to Option 1. | A real visit, start to finish, no search typed. |

Phases 1 to 3 are the product change. Phase 5 is the redesign and should wait for a real-museum
test of phase 3.

### Phase 0 results (2026-10-02, 23:35)

Each adapter's search request was reproduced outside the app exactly as `src/services/*Service.ts`
builds it: same URL, same parameters, same keys the app sends when no `.env` exists (empty string,
or `DEMO_KEY`), same 10 s timeout. Two runs each, from a Paris home connection. Script:
`prompts/palette_adapter_probe.py`. This tests the HTTP layer; adapter parsing was not run.

| Adapter | Result | Latency | Finding |
|---|---|---|---|
| Rijksmuseum | works | 0.29 s + 0.16 s per item | Search returns ids only; the app then makes 2 calls per painting. |
| Art Institute of Chicago | works | 0.04 s | 133,118 hits for "Monet", all 20 with image. |
| Cleveland | works | 0.66 s | 12 hits, all with image. |
| Victoria and Albert | works | 0.20 s | 13,780 hits. |
| National Gallery London | works | 0.09 s | Elasticsearch endpoint, 10 hits with image. |
| SMK Copenhagen | works | 0.48 s | 122 hits, 12 with image. |
| Smithsonian | works, on `DEMO_KEY` | 1.29 s | The demo key is shared and rate-limited; a free key fixes it. |
| Wikidata | works | 0.65 s | SPARQL route; see section 2 for why it is the fragile one. |
| Louvre (via Wikidata) | works | 2.14 s | Filters on *location* (`P276`), not *collection* (`P195`); slowest of the working set. |
| **Met** | **broken, HTTP 410** | 0.12 s | `/v1/search` **was retired on 2026-10-01**, yesterday. The reply names the replacement: `/v1.1/search` with `limit` and `offset`. Verified: it answers in 0.15 s with the same shape. A one-line fix. |
| **Joconde** | **broken** | 0.14 s | `data.culture.gouv.fr/api/explore/...` now returns the portal's JavaScript shell, not JSON. The Opendatasoft API behind it is gone. The data still exists (POP, `api.pop.culture.gouv.fr`) under a different API; needs a rewrite, not a patch. |
| **Paris Musées** | **broken, HTTP 403** | 0.17 s | Needs `PARIS_API_KEY`; the app sends an empty bearer. Free key on registration. |
| **Europeana** | **broken, HTTP 401** | 0.17 s | "Empty API key provided". Free key on registration. |
| **Harvard** | **broken, HTTP 401** | 0.28 s | Needs `HARVARD_API_KEY`. Free key on registration. |

**9 of 14 answer; 5 fail.** Of the 5: three are missing free API keys (Paris Musées, Europeana,
Harvard), one is a one-line endpoint change (Met, retired yesterday), one needs real work (Joconde).
So the catalog felt broken for two reasons that have nothing to do with the museums: no `.env` on
this install, and one endpoint retired this week. The three key-gated sources are the ones with the
widest reach (Europeana alone federates thousands of institutions).

What this changes in the plan:
- Phase 4 is smaller than feared. Keep all 9 working adapters as enrichment. Fix the Met now.
  Register the three free keys. Decide on Joconde after the Orsay test shows whether Wikidata's
  Orsay coverage is enough on its own.
- Wikidata-first is still the right core: even with all 14 working, the user is usually in a museum
  none of them covers, and the Met's retirement shows that every museum API is a moving target.
- The app needs a visible per-adapter health signal in Settings (last success, last error), so
  "more than half do not work" is a number on a screen, not a feeling after a bad visit.

### Phase 0b: the adapters' own code (2026-10-02, 23:50)

Zoha reported from the app that Rijksmuseum, Smithsonian, Wikidata, National Gallery and SMK fail
too, although their endpoints answered above. So the real TypeScript was run: each adapter module
loaded under Jest with the live network, `react-native-config` mocked to `{}` (no `.env`, as on this
install), `adapter.search({ query, maxResults: 10, searchType: 'artist' })`, then the app's own
`filterByQuality` with the Search screen's thresholds.

| Adapter | Raw | After quality filter | Finding |
|---|---|---|---|
| Cleveland | 10 | 10 | fine |
| Chicago | 9 | 9 | fine |
| V&A | 10 | 9 | fine |
| National Gallery | 10 | 10 | fine in Node |
| SMK | 7 | 7 | fine in Node |
| Smithsonian | 2 | 2 | fine in Node, on `DEMO_KEY` |
| Wikidata | 5 | 3 | fine in Node, 3.6 s |
| **Rijksmuseum** | **0** | 0 | **Parser bug.** The search returns 1,447 Rembrandts, the parser drops every one. `extractTitle` looks for `classified_as[0]._label === 'Primary Name'`; the live records carry no `_label` on names (only Getty AAT ids, `300417200`), so every title becomes `Untitled` and `parseLinkedArtObject` returns `null`. `extractArtist` reads `produced_by.carried_out_by`, which is absent; the creator sits under `produced_by.part[].carried_out_by`. The search also omits `type=painting` (1,447 hits vs 24 paintings). The adapter was written against a Linked Art shape the API no longer serves. |
| **Louvre** | **0** | 0 | **Wrong Wikidata filter.** It filters on *location* `P276=Q19675`; only 113 paintings on all of Wikidata carry that. The Louvre's paintings are filed under *collection* `P195=Q3044768` (Department of Paintings of the Louvre): 10,522 paintings, 75 for Delacroix. `Q19675` under `P195` gives 8. |
| Met | throws | | HTTP 410, as above. |
| Harvard, Europeana, Paris Musées | 0 | | 401 / 401 / 403, empty keys, as above. |
| Joconde | 0 | | `Unexpected token '<'`: the HTML shell parsed as JSON, as above. |

So in Node 7 of 14 return paintings. Four that pass here (National Gallery, SMK, Smithsonian,
Wikidata) fail in the running app, which means a layer this probe cannot run: the React Native
runtime (`ky` 1.8 over RN's `fetch`) or the Supabase cache phase in `searchAllMuseums`, which runs
before the API phase and is not inside its try/catch. The next measurement is in the app itself:
search with `useCache: false` and read the Metro console for the `❌ <museum> API failed:` lines.

**Repaired (commit `612e9ec` on this branch).** Rijksmuseum, Louvre and the Met now return
paintings with each adapter's own code against the live APIs: Rijksmuseum 6 of 6 Rembrandt
paintings with title, artist, year, medium, dimensions and image (titles by Getty AAT language
and preferred-term ids; artist resolved from the actor URI, one cached fetch per painter;
`type=painting` on the search); *Benares* by Marius Bauer found by title. Louvre 4 Delacroix
with images under `P195 = Q3044768 | Q19675`, SPARQL rows folded per painting. Met 12 paintings
from a Vermeer search through `/v1.1/search`. Left for phase 1: the Louvre still goes through
SPARQL, and `gsrlimit` counts rows, not paintings, so a request for 8 can return 4 distinct ones.

### Phase 1 result: Wikidata adapter on the plain API (2026-10-05, commit `8c588ab`)

`wikidataService.ts` no longer touches `query.wikidata.org`. Two calls: `list=search` with
`haswbstatement:P31=Q3305213` and an optional `P195=<museum>|...` filter (ranked, about 0.3 s),
then `wbgetentities` in batches of 50 for labels, descriptions and claims, plus one batch for the
labels of referenced items (painter, museum, material). Contact URL in the User-Agent. Label
fallback en, fr, nl; a record with no label is dropped rather than shown as a bare Q-id. Claims are
read with rank and end time, so an ended loan (Liberty's 1874 stay at the Luxembourg Museum) no
longer outranks the current home. Dimensions convert mm, m and inches to cm; decade-precision dates
give no year. Deadline and back-off were not added: `museumApiClient` already retries 429 twice
with its own timeout, and the plain API has not needed more.

New contract for museum adapters: `searchWikidataRecords({ query, collections, museum, location,
idPrefix, externalIdProperties })` returns the parsed painting plus `inventoryNumber` (P217,
matched to the credited collection) and the requested external ids (e.g. `P9394`, the Louvre ark).
This is what the Louvre fold (step 2) and later Orsay, Prado, Mauritshuis call.

Measured with the adapter's own code against the live API: *The Night Watch* rank 1 among 27
homonyms, 1.3 s for 10 full records; *Benares* the only result inside the Rijksmuseum (0.6 s, with
`SK-A-4975`); 8 of 8 Delacroix in the Louvre Department of Paintings with ark ids, 1.1 s; 20
Marius Bauer paintings with no bare Q-id title. Unit tests (`__tests__/wikidataService.test.ts`)
run on recorded response shapes, no network. Still open: the "move to tier 1" half of the phase,
and the on-device check.

### Phase 1, step 2: the Louvre folded in (2026-10-05, commit `ae49d42`)

`louvreService.ts` is now a call to `searchWikidataRecords` with the Department of Paintings filter
(`Q3044768 | Q19675`), the museum name and city stamped on, and `P9394` (the Louvre ark id)
requested. Records with an ark id are enriched from `collections.louvre.fr/ark:/53355/cl<id>.json`:
official photograph, thumbnail and catalogue page. The previous code tried this at a URL without
the `cl` prefix, which returned 404, so the enrichment had never fired. Ids are unchanged
(`louvre-<ark id>` when known) so kept paintings still match. No SPARQL call remains in `src/`.

Live: 8 of 8 Delacroix in 1.6 s, 7 with the Louvre's own image and link; the Mona Lisa with its
year (1503), which needed decade-precision inception dates to count as a year, since Wikidata files
circa dates that way. 227 lines became 118; ESLint 93 to 1 on the file.

This is the shape for every museum without an API: Orsay, Prado, Mauritshuis are each a collection
Q-id, a name, a city, and optionally an external-id property to enrich from.

## 9. Costs and risks, stated plainly

- **Wikidata is community data.** Labels can be wrong, duplicates exist, a painting can be
  mis-attributed. Palette would inherit those errors. Mitigation: show the inventory number so the
  user can check against the label; link to the Wikidata page; allow "Not it".
- **62% no image.** Journey B (browsing at home) is weaker than Journey A for small museums.
  Design the text card well.
- **Throttling.** Wikimedia asks for a contact URL and reasonable rates. Phones behind one carrier
  NAT can share an IP. Cache aggressively (Supabase cache already exists); batch `wbgetentities`.
- **Sub-collections and name languages.** Louvre department, Dutch names for Dutch museums,
  "Finnish National Gallery" holding Ateneum. The directory script needs a review pass the first
  time; after that it is stable.
- **Commons image licences.** Old paintings photographed by the museum are public domain. Visitor
  photos uploaded under CC-BY need a credit line in the detail view. Rule exists in heure-bleue.
- **Dropping adapters** that work (Rijksmuseum, Met) would lose curator text and better images.
  Keep them as enrichment; drop only the broken ones, after phase 0 says which.

## 10. Decisions (2026-10-02, with Zoha)

1. **Location.** Ask for location permission, and always offer the museum list with search as well.
   Nearest-first when location is granted; the list alone when it is not. Neither path blocks the
   other.
2. **"Keep it anyway".** Advice below, section 11.
3. **Test museum: Musée d'Orsay.** Zoha can test there easily. Orsay has 4,899 paintings on
   Wikidata and no API of its own. The Joconde adapter (French national collections database,
   `data.culture.gouv.fr`) lists Orsay works and is the candidate enrichment source there, if phase 0
   finds it working. Paris Musées is the City of Paris museums (Carnavalet, Petit Palais), not Orsay.
4. **Hero object: the palette.** The main palette, and one palette per visit. Both exist in the
   schema today (`user_palette`, `visit_palettes`). Option 1's "museum frame" is therefore the
   **visit frame**: entering a museum opens or continues a visit; what the user collects there fills
   that visit's palette; the main palette is curated across visits. The museum directory is the
   way in, not the thing the user keeps.

## 11. "Keep it anyway": recommended behaviour

The goal: the user in front of a painting never loses the moment because the data is missing.

- **Store first, resolve later.** When no result resolves (or the user says "Not it" to all),
  one tap saves a local entry: the photo, the placard text as typed by Vision, the museum, the time.
  It goes into the visit's palette at once, marked *unverified* with a small dot, not a warning.
- **It is a normal painting record** with `source: 'user'`, `wikidataId: null`,
  `status: 'unresolved'`. No second table, no special screen. Palette's existing offline queue
  syncs it to Supabase like any other collection change. The photo is downscaled (about 1200 px on
  the long side) and stored in Supabase storage; a full-size photo costs storage for little value.
- **Retry quietly.** On the next launch, or when the network returns, re-run the resolution chain
  (section 7) for every unresolved entry. On a match: set `wikidataId`, fill title, painter, date,
  inventory number, and offer the museum image **next to** the user's photo. Do not replace the
  user's photo silently; it is their memory of the visit. Let them choose, or keep both (photo for
  the visit, museum image for the main palette).
- **Let the user fix the text.** The placard OCR can be wrong. An editable title and painter field
  on the unresolved card costs little and makes the later retry succeed more often.
- **Never nag.** Unresolved entries do not notify. They show their dot, and the visit summary says
  "2 of 8 not yet identified" with a single "Try again" action.

What not to do: do not block the add behind the resolution; do not create a separate "drafts"
area the user must remember to visit; do not upload the raw photo to any identification service a
second time without the user tapping "Try again".

## 12. What if there is not enough data?

"Not enough" means one of three things, and each has its own answer.

**The museum is on Wikidata but thinly.** The Van Gogh Museum has 391 paintings listed; the
Rijksmuseum 5,827; Orsay 4,899. The directory shows the count, so expectations are set before the
visit ("391 paintings known"). Scan still works for the paintings that are there, and "Keep it
anyway" covers the rest. The visit is complete either way; only the identified share differs.

**The painting is on Wikidata but has no image.** This is the common case: 62% overall. The text
card is the design, not a fallback: title, painter, date, inventory number, the museum's colour,
and the user's own photo when the entry came from Scan. For Journey B (browsing at home) this is
the weaker experience; for Journey A (in the museum) the user has the painting in front of them and
the photo in hand, so the missing image barely matters.

**The museum is not on Wikidata at all.** Rare for a public museum (500+ collections pass the
268-painting floor; the long tail below it is still visitable). The directory can list a museum
with zero known paintings if it has coordinates and is a museum (`P31`), so the user can still
start a visit there and collect by photo and label. Every entry is a "Keep it anyway" entry. The
app works; it just does not identify.

One longer-term option, not part of this plan: unresolved entries with a clean label (title,
painter, inventory number, museum) are exactly the data Wikidata's *Sum of All Paintings* project
collects by hand. A later feature could let a user contribute an entry. That is a product decision
with moderation and licence questions; it is noted here only so the thought is not lost.

**How much data is enough for the marketing claim?** The honest sentence is not "works in every
museum" but "**works in every museum: identifies what Wikidata knows, keeps what it does not**".
The Orsay test (phase 3) gives the first real number: of N paintings scanned in one visit, how many
resolve on the spot. Below about half, the identification story is not yet the headline and the
visit-and-palette story is. Above it, identification leads.

## 13. Parked: "want to visit" as a planning mode (2026-10-03)

Not for this branch. Recorded so the idea survives.

Two moods, one collection. In the museum, search and scan are scoped to the place and what is
kept is *seen*, in this visit's palette. At home, the same field searches everywhere and what is
kept is *want to visit*, carrying its museum. The collection then groups want-to-visit by museum
("Van Gogh Museum 7, Orsay 3"), and a new visit opens with "you wanted N paintings here". Seeing
one moves it from wanted to seen. Open question Zoha raised: an artist's full list of works
could come from the artist's own Wikidata entry (works by creator `P170`), which the current
adapters cannot do. The `wantToVisit` field, the Collection filter and the visits tables exist;
the frame, the grouping and the artist lookup do not. Own branch, after the API work.

## Appendix: probes

- `/Users/zoharak/.kiro/crew/workspace/prompts/wikidata_probe.py`: SPARQL vs plain API, timed.
- `/Users/zoharak/.kiro/crew/workspace/prompts/palette_adapter_probe.py`: phase 0, the 14 adapters as the app calls them.
- `/Users/zoharak/.kiro/crew/workspace/prompts/wikidata_museums.py`: paintings per collection,
  totals, labels and countries. Output JSON reused for the directory script in phase 2.

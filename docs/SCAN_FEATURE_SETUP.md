# Scan a Painting — Setup & Testing Guide

This guide covers everything needed to configure, run, and test the **Scan a
Painting** feature (branch `feature/scan-painting-vision`).

## What the feature does

A user photographs an artwork (or its wall label). The image is sent to an
**artwork identifier** (Google Vision by default), which turns the photo into
search queries. Those queries run through the existing `searchAllMuseums`
pipeline, so matches come back as normal, schema-correct `Painting` objects and
flow into the exact same **collection / like / palette** paths as a searched
painting.

```
Camera ─▶ Identifier (Vision | Bedrock) ─▶ ScanSearchCandidate[]
        └▶ runScanSearch() ─▶ searchAllMuseums() ─▶ Painting[] ─▶ PaintingDetail / like / collection
```

Entry point: a **📷 SCAN** button in the Search screen header.

---

## 1. Prerequisites

- Node **>= 20.12** (`node -v`)
- Yarn, Xcode (iOS) and/or Android Studio, CocoaPods
- A Google Cloud project with the **Cloud Vision API** enabled
- You are on the feature branch:
  ```bash
  git checkout feature/scan-painting-vision
  ```

---

## 2. Get a Google Vision API key

1. Go to the Google Cloud Console → **APIs & Services**.
2. Enable **Cloud Vision API** for your project.
3. **Credentials → Create credentials → API key**.
4. Restrict the key (recommended): restrict to the **Cloud Vision API**.
5. Copy the key.

> Vision is billed per image × per feature. This feature requests 3 features
> (`WEB_DETECTION`, `TEXT_DETECTION`, `LABEL_DETECTION`) per scan.

---

## 3. Configure environment variables

Environment is injected at **native build time** by `react-native-config`, so
any change here requires a rebuild (Step 6).

```bash
cp .env.example .env
```

Fill in `.env`:

```dotenv
# Required for the default (Google Vision) identifier
GOOGLE_VISION_API_KEY=AIza...your_key...

# Identifier selection: 'vision' (default) or 'bedrock'
ARTWORK_IDENTIFIER=vision

# Only needed if you switch to the Bedrock identifier (see Step 7)
ARTWORK_ID_ENDPOINT=
```

Leave the existing `SUPABASE_URL` / `SUPABASE_ANON_KEY` as they already are — the
scan feature reuses the normal collection/like persistence.

---

## 4. Native permissions (already committed, verify only)

These edits ship on the branch; just confirm they are present.

**iOS** — `ios/Palette/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Palette needs camera access to photograph and identify artwork.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Palette needs photo library access to select artwork images.</string>
```

**Android** — `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```
(Android also requests the CAMERA runtime permission in-app before launching the
camera; no extra work needed.)

---

## 5. Install dependencies

```bash
yarn install
cd ios && pod install && cd ..
```

No new JS dependencies are required — the feature reuses
`react-native-image-picker` (camera) and `react-native-config` (env), both
already in `package.json`.

---

## 6. Build & run (rebuild required after any .env change)

```bash
# Start Metro in one terminal
yarn start

# iOS (another terminal)
yarn ios

# Android
yarn android
```

> Because env is baked in at build time, editing `.env` and only reloading Metro
> is **not** enough — you must rebuild the native app (`yarn ios` / `yarn
> android`).

---

## 7. (Optional) Switch to the Bedrock / LLM identifier

The Bedrock identifier gives structured `{title, artist, year}` output, which is
more accurate downstream than Vision's fuzzy entities. A mobile app must **never
hold AWS credentials**, so this identifier calls a **server-side proxy you
control** — it does not call Bedrock directly.

1. Stand up a backend endpoint (e.g. API Gateway + Lambda) that:
   - accepts `POST { "image": "<base64>" }`
   - signs a Bedrock `InvokeModel` call with an **IAM role** (Claude / Nova, vision-capable)
   - prompts: *"Identify the artwork in this image. Respond ONLY with JSON
     `{title, artist, year, confidence}`. If unsure, return an empty title. Do
     not invent an artist."*
   - returns `{ title?, artist?, year?, confidence?, alternates?[] }`
2. Point the app at it and flip the identifier in `.env`:
   ```dotenv
   ARTWORK_IDENTIFIER=bedrock
   ARTWORK_ID_ENDPOINT=https://your-proxy.example.com/identify
   ```
3. Rebuild (Step 6).

Selection logic (`src/services/identification/index.ts`): the app uses
`ARTWORK_IDENTIFIER` if that identifier is configured; otherwise the first
configured identifier (`bedrock` then `vision`); otherwise Vision as a
deterministic fallback. So with no proxy configured it silently stays on Vision.

The full request/response contract and recommended prompt live in the header of
`src/services/identification/bedrockIdentifier.ts`.

---

## 8. How to use it (manual QA)

1. Open the app, go to the **Search** tab.
2. Tap **📷 SCAN** in the header.
3. **Scan with Camera** (or **Choose from Library**). Grant camera permission
   when prompted.
4. Point at a **well-known** painting or its wall label (famous works identify
   far more reliably than obscure ones).
5. Expect: `Identifying…` → `Matching against museum collections…` → a grid of
   **possible matches**.
6. Tap a match → it opens **PaintingDetail** exactly like a searched painting →
   add to collection (Seen / Want to visit).
7. **Like-during-a-visit flow:** open Search from a visit (so a `visitId` is on
   the route), tap SCAN, and each result card shows a ♥ to like the painting
   into that visit.

Good manual test subjects: *The Starry Night*, *Mona Lisa*, *The Persistence of
Memory*. These reliably resolve against the Tier 1 museums the scan searches
(MET, Rijksmuseum, Art Institute of Chicago, Cleveland).

---

## 9. Automated tests

Unit tests cover the pure logic (Vision parsing, candidate building, match
merging, identifier selection). CI runs `yarn lint:type-check` + `yarn test`.

```bash
# Type-check (must be clean)
yarn lint:type-check

# All tests
yarn test

# Just the scan-feature suites
npx jest \
  src/services/__tests__/visionService.test.ts \
  src/services/__tests__/scanMatchService.test.ts \
  src/services/__tests__/identification.test.ts \
  src/navigation/__tests__/screenRegistry.test.ts \
  src/navigation/__tests__/navigationTypes.test.ts
```

What each suite proves:

| Suite | Covers |
|-------|--------|
| `visionService.test.ts` | Vision response parsing; candidate building (generic-term filtering, best-guess priority, placard-line handling, confidence ordering) |
| `scanMatchService.test.ts` | `mergeUniquePaintings` dedup; `runScanSearch` orchestration (merge, candidate cap, early-stop, resilience when a candidate throws) |
| `identification.test.ts` | `selectIdentifier` selection rules; `buildCandidatesFromLlm` (title/artist ordering, confidence clamp, alternates, dedup) |
| `screenRegistry` / `navigationTypes` | `ScanPainting` is registered in the root stack and its param shape is valid |

Expected result: **type-check clean, all suites green** (one `console.warn` in
`scanMatchService` is intentional — it's the "a candidate search threw" test).

---

## 10. Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| Error: *"GOOGLE_VISION_API_KEY is not set…"* | `.env` missing the key, or app not rebuilt after editing `.env`. Rebuild (Step 6). |
| App crashes on opening the camera (iOS) | `NSCameraUsageDescription` missing from `Info.plist` (Step 4), or app not rebuilt. |
| Camera never opens (Android) | CAMERA permission denied; enable it in system Settings, or reinstall to re-trigger the runtime prompt. |
| Always "No match found" for famous works | Key not enabled for Cloud Vision API, billing not enabled on the GCP project, or no network. Check the device logs for a `VisionRequestError` message. |
| Obscure painting never matches | Expected — the scan only matches against connected museums (Tier 1 by default). Widening to Europeana/Wikidata aggregators is a separate enhancement. |
| Bedrock identifier does nothing | `ARTWORK_ID_ENDPOINT` unset → the app falls back to Vision by design. Set the endpoint and rebuild. |

---

## 11. Key files (for reviewers)

- `src/services/visionService.ts` — Google Vision REST client + candidate builder
- `src/services/identification/` — pluggable `ArtworkIdentifier` interface, Vision + Bedrock impls, selector
- `src/services/scanMatchService.ts` — Vision candidates → `searchAllMuseums` → deduped matches
- `src/hooks/domain/museum/useScanPainting.ts` — camera capture + scan state machine + like bridge
- `src/screens/ScanPainting/` — the scan screen (idle / busy / results / no-match / error)
- Entry point: `src/screens/Search/Search.tsx` + `src/hooks/domain/museum/useSearch.ts` (SCAN button)

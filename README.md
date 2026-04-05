# Palette

## Setup

```bash
# Install dependencies
yarn install

# iOS pods
cd ios && pod install && cd ..

# Environment variables
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_ANON_KEY
```

## Running

```bash
yarn ios       # Run on iOS simulator
yarn android   # Run on Android emulator
yarn start     # Start Metro bundler
```

## Testing

```bash
# Run all tests
yarn test

# Run with coverage
yarn test:report

# Run a specific test file
npx jest src/navigation/__tests__/screenRegistry.test.ts

# Type check
yarn lint:type-check

# Full lint (eslint + prettier + tsc)
yarn lint
```

### Test structure

| Suite                                    | What it covers                                            |
|------------------------------------------|-----------------------------------------------------------|
| `navigation/__tests__/screenRegistry`    | Every navigate() target is registered in a navigator      |
| `navigation/__tests__/navigationTypes`   | Route param types match expectations                      |
| `services/__tests__/paintings.service`   | Painting cache CRUD, UUID lookups                         |
| `services/__tests__/museumRegistry`      | Museum registry integrity, tiers, no duplicates           |
| `services/__tests__/searchHelpers`       | Artist name cleaning, dedup, quality filtering, relevance |
| `services/__tests__/mergeCollectionData` | Offline sync conflict resolution                          |
| `services/__tests__/offlineQueue`        | Offline operation queue                                   |
| `theme/ThemeProvider`                    | Theme switching                                           |

Tests run automatically on every push and pull request via GitHub Actions.

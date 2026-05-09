# Palette - System Design Document

> **Last updated:** 2026-05-07
> **Status:** Living document - reflects current implementation

---

## 1. High-Level Architecture

Palette is a mobile app (iOS + Android) that lets users search museum paintings, curate a personal
collection, and build a shareable "palette" of 8 favorites. It operates offline-first with cloud
sync.

```mermaid
C4Context
    title System Context Diagram

    Person(user, "Museum-Goer", "Browses museums, collects paintings, curates palettes")

    System(app, "Palette Mobile App", "React Native 0.80, TypeScript")

    System_Ext(supabase, "Supabase", "Auth, PostgreSQL, RLS")
    System_Ext(museums, "Museum APIs (14)", "Met, Rijks, Chicago, Cleveland, Harvard, V&A, National Gallery, SMK, Louvre, Smithsonian, Europeana, Paris Musees, Joconde, Wikidata")

    Rel(user, app, "Uses")
    Rel(app, supabase, "Auth, sync, cache", "HTTPS")
    Rel(app, museums, "Search paintings", "HTTPS")
```

### Deployment Topology

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER'S DEVICE                                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Native App (single binary)            │   │
│  │                                                          │   │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────────────────┐  │   │
│  │  │ Zustand │  │ Offline  │  │   MMKV Storage         │  │   │
│  │  │  Store  │──│  Queue   │──│ (persists across       │  │   │
│  │  │         │  │          │  │  app launches)         │  │   │
│  │  └────┬────┘  └────┬─────┘  └────────────────────────┘  │   │
│  │       │            │                                     │   │
│  │  ┌────┴────────────┴─────────────────────────────────┐   │   │
│  │  │        Museum Adapter Layer (14 adapters)          │   │   │
│  │  └───────────────────────┬───────────────────────────┘   │   │
│  └──────────────────────────┼───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS
              ┌───────────────┴───────────────┐
              │                               │
     ┌────────▼────────┐          ┌───────────▼───────────┐
     │    Supabase      │          │   Museum APIs (14)    │
     │                  │          │                       │
     │  · PostgreSQL    │          │  Public REST / SPARQL │
     │  · Auth (OAuth)  │          │  No credentials      │
     │  · Row Security  │          │  needed for most     │
     │  · Edge Funcs    │          │                       │
     └──────────────────┘          └───────────────────────┘
```

---

## 2. Client Architecture

### 2.1 Component Tree

```mermaid
graph TD
    App["App.tsx"]
    EB["ErrorBoundary"]
    QC["QueryClientProvider"]
    TH["ThemeProvider"]
    AU["AuthProvider"]
    SI["StoreInitializer"]
    NAV["ApplicationNavigator"]
    AUTH_NAV["Auth Navigator"]
    MAIN_NAV["Authenticated Navigator"]
    TABS["TabNavigator (5 tabs)"]
    SCREENS["Stack Screens"]

    App --> EB --> QC --> TH --> AU --> SI --> NAV
    NAV -->|"no user"| AUTH_NAV
    NAV -->|"has user"| MAIN_NAV
    MAIN_NAV --> TABS
    MAIN_NAV --> SCREENS

    style App fill:#1a1a1a,color:#d4af37
    style EB fill:#c13333,color:#fff
    style SI fill:#50c878,color:#1a1a1a
```

### 2.2 State Management

The app uses **Zustand** (1.1 KB) with a single store composed of three slices:

```mermaid
graph LR
    subgraph Store["Zustand Store (src/store/)"]
        CS["CollectionSlice<br/>· paintings: Painting[]<br/>· isLoaded: boolean<br/>· addToCollection()<br/>· removeFromCollection()<br/>· toggleSeen()<br/>· toggleWantToVisit()"]
        PS["PaletteSlice<br/>· palettePaintingIds: string[]<br/>· addToPalette()<br/>· removeFromPalette()<br/>· getPalettePaintings()"]
        SS["SyncSlice<br/>· syncing: boolean<br/>· syncError: string?<br/>· deadLetterQueue[]<br/>· retryDeadLetterItem()"]
    end

    MMKV["MMKV<br/>(persistence)"]
    CS -->|"auto-persist"| MMKV
    PS -->|"auto-persist"| MMKV
    SS -->|"dead letter"| MMKV

    style Store fill:#d4af37,color:#1a1a1a
    style MMKV fill:#50c878,color:#1a1a1a
```

**Design decision:** Zustand over React Context because:
- Selector-based subscriptions (components only re-render when their slice changes)
- No provider nesting required
- State accessible outside React (sync service reads/writes directly)
- Simpler than Redux, no boilerplate

### 2.3 Screen Map

```mermaid
graph TD
    subgraph AUTH["Unauthenticated"]
        A_LOGIN["Auth<br/>(email, Apple, Google)"]
    end

    subgraph TABS["Tab Navigator"]
        T_VISITS["Visits"]
        T_COLL["Collection"]
        T_SEARCH["Search"]
        T_PAL["Palette"]
        T_SET["Settings"]
    end

    subgraph STACK["Stack Screens (overlay)"]
        S_PD["PaintingDetail"]
        S_ARTIST["ArtistProfile"]
        S_VD["VisitDetail"]
        S_MC["MuseumCollection"]
        S_SEARCH["Search (visit-scoped)"]
        S_LIKED["LikedPaintings"]
        S_VP["VisitPalette"]
        S_VPV["ViewPalette"]
    end

    T_VISITS --> S_VD
    T_COLL --> S_PD
    T_SEARCH --> S_PD
    T_PAL --> S_PD
    S_VD --> S_SEARCH
    S_VD --> S_LIKED
    S_VD --> S_VP
    S_VD --> S_VPV
    S_PD --> S_ARTIST
    S_ARTIST --> S_PD
    S_LIKED --> S_PD
    S_MC --> S_PD
```

---

## 3. Data Architecture

### 3.1 Database Schema (Supabase PostgreSQL)

```mermaid
erDiagram
    auth_users ||--o{ user_collection : "owns"
    auth_users ||--o| user_palette : "has one"
    auth_users ||--o{ visits : "logs"
    auth_users ||--o{ user_painting_likes : "likes"

    museums ||--o{ paintings : "contains"
    museums ||--o{ visits : "visited at"

    paintings ||--o{ user_collection : "collected"
    paintings ||--o{ user_painting_likes : "liked"
    paintings ||--o{ visit_palette_paintings : "in palette"

    visits ||--o{ user_painting_likes : "during"
    visits ||--o| visit_palettes : "has"
    visit_palettes ||--o{ visit_palette_paintings : "contains"

    auth_users {
        uuid id PK
        text email
        jsonb raw_user_meta_data "curator_name stored here"
    }

    museums {
        uuid id PK
        text name
        text short_name
        jsonb api_config
        boolean is_active
    }

    paintings {
        uuid id PK
        uuid museum_id FK
        text external_id
        text title
        text artist
        text image_url
        jsonb metadata
    }

    user_collection {
        uuid id PK
        uuid user_id FK
        uuid painting_id FK
        boolean is_seen
        boolean want_to_visit
        timestamptz seen_date
        text notes
        timestamptz updated_at
    }

    user_palette {
        uuid id PK
        uuid user_id FK
        uuid[] painting_ids "max 8"
        timestamptz updated_at
    }

    visits {
        uuid id PK
        uuid user_id FK
        uuid museum_id FK
        date visit_date
        text notes
    }

    user_painting_likes {
        uuid id PK
        uuid user_id FK
        uuid painting_id FK
        uuid visit_id FK
    }

    visit_palettes {
        uuid id PK
        uuid visit_id FK
    }

    visit_palette_paintings {
        uuid id PK
        uuid palette_id FK
        uuid painting_id FK
        int position "0-7"
    }
```

### 3.2 Key Constraints

| Constraint       | Table                     | Rule                                 |
|------------------|---------------------------|--------------------------------------|
| Mutual exclusion | `user_collection`         | `NOT (is_seen AND want_to_visit)`    |
| Palette size     | `user_palette`            | `array_length(painting_ids, 1) <= 8` |
| Position range   | `visit_palette_paintings` | `position >= 0 AND position < 8`     |
| Unique entry     | `user_collection`         | `UNIQUE (user_id, painting_id)`      |
| Unique painting  | `paintings`               | `UNIQUE (museum_id, external_id)`    |

### 3.3 Row Level Security

Every user-scoped table has RLS policies ensuring `auth.uid() = user_id`. The `paintings`,
`museums`, and `search_cache` tables are globally readable (public data).

---

## 4. Sync System Design

### 4.1 Overview

The app is offline-first: mutations hit local storage instantly, then sync to the cloud
asynchronously. The sync system handles conflicts, retries, and permanent failures.

### 4.2 Sync-on-Launch Flow

```mermaid
sequenceDiagram
    participant App
    participant Store as Zustand Store
    participant Sync as syncService
    participant Queue as OfflineQueue
    participant DLQ as Dead Letter Queue
    participant Supa as Supabase

    App->>Store: useSyncOnLaunch()
    Store->>Sync: syncOnLaunch(userId)
    Sync->>Store: setSyncing(true)

    par Fetch remote data
        Sync->>Supa: SELECT * FROM user_collection
        Sync->>Supa: SELECT * FROM user_palette
    end

    Supa-->>Sync: remote collection + palette

    Note over Sync: Merge local ↔ remote<br/>using updated_at timestamps<br/>(remote wins on tie)

    Sync->>Store: setPaintings(merged)
    Sync->>Store: setPalettePaintingIds(merged)
    Sync->>Store: setSyncing(false)

    loop Replay offline queue
        Sync->>Queue: peek()
        Queue-->>Sync: operation
        alt Success
            Sync->>Supa: execute operation
            Sync->>Queue: remove(id)
        else Failure (retry with backoff)
            Note over Sync: 1s → 2s → 4s → 8s → 16s
        else Permanent failure (5 retries exhausted)
            Sync->>DLQ: move operation
            Sync->>Store: addToDeadLetter()
        end
    end
```

### 4.3 Mutation Flow (user action)

```mermaid
flowchart LR
    ACTION["User taps<br/>'Add to Collection'"]
    STORE["Zustand Store<br/>+ MMKV write"]
    SYNC["syncService.<br/>upsertCollectionEntry()"]
    CHECK{syncing?}
    SUPA["Supabase<br/>upsert"]
    QUEUE["Offline Queue"]
    OK["Done"]

    ACTION --> STORE
    STORE --> SYNC
    SYNC --> CHECK
    CHECK -->|"yes"| QUEUE
    CHECK -->|"no"| SUPA
    SUPA -->|"success"| OK
    SUPA -->|"failure"| QUEUE

    style STORE fill:#50c878,color:#1a1a1a
    style QUEUE fill:#f4d03f,color:#1a1a1a
```

### 4.4 Conflict Resolution

| Scenario                       | Rule                                    |
|--------------------------------|-----------------------------------------|
| Entry in both local and remote | Compare `updated_at` — newer wins       |
| Timestamps equal (tie)         | Remote wins                             |
| Entry only in local            | Keep (will push to remote on next sync) |
| Entry only in remote           | Add to local                            |

### 4.5 Dead Letter Queue

Operations that fail after 5 retries with exponential backoff are moved to a dead-letter queue:
- Persisted in MMKV (`sync_dead_letter_queue` key)
- Visible in Settings screen with item count
- User can "Retry All" or "Discard"

---

## 5. Authentication Design

### 5.1 Supported Methods

| Method           | Provider       | Platform                           |
|------------------|----------------|------------------------------------|
| Email + password | Supabase Auth  | All                                |
| Apple Sign-In    | Supabase OAuth | iOS (required by App Store)        |
| Google Sign-In   | Supabase OAuth | All                                |
| Password reset   | Supabase email | All                                |
| Account deletion | Custom RPC     | All (required by App Store / GDPR) |

### 5.2 Auth Flow

```mermaid
stateDiagram-v2
    [*] --> Loading: App launch
    Loading --> Unauthenticated: No session
    Loading --> Authenticated: Session valid

    Unauthenticated --> Authenticated: signIn / signUp / OAuth
    Authenticated --> Unauthenticated: signOut / deleteAccount

    state Authenticated {
        [*] --> SyncOnLaunch
        SyncOnLaunch --> Ready
        Ready --> [*]
    }
```

### 5.3 Identity Model

| Layer                | Storage                                  | Purpose                          |
|----------------------|------------------------------------------|----------------------------------|
| Auth session         | MMKV (encrypted)                         | JWT tokens, refresh              |
| User ID              | Supabase `auth.users.id`                 | Foreign key for all user data    |
| Curator name         | Supabase `auth.users.raw_user_meta_data` | Display name, survives reinstall |
| Curator name (cache) | MMKV `curator_name_{userId}`             | Offline access                   |

### 5.4 Account Deletion

Calls `supabase.rpc('delete_user')` which:
1. Deletes all rows from `user_collection`, `user_palette`, `user_painting_likes`, `visits`
2. Deletes the `auth.users` row (ends session permanently)

---

## 6. Museum API Adapter Design

### 6.1 Pattern

Each museum API is wrapped by an adapter that normalizes its response into a standard `Painting`
type. Adapters self-register on import.

```mermaid
graph TD
    subgraph Adapters["14 Museum Adapters"]
        MET["metMuseumService<br/>(2-step: search → fetch)"]
        RIJKS["rijksmuseumService<br/>(REST + IIIF)"]
        CHI["chicagoService<br/>(REST + IIIF)"]
        WIKI["wikidataService<br/>(SPARQL)"]
        MORE["... 10 more"]
    end

    REG["Adapter Registry<br/>(Map&lt;id, adapter&gt;)"]
    UMS["Unified Museum Service<br/>searchAllMuseums()"]
    CACHE["Painting Cache<br/>(Supabase paintings table)"]
    UI["Screen"]

    MET -->|"registerAdapter()"| REG
    RIJKS -->|"registerAdapter()"| REG
    CHI -->|"registerAdapter()"| REG
    WIKI -->|"registerAdapter()"| REG
    MORE -->|"registerAdapter()"| REG

    REG --> UMS
    UMS -->|"1. check cache"| CACHE
    CACHE -->|"instant results"| UI
    UMS -->|"2. query APIs (background)"| Adapters
    UMS -->|"3. update cache"| CACHE

    style REG fill:#d4af37,color:#1a1a1a
    style UMS fill:#50c878,color:#1a1a1a
```

### 6.2 Adapter Interface

```typescript
interface MuseumServiceAdapter {
  museumId: string;
  search(params: {
    query: string;
    type: 'artist' | 'title';
    limit?: number;
  }): Promise<Painting[]>;
}
```

### 6.3 Museum Tiers

| Tier        | Museums                                                  | Behavior                           |
|-------------|----------------------------------------------------------|------------------------------------|
| 1 (default) | Met, Rijksmuseum, Chicago, Cleveland                     | Searched by default, most reliable |
| 2           | Harvard, V&A, National Gallery, SMK, Louvre, Smithsonian | Opt-in, good coverage              |
| 3           | Europeana, Paris Musees, Joconde, Wikidata               | Aggregators, complex APIs          |

### 6.4 Search Strategy

1. **Cache-first:** Check Supabase `paintings` table for cached results (instant)
2. **API in background:** Query selected museum APIs in parallel
3. **Deduplicate:** Same painting from multiple sources → keep best quality
4. **Cache update:** Store new results in Supabase for next time

---

## 7. Offline-First Design

### 7.1 Storage Layout

| MMKV Instance   | Keys                         | Purpose                          |
|-----------------|------------------------------|----------------------------------|
| Default         | `paintings_collection`       | Full painting array (Painting[]) |
| Default         | `palette_painting_ids`       | Palette UUID array               |
| Default         | `sync_last_sync_at`          | Last successful sync timestamp   |
| Default         | `sync_collection_updated_at` | Per-painting timestamp map       |
| Default         | `sync_dead_letter_queue`     | Failed operations                |
| `sync-queue`    | `sync_offline_queue`         | Pending operations               |
| `supabase-auth` | Session keys                 | Auth tokens                      |

### 7.2 Why Offline-First?

Museums have thick walls and poor connectivity. If the app required internet for every action, it
would be unusable in the exact place people need it most. Every user action succeeds instantly via
MMKV, then syncs when possible.

---

## 8. Component Architecture (Atomic Design)

```mermaid
graph BT
    subgraph Atoms["Atoms"]
        A1["Skeleton"]
        A2["BackButton"]
        A3["AssetByVariant"]
    end

    subgraph Molecules["Molecules"]
        M1["GridPaintingCard"]
        M2["PaletteTile"]
        M3["ProfileCard"]
        M4["EmptyState"]
        M5["SyncErrorBanner"]
        M6["ModalHeader"]
    end

    subgraph Organisms["Organisms"]
        O1["ErrorBoundary"]
        O2["MuseumSelector"]
    end

    subgraph Templates["Templates"]
        T1["SafeScreen"]
        T2["LoadingScreen"]
    end

    Atoms --> Molecules --> Organisms --> Templates
```

### Key Components

| Component          | Purpose                     | Key Props                                                |
|--------------------|-----------------------------|----------------------------------------------------------|
| `GridPaintingCard` | Thumbnail card in grids     | `painting`, `variant` (museum/status/minimal), `onPress` |
| `PaletteTile`      | Single slot in 3x3 palette  | `imageUrl`, `title`, `artist`, `size`, `badge?`          |
| `ProfileCard`      | Center card in palette grid | `profile`, `isFlipped`, `onPress`                        |
| `EmptyState`       | Shown when list is empty    | `icon`, `title`, `subtitle`, `action?`                   |
| `ErrorBoundary`    | Catches render errors       | `fallback?`, `onReset?`                                  |
| `MuseumSelector`   | Multi-select museum picker  | `selected`, `onChange`, `grouped by tier`                |

---

## 9. Design Language

### Art Deco Visual Identity

| Token      | Hex       | Usage                                |
|------------|-----------|--------------------------------------|
| Gold       | `#d4af37` | Primary accent, buttons, active tabs |
| Black      | `#1a1a1a` | Backgrounds                          |
| Cream      | `#f5f5dc` | Light surfaces, cards                |
| Emerald    | `#50c878` | "Seen" status                        |
| Gold Light | `#f4d03f` | "Want to Visit" status               |
| Danger     | `#e63946` | Destructive actions                  |

### Typography Rules

- Titles: UPPERCASE, `letterSpacing: 2`, bold
- Dividers: `◆` diamond character
- Proportions: 1.3:1 card aspect ratio (Art Deco geometric)

---

## 10. Security Model

### Threat Mitigations

| Threat                   | Mitigation                                                       |
|--------------------------|------------------------------------------------------------------|
| Unauthorized data access | Supabase RLS: `auth.uid() = user_id` on all user tables          |
| API key exposure         | Keys loaded from `.env` via `react-native-config`, never bundled |
| Session hijacking        | Supabase auto-refreshes tokens; MMKV encryption for auth storage |
| Cross-user data leak     | No client-side admin access; RLS enforces isolation              |
| Account data retention   | `delete_user()` RPC wipes all tables + auth record               |

### API Keys

| Service     | Key location                                | Fallback behavior                 |
|-------------|---------------------------------------------|-----------------------------------|
| Supabase    | `.env` `SUPABASE_URL` + `SUPABASE_ANON_KEY` | App throws on missing (hard fail) |
| Rijksmuseum | `.env` `RIJKSMUSEUM_API_KEY`                | Service disabled                  |
| Smithsonian | `.env` `SMITHSONIAN_API_KEY`                | Falls back to `DEMO_KEY`          |
| Harvard     | `.env` `HARVARD_API_KEY`                    | Service disabled                  |

---

## 11. Technology Decisions

| Decision         | Choice           | Alternatives Considered    | Rationale                                                         |
|------------------|------------------|----------------------------|-------------------------------------------------------------------|
| State management | Zustand          | Redux, MobX, React Context | 1.1 KB, selector subscriptions, no providers, works outside React |
| Local storage    | MMKV             | AsyncStorage, SQLite       | 30x faster than AsyncStorage, synchronous reads                   |
| HTTP client      | ky               | axios, fetch               | Built-in retry, timeout, hooks; tiny bundle                       |
| Backend          | Supabase         | Firebase, custom           | PostgreSQL + RLS + Auth + OAuth in one; generous free tier        |
| Navigation       | React Navigation | expo-router                | Mature, type-safe, supports stack + tabs                          |
| Images           | FastImage        | default Image              | Disk caching, priority loading, placeholder                       |
| Validation       | Zod v4           | io-ts, yup                 | TypeScript-first, small, composable                               |

---

## 12. Future Considerations

These are documented architectural decisions that haven't been implemented yet:

| Feature                         | Approach                                             | Complexity |
|---------------------------------|------------------------------------------------------|------------|
| Real-time sync                  | Supabase Realtime subscriptions on `user_collection` | Low        |
| Push notifications              | Supabase Edge Functions → Expo Push                  | Medium     |
| Image upload (custom paintings) | Supabase Storage bucket with RLS                     | Low        |
| Social features (follow, share) | New `follows` table + feed query                     | High       |
| Gamification (badges)           | Computed from collection stats, cached in `profiles` | Medium     |
| Multi-language                  | i18next already set up (EN, FR); add more JSON files | Low        |

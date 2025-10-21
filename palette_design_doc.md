# Palette - Design Document & Roadmap

## 🎨 Vision Statement
**Palette** is a social art discovery app that helps art lovers track paintings they've seen, discover new works by artists they love, and share their artistic taste with friends. Like Spotify Wrapped meets Instagram, but for museum-goers.

---

## 📖 Origin Story
The "Gerard Von Honthorst moment" - recognizing an artist's work in Utrecht after seeing their painting in Paris, but not knowing:
- Which paintings you've already seen
- Where to find more of their work
- How to track and share your art journey

**Problem**: Art lovers have no way to organize, track, and share their museum experiences.

**Solution**: Palette - Your personal art collection tracker and social discovery platform.

---

## 🎯 Core Value Propositions

1. **Track Your Journey**: Checkbox paintings you've seen, know what's left to discover
2. **Artist Discovery**: "You liked this? Here are 5 more by this artist near you"
3. **Show Your Taste**: Curate your favorite 8 paintings in a beautiful Palette display
4. **Plan Visits**: See which museums have paintings you want to see
5. **Social Discovery**: Connect with people who share your artistic taste
6. **Gamification**: Earn badges, complete collections, see your art personality

---

## 🏗️ Technical Architecture

### Current Tech Stack
- **Framework**: React Native (with The Coding Machine boilerplate)
- **Navigation**: React Navigation (Stack + Bottom Tabs)
- **State Management**: TanStack Query (server state) + React Hooks (UI state)
- **Storage**: React Native MMKV (local storage)
- **Styling**: React Native StyleSheet
- **Language**: TypeScript

### Future Tech Stack Additions
- **Backend**: Firebase or Supabase (auth, database, storage)
- **Image Handling**: React Native Image Picker, React Native Fast Image
- **API**: RESTful or GraphQL
- **Analytics**: Basic usage tracking

---

## 📱 App Structure & Navigation

### Bottom Tab Navigation (Main)
1. **Home** 🏠 - Feed of paintings from people you follow
2. **Search** 🔍 - Discover paintings, artists, users, museums
3. **Profile** 👤 - Your Palette and collection (IMPLEMENTED ✅)

### Stack Navigation (Overlays)
- **Painting Detail** - Full view of painting with info
- **Add Painting** - Add new painting to your collection
- **Artist Page** - All works by an artist
- **Museum Page** - All paintings in a museum
- **User Profile** - View other users' Palettes
- **Settings** - Account settings

---

## 🎨 Design Philosophy

### Visual Identity
- **Classy but Artsy**: Museum-quality feel with playful interactions
- **Color Palette**: Clean whites, soft grays, pops of vibrant colors from artwork
- **Typography**: Elegant serif for titles, clean sans-serif for body
- **Interactions**: Smooth animations, satisfying feedback (like card flips)
- **Grid System**: Instagram-inspired but unique to art

### Key UI Principles
1. **Art First**: Paintings are the star, UI supports but doesn't compete
2. **Tactile Interactions**: Flip cards, swipe galleries, satisfying feedback
3. **Context Awareness**: Show relevant info (museum location, artist bio) at the right time
4. **Progressive Disclosure**: Don't overwhelm, reveal details on demand

---

## 📋 Feature Roadmap

### ✅ PHASE 0: Foundation (COMPLETED)
**Status**: Done  
**Timeline**: Completed

- [x] Project setup with React Native boilerplate
- [x] Bottom tab navigation working
- [x] Profile screen with 3x3 Palette grid
- [x] Flip card interaction
- [x] Component structure (PaintingCard, ProfileCard)
- [x] Mock data system (types, mockPaintings.ts)

---

### 🎯 PHASE 1: Core Experience (MVP)
**Goal**: Complete the "add, view, showcase" loop  
**Timeline**: 2-3 weeks  
**Status**: Next Up

#### 1.1 Polish Palette UI ⭐ (Week 1)
**Priority**: High - Sets the visual tone for entire app

- [ ] Larger, more immersive cards (fill screen width better)
- [ ] Better spacing and padding
- [ ] Smooth flip animations (react-native-reanimated)
- [ ] Artsy header design
- [ ] Custom fonts (elegant serif + modern sans)
- [ ] Shadow and depth improvements
- [ ] Loading states with skeleton screens

**Success Metric**: "Wow" factor when showing to friends

---

#### 1.2 Painting Detail Screen (Week 1-2)
**Priority**: High - Core information architecture

- [ ] Full-screen painting view
- [ ] Artist name, title, year, medium
- [ ] Museum location with map
- [ ] "Mark as Seen" toggle button
- [ ] Share button
- [ ] "More by this artist" section
- [ ] Smooth transition from Palette card

**Data Model**:
```typescript
type PaintingDetail = {
  id: string;
  title: string;
  artist: string;
  year: number;
  medium: string;
  dimensions: string;
  museum: string;
  location: string;
  imageUrl: string;
  description?: string;
  isSeen: boolean;
  isInPalette: boolean;
}
```

---

#### 1.3 Add Painting Flow (Week 2)
**Priority**: High - Core user action

- [ ] Button to add new painting
- [ ] Form: title, artist, year, museum
- [ ] Image picker (camera or gallery)
- [ ] Optional: location, notes, date visited
- [ ] Save to collection
- [ ] Option to add to Palette immediately

**UI Flow**:
1. Tap "+" button (floating action button or tab bar)
2. Form screen with inputs
3. Success animation
4. Navigate to Painting Detail

---

#### 1.4 Collection View (Week 2-3)
**Priority**: Medium - See beyond just Palette

- [ ] Grid view of ALL paintings you've added
- [ ] Filter: All / Seen / Want to See / In Palette
- [ ] Sort: Recent, Artist, Museum, Date Added
- [ ] Search within your collection
- [ ] Tap to view detail
- [ ] Long press for quick actions (add to palette, remove)

**Stats Bar**:
- Total paintings: 42
- Seen: 38
- Want to see: 4
- Museums visited: 8

---

#### 1.5 Basic Search (Week 3)
**Priority**: Medium - Discovery

- [ ] Search bar in Search tab
- [ ] Search mock database by title or artist
- [ ] Results in grid
- [ ] Tap result to see detail
- [ ] "Add to Collection" button

---

### 🚀 PHASE 2: Social Foundation
**Goal**: Enable sharing and discovery  
**Timeline**: 3-4 weeks  
**Status**: Future

#### 2.1 User Authentication
- [ ] Sign up / Login screens
- [ ] Firebase/Supabase authentication
- [ ] Secure token storage (MMKV)
- [ ] Protected routes

#### 2.2 User Profiles
- [ ] View other users' Palettes
- [ ] Follow/Unfollow
- [ ] User stats (paintings seen, museums visited)

#### 2.3 Home Feed
- [ ] See paintings added by people you follow
- [ ] Like functionality (UI only first, then backend)
- [ ] Comment system (optional)
- [ ] "Shared a visit to Louvre" posts

#### 2.4 Backend Integration
- [ ] Set up Firebase/Supabase
- [ ] User database
- [ ] Paintings collection
- [ ] Cloud storage for images
- [ ] API queries with TanStack Query

---

### 🎮 PHASE 3: Gamification & Discovery
**Goal**: Keep users engaged and discovering  
**Timeline**: 3-4 weeks  
**Status**: Future

#### 3.1 Artist Pages
- [ ] View all paintings by an artist
- [ ] Artist bio and info
- [ ] "You've seen X of Y paintings"
- [ ] Filter by museum location

#### 3.2 Museum Pages
- [ ] List of paintings in a museum
- [ ] Museum info, hours, location
- [ ] "Plan a visit" feature
- [ ] Check which paintings you've seen

#### 3.3 Badges & Achievements
- [ ] Badge system (Baroque Lover, Museum Hopper, etc.)
- [ ] Progress tracking
- [ ] Unlock special palette frames/themes

#### 3.4 Taste Analysis
- [ ] Analyze user's collection
- [ ] Top artists, periods, styles
- [ ] "Spotify Wrapped" style annual recap
- [ ] Share your art personality

---

### 🌟 PHASE 4: Advanced Features
**Goal**: Differentiate and delight  
**Timeline**: 4-6 weeks  
**Status**: Future

#### 4.1 Smart Recommendations
- [ ] "Based on your palette, you might like..."
- [ ] Museum visit suggestions
- [ ] Artist deep dives

#### 4.2 Trip Planning
- [ ] "Create Museum Route"
- [ ] Multi-city art trips
- [ ] Integration with maps

#### 4.3 AR Features (Ambitious)
- [ ] Point camera at painting, auto-identify
- [ ] Auto-check-in at museums
- [ ] AR frame around paintings for photos

#### 4.4 Social Features
- [ ] Palette challenges
- [ ] Group museum visits
- [ ] Gift paintings to friends' collections

---

## 📊 Success Metrics

### Phase 1 (MVP)
- User can add 10+ paintings to collection
- User can curate their Palette of 8
- App loads and navigates smoothly
- "Wow" reaction from 3 test users

### Phase 2 (Social)
- 10+ active users
- 100+ paintings in database
- Users checking app 2x/week
- Average 5 paintings per user

### Phase 3 (Engagement)
- 50+ active users
- Users earning badges
- User returning to app during museum visits
- Social sharing happening

---

## 🎨 Current Implementation Status

### ✅ What's Working Now

#### File Structure
```
src/
├── components/
│   └── molecules/
│       ├── PaintingCard/
│       │   └── PaintingCard.tsx      ✅ Reusable painting display
│       └── ProfileCard/
│           └── ProfileCard.tsx        ✅ Profile picture card
├── data/
│   └── mockPaintings.ts               ✅ Mock painting data
├── navigation/
│   ├── Application.tsx                ✅ Main nav container
│   ├── TabNavigator.tsx               ✅ Bottom tabs
│   ├── paths.ts                       ✅ Route definitions
│   └── types.ts                       ✅ Nav type safety
├── screens/
│   ├── Home/
│   │   └── Home.tsx                   ✅ Feed (placeholder)
│   ├── Profile/
│   │   └── Profile.tsx                ✅ Palette grid with flip
│   ├── Search/
│   │   └── Search.tsx                 ⚠️  Placeholder screen
│   └── Startup/
│       └── Startup.tsx                ✅ Splash/loading
├── types/
│   └── painting.ts                    ✅ TypeScript definitions
└── App.tsx                            ✅ Root component
```

#### Key Components

**PaintingCard** (`src/components/molecules/PaintingCard/PaintingCard.tsx`)
- Shows painting placeholder (colorful square with 🎨)
- Flips to show title and artist
- Reusable across app

**ProfileCard** (`src/components/molecules/ProfileCard/ProfileCard.tsx`)
- Circular profile picture with user initial
- Flips to show username and stats
- Used in center of Palette grid

**Profile Screen** (`src/screens/Profile/Profile.tsx`)
- 3x3 grid layout
- Profile card in center (position 4)
- 8 painting cards around it
- Tap to flip any card
- Uses mock data from `mockPaintings.ts`

#### Data Structure
```typescript
// src/types/painting.ts
type Painting = {
  id: number;
  title: string;
  artist: string;
  imageUrl?: string;
  color: string; // placeholder
}

type UserProfile = {
  username: string;
  profileColor: string;
  stats: {
    paintings: number;
    followers: string;
    following: number;
  }
}
```

---

## 🎯 Next Session Goals

### Immediate (Today/Tomorrow):
1. **Polish Palette UI**
   - Bigger cards
   - Better spacing
   - Smooth animations
   - Custom colors/fonts

### Short Term (This Week):
2. **Painting Detail Screen**
   - Full painting view
   - All metadata
   - Share functionality

3. **Add Painting Flow**
   - Simple form
   - Image picker
   - Save to collection

---

## 💭 Open Questions & Decisions Needed

### Name: Is "Palette" Right? 🤔

**Pros:**
- ✅ Perfect metaphor (colors on palette = paintings in collection)
- ✅ Visual and memorable
- ✅ Art-related without being pretentious
- ✅ Short and pronounceable
- ✅ Available as domain/app name?

**Cons:**
- ⚠️  Might be confused with color palette apps
- ⚠️  Doesn't immediately say "museum" or "paintings"

**Alternative Names to Consider:**
- **Galleria** (gallery vibe)
- **Curator** (you curate your collection)
- **Museé** (French, classy)
- **Frame** (framing your art journey)
- **Canvas** (blank slate for your collection)
- **Exhibit** (showcase your taste)

**My Opinion**: I LOVE "Palette" - it's unique, the metaphor is perfect (arranging your favorite paintings like colors on a palette), and the feature of showcasing your top 8 in a grid literally IS a palette. Keep it! 🎨

### Technical Decisions:
1. **Backend**: Firebase vs Supabase? (Recommendation: Firebase for quick MVP)
2. **Image Storage**: Cloud storage or URLs? (Start with URLs)
3. **Database Schema**: Firestore collections structure?

### Design Decisions:
1. **Color Scheme**: What's the primary brand color?
2. **Typography**: Which fonts? (Suggestion: Playfair Display + Inter)
3. **Palette Grid**: Stay 3x3 or allow customization?

---

## 📚 Resources Needed

### Design Assets
- [ ] App icon
- [ ] Splash screen
- [ ] Custom fonts
- [ ] Color palette definition
- [ ] Icon set for tabs/buttons

### Data Sources
- [ ] Initial painting database (start with 100 famous paintings)
- [ ] Museum database
- [ ] Artist information

### Development
- [ ] Firebase project setup
- [ ] Testing devices/users

---

## 🎉 Conclusion

**Palette** is a unique and viable concept that solves a real problem for art lovers. The MVP is achievable in 2-3 weeks, and the roadmap provides clear direction for growth.

**Next Steps:**
1. ✅ Complete this design doc
2. 🎨 Polish the Palette UI
3. 📱 Build Painting Detail Screen
4. ➕ Implement Add Painting Flow

**The name "Palette" is perfect.** Keep it! 🎨✨
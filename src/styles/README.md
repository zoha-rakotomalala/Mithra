# Mithra Style System

**Art Deco Design Language for the Palette App**

## Overview

The Mithra style system provides a cohesive, reusable set of styles inspired by Art Deco design principles from the 1920s-1930s. The system emphasizes:

- **Geometric forms** - Clean lines, symmetry, bold shapes
- **Luxurious materials** - Gold accents, rich colors
- **Elegant typography** - Bold, geometric letterforms
- **Sophisticated palette** - Black, gold, cream, jewel tones

---

## Quick Start

```typescript
import { shared, cards, badges, typography, buttons } from '@/styles';
import { COLORS, SPACING, CARD } from '@/constants';

// Use in your component
<View style={shared.container}>
  <Text style={typography.h1}>My Title</Text>
</View>
```

---

## Architecture

### Constants (`src/constants/`)
Foundational values used throughout the app:
- **colors.ts** - Color palette, museum colors, semantic colors
- **dimensions.ts** - Spacing, card sizes, proportions
- **museums.ts** - Museum badge metadata

### Styles (`src/styles/`)
Pre-built StyleSheet objects for common patterns:
- **shared.ts** - Common layouts, containers, helpers
- **cards.ts** - Painting card styles
- **badges.ts** - Status and museum badges
- **typography.ts** - Text styles
- **buttons.ts** - Button styles

---

## Usage Guide

### 1. Colors

```typescript
import { COLORS } from '@/constants';

// Primary Art Deco palette
COLORS.gold          // #d4af37 - Primary brand color
COLORS.black         // #1a1a1a - Primary text
COLORS.cream         // #f5f5dc - Backgrounds
COLORS.ivory         // #fffff0 - Light backgrounds

// Status colors
COLORS.seen          // Green - "Seen" status
COLORS.wantToVisit   // Gold - "Want to Visit" status
COLORS.inPalette     // Gold - In palette

// Museum colors
MUSEUM_COLORS.met
MUSEUM_COLORS.rijksmuseum
// ... etc

// Usage
<View style={{ backgroundColor: COLORS.gold }}>
  <Text style={{ color: COLORS.black }}>Hello</Text>
</View>
```

### 2. Spacing & Dimensions

```typescript
import { SPACING, CARD, GRID } from '@/constants';

// Spacing scale
SPACING.xs    // 4
SPACING.sm    // 8
SPACING.md    // 16
SPACING.lg    // 24
SPACING.xl    // 32
SPACING.xxl   // 48

// Card dimensions (auto-calculated)
CARD.gridWidth      // Width for 3-column grid
CARD.gridHeight     // Height with Art Deco 1.3 ratio
CARD.borderRadius   // 8

// Grid system
GRID.columns   // 3
GRID.gutter    // 16
GRID.margin    // 24

// Usage
<View style={{ 
  padding: SPACING.md,
  marginBottom: SPACING.lg 
}}>
```

### 3. Typography

```typescript
import { typography } from '@/styles';

// Headings
<Text style={typography.h1}>Main Title</Text>
<Text style={typography.h2}>Section Title</Text>
<Text style={typography.h3}>Subsection</Text>

// Body text
<Text style={typography.body}>Regular text</Text>
<Text style={typography.bodyLarge}>Larger text</Text>
<Text style={typography.bodySmall}>Small text</Text>

// Special styles
<Text style={typography.label}>LABEL</Text>
<Text style={typography.caption}>Caption text</Text>

// Art Deco specific
<Text style={typography.artDecoTitle}>GALLERY</Text>
<Text style={typography.artDecoSubtitle}>COLLECTION</Text>
```

### 4. Cards

```typescript
import { cards } from '@/styles';
import { CARD } from '@/constants';

// Grid painting card
<View style={cards.gridCard}>
  <View style={cards.imageContainer}>
    <Image 
      source={{ uri: painting.imageUrl }}
      style={cards.image}
    />
  </View>
  <Text style={cards.cardTitle} numberOfLines={2}>
    {painting.title}
  </Text>
  <Text style={cards.cardArtist} numberOfLines={1}>
    {painting.artist}
  </Text>
  <Text style={cards.cardYear}>
    {painting.year}
  </Text>
</View>

// With placeholder
<View style={cards.imagePlaceholder}>
  <Text style={cards.imagePlaceholderIcon}>🎨</Text>
</View>

// With loading overlay
<View style={cards.imageLoadingOverlay}>
  <ActivityIndicator color={COLORS.gold} />
</View>
```

### 5. Badges

```typescript
import { badges } from '@/styles';
import { COLORS } from '@/constants';
import { getMuseumBadge } from '@/constants/museums';

// Status badges (Seen/Want to Visit)
{painting.isSeen && (
  <View style={[badges.statusBadge, badges.statusBadgeSeen]}>
    <Text style={badges.statusBadgeText}>S</Text>
  </View>
)}

{painting.wantToVisit && (
  <View style={[badges.statusBadge, badges.statusBadgeWant]}>
    <Text style={badges.statusBadgeText}>W</Text>
  </View>
)}

// Museum badge
const museumInfo = getMuseumBadge(painting.museum);
<View style={[badges.museumBadge, { backgroundColor: museumInfo.color }]}>
  <Text style={badges.museumBadgeText}>{museumInfo.shortName}</Text>
</View>

// Multiple status badges
<View style={badges.statusBadgeContainer}>
  {/* badges here */}
</View>
```

### 6. Buttons

```typescript
import { buttons } from '@/styles';

// Primary button
<TouchableOpacity style={buttons.primary}>
  <Text style={buttons.primaryText}>Add to Collection</Text>
</TouchableOpacity>

// Secondary button
<TouchableOpacity style={buttons.secondary}>
  <Text style={buttons.secondaryText}>Cancel</Text>
</TouchableOpacity>

// Icon button
<TouchableOpacity style={buttons.iconButton}>
  <Icon name="heart" />
</TouchableOpacity>

// Small button
<TouchableOpacity style={[buttons.primary, buttons.small]}>
  <Text style={[buttons.primaryText, buttons.smallText]}>Save</Text>
</TouchableOpacity>
```

### 7. Shared Utilities

```typescript
import { shared } from '@/styles';

// Containers
<View style={shared.container}>           // Full screen
<View style={shared.centered}>            // Centered content
<View style={shared.paddingHorizontal}>   // Horizontal padding

// Flex layouts
<View style={shared.row}>                 // Horizontal
<View style={shared.rowCenter}>           // Horizontal + centered
<View style={shared.rowBetween}>          // Space between

// Gaps
<View style={[shared.row, shared.gap8]}>  // 8px gap

// Shadows
<View style={shared.shadowLight}>         // Subtle shadow
<View style={shared.shadowMedium}>        // Medium shadow

// Dividers
<View style={shared.artDecoDivider} />    // Gold divider line
```

---

## Common Patterns

### Grid of Painting Cards

```typescript
import { cards, badges } from '@/styles';
import { COLORS, GRID } from '@/constants';
import { getMuseumBadge } from '@/constants/museums';

<FlatList
  data={paintings}
  numColumns={GRID.columns}
  columnWrapperStyle={{ gap: GRID.gutter }}
  contentContainerStyle={{ 
    padding: GRID.margin,
    gap: GRID.gutter 
  }}
  renderItem={({ item }) => (
    <TouchableOpacity style={cards.gridCard}>
      <View style={cards.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={cards.image} />
        
        {/* Museum badge (Search screen) */}
        {showMuseumBadge && (
          <View style={[
            badges.museumBadge, 
            { backgroundColor: getMuseumBadge(item.museum).color }
          ]}>
            <Text style={badges.museumBadgeText}>
              {getMuseumBadge(item.museum).shortName}
            </Text>
          </View>
        )}
        
        {/* Status badges (Collection screen) */}
        {item.isSeen && (
          <View style={[badges.statusBadge, badges.statusBadgeSeen]}>
            <Text style={badges.statusBadgeText}>S</Text>
          </View>
        )}
      </View>
      
      <Text style={cards.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={cards.cardArtist} numberOfLines={1}>{item.artist}</Text>
      {item.year && <Text style={cards.cardYear}>{item.year}</Text>}
    </TouchableOpacity>
  )}
/>
```

### Screen Layout

```typescript
import { shared, typography } from '@/styles';
import { COLORS } from '@/constants';

<View style={shared.container}>
  <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
  
  <View style={shared.paddingHorizontal}>
    <Text style={typography.h1}>Screen Title</Text>
    <View style={shared.artDecoDivider} />
  </View>
  
  {/* Content */}
</View>
```

---

## Design Principles

### 1. Consistency
Always use constants and shared styles instead of inline values:
```typescript
// ❌ Don't
<View style={{ padding: 16, backgroundColor: '#d4af37' }}>

// ✅ Do
<View style={{ padding: SPACING.md, backgroundColor: COLORS.gold }}>
```

### 2. Composition
Combine styles for flexibility:
```typescript
<View style={[shared.row, shared.gap8, shared.paddingHorizontal]}>
```

### 3. Semantic Naming
Use semantic color names:
```typescript
// ❌ Don't
backgroundColor: COLORS.gold

// ✅ Do (when appropriate)
backgroundColor: COLORS.seen  // For status
backgroundColor: COLORS.inPalette  // For palette items
```

### 4. Art Deco Aesthetic
- Use gold accents sparingly for emphasis
- Maintain geometric, clean layouts
- Prefer bold, uppercase labels for headings
- Use subtle shadows, not heavy drop shadows

---

## Migration Guide

### Before (Inline Styles)
```typescript
const styles = StyleSheet.create({
  card: {
    width: (width - 48) / 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 4,
  },
});
```

### After (Shared Styles)
```typescript
import { cards } from '@/styles';

// Use pre-built styles
<View style={cards.gridCard}>
  <Text style={cards.cardTitle}>{title}</Text>
</View>
```

---

## FAQ

**Q: When should I create new styles vs. use shared styles?**
A: Use shared styles for common patterns (cards, badges, buttons). Create component-specific styles only for unique layouts.

**Q: Can I override shared styles?**
A: Yes! Combine with inline styles:
```typescript
<Text style={[typography.h1, { color: COLORS.gold }]}>
```

**Q: How do I add new colors?**
A: Add to `src/constants/colors.ts` and document the use case.

**Q: What if I need a different card size?**
A: Use the constants as a base:
```typescript
width: CARD.gridWidth * 2  // Double width
```

---

## Resources

- **Art Deco Reference**: [Wikipedia](https://en.wikipedia.org/wiki/Art_Deco)
- **Color Palette**: See `src/constants/colors.ts`
- **Component Examples**: See screen implementations in `src/screens/`

---

**Last Updated:** 2026-01-03

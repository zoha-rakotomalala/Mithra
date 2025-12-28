import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';
import { usePaintings } from '@/contexts/PaintingsContext';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 3;

type FilterType = 'all' | 'seen' | 'unseen' | 'museum' | 'artist';
type SortType = 'seenFirst' | 'alphabetical' | 'yearNewest' | 'yearOldest';

export function Collection() {
  const navigation = useNavigation();
  const { paintings } = usePaintings();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('seenFirst');

  // Calculate stats
  const stats = useMemo(() => {
    const total = paintings.length;
    const seen = paintings.filter(p => p.isSeen).length;
    const unseen = total - seen;
    return { total, seen, unseen };
  }, [paintings]);

  // Filter and sort paintings
  const filteredAndSortedPaintings = useMemo(() => {
    let filtered = [...paintings];

    // Apply filters
    switch (activeFilter) {
      case 'seen':
        filtered = filtered.filter(p => p.isSeen);
        break;
      case 'unseen':
        filtered = filtered.filter(p => !p.isSeen);
        break;
      // Add more filters as needed
    }

    // Apply sorting
    switch (sortBy) {
      case 'seenFirst':
        filtered.sort((a, b) => {
          if (a.isSeen === b.isSeen) return 0;
          return a.isSeen ? -1 : 1;
        });
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'yearNewest':
        filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case 'yearOldest':
        filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
    }

    return filtered;
  }, [paintings, activeFilter, sortBy]);

  const handlePaintingPress = (painting: Painting) => {
    navigation.navigate(Paths.PaintingDetail, { painting });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Collection</Text>
          <View style={styles.brushStroke} />
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.seenNumber]}>{stats.seen}</Text>
            <Text style={styles.statLabel}>Seen</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.unseenNumber]}>{stats.unseen}</Text>
            <Text style={styles.statLabel}>To Discover</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
            contentContainerStyle={styles.filtersContent}
          >
            <FilterChip
              label="All"
              isActive={activeFilter === 'all'}
              onPress={() => setActiveFilter('all')}
            />
            <FilterChip
              label="Seen"
              isActive={activeFilter === 'seen'}
              onPress={() => setActiveFilter('seen')}
            />
            <FilterChip
              label="Unseen"
              isActive={activeFilter === 'unseen'}
              onPress={() => setActiveFilter('unseen')}
            />
            <FilterChip
              label="By Museum"
              isActive={activeFilter === 'museum'}
              onPress={() => setActiveFilter('museum')}
            />
            <FilterChip
              label="By Artist"
              isActive={activeFilter === 'artist'}
              onPress={() => setActiveFilter('artist')}
            />
          </ScrollView>

          {/* Sort Options */}
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortOptions}
            >
              <SortOption
                label="Seen First"
                isActive={sortBy === 'seenFirst'}
                onPress={() => setSortBy('seenFirst')}
              />
              <SortOption
                label="A-Z"
                isActive={sortBy === 'alphabetical'}
                onPress={() => setSortBy('alphabetical')}
              />
              <SortOption
                label="Newest"
                isActive={sortBy === 'yearNewest'}
                onPress={() => setSortBy('yearNewest')}
              />
              <SortOption
                label="Oldest"
                isActive={sortBy === 'yearOldest'}
                onPress={() => setSortBy('yearOldest')}
              />
            </ScrollView>
          </View>

          {/* Paintings Grid */}
          <View style={styles.grid}>
            {filteredAndSortedPaintings.map((painting) => (
              <TouchableOpacity
                key={painting.id}
                style={styles.gridItem}
                onPress={() => handlePaintingPress(painting)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.paintingCard,
                    !painting.isSeen && styles.unseenCard,
                  ]}
                >
                  {painting.imageUrl ? (
                    <>
                      <Image
                        source={{ uri: painting.imageUrl }}
                        style={styles.paintingImage}
                        resizeMode="cover"
                      />
                      {!painting.isSeen && <View style={styles.unseenFilter} />}
                    </>
                  ) : (
                    <View style={[styles.paintingPlaceholder, { backgroundColor: painting.color }]}>
                      <View style={styles.artFrame}>
                        <Text style={[
                          styles.paintingIcon,
                          !painting.isSeen && styles.unseenIcon
                        ]}>
                          🎨
                        </Text>
                      </View>
                    </View>
                  )}

                  {!painting.isSeen && (
                    <View style={styles.unseenOverlay}>
                      <Text style={styles.unseenLabel}>Not Seen</Text>
                    </View>
                  )}
                  {painting.isSeen && (
                    <View style={styles.seenBadge}>
                      <Text style={styles.seenBadgeText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.paintingTitle} numberOfLines={2}>
                  {painting.title}
                </Text>
                <Text style={styles.paintingArtist} numberOfLines={1}>
                  {painting.artist}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// Filter Chip Component
function FilterChip({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// Sort Option Component
function SortOption({ label, isActive, onPress }: { label: string; isActive: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.sortOption, isActive && styles.sortOptionActive]}
      onPress={onPress}
    >
      <Text style={[styles.sortOptionText, isActive && styles.sortOptionTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#1a4d3e',
    fontStyle: 'italic',
  },
  brushStroke: {
    marginTop: 4,
    width: 100,
    height: 2,
    backgroundColor: '#2d6a4f',
    borderRadius: 2,
    opacity: 0.6,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  seenNumber: {
    color: '#2d6a4f',
  },
  unseenNumber: {
    color: '#999',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E8E8E8',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  filtersContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  filterChipActive: {
    backgroundColor: '#1a4d3e',
    borderColor: '#1a4d3e',
  },
  filterChipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  sortContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sortLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  sortOptionActive: {
    backgroundColor: '#2d6a4f',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridItem: {
    width: CARD_SIZE,
    marginBottom: 20,
    padding: 4,
  },
  paintingCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paintingImage: {
    width: '100%',
    height: '100%',
  },
  unseenFilter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  paintingPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unseenCard: {
    opacity: 0.4,
  },
  artFrame: {
    width: '80%',
    height: '80%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paintingIcon: {
    fontSize: 40,
    opacity: 0.9,
  },
  unseenIcon: {
    opacity: 0.5,
  },
  unseenOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unseenLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  seenBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2d6a4f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seenBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  paintingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 8,
    lineHeight: 16,
  },
  paintingArtist: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
});
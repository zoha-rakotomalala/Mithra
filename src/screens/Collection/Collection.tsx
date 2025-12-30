import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';
import { usePaintings } from '@/contexts/PaintingsContext';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 64) / 3;

type FilterType = 'all' | 'seen' | 'wantToVisit' | 'artist' | 'museum';
type SortType = 'recentlyAdded' | 'alphabetical' | 'yearNewest' | 'yearOldest';

type GroupedSection = {
  title: string;
  data: Painting[];
};

// Memoized painting card
const PaintingCard = React.memo(({
  painting,
  onPress
}: {
  painting: Painting;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={styles.gridItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.paintingCard}>
      {painting.imageUrl ? (
        <FastImage
          source={{
            uri: painting.thumbnailUrl || painting.imageUrl,
            priority: FastImage.priority.normal,
            cache: FastImage.cacheControl.immutable,
          }}
          style={styles.paintingImage}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <View style={[styles.paintingPlaceholder, { backgroundColor: painting.color }]}>
          <View style={styles.artFrame}>
            <Text style={styles.paintingIcon}>🎨</Text>
          </View>
        </View>
      )}

      {/* Status Badge */}
      {painting.isSeen && (
        <View style={styles.seenBadge}>
          <Text style={styles.badgeIcon}>♥</Text>
        </View>
      )}
      {painting.wantToVisit && (
        <View style={styles.wantToVisitBadge}>
          <Text style={styles.badgeIcon}>◆</Text>
        </View>
      )}
    </View>

    <Text style={styles.paintingTitle} numberOfLines={2}>
      {painting.title}
    </Text>
    <Text style={styles.paintingArtist} numberOfLines={1}>
      {painting.artist}
    </Text>
    {painting.year && (
      <Text style={styles.paintingYear}>{painting.year}</Text>
    )}
  </TouchableOpacity>
));

export function Collection() {
  const navigation = useNavigation();
  const { paintings, getPaintingsByArtist, getPaintingsByMuseum } = usePaintings();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recentlyAdded');

  // Calculate stats
  const stats = useMemo(() => {
    const total = paintings.length;
    const seen = paintings.filter(p => p.isSeen).length;
    const wantToVisit = paintings.filter(p => p.wantToVisit).length;
    return { total, seen, wantToVisit };
  }, [paintings]);

  // Prepare data based on filter
  const preparedData = useMemo(() => {
    if (activeFilter === 'artist') {
      const grouped = getPaintingsByArtist();
      return Array.from(grouped.entries()).map(([artist, paintingsData]) => ({
        title: artist,
        data: paintingsData,
      }));
    }

    if (activeFilter === 'museum') {
      const grouped = getPaintingsByMuseum();
      return Array.from(grouped.entries()).map(([museum, paintingsData]) => ({
        title: museum,
        data: paintingsData,
      }));
    }

    // For flat filters, return single section
    let filtered = [...paintings];

    switch (activeFilter) {
      case 'seen':
        filtered = filtered.filter(p => p.isSeen);
        break;
      case 'wantToVisit':
        filtered = filtered.filter(p => p.wantToVisit);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'recentlyAdded':
        filtered.sort((a, b) => {
          const dateA = new Date(a.dateAdded || 0).getTime();
          const dateB = new Date(b.dateAdded || 0).getTime();
          return dateB - dateA;
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

    return [{ title: '', data: filtered }];
  }, [paintings, activeFilter, sortBy, getPaintingsByArtist, getPaintingsByMuseum]);

  const isGroupedView = activeFilter === 'artist' || activeFilter === 'museum';

  const handlePaintingPress = useCallback((painting: Painting) => {
    navigation.navigate(Paths.PaintingDetail, { painting });
  }, [navigation]);

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>🖼️</Text>
      <Text style={styles.emptyTitle}>No Paintings Yet</Text>
      <Text style={styles.emptyText}>
        Start building your collection by searching for paintings in the Search tab.
      </Text>
    </View>
  );

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
            <Text style={[styles.statNumber, styles.wantNumber]}>{stats.wantToVisit}</Text>
            <Text style={styles.statLabel}>Want to Visit</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <FlatList
            horizontal
            data={[
              { key: 'all', label: 'All' },
              { key: 'artist', label: 'By Artist' },
              { key: 'museum', label: 'By Museum' },
              { key: 'seen', label: 'Seen' },
              { key: 'wantToVisit', label: 'Want to Visit' },
            ]}
            renderItem={({ item }) => (
              <FilterChip
                label={item.label}
                isActive={activeFilter === item.key}
                onPress={() => setActiveFilter(item.key as FilterType)}
              />
            )}
            keyExtractor={item => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        {/* Sort Options (only for non-grouped views) */}
        {!isGroupedView && (
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <FlatList
              horizontal
              data={[
                { key: 'recentlyAdded', label: 'Recently Added' },
                { key: 'alphabetical', label: 'A-Z' },
                { key: 'yearNewest', label: 'Newest' },
                { key: 'yearOldest', label: 'Oldest' },
              ]}
              renderItem={({ item }) => (
                <SortOption
                  label={item.label}
                  isActive={sortBy === item.key}
                  onPress={() => setSortBy(item.key as SortType)}
                />
              )}
              keyExtractor={item => item.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortOptions}
            />
          </View>
        )}

        {/* Content */}
        {paintings.length === 0 ? (
          renderEmpty()
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {isGroupedView ? (
              // Grouped view with horizontal carousels
              preparedData.map((section, index) => (
                <View key={`section-${index}`} style={styles.groupSection}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupTitle}>{section.title}</Text>
                    <Text style={styles.groupCount}>
                      {section.data.length} {section.data.length === 1 ? 'painting' : 'paintings'}
                    </Text>
                  </View>
                  <FlatList
                    horizontal
                    data={section.data}
                    renderItem={({ item }) => (
                      <PaintingCard
                        painting={item}
                        onPress={() => handlePaintingPress(item)}
                      />
                    )}
                    keyExtractor={item => `painting-${item.id}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                  />
                </View>
              ))
            ) : (
              // Grid view for All, Seen, Want to Visit
              <View style={styles.grid}>
                {preparedData[0].data.map((painting) => (
                  <PaintingCard
                    key={painting.id}
                    painting={painting}
                    onPress={() => handlePaintingPress(painting)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}
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
    color: '#e63946',
  },
  wantNumber: {
    color: '#f59e0b',
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
  filtersSection: {
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
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
    marginRight: 8,
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
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
    marginRight: 8,
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
  groupSection: {
    marginBottom: 24,
  },
  groupHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f7f4',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3e',
  },
  groupCount: {
    fontSize: 12,
    color: '#666',
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    marginHorizontal: 4,
  },
  paintingCard: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paintingImage: {
    width: '100%',
    height: '100%',
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
  seenBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  wantToVisitBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeIcon: {
    fontSize: 16,
    color: '#fff',
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
  paintingYear: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    paddingVertical: 80,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a4d3e',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
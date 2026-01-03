import type { Painting } from '@/types/painting';

import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import { Paths } from '@/navigation/paths';

import { usePaintings } from '@/contexts/PaintingsContext';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 64) / 3;

type FilterType = 'all' | 'artist' | 'museum' | 'seen' | 'wantToVisit';
type GroupedSection = {
  data: Painting[];
  title: string;
};

type SortType = 'alphabetical' | 'recentlyAdded' | 'yearNewest' | 'yearOldest';

// Memoized painting card
const PaintingCard = React.memo(({
  onPress,
  painting
}: {
  readonly onPress: () => void;
  readonly painting: Painting;
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={onPress}
    style={styles.gridItem}
  >
    <View style={styles.paintingCard}>
      {painting.imageUrl ? (
        <FastImage
          resizeMode={FastImage.resizeMode.cover}
          source={{
            cache: FastImage.cacheControl.immutable,
            priority: FastImage.priority.normal,
            uri: painting.thumbnailUrl || painting.imageUrl,
          }}
          style={styles.paintingImage}
        />
      ) : (
        <View style={[styles.paintingPlaceholder, { backgroundColor: painting.color }]}>
          <View style={styles.artFrame}>
            <Text style={styles.paintingIcon}>🎨</Text>
          </View>
        </View>
      )}

      {/* Status Badge */}
      {painting.isSeen ? <View style={styles.seenBadge}>
          <Text style={styles.badgeIcon}>S</Text>
        </View> : null}
      {painting.wantToVisit ? <View style={styles.wantToVisitBadge}>
          <Text style={styles.badgeIcon}>W</Text>
        </View> : null}
    </View>

    <Text numberOfLines={2} style={styles.paintingTitle}>
      {painting.title}
    </Text>
    <Text numberOfLines={1} style={styles.paintingArtist}>
      {painting.artist}
    </Text>
    {painting.year ? <Text style={styles.paintingYear}>{painting.year}</Text> : null}
  </TouchableOpacity>
));

export function Collection() {
  const navigation = useNavigation();
  const { getPaintingsByArtist, getPaintingsByMuseum, paintings } = usePaintings();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recentlyAdded');

  // Calculate stats
  const stats = useMemo(() => {
    const total = paintings.length;
    const seen = paintings.filter(p => p.isSeen).length;
    const wantToVisit = paintings.filter(p => p.wantToVisit).length;
    return { seen, total, wantToVisit };
  }, [paintings]);

  // Prepare data based on filter
  const preparedData = useMemo(() => {
    if (activeFilter === 'artist') {
      const grouped = getPaintingsByArtist();
      return [...grouped.entries()].map(([artist, paintingsData]) => ({
        data: paintingsData,
        title: artist,
      }));
    }

    if (activeFilter === 'museum') {
      const grouped = getPaintingsByMuseum();
      return [...grouped.entries()].map(([museum, paintingsData]) => ({
        data: paintingsData,
        title: museum,
      }));
    }

    let filtered = [...paintings];

    switch (activeFilter) {
      case 'seen': {
        filtered = filtered.filter(p => p.isSeen);
        break;
      }
      case 'wantToVisit': {
        filtered = filtered.filter(p => p.wantToVisit);
        break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical': {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      }
      case 'recentlyAdded': {
        filtered.sort((a, b) => {
          const dateA = new Date(a.dateAdded || 0).getTime();
          const dateB = new Date(b.dateAdded || 0).getTime();
          return dateB - dateA;
        });
        break;
      }
      case 'yearNewest': {
        filtered.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      }
      case 'yearOldest': {
        filtered.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      }
    }

    return [{ data: filtered, title: '' }];
  }, [paintings, activeFilter, sortBy, getPaintingsByArtist, getPaintingsByMuseum]);

  const isGroupedView = activeFilter === 'artist' || activeFilter === 'museum';

  const handlePaintingPress = useCallback((painting: Painting) => {
    navigation.navigate(Paths.PaintingDetail, { painting });
  }, [navigation]);

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
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
      <View style={styles.container}>
        {/* Art Deco Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>COLLECTION</Text>
          <View style={styles.headerDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerOrnament}>◆</Text>
            <View style={styles.dividerLine} />
          </View>
        </View>

        {/* Art Deco Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>PAINTINGS</Text>
          </View>
          <View style={styles.statDivider}>
            <Text style={styles.statDividerText}>·</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.seenNumber]}>{stats.seen}</Text>
            <Text style={styles.statLabel}>SEEN</Text>
          </View>
          <View style={styles.statDivider}>
            <Text style={styles.statDividerText}>·</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, styles.wantNumber]}>{stats.wantToVisit}</Text>
            <Text style={styles.statLabel}>TO VISIT</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <FlatList
            contentContainerStyle={styles.filtersContent}
            data={[
              { key: 'all', label: 'All' },
              { key: 'artist', label: 'By Artist' },
              { key: 'museum', label: 'By Museum' },
              { key: 'seen', label: 'Seen' },
              { key: 'wantToVisit', label: 'Want to Visit' },
            ]}
            horizontal
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { setActiveFilter(item.key as FilterType); }}
                style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, activeFilter === item.key && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Sort Options (only for non-grouped views) */}
        {!isGroupedView && (
          <View style={styles.sortContainer}>
            <FlatList
              contentContainerStyle={styles.sortOptions}
              data={[
                { key: 'recentlyAdded', label: 'Recently Added' },
                { key: 'alphabetical', label: 'A-Z' },
                { key: 'yearNewest', label: 'Newest' },
                { key: 'yearOldest', label: 'Oldest' },
              ]}
              horizontal
              keyExtractor={item => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setSortBy(item.key as SortType); }}
                  style={[styles.sortOption, sortBy === item.key && styles.sortOptionActive]}
                >
                  <Text style={[styles.sortOptionText, sortBy === item.key && styles.sortOptionTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
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
                      {section.data.length}
                    </Text>
                  </View>
                  <FlatList
                    contentContainerStyle={styles.horizontalList}
                    data={section.data}
                    horizontal
                    keyExtractor={item => `painting-${item.id}`}
                    renderItem={({ item }) => (
                      <PaintingCard
                        onPress={() => { handlePaintingPress(item); }}
                        painting={item}
                      />
                    )}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>
              ))
            ) : (
              // Grid view for All, Seen, Want to Visit
              <View style={styles.grid}>
                {preparedData[0].data.map((painting) => (
                  <PaintingCard
                    key={painting.id}
                    onPress={() => { handlePaintingPress(painting); }}
                    painting={painting}
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

const styles = StyleSheet.create({
  artFrame: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    borderWidth: 2,
    height: '80%',
    justifyContent: 'center',
    width: '80%',
  },
  badgeIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 12,
    textAlign: 'center',
  },
  container: {
    backgroundColor: '#f5f3ed', // Cream
    flex: 1,
  },
  dividerLine: {
    backgroundColor: '#d4af37',
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  dividerOrnament: {
    color: '#d4af37',
    fontSize: 12,
    marginHorizontal: 12,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#004d40',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  filterChip: {
    backgroundColor: 'transparent',
    borderColor: '#004d40',
    borderRadius: 2,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#004d40',
    borderColor: '#d4af37',
  },
  filterChipText: {
    color: '#004d40',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  filterChipTextActive: {
    color: '#d4af37',
  },
  filtersContent: {
    gap: 8,
    paddingHorizontal: 20,
  },
  filtersSection: {
    backgroundColor: '#f5f3ed',
    borderBottomColor: '#e0ddd5',
    borderBottomWidth: 1,
    paddingVertical: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridItem: {
    marginBottom: 20,
    marginHorizontal: 4,
    width: CARD_SIZE,
  },
  groupCount: {
    color: '#666',
    fontSize: 12,
    letterSpacing: 1,
  },
  groupHeader: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 77, 64, 0.05)',
    borderLeftColor: '#d4af37',
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  groupSection: {
    marginBottom: 24,
  },
  groupTitle: {
    color: '#004d40',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#d4af37',
    borderBottomWidth: 2,
    paddingBottom: 20,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  headerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '60%',
  },
  headerTitle: {
    color: '#d4af37',
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  paintingArtist: {
    color: '#666',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  paintingCard: {
    aspectRatio: 0.75,
    backgroundColor: '#f0f0f0',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 2,
    borderWidth: 2,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  paintingIcon: {
    fontSize: 40,
    opacity: 0.9,
  },
  paintingImage: {
    height: '100%',
    width: '100%',
  },
  paintingPlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  paintingTitle: {
    color: '#2c2c2c',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    marginTop: 8,
  },
  paintingYear: {
    color: '#999',
    fontSize: 9,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  seenBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    borderRadius: 12,
    elevation: 4,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    top: 8,
    width: 24,
  },
  seenNumber: {
    color: '#e63946',
  },
  sortContainer: {
    backgroundColor: '#f5f3ed',
    borderBottomColor: '#e0ddd5',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sortOption: {
    backgroundColor: 'transparent',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    borderRadius: 2,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortOptionActive: {
    borderBottomColor: '#d4af37',
  },
  sortOptions: {
    gap: 8,
  },
  sortOptionText: {
    color: '#666',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
  },
  sortOptionTextActive: {
    color: '#004d40',
    fontWeight: '700',
  },
  statDivider: {
    justifyContent: 'center',
  },
  statDividerText: {
    color: 'rgba(212, 175, 55, 0.3)',
    fontSize: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(212, 175, 55, 0.7)',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 4,
  },
  statNumber: {
    color: '#d4af37',
    fontSize: 28,
    fontWeight: '300',
  },
  statsBar: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  wantNumber: {
    color: '#f59e0b',
  },
  wantToVisitBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    borderRadius: 12,
    elevation: 4,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    top: 8,
    width: 24,
  },
});
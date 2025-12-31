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
          <Text style={styles.badgeIcon}>S</Text>
        </View>
      )}
      {painting.wantToVisit && (
        <View style={styles.wantToVisitBadge}>
          <Text style={styles.badgeIcon}>W</Text>
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
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
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
            horizontal
            data={[
              { key: 'all', label: 'All' },
              { key: 'artist', label: 'By Artist' },
              { key: 'museum', label: 'By Museum' },
              { key: 'seen', label: 'Seen' },
              { key: 'wantToVisit', label: 'Want to Visit' },
            ]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(item.key as FilterType)}
              >
                <Text style={[styles.filterChipText, activeFilter === item.key && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.key}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        {/* Sort Options (only for non-grouped views) */}
        {!isGroupedView && (
          <View style={styles.sortContainer}>
            <FlatList
              horizontal
              data={[
                { key: 'recentlyAdded', label: 'Recently Added' },
                { key: 'alphabetical', label: 'A-Z' },
                { key: 'yearNewest', label: 'Newest' },
                { key: 'yearOldest', label: 'Oldest' },
              ]}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.sortOption, sortBy === item.key && styles.sortOptionActive]}
                  onPress={() => setSortBy(item.key as SortType)}
                >
                  <Text style={[styles.sortOptionText, sortBy === item.key && styles.sortOptionTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
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
                      {section.data.length}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ed', // Cream
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#d4af37',
    marginBottom: 12,
  },
  headerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d4af37',
    opacity: 0.5,
  },
  dividerOrnament: {
    fontSize: 12,
    color: '#d4af37',
    marginHorizontal: 12,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '300',
    color: '#d4af37',
  },
  seenNumber: {
    color: '#e63946',
  },
  wantNumber: {
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(212, 175, 55, 0.7)',
    marginTop: 4,
    letterSpacing: 2,
  },
  statDivider: {
    justifyContent: 'center',
  },
  statDividerText: {
    fontSize: 24,
    color: 'rgba(212, 175, 55, 0.3)',
  },
  filtersSection: {
    paddingVertical: 16,
    backgroundColor: '#f5f3ed',
    borderBottomWidth: 1,
    borderBottomColor: '#e0ddd5',
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 2,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#004d40',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#004d40',
    borderColor: '#d4af37',
  },
  filterChipText: {
    fontSize: 11,
    color: '#004d40',
    fontWeight: '600',
    letterSpacing: 1,
  },
  filterChipTextActive: {
    color: '#d4af37',
  },
  sortContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f5f3ed',
    borderBottomWidth: 1,
    borderBottomColor: '#e0ddd5',
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 2,
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: 8,
  },
  sortOptionActive: {
    borderBottomColor: '#d4af37',
  },
  sortOptionText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 1,
  },
  sortOptionTextActive: {
    color: '#004d40',
    fontWeight: '700',
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
    backgroundColor: 'rgba(0, 77, 64, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: '#d4af37',
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004d40',
    letterSpacing: 0.5,
  },
  groupCount: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 1,
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
    borderRadius: 2,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
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
  paintingPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artFrame: {
    width: '80%',
    height: '80%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
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
    width: 24,
    height: 24,
    borderRadius: 12,
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
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  paintingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c2c2c',
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
    fontSize: 9,
    color: '#999',
    marginTop: 2,
    letterSpacing: 0.5,
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
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#004d40',
    marginBottom: 12,
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
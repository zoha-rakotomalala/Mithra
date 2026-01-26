import type { Painting } from '@/types/painting';

import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import { Paths } from '@/navigation/paths';
import { COLORS } from '@/constants';

import { usePaintings } from '@/contexts/PaintingsContext';
import { collectionStyles as styles } from './Collection.styles';

const { width } = Dimensions.get('window');

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.black} barStyle="light-content" />
      <View style={styles.container}>
        {/* Compact Header - Like Search */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>COLLECTION</Text>
        </View>

        {/* Compact Inline Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCompact}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>paintings</Text>
          </View>
          <Text style={styles.statDivider}>·</Text>
          <View style={styles.statCompact}>
            <Text style={[styles.statNumber, styles.seenNumber]}>{stats.seen}</Text>
            <Text style={styles.statLabel}>seen</Text>
          </View>
          <Text style={styles.statDivider}>·</Text>
          <View style={styles.statCompact}>
            <Text style={[styles.statNumber, styles.wantNumber]}>{stats.wantToVisit}</Text>
            <Text style={styles.statLabel}>to visit</Text>
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
    </SafeAreaView>
  );
}
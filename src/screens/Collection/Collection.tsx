import type { Painting } from '@/types/painting';

import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';

import { COLORS } from '@/constants';
import { museumImageSource } from '@/utils/imageSource';

import { EmptyState, SyncErrorBanner } from '@/components/molecules';
import { useCollectionFilter } from '@/hooks/domain/collection/useCollectionFilter';
import { collectionStyles as styles } from './Collection.styles';

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
          source={museumImageSource(painting.thumbnailUrl || painting.imageUrl)}
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
  const {
    paintings,
    activeFilter,
    setActiveFilter,
    sortBy,
    setSortBy,
    stats,
    preparedData,
    isGroupedView,
    syncing,
    syncError,
    handlePaintingPress,
  } = useCollectionFilter();

  const renderEmpty = () => (
    <EmptyState
      icon="🖼️"
      title="No Paintings Yet"
      subtitle="Start building your collection by searching for paintings in the Search tab."
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.black} barStyle="light-content" />
      <View style={styles.container}>
        {/* Compact Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>COLLECTION</Text>
        </View>

        {syncing && (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <ActivityIndicator color={COLORS.white} size="small" />
            <Text style={{ color: COLORS.white, fontSize: 12, marginTop: 4, opacity: 0.7 }}>Syncing...</Text>
          </View>
        )}

        <SyncErrorBanner error={syncError} />

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
                onPress={() => { setActiveFilter(item.key as any); }}
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
                  onPress={() => { setSortBy(item.key as any); }}
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

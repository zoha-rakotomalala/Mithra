import type { Painting } from '@/types/painting';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { MuseumSelector } from '@/components/organisms';
import { searchStyles as styles } from './Search.styles';
import { COLORS } from '@/constants/colors';
import { getMuseumBadgeInfo } from '@/services/unifiedMuseumService';
import { useSearch } from '@/hooks/domain/museum/useSearch';

const GridItem = React.memo(({
  collectionStatus,
  inCollection,
  isLiked,
  onPress,
  onToggleLike,
  painting
}: {
  readonly collectionStatus?: { isSeen: boolean; wantToVisit: boolean };
  readonly inCollection: boolean;
  readonly isLiked?: boolean;
  readonly onPress: () => void;
  readonly onToggleLike?: () => void;
  readonly painting: Painting;
}) => {
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);
  const badgeInfo = getMuseumBadgeInfo(painting);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.resultCard}
    >
      <View style={styles.imageContainer}>
        {painting.imageUrl || painting.thumbnailUrl ? (
          <>
            {imageLoading && !imageError && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator color={COLORS.gold} size="small" />
              </View>
            )}
            <FastImage
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
              onLoadEnd={() => setImageLoading(false)}
              onLoadStart={() => setImageLoading(true)}
              resizeMode={FastImage.resizeMode.cover}
              source={{
                cache: FastImage.cacheControl.immutable,
                priority: FastImage.priority.normal,
                uri: painting.thumbnailUrl || painting.imageUrl || '',
              }}
              style={styles.resultImage}
            />
          </>
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: painting.color }]}>
            <Text style={styles.placeholderIcon}>🎨</Text>
          </View>
        )}

        {imageError && (
          <View style={[styles.placeholderImage, { backgroundColor: painting.color }]}>
            <Text style={styles.placeholderIcon}>🖼️</Text>
          </View>
        )}

        {inCollection && collectionStatus && (
          <View style={styles.statusBadge}>
            {collectionStatus.isSeen && <Text style={styles.badgeTextSeen}>S</Text>}
            {collectionStatus.wantToVisit && <Text style={styles.badgeTextWant}>W</Text>}
          </View>
        )}

        <View style={[styles.museumBadge, { backgroundColor: badgeInfo.color }]}>
          <Text style={styles.museumBadgeText}>{badgeInfo.shortName}</Text>
        </View>

        {onToggleLike && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              onToggleLike();
            }}
            style={styles.likeButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.likeButtonText}>{isLiked ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text numberOfLines={2} style={styles.resultTitle}>
        {painting.title}
      </Text>
      <Text numberOfLines={1} style={styles.resultArtist}>
        {painting.artist}
      </Text>
      {painting.year && <Text style={styles.resultYear}>{painting.year}</Text>}
    </TouchableOpacity>
  );
});

export function Search() {
  const {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults,
    isLoadingCache,
    hasSearched,
    selectedMuseums,
    setSelectedMuseums,
    showMuseumPicker,
    setShowMuseumPicker,
    allMuseums,
    popularArtists,
    handleSearch,
    handleArtistSearch,
    isAlreadyInCollection,
    clearSearch,
    visitId: activeVisitId,
    handleLike,
    isLiked,
    handlePaintingPress,
    goBack,
    hasVisitId,
  } = useSearch();

  const renderItem = useCallback(({ item }: { readonly item: Painting }) => {
    const collectionInfo = isAlreadyInCollection(item);
    return (
      <GridItem
        collectionStatus={collectionInfo.status}
        inCollection={collectionInfo.inCollection}
        isLiked={activeVisitId ? isLiked(item) : undefined}
        onPress={() => handlePaintingPress(item)}
        onToggleLike={activeVisitId ? () => handleLike(item) : undefined}
        painting={item}
      />
    );
  }, [handlePaintingPress, isAlreadyInCollection, activeVisitId, isLiked, handleLike]);

  const keyExtractor = useCallback((item: Painting) => `painting-${item.id}`, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor={COLORS.text} barStyle="light-content" />
      <View style={styles.container}>
        {/* Improved Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {hasVisitId && (
              <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
                <Text style={styles.backText}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>SEARCH</Text>
          </View>

          {/* Search Type Selector */}
          <View style={styles.searchTypeRow}>
            <Text style={styles.searchTypeLabel}>Search by:</Text>
            <View style={styles.searchTypeButtons}>
              <TouchableOpacity
                onPress={() => setSearchType('artist')}
                style={[
                  styles.searchTypeButton,
                  searchType === 'artist' && styles.searchTypeButtonActive
                ]}
              >
                <Text style={[
                  styles.searchTypeButtonText,
                  searchType === 'artist' && styles.searchTypeButtonTextActive
                ]}>
                  Artist
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSearchType('title')}
                style={[
                  styles.searchTypeButton,
                  searchType === 'title' && styles.searchTypeButtonActive
                ]}
              >
                <Text style={[
                  styles.searchTypeButtonText,
                  searchType === 'title' && styles.searchTypeButtonTextActive
                ]}>
                  Title
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                placeholder={searchType === 'artist' ? 'Artist name...' : 'Painting title...'}
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              disabled={!searchQuery.trim() || isLoadingCache}
              onPress={handleSearch}
              style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]}
            >
              <Text style={styles.searchButtonText}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Museum Selector */}
          <TouchableOpacity
            onPress={() => setShowMuseumPicker(true)}
            style={styles.museumSelectButton}
          >
            <View style={styles.museumSelectContent}>
              <Text style={styles.museumSelectLabel}>Museums</Text>
              <Text style={styles.museumSelectValue}>
                {selectedMuseums.length} of {allMuseums.length} selected
              </Text>
            </View>
            <Text style={styles.museumSelectIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Museum Picker Modal */}
        <Modal
          animationType="slide"
          presentationStyle="pageSheet"
          visible={showMuseumPicker}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Museums</Text>
              <TouchableOpacity
                onPress={() => setShowMuseumPicker(false)}
                style={styles.modalDoneButton}
              >
                <Text style={styles.modalDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
            <MuseumSelector
              onMuseumsChange={setSelectedMuseums}
              selectedMuseums={selectedMuseums}
            />
          </SafeAreaView>
        </Modal>

        {/* Centered Results Grid */}
        <FlatList
          contentContainerStyle={styles.gridContainer}
          data={searchResults}
          initialNumToRender={15}
          keyExtractor={keyExtractor}
          ListEmptyComponent={() => (
            !isLoadingCache && !hasSearched ? (
              <View style={styles.emptyState}>
                {searchType === 'artist' && popularArtists.length > 0 && (
                  <>
                    <Text style={styles.popularTitle}>Popular Artists</Text>
                    <View style={styles.artistChips}>
                      {popularArtists.slice(0, 6).map((artist) => (
                        <TouchableOpacity
                          key={artist}
                          onPress={() => handleArtistSearch(artist)}
                          style={styles.artistChip}
                        >
                          <Text style={styles.artistChipText}>{artist}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
                <Text style={styles.emptyHint}>
                  {selectedMuseums.length} museum{selectedMuseums.length > 1 ? 's' : ''} • 2.5M+ artworks
                </Text>
              </View>
            ) : isLoadingCache ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={COLORS.gold} size="large" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : null
          )}
          maxToRenderPerBatch={15}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          removeClippedSubviews
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          updateCellsBatchingPeriod={50}
          windowSize={7}
        />
      </View>
    </SafeAreaView>
  );
}

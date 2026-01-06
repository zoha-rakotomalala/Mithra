import type { Painting } from '@/types/painting';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
import { Paths } from '@/navigation/paths';
import { MuseumSelector } from '@/components/MuseumSelector';
import { usePaintings } from '@/contexts/PaintingsContext';
import { searchStyles as styles } from './Search.styles';
import { getAllMuseums, TIER_1_MUSEUMS } from '@/services/museumRegistry';
import {
  getMuseumBadgeInfo,
  getPopularArtistsByMuseums,
  searchAllMuseums,
  type SearchType,
  type ProgressUpdate
} from '@/services/unifiedMuseumService';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 32) / 3; // 3 columns with padding
const GRID_PADDING = 16;

const GridItem = React.memo(({
  collectionStatus,
  inCollection,
  onPress,
  painting
}: {
  readonly collectionStatus?: { isSeen: boolean; wantToVisit: boolean };
  readonly inCollection: boolean;
  readonly onPress: () => void;
  readonly painting: Painting;
}) => {
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);
  const badgeInfo = getMuseumBadgeInfo(painting);

  // Debug Chicago images
  React.useEffect(() => {
    if (typeof painting.id === 'string' && painting.id.startsWith('chicago-')) {
      console.log('Chicago painting in grid:', {
        id: painting.id,
        title: painting.title,
        imageUrl: painting.imageUrl,
        thumbnailUrl: painting.thumbnailUrl,
      });
    }
  }, [painting]);

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
                <ActivityIndicator color="#d4af37" size="small" />
              </View>
            )}
            <FastImage
              onError={(error) => {
                console.log('FastImage error for:', painting.title, error);
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
  const navigation = useNavigation();
  const { paintings: existingPaintings } = usePaintings();
  const allMuseums = getAllMuseums();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('artist');
  const [searchResults, setSearchResults] = useState<Painting[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedMuseums, setSelectedMuseums] = useState<string[]>(TIER_1_MUSEUMS);
  const [showMuseumPicker, setShowMuseumPicker] = useState(false);
  const [cacheStats, setCacheStats] = useState({ added: 0 });

  const handleProgressUpdate = useCallback((update: ProgressUpdate) => {
    if (update.phase === 'cache') {
      setIsLoadingCache(false);
    } else if (update.phase === 'api') {
      setIsRefreshing(true);
    } else if (update.phase === 'complete') {
      setIsRefreshing(false);
      if (update.added) {
        setCacheStats({ added: update.added });
        setTimeout(() => setCacheStats({ added: 0 }), 3000);
      }
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (selectedMuseums.length === 0) {
      Alert.alert('Notice', 'Please select at least one museum to search');
      return;
    }

    setIsLoadingCache(true);
    setHasSearched(true);
    setCacheStats({ added: 0 });

    try {
      const result = await searchAllMuseums({
        query: searchQuery,
        searchType,
        museumIds: selectedMuseums,
        maxResultsPerMuseum: 20,
        useCache: true,
        onProgressUpdate: handleProgressUpdate,
      });

      setSearchResults(result.paintings);

      if (result.paintings.length === 0) {
        Alert.alert(
          'No Results',
          `No ${searchType === 'artist' ? 'works by' : 'paintings titled'} "${searchQuery}" found.\n\nTry different keywords or select more museums.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Search Error',
        'Failed to search paintings. Please check your connection.',
        [{ text: 'OK' }]
      );
      console.error('Search error:', error);
    } finally {
      setIsLoadingCache(false);
      setIsRefreshing(false);
    }
  };

  const handleArtistSearch = async (artistName: string) => {
    setSearchQuery(artistName);
    setSearchType('artist');
    setIsLoadingCache(true);
    setHasSearched(true);

    try {
      const result = await searchAllMuseums({
        query: artistName,
        searchType: 'artist',
        museumIds: selectedMuseums,
        maxResultsPerMuseum: 20,
        useCache: true,
        onProgressUpdate: handleProgressUpdate,
      });

      setSearchResults(result.paintings);
    } catch {
      Alert.alert('Search Error', 'Failed to search paintings by artist.');
    } finally {
      setIsLoadingCache(false);
      setIsRefreshing(false);
    }
  };

  const handlePaintingPress = useCallback((painting: Painting) => {
    navigation.navigate(Paths.PaintingDetail, { painting });
  }, [navigation]);

  const isAlreadyInCollection = useCallback((painting: Painting) => {
    const found = existingPaintings.find(
      p => p.id === painting.id ||
      (p.title.toLowerCase() === painting.title.toLowerCase() &&
       p.artist.toLowerCase() === painting.artist.toLowerCase())
    );
    return found ? {
      inCollection: true,
      status: { isSeen: found.isSeen || false, wantToVisit: found.wantToVisit || false }
    } : { inCollection: false };
  }, [existingPaintings]);

  const renderItem = useCallback(({ item }: { readonly item: Painting }) => {
    const collectionInfo = isAlreadyInCollection(item);
    return (
      <GridItem
        collectionStatus={collectionInfo.status}
        inCollection={collectionInfo.inCollection}
        onPress={() => handlePaintingPress(item)}
        painting={item}
      />
    );
  }, [handlePaintingPress, isAlreadyInCollection]);

  const keyExtractor = useCallback((item: Painting) => `painting-${item.id}`, []);
  const popularArtists = getPopularArtistsByMuseums(selectedMuseums);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
      <View style={styles.container}>
        {/* Improved Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>SEARCH ART</Text>
            {isRefreshing && (
              <ActivityIndicator size="small" color="#d4af37" style={styles.headerSpinner} />
            )}
            {cacheStats.added > 0 && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>+{cacheStats.added}</Text>
              </View>
            )}
          </View>

          {/* Search Type Selector - Clear labels */}
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
                placeholderTextColor="#666"
                returnKeyType="search"
                style={styles.searchInput}
                value={searchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setHasSearched(false);
                  }}
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

          {/* Museum Selector - Clear button */}
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
                <ActivityIndicator color="#d4af37" size="large" />
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
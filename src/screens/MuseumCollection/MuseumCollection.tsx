import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { searchAllMuseums } from '@/services/unifiedMuseumService';
import { likePainting, unlikePainting, getLikedLegacyIdsForVisit } from '@/services';
import { GridPaintingCard } from '@/components/molecules';
import { shared, typography } from '@/styles';
import { COLORS, GRID } from '@/constants';
import { collectionStyles as styles } from './styles';
import type { Painting } from '@/types/painting';

export function MuseumCollection() {
  const navigation = useNavigation();
  const route = useRoute();
  const { museumId, visitId } = route.params as { museumId: string; visitId: string };

  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLikedPaintings();
  }, [museumId, visitId]);

  const loadLikedPaintings = async () => {
    const liked = await getLikedLegacyIdsForVisit(visitId);
    setLikedIds(liked);
  };

  const searchCollection = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a search term');
      return;
    }

    setLoading(true);
    try {
      // ✅ Use unified search with quality filters
      const result = await searchAllMuseums({
        query: searchQuery.trim(),
        searchType: 'title',
        museumIds: [museumId],
        maxResultsPerMuseum: 50,
        qualityFilters: {
          requireImage: true,
          requireArtist: true,
          paintingsOnly: true,
          minRelevanceScore: 10,
        }
      });

      setPaintings(result.paintings);

      if (result.paintings.length === 0) {
        alert('No results found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching collection:', error);
      alert('Failed to search. Please try again.');
    }
    setLoading(false);
  };

  const handleLike = async (painting: Painting) => {
    const paintingId = `${museumId.toLowerCase()}-${painting.id}`;
    const isLiked = likedIds.has(paintingId);

    if (isLiked) {
      await unlikePainting(paintingId, visitId);
      setLikedIds(prev => {
        const next = new Set(prev);
        next.delete(paintingId);
        return next;
      });
    } else {
      await likePainting(paintingId, visitId);
      setLikedIds(prev => new Set(prev).add(paintingId));
    }
  };

  const renderPainting = ({ item }: { item: Painting }) => {
    const paintingId = `${museumId.toLowerCase()}-${item.id}`;
    const isLiked = likedIds.has(paintingId);

    return (
      <View style={styles.cardWrapper}>
        <GridPaintingCard
          variant="minimal"
          painting={item}
          onPress={() => console.log('View painting:', item.id)}
        />
        <TouchableOpacity
          style={[styles.likeButton, isLiked && styles.likeButtonActive]}
          onPress={() => handleLike(item)}
        >
          <Text style={styles.likeIcon}>{isLiked ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={shared.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={typography.artDecoTitle}>{museumId} COLLECTION</Text>
          <View style={shared.artDecoDivider} />
        </View>

        {/* ✅ Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search artworks (e.g., Monet, landscapes, impressionism)"
            placeholderTextColor={'#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={searchCollection}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={searchCollection}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>
              {loading ? '...' : '🔍'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results or Empty State */}
        {paintings.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={[typography.body, styles.emptyText]}>
              {searchQuery.trim()
                ? 'No results found. Try a different search term.'
                : `Enter a search term to explore the ${museumId} collection`
              }
            </Text>
            <Text style={[typography.caption, styles.emptyHint]}>
              Try searching for artists, movements, or subjects
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={typography.body}>Searching for quality artworks...</Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={typography.caption}>
                {paintings.length} result{paintings.length !== 1 ? 's' : ''} found
              </Text>
            </View>
            <FlatList
              data={paintings}
              renderItem={renderPainting}
              keyExtractor={(item) => String(item.id)}
              numColumns={GRID.columns}
              columnWrapperStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: GRID.margin,
                marginBottom: GRID.gutter
              }}
              contentContainerStyle={{
                paddingTop: GRID.margin,
                paddingBottom: GRID.margin
              }}
            />
          </>
        )}
      </View>
    </>
  );
}
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GridPaintingCard } from '@/components/molecules';
import { shared, typography } from '@/styles';
import { COLORS, GRID } from '@/constants';
import { collectionStyles as styles } from './MuseumCollection.styles';
import { useMuseumCollection } from '@/hooks/domain/museum/useMuseumCollection';
import type { Painting } from '@/types/painting';

export function MuseumCollection() {
  const navigation = useNavigation();
  const route = useRoute();
  const { museumId, visitId } = route.params as {
    museumId: string;
    visitId: string;
  };

  const {
    paintings,
    loading,
    searchQuery,
    setSearchQuery,
    searchCollection,
    handleLike,
    isLiked,
  } = useMuseumCollection(museumId, visitId);

  const renderPainting = ({ item }: { item: Painting }) => {
    const liked = isLiked(item);
    return (
      <View style={styles.cardWrapper}>
        <GridPaintingCard
          variant="minimal"
          painting={item}
          onPress={() => console.log('View painting:', item.id)}
        />
        <TouchableOpacity
          style={[styles.likeButton, liked && styles.likeButtonActive]}
          onPress={() => handleLike(item)}
        >
          <Text style={styles.likeIcon}>{liked ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={shared.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text
              style={typography.artDecoTitle}
            >{`${museumId} COLLECTION`}</Text>
          </View>
        </View>

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
            style={[
              styles.searchButton,
              loading && styles.searchButtonDisabled,
            ]}
            onPress={searchCollection}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>
              {loading ? '...' : '🔍'}
            </Text>
          </TouchableOpacity>
        </View>

        {paintings.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={[typography.body, styles.emptyText]}>
              {searchQuery.trim()
                ? 'No results found. Try a different search term.'
                : `Enter a search term to explore the ${museumId} collection`}
            </Text>
            <Text style={[typography.caption, styles.emptyHint]}>
              Try searching for artists, movements, or subjects
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.gold} />
            <Text style={typography.body}>
              Searching for quality artworks...
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={typography.caption}>
                {paintings.length} result{paintings.length !== 1 ? 's' : ''}{' '}
                found
              </Text>
            </View>
            <FlatList
              data={paintings}
              renderItem={renderPainting}
              keyExtractor={(item) => item.id}
              numColumns={GRID.columns}
              columnWrapperStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: GRID.margin,
                marginBottom: GRID.gutter,
              }}
              contentContainerStyle={{
                paddingTop: GRID.margin,
                paddingBottom: GRID.margin,
              }}
            />
          </>
        )}
      </View>
    </>
  );
}

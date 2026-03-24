import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GridPaintingCard, EmptyState } from '@/components/molecules';
import { shared, typography } from '@/styles';
import { COLORS, GRID } from '@/constants';
import { useLikedPaintings } from '@/hooks/domain/visits/useLikedPaintings';
import { likedPaintingsStyles as styles } from './LikedPaintings.styles';
import type { Painting } from '@/types/painting';
import type { Painting as CachedPainting } from '@/types/database';

function toUIPainting(db: CachedPainting): Painting {
  return {
    id: db.id,
    title: db.title,
    artist: db.artist,
    year: db.year,
    imageUrl: db.image_url,
    thumbnailUrl: db.thumbnail_url,
    color: db.color || '#cccccc',
    museum: db.museum_id,
  };
}

export function LikedPaintings() {
  const navigation = useNavigation();
  const route = useRoute();
  const { visitId } = route.params as { visitId: string };

  const { paintings, loading, count } = useLikedPaintings(visitId);

  const uiPaintings = paintings.map(toUIPainting);

  const renderPainting = ({ item }: { item: Painting }) => (
    <GridPaintingCard
      variant="minimal"
      painting={item}
      onPress={() => console.log('View painting:', item.id)}
    />
  );

  if (loading) {
    return (
      <View style={shared.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={typography.artDecoTitle}>LIKED ARTWORKS</Text>
          <View style={shared.artDecoDivider} />
        </View>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={COLORS.gold} />
          <Text style={typography.body}>Loading liked artworks...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={shared.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={typography.artDecoTitle}>LIKED ARTWORKS</Text>
          <View style={shared.artDecoDivider} />
        </View>

        {count === 0 ? (
          <EmptyState
            icon="♡"
            title="No Liked Artworks"
            subtitle="Browse the collection to like paintings"
          />
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={typography.caption}>
                {count} liked artwork{count !== 1 ? 's' : ''}
              </Text>
            </View>
            <FlatList
              data={uiPaintings}
              renderItem={renderPainting}
              keyExtractor={(item) => String(item.id)}
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

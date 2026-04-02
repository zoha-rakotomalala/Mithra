import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GridPaintingCard, EmptyState } from '@/components/molecules';
import { shared, typography } from '@/styles';
import { COLORS, GRID } from '@/constants';
import { useLikedPaintings } from '@/hooks/domain/visits/useLikedPaintings';
import { likedPaintingsStyles as styles } from './LikedPaintings.styles';
import { Paths } from '@/navigation/paths';
import { createSyncService } from '@/services/syncService';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/App';
import type { Painting } from '@/types/painting';
import type { Painting as CachedPainting } from '@/types/database';
import type { UserCollectionEntry } from '@/types/database';

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
  const { user } = useAuth();

  const { paintings, loading, count, museumName, visitDate } = useLikedPaintings(visitId);

  const uiPaintings = paintings.map(toUIPainting);

  const onPaintingPress = useCallback((item: Painting) => {
    // Guard: skip upsert if painting_id is falsy
    if (item.id && user?.id) {
      const now = new Date().toISOString();
      const entry: UserCollectionEntry = {
        id: '',
        user_id: user.id,
        painting_id: String(item.id),
        is_seen: true,
        want_to_visit: false,
        seen_date: visitDate || null,
        date_added: now,
        notes: null,
        created_at: now,
        updated_at: now,
      };

      const syncService = createSyncService(storage);
      syncService.upsertCollectionEntry(user.id, entry).catch(err => {
        console.error('[LikedPaintings] Failed to upsert collection entry:', err?.message || err);
      });
    }

    navigation.navigate(Paths.PaintingDetail as never, { painting: item } as never);
  }, [user, museumName, visitDate, navigation]);

  const renderPainting = ({ item }: { item: Painting }) => (
    <GridPaintingCard
      variant="minimal"
      painting={item}
      onPress={() => onPaintingPress(item)}
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <View style={shared.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={typography.artDecoTitle}>LIKED ARTWORKS</Text>
        </View>

        <View style={styles.contentArea}>
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
                  justifyContent: 'flex-start',
                  paddingHorizontal: GRID.margin,
                  marginBottom: GRID.gutter,
                  gap: GRID.gutter,
                }}
                contentContainerStyle={{
                  paddingTop: GRID.margin,
                  paddingBottom: GRID.margin,
                }}
              />
            </>
          )}
        </View>
      </View>
    </>
  );
}

import type { Painting } from '@/types/painting';

import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useMemo } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Paths } from '@/navigation/paths';

import { usePaintings } from '@/contexts/PaintingsContext';

type RouteParameters = {
  artistName: string;
};

export function ArtistProfile() {
  const route = useRoute();
  const navigation = useNavigation();
  const { artistName } = route.params as RouteParameters;
  const { addToCollection, paintings } = usePaintings();

  // Get all paintings by this artist
  const artistPaintings = useMemo(() => {
    return paintings.filter(p => p.artist === artistName);
  }, [paintings, artistName]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = artistPaintings.length;
    const seen = artistPaintings.filter(p => p.isSeen).length;
    const wantToVisit = artistPaintings.filter(p => p.wantToVisit).length;

    // Group by museum
    const museums = new Map<string, number>();
    for (const p of artistPaintings) {
      const museum = p.museum || 'Unknown';
      museums.set(museum, (museums.get(museum) || 0) + 1);
    }

    return { museums, seen, total, wantToVisit };
  }, [artistPaintings]);

  const handlePaintingPress = (painting: Painting) => {
    navigation.navigate(Paths.PaintingDetail, { painting });
  };

  const handleAddAllToWantToVisit = () => {
    const unseenPaintings = artistPaintings.filter(p => !p.isSeen && !p.wantToVisit);

    if (unseenPaintings.length === 0) {
      Alert.alert('Already Added', 'All paintings are already in your collection.');
      return;
    }

    Alert.alert(
      'Add All to Want to Visit',
      `Add ${unseenPaintings.length} ${unseenPaintings.length === 1 ? 'painting' : 'paintings'} to your Want to Visit list?`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => {
            for (const painting of unseenPaintings) {
              addToCollection({
                ...painting,
                isSeen: false,
                wantToVisit: true,
              });
            }
            Alert.alert('Success', `Added ${unseenPaintings.length} paintings to Want to Visit`);
          },
          text: 'Add All',
        },
      ]
    );
  };

  const renderPainting = ({ item }: { item: Painting }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => { handlePaintingPress(item); }}
      style={styles.paintingCard}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            resizeMode="cover"
            source={{ uri: item.thumbnailUrl || item.imageUrl }}
            style={styles.paintingImage}
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: item.color }]}>
            <Text style={styles.placeholderIcon}>🎨</Text>
          </View>
        )}

        {/* Status badges */}
        {item.isSeen ? <View style={styles.seenBadge}>
            <Text style={styles.badgeText}>S</Text>
          </View> : null}
        {item.wantToVisit ? <View style={styles.wantBadge}>
            <Text style={styles.badgeText}>W</Text>
          </View> : null}
      </View>

      <Text numberOfLines={2} style={styles.paintingTitle}>
        {item.title}
      </Text>
      {item.year ? <Text style={styles.paintingYear}>{item.year}</Text> : null}
      {item.museum ? <Text numberOfLines={1} style={styles.paintingMuseum}>
          {item.museum}
        </Text> : null}
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
      <View style={styles.container}>
        {/* Art Deco Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => { navigation.goBack(); }}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {artistName}
            </Text>
            <View style={styles.headerDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerOrnament}>◆</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* Art Deco Stats Bar */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>PAINTINGS</Text>
            </View>
            <View style={styles.statDivider}>
              <Text style={styles.statDividerText}>◆</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.seenNumber]}>{stats.seen}</Text>
              <Text style={styles.statLabel}>SEEN</Text>
            </View>
            <View style={styles.statDivider}>
              <Text style={styles.statDividerText}>◆</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.wantNumber]}>{stats.wantToVisit}</Text>
              <Text style={styles.statLabel}>WANT TO VISIT</Text>
            </View>
          </View>

          {/* Museums with Art Deco styling */}
          {stats.museums.size > 0 && (
            <View style={styles.museumsSection}>
              <View style={styles.sectionDivider}>
                <View style={styles.sectionDividerLine} />
                <Text style={styles.museumsSectionTitle}>MUSEUMS</Text>
                <View style={styles.sectionDividerLine} />
              </View>
              {[...stats.museums.entries()].map(([museum, count]) => (
                <View key={museum} style={styles.museumRow}>
                  <Text numberOfLines={1} style={styles.museumName}>
                    {museum}
                  </Text>
                  <View style={styles.museumCountBadge}>
                    <Text style={styles.museumCount}>{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Art Deco Action Button */}
        {stats.total > 0 && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              onPress={handleAddAllToWantToVisit}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>ADD ALL TO WANT TO VISIT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Paintings Grid */}
        <FlatList
          contentContainerStyle={styles.gridContent}
          data={artistPaintings}
          keyExtractor={item => `artist-painting-${item.id}`}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyTitle}>No Paintings Yet</Text>
              <Text style={styles.emptyText}>
                Add paintings by {artistName} to your collection
              </Text>
            </View>
          )}
          numColumns={3}
          renderItem={renderPainting}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#004d40',
    borderColor: '#d4af37',
    borderRadius: 2,
    borderWidth: 2,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  actionButtonText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  actionsSection: {
    backgroundColor: '#f5f3ed',
    borderBottomColor: '#e0ddd5',
    borderBottomWidth: 1,
    padding: 16,
  },
  backButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backIcon: {
    color: '#d4af37',
    fontSize: 28,
    fontWeight: '300',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#f5f3ed',
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
    fontSize: 10,
    marginHorizontal: 8,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyState: {
    alignItems: 'center',
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
  gridContent: {
    padding: 12,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#d4af37',
    borderBottomWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '80%',
  },
  headerTitle: {
    color: '#d4af37',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 8,
  },
  imageContainer: {
    aspectRatio: 0.75,
    backgroundColor: '#f0f0f0',
    borderColor: 'rgba(212, 175, 55, 0.2)',
    borderRadius: 2,
    borderWidth: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  museumCount: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '700',
  },
  museumCountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
    borderRadius: 2,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    minWidth: 28,
    paddingHorizontal: 8,
  },
  museumName: {
    color: 'rgba(212, 175, 55, 0.8)',
    flex: 1,
    fontSize: 12,
  },
  museumRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  museumsSection: {
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
    borderTopWidth: 1,
    paddingTop: 16,
  },
  museumsSectionTitle: {
    color: 'rgba(212, 175, 55, 0.9)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  paintingCard: {
    flex: 1,
    margin: 4,
    maxWidth: '31%',
  },
  paintingImage: {
    height: '100%',
    width: '100%',
  },
  paintingMuseum: {
    color: '#666',
    fontSize: 9,
    fontStyle: 'italic',
  },
  paintingTitle: {
    color: '#2c2c2c',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginBottom: 2,
  },
  paintingYear: {
    color: '#999',
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  placeholderIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  placeholderImage: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  sectionDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  sectionDividerLine: {
    backgroundColor: '#d4af37',
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  seenBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 20,
  },
  seenNumber: {
    color: '#e63946',
  },
  statDivider: {
    paddingHorizontal: 8,
  },
  statDividerText: {
    color: 'rgba(212, 175, 55, 0.3)',
    fontSize: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(212, 175, 55, 0.7)',
    fontSize: 9,
    letterSpacing: 2,
  },
  statNumber: {
    color: '#d4af37',
    fontSize: 28,
    fontWeight: '300',
    marginBottom: 4,
  },
  statsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statsSection: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  wantBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 20,
  },
  wantNumber: {
    color: '#f59e0b',
  },
});
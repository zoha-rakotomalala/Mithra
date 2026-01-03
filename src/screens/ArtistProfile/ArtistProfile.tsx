import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePaintings } from '@/contexts/PaintingsContext';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';

type RouteParams = {
  artistName: string;
};

export function ArtistProfile() {
  const route = useRoute();
  const navigation = useNavigation();
  const { artistName } = route.params as RouteParams;
  const { paintings, addToCollection } = usePaintings();

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
    artistPaintings.forEach(p => {
      const museum = p.museum || 'Unknown';
      museums.set(museum, (museums.get(museum) || 0) + 1);
    });

    return { total, seen, wantToVisit, museums };
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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add All',
          onPress: () => {
            unseenPaintings.forEach(painting => {
              addToCollection({
                ...painting,
                wantToVisit: true,
                isSeen: false,
              });
            });
            Alert.alert('Success', `Added ${unseenPaintings.length} paintings to Want to Visit`);
          },
        },
      ]
    );
  };

  const renderPainting = ({ item }: { item: Painting }) => (
    <TouchableOpacity
      style={styles.paintingCard}
      onPress={() => handlePaintingPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl || item.imageUrl }}
            style={styles.paintingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: item.color }]}>
            <Text style={styles.placeholderIcon}>🎨</Text>
          </View>
        )}

        {/* Status badges */}
        {item.isSeen && (
          <View style={styles.seenBadge}>
            <Text style={styles.badgeText}>S</Text>
          </View>
        )}
        {item.wantToVisit && (
          <View style={styles.wantBadge}>
            <Text style={styles.badgeText}>W</Text>
          </View>
        )}
      </View>

      <Text style={styles.paintingTitle} numberOfLines={2}>
        {item.title}
      </Text>
      {item.year && (
        <Text style={styles.paintingYear}>{item.year}</Text>
      )}
      {item.museum && (
        <Text style={styles.paintingMuseum} numberOfLines={1}>
          {item.museum}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        {/* Art Deco Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
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
              {Array.from(stats.museums.entries()).map(([museum, count]) => (
                <View key={museum} style={styles.museumRow}>
                  <Text style={styles.museumName} numberOfLines={1}>
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
              style={styles.actionButton}
              onPress={handleAddAllToWantToVisit}
            >
              <Text style={styles.actionButtonText}>ADD ALL TO WANT TO VISIT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Paintings Grid */}
        <FlatList
          data={artistPaintings}
          renderItem={renderPainting}
          keyExtractor={item => `artist-painting-${item.id}`}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎨</Text>
              <Text style={styles.emptyTitle}>No Paintings Yet</Text>
              <Text style={styles.emptyText}>
                Add paintings by {artistName} to your collection
              </Text>
            </View>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ed',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#d4af37',
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#d4af37',
    marginBottom: 8,
  },
  headerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d4af37',
    opacity: 0.5,
  },
  dividerOrnament: {
    fontSize: 10,
    color: '#d4af37',
    marginHorizontal: 8,
  },
  statsSection: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.3)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '300',
    color: '#d4af37',
    marginBottom: 4,
  },
  seenNumber: {
    color: '#e63946',
  },
  wantNumber: {
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(212, 175, 55, 0.7)',
    letterSpacing: 2,
  },
  statDivider: {
    paddingHorizontal: 8,
  },
  statDividerText: {
    fontSize: 16,
    color: 'rgba(212, 175, 55, 0.3)',
  },
  museumsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d4af37',
    opacity: 0.3,
  },
  museumsSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(212, 175, 55, 0.9)',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  museumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  museumName: {
    fontSize: 12,
    color: 'rgba(212, 175, 55, 0.8)',
    flex: 1,
  },
  museumCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderWidth: 1,
    borderColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  museumCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#d4af37',
  },
  actionsSection: {
    padding: 16,
    backgroundColor: '#f5f3ed',
    borderBottomWidth: 1,
    borderBottomColor: '#e0ddd5',
  },
  actionButton: {
    backgroundColor: '#004d40',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 2,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d4af37',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 2,
  },
  gridContent: {
    padding: 12,
  },
  paintingCard: {
    flex: 1,
    margin: 4,
    maxWidth: '31%',
  },
  imageContainer: {
    aspectRatio: 0.75,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  paintingImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
    opacity: 0.5,
  },
  seenBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wantBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  paintingTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2c2c2c',
    lineHeight: 14,
    marginBottom: 2,
  },
  paintingYear: {
    fontSize: 9,
    color: '#999',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  paintingMuseum: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyState: {
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
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
    const inCollection = artistPaintings.length;

    // Group by museum
    const museums = new Map<string, number>();
    artistPaintings.forEach(p => {
      const museum = p.museum || 'Unknown';
      museums.set(museum, (museums.get(museum) || 0) + 1);
    });

    return { total, seen, wantToVisit, inCollection, museums };
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
            source={{ uri: item.imageUrl }}
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
            <Text style={styles.badgeIcon}>♥</Text>
          </View>
        )}
        {item.wantToVisit && (
          <View style={styles.wantBadge}>
            <Text style={styles.badgeIcon}>◆</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {artistName}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Stats Bar */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Paintings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.seenNumber]}>{stats.seen}</Text>
              <Text style={styles.statLabel}>Seen</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.wantNumber]}>{stats.wantToVisit}</Text>
              <Text style={styles.statLabel}>Want to Visit</Text>
            </View>
          </View>

          {/* Museums */}
          {stats.museums.size > 0 && (
            <View style={styles.museumsSection}>
              <Text style={styles.museumsSectionTitle}>Museums</Text>
              {Array.from(stats.museums.entries()).map(([museum, count]) => (
                <View key={museum} style={styles.museumRow}>
                  <Text style={styles.museumName} numberOfLines={1}>
                    {museum}
                  </Text>
                  <Text style={styles.museumCount}>{count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAddAllToWantToVisit}
          >
            <Text style={styles.actionButtonIcon}>◆</Text>
            <Text style={styles.actionButtonText}>Add All to Want to Visit</Text>
          </TouchableOpacity>
        </View>

        {/* Paintings Grid */}
        <FlatList
          data={artistPaintings}
          renderItem={renderPainting}
          keyExtractor={item => `artist-painting-${item.id}`}
          numColumns={3}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#1a4d3e',
    fontWeight: '300',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a4d3e',
  },
  statsSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  seenNumber: {
    color: '#e63946',
  },
  wantNumber: {
    color: '#f59e0b',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  museumsSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  museumsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a4d3e',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  museumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  museumName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  museumCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a4d3e',
    marginLeft: 8,
  },
  actionsSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonIcon: {
    fontSize: 20,
    color: '#fff',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
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
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(230, 57, 70, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wantBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    fontSize: 14,
    color: '#fff',
  },
  paintingTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 14,
    marginBottom: 2,
  },
  paintingYear: {
    fontSize: 9,
    color: '#999',
    marginBottom: 2,
  },
  paintingMuseum: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
  },
});
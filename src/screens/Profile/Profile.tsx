import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { PaintingCard } from '@/components/molecules/PaintingCard/PaintingCard';
import { ProfileCard } from '@/components/molecules/ProfileCard/ProfileCard';
import { usePaintings } from '@/contexts/PaintingsContext';
import type { UserProfile } from '@/types/painting';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 64) / 3;

export function Profile() {
  const isFocused = useIsFocused();
  const { getPalettePaintings, paintings } = usePaintings();

  const [flippedCardId, setFlippedCardId] = useState<number | 'profile' | null>(null);

  const palettePaintings = getPalettePaintings();

  const userProfile: UserProfile = {
    username: 'artlover',
    profileColor: '#004d40',
    stats: {
      paintings: paintings.length,
      followers: '1.2k',
      following: 342,
    },
  };

  useEffect(() => {
    if (!isFocused) setFlippedCardId(null);
  }, [isFocused]);

  const handleCardPress = (cardId: number | 'profile') => {
    setFlippedCardId(prev => (prev === cardId ? null : cardId));
  };

  const gridPositions = [0, 1, 2, 3, 'profile', 4, 5, 6, 7];

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Art Deco Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PALETTE</Text>
            <View style={styles.headerDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerOrnament}>◆</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{palettePaintings.length}</Text>
              <Text style={styles.statLabel}>IN PALETTE</Text>
            </View>
            <View style={styles.statDivider}>
              <Text style={styles.statDividerText}>·</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{paintings.length}</Text>
              <Text style={styles.statLabel}>COLLECTED</Text>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              {palettePaintings.length === 0
                ? 'Your palette is empty. Add paintings from your collection.'
                : palettePaintings.length < 8
                ? `${8 - palettePaintings.length} open spots remain in your palette.`
                : 'Your palette is complete.'}
            </Text>
          </View>

          {/* Gallery Grid */}
          <View style={styles.grid}>
            {gridPositions.map((position, index) => {
              if (position === 'profile') {
                return (
                  <ProfileCard
                    key="profile"
                    profile={userProfile}
                    isFlipped={flippedCardId === 'profile'}
                    onPress={() => handleCardPress('profile')}
                  />
                );
              }

              const painting = palettePaintings[position as number];

              if (!painting) {
                return (
                  <View key={`empty-${index}`} style={styles.emptySlot}>
                    <View style={styles.emptyFrame}>
                      <Text style={styles.emptyIcon}>+</Text>
                      <Text style={styles.emptyText}>EMPTY</Text>
                    </View>
                  </View>
                );
              }

              return (
                <PaintingCard
                  key={painting.id}
                  painting={painting}
                  isFlipped={flippedCardId === painting.id}
                  onPress={() => handleCardPress(painting.id)}
                />
              );
            })}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <View style={styles.sectionHeader}>
              <View style={styles.dividerLine} />
              <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
              <View style={styles.dividerLine} />
            </View>

            <Text style={styles.instructionText}>
              Tap a card to flip and preview details.
            </Text>
            <Text style={styles.instructionText}>
              Long press to view the full artwork page.
            </Text>
            <Text style={styles.instructionText}>
              Add paintings from Search or Collection.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ed',
  },

  /* Header */
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#d4af37',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 4,
    color: '#d4af37',
    marginBottom: 12,
  },
  headerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d4af37',
    opacity: 0.5,
  },
  dividerOrnament: {
    fontSize: 12,
    color: '#d4af37',
    marginHorizontal: 12,
  },

  /* Stats */
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.3)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '300',
    color: '#d4af37',
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(212,175,55,0.7)',
    letterSpacing: 2,
    marginTop: 4,
  },
  statDivider: {
    justifyContent: 'center',
  },
  statDividerText: {
    fontSize: 24,
    color: 'rgba(212,175,55,0.3)',
  },

  /* Info */
  infoSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0ddd5',
  },
  infoText: {
    textAlign: 'center',
    color: '#004d40',
    fontSize: 14,
    letterSpacing: 1,
  },

  /* Grid */
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  emptySlot: {
    width: CARD_SIZE,
    margin: 4,
  },
  emptyFrame: {
    aspectRatio: 0.75,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    color: '#999',
  },
  emptyText: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 1,
    marginTop: 4,
  },

  /* Instructions */
  instructions: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#004d40',
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#4a4a4a',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
});

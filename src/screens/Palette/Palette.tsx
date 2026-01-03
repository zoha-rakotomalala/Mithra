import type { UserProfile } from '@/types/painting';

import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PaintingCard } from '@/components/molecules/PaintingCard/PaintingCard';
import { ProfileCard } from '@/components/molecules/ProfileCard/ProfileCard';

import { usePaintings } from '@/contexts/PaintingsContext';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 64) / 3;

export function Palette() {
  const isFocused = useIsFocused();
  const { getPalettePaintings, paintings } = usePaintings();

  const [flippedCardId, setFlippedCardId] = useState<'profile' | null | number>(null);

  const palettePaintings = getPalettePaintings();

  const userProfile: UserProfile = {
    profileColor: '#004d40',
    stats: {
      followers: '1.2k',
      following: 342,
      paintings: paintings.length,
    },
    username: 'artlover',
  };

  useEffect(() => {
    if (!isFocused) setFlippedCardId(null);
  }, [isFocused]);

  const handleCardPress = (cardId: 'profile' | number) => {
    setFlippedCardId(previous => (previous === cardId ? null : cardId));
  };

  const gridPositions = [0, 1, 2, 3, 'profile', 4, 5, 6, 7];

  return (
    <>
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
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
                    isFlipped={flippedCardId === 'profile'}
                    key="profile"
                    onPress={() => { handleCardPress('profile'); }}
                    profile={userProfile}
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
                  isFlipped={flippedCardId === painting.id}
                  key={painting.id}
                  onPress={() => { handleCardPress(painting.id); }}
                  painting={painting}
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
    backgroundColor: '#f5f3ed',
    flex: 1,
  },

  /* Header */
  dividerLine: {
    backgroundColor: '#d4af37',
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  dividerOrnament: {
    color: '#d4af37',
    fontSize: 12,
    marginHorizontal: 12,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#d4af37',
    borderBottomWidth: 2,
    paddingBottom: 20,
    paddingTop: 60,
  },
  headerDivider: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '60%',
  },
  headerTitle: {
    color: '#d4af37',
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: 12,
  },

  /* Stats */
  statDivider: {
    justifyContent: 'center',
  },
  statDividerText: {
    color: 'rgba(212,175,55,0.3)',
    fontSize: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(212,175,55,0.7)',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 4,
  },
  statNumber: {
    color: '#d4af37',
    fontSize: 28,
    fontWeight: '300',
  },
  statsBar: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: 'rgba(212,175,55,0.3)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },

  /* Info */
  infoSection: {
    borderBottomColor: '#e0ddd5',
    borderBottomWidth: 1,
    padding: 20,
  },
  infoText: {
    color: '#004d40',
    fontSize: 14,
    letterSpacing: 1,
    textAlign: 'center',
  },

  /* Grid */
  emptyFrame: {
    alignItems: 'center',
    aspectRatio: 0.75,
    borderColor: 'rgba(212,175,55,0.3)',
    borderWidth: 2,
    justifyContent: 'center',
  },
  emptyIcon: {
    color: '#999',
    fontSize: 32,
  },
  emptySlot: {
    margin: 4,
    width: CARD_SIZE,
  },
  emptyText: {
    color: '#999',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  /* Instructions */
  instructions: {
    padding: 24,
  },
  instructionText: {
    color: '#4a4a4a',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#004d40',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 16,
  },
});

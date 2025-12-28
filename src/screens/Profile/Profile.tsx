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
const CARD_SIZE = (width - 48) / 3;

export function Profile() {
  const isFocused = useIsFocused();
  const { getPalettePaintings, paintings } = usePaintings();

  const [flippedCardId, setFlippedCardId] = useState<number | 'profile' | null>(null);

  // Get the actual paintings in the palette
  const palettePaintings = getPalettePaintings();

  // User profile data
  const userProfile: UserProfile = {
    username: 'artlover',
    profileColor: '#2d6a4f',
    stats: {
      paintings: paintings.length,
      followers: '1.2k',
      following: 342,
    },
  };

  // Reset flipped state when leaving the tab
  useEffect(() => {
    if (!isFocused) {
      setFlippedCardId(null);
    }
  }, [isFocused]);

  const handleCardPress = (cardId: number | 'profile') => {
    setFlippedCardId(prev => (prev === cardId ? null : cardId));
  };

  // Grid positions (3x3):
  // [0] [1] [2]
  // [3] [P] [4]  <- P = Profile in center
  // [5] [6] [7]
  const gridPositions = [0, 1, 2, 3, 'profile', 4, 5, 6, 7];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Palette</Text>
            <View style={styles.brushStroke} />
            <Text style={styles.headerSubtitle}>Your Top 8 Paintings</Text>
          </View>

          {/* Info Text */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              {palettePaintings.length === 0
                ? '🎨 Your palette is empty. Add paintings from search or your collection!'
                : palettePaintings.length < 8
                ? `✨ ${8 - palettePaintings.length} more ${8 - palettePaintings.length === 1 ? 'spot' : 'spots'} available in your palette`
                : '🎨 Your palette is complete! Tap cards to see details, long press to view full info.'}
            </Text>
          </View>

          {/* 3x3 Grid */}
          <View style={styles.gridContainer}>
            {gridPositions.map((position, index) => {
              if (position === 'profile') {
                // Center position: Profile Card
                return (
                  <ProfileCard
                    key="profile"
                    profile={userProfile}
                    isFlipped={flippedCardId === 'profile'}
                    onPress={() => handleCardPress('profile')}
                  />
                );
              }

              // Get the painting for this position
              const painting = palettePaintings[position as number];

              if (!painting) {
                // Empty slot
                return (
                  <View key={`empty-${index}`} style={styles.emptySlot}>
                    <View style={styles.emptySlotInner}>
                      <Text style={styles.emptySlotIcon}>+</Text>
                      <Text style={styles.emptySlotText}>Empty</Text>
                    </View>
                  </View>
                );
              }

              // Painting card
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
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>How to use your Palette</Text>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionIcon}>👆</Text>
              <Text style={styles.instructionText}>
                <Text style={styles.instructionBold}>Tap</Text> any card to flip and see details
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionIcon}>👇</Text>
              <Text style={styles.instructionText}>
                <Text style={styles.instructionBold}>Long press</Text> to view full painting information
              </Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionIcon}>⭐</Text>
              <Text style={styles.instructionText}>
                Add paintings to your Palette from the{' '}
                <Text style={styles.instructionBold}>Search</Text> or{' '}
                <Text style={styles.instructionBold}>Collection</Text> tabs
              </Text>
            </View>
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
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#1a4d3e',
    fontStyle: 'italic',
  },
  brushStroke: {
    marginTop: 4,
    width: 100,
    height: 2,
    backgroundColor: '#2d6a4f',
    borderRadius: 2,
    opacity: 0.6,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#f0f7f4',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  infoText: {
    fontSize: 14,
    color: '#1a4d3e',
    textAlign: 'center',
    lineHeight: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'center',
  },
  emptySlot: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.3,
    padding: 4,
  },
  emptySlotInner: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotIcon: {
    fontSize: 32,
    color: '#ccc',
    marginBottom: 4,
  },
  emptySlotText: {
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionsSection: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3e',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  instructionIcon: {
    fontSize: 24,
    marginRight: 12,
    width: 32,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  instructionBold: {
    fontWeight: '600',
    color: '#1a4d3e',
  },
});
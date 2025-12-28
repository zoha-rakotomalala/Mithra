import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { PaintingCard } from '@/components/molecules/PaintingCard/PaintingCard';
import { ProfileCard } from '@/components/molecules/ProfileCard/ProfileCard';
import { mockUserProfile, mockPaintings } from '@/data/mockPaintings';
import { usePaintings } from '@/contexts/PaintingsContext';

const { width } = Dimensions.get('window');

export function Profile() {
  const isFocused = useIsFocused();
  // Only one card can be flipped at a time
  const [flippedCardId, setFlippedCardId] = useState<number | null>(null);

  // Reset flipped cards when tab loses focus
  useEffect(() => {
    if (!isFocused) {
      setFlippedCardId(null);
    }
  }, [isFocused]);

  const handleCardPress = (cardId: number) => {
    // If clicking the same card, flip it back
    // If clicking a different card, flip that one (auto-closes previous)
    setFlippedCardId(prev => prev === cardId ? null : cardId);
  };

  // Create grid with profile in center (position 3 in 0-indexed array)
  const gridItems = [
    ...mockPaintings.slice(0, 4),  // Positions 0, 1, 2, 3
    null,                           // Position 4 - will be profile
    ...mockPaintings.slice(4),      // Positions 5, 6, 7, 8
  ];

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Minimal Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Palette</Text>
          <View style={styles.brushStroke} />
        </View>

        {/* 3x3 Grid with better spacing */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {gridItems.map((item, index) => {
              // Position 4 is the center
              if (index === 4) {
                return (
                  <ProfileCard
                    key="profile"
                    profile={mockUserProfile}
                    isFlipped={flippedCardId === 0}
                    onPress={() => handleCardPress(0)}
                  />
                );
              }

              if (item) {
                return (
                  <PaintingCard
                    key={item.id}
                    painting={item}
                    isFlipped={flippedCardId === item.id}
                    onPress={() => handleCardPress(item.id)}
                  />
                );
              }

              return null;
            })}
          </View>
        </View>

        {/* Subtle tip */}
        <View style={styles.tipContainer}>
          <View style={styles.tipDot} />
          <Text style={styles.tipText}>Tap any tile to reveal details</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    position: 'relative',
  },
  appTitle: {
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
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2d6a4f',
    marginRight: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#999',
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
});
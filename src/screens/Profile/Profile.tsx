// src/screens/Profile/Profile.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { PaintingCard } from '@/components/molecules/PaintingCard/PaintingCard';
import { ProfileCard } from '@/components/molecules/ProfileCard/ProfileCard';
import { mockPaintings, mockUserProfile } from '@/data/mockPaintings';

export function Profile() {
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const handleCardPress = (cardId: number) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  // Create grid with profile in center (position 4)
  const gridItems = [
    ...mockPaintings.slice(0, 4),  // Positions 0, 1, 2
    null,                           // Position 3 - will be profile
    ...mockPaintings.slice(4),     // Positions 4, 5, 6, 7, 8
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Palette 🎨</Text>
      </View>

      {/* 3x3 Grid */}
      <View style={styles.grid}>
        {gridItems.map((item, index) => {
          // Position 3 is the center (row 1, col 1 in 0-indexed 3x3 grid)
          if (index === 4) {
            return (
              <ProfileCard
                key="profile"
                profile={mockUserProfile}
                isFlipped={flippedCards.has(0)}
                onPress={() => handleCardPress(0)}
              />
            );
          }

          if (item) {
            return (
              <PaintingCard
                key={item.id}
                painting={item}
                isFlipped={flippedCards.has(item.id)}
                onPress={() => handleCardPress(item.id)}
              />
            );
          }

          return null;
        })}
      </View>

      {/* Tip text */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>💡 Tap any card to flip and see details</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tipContainer: {
    padding: 20,
    alignItems: 'center',
  },
  tipText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});
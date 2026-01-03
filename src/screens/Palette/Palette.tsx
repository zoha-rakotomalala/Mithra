import type { UserProfile } from '@/types/painting';

import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';

import { PaintingCard } from '@/components/molecules/PaintingCard/PaintingCard';
import { ProfileCard } from '@/components/molecules/ProfileCard/ProfileCard';

import { usePaintings } from '@/contexts/PaintingsContext';
import { paletteStyles as styles } from './Palette.styles';

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
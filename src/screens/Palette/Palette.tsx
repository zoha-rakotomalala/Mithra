import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, SafeAreaView } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { PaintingCard } from '@/components/molecules/PaintingCard/PaintingCard';
import { ProfileCard } from '@/components/molecules/ProfileCard/ProfileCard';
import { usePaintings } from '@/contexts/PaintingsContext';
import { shared, buttons } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { paletteStyles as styles } from './Palette.styles';
import type { UserProfile } from '@/types/painting';

export function Palette() {
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const { getPalettePaintings, paintings } = usePaintings();

  const [flippedCardId, setFlippedCardId] = useState<number | string | 'profile' | null>(null);

  const palettePaintings = getPalettePaintings();

  const userProfile: UserProfile = {
    username: 'zoha',
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

  const handleCardPress = (cardId: number | string | 'profile') => {
    setFlippedCardId(prev => (prev === cardId ? null : cardId));
  };

  const gridPositions = [0, 1, 2, 3, 'profile', 4, 5, 6, 7];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Compact Header - Like Search */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>PALETTE</Text>
          </View>

          {/* Compact Inline Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCompact}>
              <Text style={styles.statNumber}>{palettePaintings.length}</Text>
              <Text style={styles.statLabel}>in palette</Text>
            </View>
            <Text style={styles.statDivider}>·</Text>
            <View style={styles.statCompact}>
              <Text style={styles.statNumber}>{paintings.length}</Text>
              <Text style={styles.statLabel}>collected</Text>
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
            <TouchableOpacity
              style={[buttons.primary, { marginTop: SPACING.md }]}
              onPress={() => navigation.navigate('viewCanon' as never)}
            >
              <Text style={buttons.primaryText}>View Canon Palette</Text>
            </TouchableOpacity>
          </View>

          {/* Gallery Grid - 3x3 with profile in center */}
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
            <View style={[shared.rowCenter, styles.sectionHeader]}>
              <View style={shared.artDecoDivider} />
              <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
              <View style={shared.artDecoDivider} />
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

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
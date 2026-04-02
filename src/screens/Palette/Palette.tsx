import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, SafeAreaView, ActivityIndicator, Share } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import { PaintingCard } from '@/components/molecules/PaintingCard/PaintingCard';
import { ProfileCard } from '@/components/molecules/ProfileCard/ProfileCard';
import { SectionHeader, SyncErrorBanner } from '@/components/molecules';
import { usePaintings } from '@/contexts/PaintingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/App';
import { buttons } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { paletteStyles as styles } from './Palette.styles';
import type { UserProfile } from '@/types/painting';

export function Palette() {
  const isFocused = useIsFocused();
  const { getPalettePaintings, paintings, syncing, syncError } = usePaintings();
  const { user } = useAuth();
  const viewShotRef = useRef<ViewShot>(null);

  const [flippedCardId, setFlippedCardId] = useState<number | string | 'profile' | null>(null);

  const palettePaintings = getPalettePaintings();

  const username = storage.getString('curator_name') || user?.email?.split('@')[0] || 'curator';

  const userProfile: UserProfile = {
    username,
    profileColor: '#004d40',
    stats: {
      paintings: paintings.length,
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

          {syncing && (
            <View style={{ alignItems: 'center', paddingVertical: SPACING.sm }}>
              <ActivityIndicator color={COLORS.white} size="small" />
              <Text style={{ color: COLORS.white, fontSize: 12, marginTop: 4, opacity: 0.7 }}>Syncing...</Text>
            </View>
          )}

          <SyncErrorBanner error={syncError} />

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
            {palettePaintings.length === 8 && (
              <TouchableOpacity
                style={[buttons.primary, { marginTop: SPACING.md }]}
                onPress={async () => {
                  try {
                    const uri = await viewShotRef.current?.capture?.();
                    if (!uri) return;
                    await Share.share({ title: 'My Palette', url: uri });
                  } catch (err) {
                    console.error('Error sharing palette:', err);
                  }
                }}
              >
                <Text style={buttons.primaryText}>Share Palette</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Gallery Grid - 3x3 with profile in center */}
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
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
          </ViewShot>

          {/* Instructions */}
          <View style={styles.instructions}>
            <SectionHeader title="HOW IT WORKS" />

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
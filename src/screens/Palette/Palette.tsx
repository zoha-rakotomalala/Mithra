import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StatusBar, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import { PaletteTile, EmptyPaletteTile } from '@/components/molecules/PaletteTile';
import { ProfileCard } from '@/components/molecules/ProfileCard/ProfileCard';
import { SyncErrorBanner } from '@/components/molecules';
import { usePaintings } from '@/contexts/PaintingsContext';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/App';
import { Paths } from '@/navigation/paths';
import { COLORS, SPACING } from '@/constants';
import { paletteStyles as styles } from './Palette.styles';
import type { UserProfile } from '@/types/painting';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 64) / 3;

export function Palette() {
  const navigation = useNavigation();
  const { getPalettePaintings, paintings, syncing, syncError, removeFromPalette } = usePaintings();
  const { user } = useAuth();
  const viewShotRef = useRef<ViewShot>(null);
  const [editing, setEditing] = useState(false);

  const palettePaintings = getPalettePaintings();
  const username = storage.getString('curator_name') || user?.email?.split('@')[0] || 'curator';

  const userProfile: UserProfile = {
    username,
    profileColor: '#004d40',
    stats: { paintings: paintings.length },
  };

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) return;
      await RNShare.open({
        title: 'My Palette',
        url: Platform.OS === 'ios' ? uri : `file://${uri}`,
        type: 'image/png',
      });
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        console.error('Error sharing palette:', err);
      }
    }
  };

  const handlePaintingPress = (painting: any) => {
    if (editing) {
      removeFromPalette(painting.id as any);
    } else {
      navigation.navigate(Paths.PaintingDetail, { painting });
    }
  };

  const gridPositions = [0, 1, 2, 3, 'profile', 4, 5, 6, 7];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerTitle}>PALETTE</Text>
              <View style={{ flex: 1 }} />
              {palettePaintings.length > 0 && !editing && (
                <TouchableOpacity onPress={handleShare} style={{ padding: SPACING.xs }}>
                  <Text style={{ fontSize: 22, color: COLORS.gold }}>⎘</Text>
                </TouchableOpacity>
              )}
              {palettePaintings.length > 0 && (
                <TouchableOpacity onPress={() => setEditing(!editing)} style={{ padding: SPACING.xs }}>
                  <Text style={{ fontSize: 22, color: editing ? COLORS.goldLight : COLORS.gold }}>{editing ? '✓' : '✎'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {syncing && (
            <View style={{ alignItems: 'center', paddingVertical: SPACING.sm }}>
              <ActivityIndicator color={COLORS.ivory} size="small" />
              <Text style={{ color: COLORS.ivory, fontSize: 12, marginTop: 4, opacity: 0.7 }}>Syncing...</Text>
            </View>
          )}

          <SyncErrorBanner error={syncError} />

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

          {palettePaintings.length === 0 && (
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                Your palette is empty. Add paintings from your collection.
              </Text>
            </View>
          )}

          <View style={{ flex: 1, justifyContent: 'center' }}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            <View style={styles.grid}>
              {gridPositions.map((position, index) => {
                if (position === 'profile') {
                  return (
                    <ProfileCard
                      key="profile"
                      profile={userProfile}
                      isFlipped={false}
                      onPress={() => {}}
                    />
                  );
                }

                const painting = palettePaintings[position as number];

                if (!painting) {
                  return <EmptyPaletteTile key={`empty-${index}`} size={TILE_SIZE} />;
                }

                return (
                  <PaletteTile
                    key={painting.id}
                    imageUrl={painting.imageUrl}
                    title={painting.title}
                    artist={painting.artist}
                    onPress={() => handlePaintingPress(painting)}
                    size={TILE_SIZE}
                    badge={editing ? '×' : undefined}
                  />
                );
              })}
            </View>
          </ViewShot>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

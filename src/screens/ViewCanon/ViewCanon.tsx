import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ViewShot from 'react-native-view-shot';
import RNShare from 'react-native-share';
import { getCanonPalette, getCachedPaintings } from '@/services';
import { EmptyState } from '@/components/molecules';
import { shared, typography, buttons } from '@/styles';
import { COLORS } from '@/constants';
import { viewCanonStyles as styles } from './ViewCanon.styles';
import type { Painting as CachedPainting } from '@/types/database';

export function ViewCanon() {
  const navigation = useNavigation();
  const viewShotRef = useRef<ViewShot>(null);
  const [paintings, setPaintings] = useState<CachedPainting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCanon();
  }, []);

  const loadCanon = async () => {
    setLoading(true);
    
    const canon = await getCanonPalette();
    if (canon && canon.painting_ids.length === 8) {
      const cached = await getCachedPaintings(canon.painting_ids);
      setPaintings(cached);
    }
    
    setLoading(false);
  };

  const handleShare = async () => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      if (!uri) return;
      await RNShare.open({
        title: 'My Canon Palette',
        url: Platform.OS === 'ios' ? uri : `file://${uri}`,
        type: 'image/png',
      });
    } catch (err: any) {
      if (err?.message !== 'User did not share') {
        console.error('Error sharing canon:', err);
      }
    }
  };

  const renderPainting = (painting: CachedPainting, index: number) => (
    <View key={painting.id} style={styles.gridItem}>
      <Image source={{ uri: painting.image_url }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.artist} numberOfLines={1}>{painting.artist}</Text>
      </View>
    </View>
  );

  const renderCenter = () => (
    <View style={[styles.gridItem, styles.centerItem]}>
      <Text style={styles.centerTitle}>MY CANON</Text>
      <Text style={styles.centerSubtitle}>Ultimate Collection</Text>
    </View>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <ScrollView style={shared.container}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CANON PALETTE</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text style={typography.body}>Loading canon...</Text>
          </View>
        ) : paintings.length === 8 ? (
          <View style={styles.content}>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
              <View style={styles.shareableGrid}>
                <View style={styles.grid}>
                  {paintings.slice(0, 3).map((p, i) => renderPainting(p, i))}
                  {paintings.slice(3, 4).map((p, i) => renderPainting(p, i + 3))}
                  {renderCenter()}
                  {paintings.slice(4, 5).map((p, i) => renderPainting(p, i + 4))}
                  {paintings.slice(5, 8).map((p, i) => renderPainting(p, i + 5))}
                </View>
              </View>
            </ViewShot>

            <View style={styles.actions}>
              <TouchableOpacity
                style={buttons.primary}
                onPress={handleShare}
              >
                <Text style={buttons.primaryText}>Share Canon</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={buttons.secondary}
                onPress={() => navigation.navigate('canonPalette' as never)}
              >
                <Text style={buttons.secondaryText}>Edit Canon</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <EmptyState
            icon="🎨"
            title="No Canon Yet"
            subtitle="Create your ultimate collection"
            action={{ label: 'Create Canon', onPress: () => navigation.navigate('canonPalette' as never) }}
          />
        )}
      </ScrollView>
    </>
  );
}

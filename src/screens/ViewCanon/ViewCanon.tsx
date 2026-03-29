import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getCanonPalette, getCachedPaintings } from '@/services';
import { EmptyState } from '@/components/molecules';
import { shared, typography, buttons } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { viewCanonStyles as styles } from './ViewCanon.styles';
import type { Painting as CachedPainting } from '@/types/database';

export function ViewCanon() {
  const navigation = useNavigation();
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={shared.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={typography.artDecoTitle}>CANON PALETTE</Text>
          <View style={shared.artDecoDivider} />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <Text style={typography.body}>Loading canon...</Text>
          </View>
        ) : paintings.length === 8 ? (
          <View style={styles.content}>
            <View style={styles.grid}>
              {paintings.slice(0, 3).map((p, i) => renderPainting(p, i))}
              {paintings.slice(3, 4).map((p, i) => renderPainting(p, i + 3))}
              {renderCenter()}
              {paintings.slice(4, 5).map((p, i) => renderPainting(p, i + 4))}
              {paintings.slice(5, 8).map((p, i) => renderPainting(p, i + 5))}
            </View>

            <View style={styles.actions}>
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

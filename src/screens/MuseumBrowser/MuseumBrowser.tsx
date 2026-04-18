import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { shared, typography } from '@/styles';
import { COLORS } from '@/constants';
import { getAllMuseums, type MuseumConfig } from '@/services/museumRegistry';
import { museumBrowserStyles as styles } from './MuseumBrowser.styles';

interface MuseumDisplay {
  id: string;
  name: string;
  shortName: string;
  location: string;
  color: string;
  collectionSize: string;
}

function extractCollectionSize(description: string): string {
  const match = description.match(
    /([\d,]+[MKB]?\+)\s*(?:artworks|objects|paintings)/i,
  );
  return match ? match[1] : '';
}

function toMuseumDisplay(config: MuseumConfig): MuseumDisplay {
  return {
    id: config.id,
    name: config.name,
    shortName: config.shortName,
    location: config.country,
    color: config.color,
    collectionSize: extractCollectionSize(config.description),
  };
}

const MUSEUMS: MuseumDisplay[] = getAllMuseums().map(toMuseumDisplay);

export function MuseumBrowser() {
  const navigation = useNavigation<RootScreenProps['navigation']>();
  const route = useRoute();
  const { visitId } = route.params as { visitId: string };

  const renderMuseum = ({ item }: { item: MuseumDisplay }) => (
    <TouchableOpacity
      style={styles.museumCard}
      onPress={() =>
        navigation.navigate(Paths.MuseumCollection, {
          museumId: item.id,
          visitId,
        })
      }
    >
      <View style={[styles.badge, { backgroundColor: item.color }]}>
        <Text style={styles.badgeText}>{item.shortName}</Text>
      </View>

      <View style={styles.museumInfo}>
        <Text style={[typography.h3, { color: COLORS.black }]}>
          {item.name}
        </Text>
        <Text style={[typography.caption, { color: COLORS.black + 'AA' }]}>
          {item.location}
        </Text>
        <Text style={[typography.caption, styles.collectionSize]}>
          {item.collectionSize} artworks
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <View style={[shared.container, { backgroundColor: COLORS.cream }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={[typography.artDecoTitle, { color: COLORS.gold }]}>
            CHOOSE MUSEUM
          </Text>
        </View>

        <FlatList
          data={MUSEUMS}
          renderItem={renderMuseum}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </>
  );
}

import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { shared, typography } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { museumBrowserStyles as styles } from './styles';

interface Museum {
  id: string;
  name: string;
  shortName: string;
  location: string;
  color: string;
  collectionSize: string;
}

const MUSEUMS: Museum[] = [
  { id: 'MET', name: 'Metropolitan Museum of Art', shortName: 'MET', location: 'New York, USA', color: '#ce1126', collectionSize: '1.5M+' },
  { id: 'RIJKS', name: 'Rijksmuseum', shortName: 'Rijks', location: 'Amsterdam, Netherlands', color: '#003d7a', collectionSize: '700K+' },
  { id: 'CHICAGO', name: 'Art Institute of Chicago', shortName: 'AIC', location: 'Chicago, USA', color: '#b31b1b', collectionSize: '300K+' },
  { id: 'CLEVELAND', name: 'Cleveland Museum of Art', shortName: 'CMA', location: 'Cleveland, USA', color: '#0066cc', collectionSize: '61K+' },
  { id: 'NATIONAL_GALLERY', name: 'National Gallery', shortName: 'NG', location: 'London, UK', color: '#006400', collectionSize: '2.3K+' },
  { id: 'HARVARD', name: 'Harvard Art Museums', shortName: 'Harvard', location: 'Cambridge, USA', color: '#a51c30', collectionSize: '250K+' },
];

export function MuseumBrowser() {
  const navigation = useNavigation<RootScreenProps['navigation']>();
  const route = useRoute();
  const { visitId } = route.params as { visitId: string };

  const renderMuseum = ({ item }: { item: Museum }) => (
    <TouchableOpacity
      style={styles.museumCard}
      onPress={() => navigation.navigate(Paths.MuseumCollection, { museumId: item.id, visitId } )}
    >
      <View style={[styles.badge, { backgroundColor: item.color }]}>
        <Text style={styles.badgeText}>{item.shortName}</Text>
      </View>
      
      <View style={styles.museumInfo}>
        <Text style={[typography.h3, { color: COLORS.black }]}>{item.name}</Text>
        <Text style={[typography.caption, { color: COLORS.black + 'AA' }]}>{item.location}</Text>
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={[typography.artDecoTitle, { color: COLORS.gold }]}>CHOOSE MUSEUM</Text>
          <View style={shared.artDecoDivider} />
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

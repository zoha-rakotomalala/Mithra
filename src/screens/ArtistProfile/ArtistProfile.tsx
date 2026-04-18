import type { Painting } from '@/types/painting';

import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import React, { useMemo } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Paths } from '@/navigation/paths';

import { EmptyState, SectionHeader } from '@/components/molecules';
import { usePaintings } from '@/contexts/PaintingsContext';
import { artistProfileStyles as styles } from './ArtistProfile.styles';

type RouteParameters = {
  artistName: string;
};

export function ArtistProfile() {
  const route = useRoute();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { artistName } = route.params as RouteParameters;
  const { addToCollection, paintings } = usePaintings();

  // Get all paintings by this artist
  const artistPaintings = useMemo(() => {
    return paintings.filter((p) => p.artist === artistName);
  }, [paintings, artistName]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = artistPaintings.length;
    const seen = artistPaintings.filter((p) => p.isSeen).length;
    const wantToVisit = artistPaintings.filter((p) => p.wantToVisit).length;

    // Group by museum
    const museums = new Map<string, number>();
    for (const p of artistPaintings) {
      const museum = p.museum || 'Unknown';
      museums.set(museum, (museums.get(museum) || 0) + 1);
    }

    return { museums, seen, total, wantToVisit };
  }, [artistPaintings]);

  const handlePaintingPress = (painting: Painting) => {
    navigation.navigate(Paths.PaintingDetail, { paintingId: painting.id });
  };

  const handleAddAllToWantToVisit = () => {
    const unseenPaintings = artistPaintings.filter(
      (p) => !p.isSeen && !p.wantToVisit,
    );

    if (unseenPaintings.length === 0) {
      Alert.alert(
        'Already Added',
        'All paintings are already in your collection.',
      );
      return;
    }

    Alert.alert(
      'Add All to Want to Visit',
      `Add ${unseenPaintings.length} ${unseenPaintings.length === 1 ? 'painting' : 'paintings'} to your Want to Visit list?`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => {
            for (const painting of unseenPaintings) {
              addToCollection({
                ...painting,
                isSeen: false,
                wantToVisit: true,
              });
            }
            Alert.alert(
              'Success',
              `Added ${unseenPaintings.length} paintings to Want to Visit`,
            );
          },
          text: 'Add All',
        },
      ],
    );
  };

  const renderPainting = ({ item }: { item: Painting }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => {
        handlePaintingPress(item);
      }}
      style={styles.paintingCard}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image
            resizeMode="cover"
            source={{ uri: item.thumbnailUrl || item.imageUrl }}
            style={styles.paintingImage}
          />
        ) : (
          <View
            style={[styles.placeholderImage, { backgroundColor: item.color }]}
          >
            <Text style={styles.placeholderIcon}>🎨</Text>
          </View>
        )}

        {/* Status badges */}
        {item.isSeen ? (
          <View style={styles.seenBadge}>
            <Text style={styles.badgeText}>S</Text>
          </View>
        ) : null}
        {item.wantToVisit ? (
          <View style={styles.wantBadge}>
            <Text style={styles.badgeText}>W</Text>
          </View>
        ) : null}
      </View>

      <Text numberOfLines={2} style={styles.paintingTitle}>
        {item.title}
      </Text>
      {item.year ? <Text style={styles.paintingYear}>{item.year}</Text> : null}
      {item.museum ? (
        <Text numberOfLines={1} style={styles.paintingMuseum}>
          {item.museum}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
      <View style={styles.container}>
        {/* Art Deco Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {artistName}
            </Text>
            <View style={styles.headerDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerOrnament}>◆</Text>
              <View style={styles.dividerLine} />
            </View>
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* Art Deco Stats Bar */}
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>PAINTINGS</Text>
            </View>
            <View style={styles.statDivider}>
              <Text style={styles.statDividerText}>◆</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.seenNumber]}>
                {stats.seen}
              </Text>
              <Text style={styles.statLabel}>SEEN</Text>
            </View>
            <View style={styles.statDivider}>
              <Text style={styles.statDividerText}>◆</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.wantNumber]}>
                {stats.wantToVisit}
              </Text>
              <Text style={styles.statLabel}>WANT TO VISIT</Text>
            </View>
          </View>

          {/* Museums with Art Deco styling */}
          {stats.museums.size > 0 && (
            <View style={styles.museumsSection}>
              <SectionHeader
                title="MUSEUMS"
                titleStyle={styles.museumsSectionTitle}
              />
              {[...stats.museums.entries()].map(([museum, count]) => (
                <View key={museum} style={styles.museumRow}>
                  <Text numberOfLines={1} style={styles.museumName}>
                    {museum}
                  </Text>
                  <View style={styles.museumCountBadge}>
                    <Text style={styles.museumCount}>{count}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Art Deco Action Button */}
        {stats.total > 0 && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              onPress={handleAddAllToWantToVisit}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>
                ADD ALL TO WANT TO VISIT
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Paintings Grid */}
        <FlatList
          contentContainerStyle={styles.gridContent}
          data={artistPaintings}
          keyExtractor={(item) => `artist-painting-${item.id}`}
          ListEmptyComponent={() => (
            <EmptyState
              icon="🎨"
              title="No Paintings Yet"
              subtitle={`Add paintings by ${artistName} to your collection`}
            />
          )}
          numColumns={3}
          renderItem={renderPainting}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </>
  );
}

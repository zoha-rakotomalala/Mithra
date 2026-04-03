import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import { COLORS, SPACING } from '@/constants';

const { width } = Dimensions.get('window');
// Match ProfileCard: (width - 64) / 3 with margin: 4
const DEFAULT_SIZE = (width - 64) / 3;

export type PaletteTileProps = {
  readonly imageUrl?: string | null;
  readonly artist?: string;
  readonly title?: string;
  readonly onPress?: () => void;
  readonly size?: number;
  readonly badge?: string;
};

export function PaletteTile({
  imageUrl,
  artist,
  title,
  onPress,
  size = DEFAULT_SIZE,
  badge,
}: PaletteTileProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.container, { width: size, height: size * 1.3 }]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🎨</Text>
        </View>
      )}
      {(artist || title) && (
        <View style={styles.overlay}>
          {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
          {artist && <Text style={styles.artist} numberOfLines={1}>{artist}</Text>}
        </View>
      )}
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export type EmptyPaletteTileProps = {
  readonly size?: number;
};

export function EmptyPaletteTile({ size = DEFAULT_SIZE }: EmptyPaletteTileProps) {
  return (
    <View style={[styles.emptyContainer, { width: size, height: size * 1.3 }]}>
      <Text style={styles.emptyIcon}>+</Text>
      <Text style={styles.emptyText}>EMPTY</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.gold,
    margin: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  placeholderIcon: {
    fontSize: 32,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 3,
  },
  title: {
    fontSize: 9,
    color: COLORS.ivory,
    fontWeight: '600',
  },
  artist: {
    fontSize: 9,
    color: COLORS.gold,
    fontStyle: 'italic',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(230, 57, 70, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    borderWidth: 2,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  emptyIcon: {
    fontSize: 32,
    color: COLORS.gray400,
  },
  emptyText: {
    fontSize: 10,
    color: COLORS.gray400,
    letterSpacing: 1,
    marginTop: SPACING.xs,
  },
});

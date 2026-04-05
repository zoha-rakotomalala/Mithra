import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import { cards, badges } from '@/styles';
import { COLORS } from '@/constants';
import { getMuseumBadge } from '@/constants/museums';
import { museumImageSource } from '@/utils/imageSource';
import type { GridPaintingCardProps } from './types';

export function GridPaintingCard({ 
  painting, 
  variant = 'minimal', 
  onPress 
}: GridPaintingCardProps) {
  const [imageLoading, setImageLoading] = useState(true);

  const museumInfo = getMuseumBadge(painting.museum || 'UNKNOWN');

  return (
    <TouchableOpacity style={cards.gridCard} onPress={onPress} activeOpacity={0.7}>
      <View style={cards.imageContainer}>
        {painting.imageUrl ? (
          <>
            {imageLoading && (
              <View style={cards.imageLoadingOverlay}>
                <ActivityIndicator size="small" color={COLORS.gold} />
              </View>
            )}
            <FastImage
              source={museumImageSource(painting.thumbnailUrl || painting.imageUrl)}
              style={cards.image}
              resizeMode={FastImage.resizeMode.cover}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          </>
        ) : (
          <View style={[cards.imagePlaceholder, { backgroundColor: painting.color }]}>
            <Text style={cards.imagePlaceholderIcon}>🎨</Text>
          </View>
        )}

        {/* Museum badge variant (Search screen) */}
        {variant === 'museum' && (
          <View style={[badges.museumBadge, { backgroundColor: museumInfo.color }]}>
            <Text style={badges.museumBadgeText}>{museumInfo.shortName}</Text>
          </View>
        )}

        {/* Status badges variant (Collection screen) */}
        {variant === 'status' && (
          <>
            {painting.isSeen && (
              <View style={[badges.statusBadge, badges.statusBadgeSeen]}>
                <Text style={badges.statusBadgeText}>S</Text>
              </View>
            )}
            {painting.wantToVisit && (
              <View style={[badges.statusBadge, badges.statusBadgeWant, { right: painting.isSeen ? 32 : 4 }]}>
                <Text style={badges.statusBadgeText}>W</Text>
              </View>
            )}
          </>
        )}

        {/* Minimal variant (Palette screen) - no badges */}
      </View>

      <Text style={cards.cardTitle} numberOfLines={2}>
        {painting.title}
      </Text>
      <Text style={cards.cardArtist} numberOfLines={1}>
        {painting.artist}
      </Text>
      {painting.year && (
        <Text style={cards.cardYear}>{painting.year}</Text>
      )}
    </TouchableOpacity>
  );
}

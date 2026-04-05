import type { Painting } from '@/types/painting';

import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '@/constants/colors';
import { Paths } from '@/navigation/paths';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

export type PaintingCardProps = {
  readonly isFlipped: boolean;
  readonly onPress: () => void;
  readonly painting: Painting;
};

export function PaintingCard({ isFlipped, onPress, painting }: PaintingCardProps) {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const flipAnimation = useRef(new Animated.Value(0)).current;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    Animated.spring(flipAnimation, {
      friction: 8,
      tension: 10,
      toValue: isFlipped ? 180 : 0,
      useNativeDriver: true,
    }).start();
  }, [isFlipped]);

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 90, 180],
    outputRange: [1, 1, 0, 0],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 90, 90, 180],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onLongPress={() => { navigation.navigate(Paths.PaintingDetail, { paintingId: painting.id }); }}
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.cardContainer}>
        {/* Front Side */}
        <Animated.View
          style={[
            styles.flipCard,
            styles.flipCardFront,
            {
              opacity: frontOpacity,
              transform: [{ rotateY: frontInterpolate }],
            },
          ]}
        >
          <View style={styles.paintingFront}>
            {painting.imageUrl && !imageError ? (
              <>
                {imageLoading ? <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  </View> : null}
                <Image
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                  onLoadEnd={() => { setImageLoading(false); }}
                  onLoadStart={() => { setImageLoading(true); }}
                  resizeMode="cover"
                  source={{ uri: painting.imageUrl }}
                  style={styles.paintingImage}
                />
                <View style={styles.imageOverlay} />
              </>
            ) : (
              <View style={[styles.paintingPlaceholder, { backgroundColor: painting.color }]}>
                <View style={styles.artFrame}>
                  <Text style={styles.paintingIcon}>🎨</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Back Side */}
        <Animated.View
          style={[
            styles.flipCard,
            styles.flipCardBack,
            {
              opacity: backOpacity,
              transform: [{ rotateY: backInterpolate }],
            },
          ]}
        >
          <View style={styles.cardBack}>
            <View style={styles.infoContainer}>
              <Text numberOfLines={3} style={styles.paintingTitle}>
                {painting.title}
              </Text>
              <View style={styles.divider} />
              <Text numberOfLines={2} style={styles.paintingArtist}>
                {painting.artist}
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  artFrame: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    borderWidth: 2,
    height: '85%',
    justifyContent: 'center',
    width: '85%',
  },
  cardBack: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 12,
  },
  cardContainer: {
    flex: 1,
    position: 'relative',
  },
  container: {
    height: CARD_HEIGHT,
    padding: 4,
    width: CARD_WIDTH,
  },
  divider: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    height: 1,
    marginVertical: 6,
    width: 30,
  },
  flipCard: {
    backfaceVisibility: 'hidden',
    borderRadius: 12,
    elevation: 4,
    height: '100%',
    position: 'absolute',
    shadowColor: COLORS.pureBlack,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    width: '100%',
  },
  flipCardBack: {
    backgroundColor: COLORS.primaryDark,
  },
  flipCardFront: {
    backgroundColor: COLORS.white,
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    zIndex: 10,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paintingArtist: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  paintingFront: {
    borderRadius: 12,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  paintingIcon: {
    fontSize: 44,
    opacity: 0.9,
  },
  paintingImage: {
    height: '100%',
    width: '100%',
  },
  paintingPlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  paintingTitle: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
});
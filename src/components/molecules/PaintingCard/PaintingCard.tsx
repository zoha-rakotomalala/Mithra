import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import type { Painting } from '@/types/painting';

const { width } = Dimensions.get('window');
// Much bigger cards - nearly full width divided by 3
const CARD_WIDTH = (width - 48) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.3; // Rectangular, not square!

type PaintingCardProps = {
  painting: Painting;
  isFlipped: boolean;
  onPress: () => void;
};

export function PaintingCard({ painting, isFlipped, onPress }: PaintingCardProps) {
  const flipAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 180 : 0,
      friction: 8,
      tension: 10,
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
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
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
          <View
            style={[styles.paintingFront, { backgroundColor: painting.color }]}
          >
            <View style={styles.artFrame}>
              <Text style={styles.paintingIcon}>🎨</Text>
            </View>
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
              <Text style={styles.paintingTitle} numberOfLines={3}>
                {painting.title}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.paintingArtist} numberOfLines={2}>
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
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    padding: 4,
  },
  cardContainer: {
    flex: 1,
    position: 'relative',
  },
  flipCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  flipCardFront: {
    backgroundColor: '#fff',
  },
  flipCardBack: {
    backgroundColor: '#1a4d3e',
  },
  paintingFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  artFrame: {
    width: '85%',
    height: '85%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paintingIcon: {
    fontSize: 44,
    opacity: 0.9,
  },
  cardBack: {
    flex: 1,
    backgroundColor: '#1a4d3e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  paintingTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  divider: {
    width: 30,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginVertical: 6,
  },
  paintingArtist: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
import type { UserProfile } from '@/types/painting';

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '@/constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

export type ProfileCardProps = {
  readonly isFlipped: boolean;
  readonly onPress: () => void;
  readonly profile: UserProfile;
};

export function ProfileCard({ isFlipped, onPress, profile }: ProfileCardProps) {
  const flipAnimation = useRef(new Animated.Value(0)).current;

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
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.container}>
      <View style={styles.cardContainer}>
        {/* FRONT */}
        <Animated.View
          style={[
            styles.flipCard,
            {
              opacity: frontOpacity,
              transform: [{ rotateY: frontInterpolate }],
            },
          ]}
        >
          <View style={styles.frontInner}>
            <View
              style={[
                styles.initialCircle,
                { backgroundColor: profile.profileColor },
              ]}
            >
              <Text style={styles.initial}>
                {profile.username.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={styles.frontLabel}>CURATOR</Text>
          </View>
        </Animated.View>

        {/* BACK */}
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
          <View style={styles.backInner}>
            <Text numberOfLines={1} style={styles.username}>
              {profile.username.toUpperCase()}
            </Text>

            <View style={styles.divider} />

            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{profile.stats.paintings}</Text>
              <Text style={styles.statLabel}>PAINTINGS</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
  },
  container: {
    height: CARD_HEIGHT,
    margin: 4,
    width: CARD_WIDTH,
  },
  flipCard: {
    backfaceVisibility: 'hidden',
    backgroundColor: COLORS.backgroundCream,
    borderColor: 'rgba(212,175,55,0.35)',
    borderWidth: 2,
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  flipCardBack: {
    backgroundColor: COLORS.text,
  },

  /* FRONT */
  frontInner: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  frontLabel: {
    color: COLORS.teal,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
  initial: {
    color: COLORS.textInverse,
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: 2,
  },
  initialCircle: {
    alignItems: 'center',
    borderColor: COLORS.gold,
    borderRadius: CARD_WIDTH * 0.3,
    borderWidth: 2,
    height: CARD_WIDTH * 0.6,
    justifyContent: 'center',
    marginBottom: 12,
    width: CARD_WIDTH * 0.6,
  },

  /* BACK */
  backInner: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 12,
  },
  divider: {
    backgroundColor: 'rgba(212,175,55,0.5)',
    height: 1,
    marginBottom: 16,
    width: 40,
  },
  statBlock: {
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 2,
  },
  statNumber: {
    color: COLORS.textInverse,
    fontSize: 18,
    fontWeight: '300',
  },
  username: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
});

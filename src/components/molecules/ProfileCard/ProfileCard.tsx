import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import type { UserProfile } from '@/types/painting';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 64) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.3;

type ProfileCardProps = {
  profile: UserProfile;
  isFlipped: boolean;
  onPress: () => void;
};

export function ProfileCard({ profile, isFlipped, onPress }: ProfileCardProps) {
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
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
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
            <Text style={styles.username} numberOfLines={1}>
              {profile.username.toUpperCase()}
            </Text>

            <View style={styles.divider} />

            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{profile.stats.paintings}</Text>
              <Text style={styles.statLabel}>PAINTINGS</Text>
            </View>

            <View style={styles.statBlock}>
              <Text style={styles.statNumber}>{profile.stats.followers}</Text>
              <Text style={styles.statLabel}>FOLLOWERS</Text>
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
    margin: 4,
  },
  cardContainer: {
    flex: 1,
  },
  flipCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.35)',
    backgroundColor: '#f5f3ed',
  },
  flipCardBack: {
    backgroundColor: '#1a1a1a',
  },

  /* FRONT */
  frontInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialCircle: {
    width: CARD_WIDTH * 0.6,
    height: CARD_WIDTH * 0.6,
    borderRadius: CARD_WIDTH * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d4af37',
    marginBottom: 12,
  },
  initial: {
    fontSize: 40,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 2,
  },
  frontLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: '#004d40',
    fontWeight: '700',
  },

  /* BACK */
  backInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  username: {
    fontSize: 12,
    letterSpacing: 2,
    color: '#d4af37',
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(212,175,55,0.5)',
    marginBottom: 16,
  },
  statBlock: {
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '300',
    color: '#fff',
  },
  statLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
});

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
const CARD_WIDTH = (width - 48) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.3; // Match PaintingCard dimensions

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
          <View style={styles.profileFront}>
            <View
              style={[
                styles.profileImage,
                { backgroundColor: profile.profileColor },
              ]}
            >
              <Text style={styles.profileInitial}>
                {profile.username.charAt(0).toUpperCase()}
              </Text>
              <View style={styles.profileRing} />
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
              <Text style={styles.username} numberOfLines={1}>
                {profile.username}
              </Text>
              <View style={styles.statsDivider} />
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{profile.stats.paintings}</Text>
                  <Text style={styles.statLabel}>Paintings</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>{profile.stats.followers}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
              </View>
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
    backgroundColor: '#FAFAFA',
  },
  flipCardBack: {
    backgroundColor: '#2d6a4f',
  },
  profileFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileImage: {
    width: CARD_WIDTH * 0.65,
    height: CARD_WIDTH * 0.65,
    borderRadius: (CARD_WIDTH * 0.65) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
  },
  profileRing: {
    position: 'absolute',
    width: CARD_WIDTH * 0.7,
    height: CARD_WIDTH * 0.7,
    borderRadius: (CARD_WIDTH * 0.7) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: '300',
    color: '#fff',
    letterSpacing: 1,
  },
  cardBack: {
    flex: 1,
    backgroundColor: '#2d6a4f',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  statsDivider: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
  },
  statsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    marginVertical: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
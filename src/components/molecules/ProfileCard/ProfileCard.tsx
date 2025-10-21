import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type { UserProfile } from '@/types/painting';

const { width } = Dimensions.get('window');
const CARD_SIZE = width / 3;

type ProfileCardProps = {
  profile: UserProfile;
  isFlipped: boolean;
  onPress: () => void;
};

export function ProfileCard({ profile, isFlipped, onPress }: ProfileCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardContainer}>
        {!isFlipped ? (
          // Front: Profile Picture
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
            </View>
          </View>
        ) : (
          // Back: User Info
          <View style={styles.cardBack}>
            <Text style={styles.username}>{profile.username}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{profile.stats.paintings}</Text>
                <Text style={styles.statLabel}>Paintings</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{profile.stats.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{profile.stats.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    padding: 2,
  },
  cardContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  profileImage: {
    width: CARD_SIZE * 0.65,
    height: CARD_SIZE * 0.65,
    borderRadius: (CARD_SIZE * 0.65) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  profileInitial: {
    fontSize: 45,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardBack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#34495e',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 10,
    color: '#ecf0f1',
    marginTop: 2,
  },
});
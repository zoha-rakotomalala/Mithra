import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import type { Painting } from '@/types/painting';

const { width } = Dimensions.get('window');
const CARD_SIZE = width / 3;

type PaintingCardProps = {
  painting: Painting;
  isFlipped: boolean;
  onPress: () => void;
};

export function PaintingCard({ painting, isFlipped, onPress }: PaintingCardProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardContainer}>
        {!isFlipped ? (
          // Front: Painting placeholder
          <View
            style={[styles.paintingFront, { backgroundColor: painting.color }]}
          >
            <Text style={styles.paintingIcon}>🎨</Text>
          </View>
        ) : (
          // Back: Painting info
          <View style={styles.cardBack}>
            <Text style={styles.paintingTitle}>{painting.title}</Text>
            <Text style={styles.paintingArtist}>by {painting.artist}</Text>
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
  paintingFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paintingIcon: {
    fontSize: 50,
  },
  cardBack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2c3e50',
  },
  paintingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  paintingArtist: {
    fontSize: 12,
    color: '#ecf0f1',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
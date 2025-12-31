import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { storage } from '@/App';
import { usePaintings } from '@/contexts/PaintingsContext';

export function Settings() {
  const { paintings, palettePaintingIds } = usePaintings();

  const handleClearStorage = () => {
    Alert.alert(
      'Clear Archive',
      'This will remove all paintings and palette selections. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            storage.clearAll();
            Alert.alert('Archive Cleared', 'Restart the app to reload default data.');
          },
        },
      ]
    );
  };

  const handleShowStorageInfo = () => {
    Alert.alert(
      'Archive Status',
      `Paintings: ${paintings.length}\n` +
        `Seen: ${paintings.filter(p => p.isSeen).length}\n` +
        `Palette: ${palettePaintingIds.length}/8`,
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARCHIVE</Text>

          <TouchableOpacity style={styles.row} onPress={handleShowStorageInfo}>
            <Text style={styles.label}>Archive Status</Text>
            <Text style={styles.value}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.row, styles.danger]} onPress={handleClearStorage}>
            <Text style={[styles.label, styles.dangerText]}>
              Clear Archive
            </Text>
            <Text style={styles.dangerText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SYSTEM</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Data Version</Text>
            <Text style={styles.value}>
              {storage.getString('palette_data_version') || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            All changes are saved locally on this device.
            Your collection persists automatically.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 48, // ← breathing room
  },

  section: {
    marginBottom: 40, // ← more air
    paddingHorizontal: 28,
  },

  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(212,175,55,0.7)',
    marginBottom: 12,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,175,55,0.2)',
  },

  label: {
    fontSize: 15,
    color: '#f5f3ed',
  },

  value: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
  },

  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2.5,
    color: 'rgba(212,175,55,0.7)',
    marginBottom: 16,
  },

  danger: {
    borderBottomColor: 'rgba(230,57,70,0.4)',
  },

  dangerText: {
    color: '#e63946',
    fontWeight: '600',
  },

  note: {
    marginTop: 24,
    paddingHorizontal: 24,
  },

  noteText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
});

import React from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => {
            storage.clearAll();
            Alert.alert('Archive Cleared', 'Restart the app to reload default data.');
          },
          style: 'destructive',
          text: 'Clear',
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
      <StatusBar backgroundColor="#1a1a1a" barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARCHIVE</Text>

          <TouchableOpacity onPress={handleShowStorageInfo} style={styles.row}>
            <Text style={styles.label}>Archive Status</Text>
            <Text style={styles.value}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClearStorage} style={[styles.row, styles.danger]}>
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
    backgroundColor: '#1a1a1a',
    flex: 1,
    paddingTop: 48, // ← breathing room
  },

  danger: {
    borderBottomColor: 'rgba(230,57,70,0.4)',
  },

  dangerText: {
    color: '#e63946',
    fontWeight: '600',
  },

  label: {
    color: '#f5f3ed',
    fontSize: 15,
  },

  note: {
    marginTop: 24,
    paddingHorizontal: 24,
  },

  noteText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    lineHeight: 18,
  },

  row: {
    alignItems: 'center',
    borderBottomColor: 'rgba(212,175,55,0.2)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },

  section: {
    marginBottom: 40, // ← more air
    paddingHorizontal: 28,
  },

  sectionTitle: {
    color: 'rgba(212,175,55,0.7)',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 12,
  },

  sectionTitle: {
    color: 'rgba(212,175,55,0.7)',
    fontSize: 11,
    letterSpacing: 2.5,
    marginBottom: 16,
  },

  value: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
  },
});

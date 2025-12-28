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
      'Clear All Data',
      'This will delete all your paintings and palette. The app will restart with default data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            storage.clearAll();
            Alert.alert(
              'Data Cleared',
              'Please restart the app to load default data.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleShowStorageInfo = () => {
    const paintingsCount = paintings.length;
    const seenCount = paintings.filter(p => p.isSeen).length;
    const paletteCount = palettePaintingIds.length;

    Alert.alert(
      'Storage Info',
      `Total Paintings: ${paintingsCount}\n` +
      `Seen: ${seenCount}\n` +
      `In Palette: ${paletteCount}/8\n\n` +
      `Data is automatically saved to device storage.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.brushStroke} />
        </View>

        {/* Settings Sections */}
        <View style={styles.content}>
          {/* Data Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATA</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleShowStorageInfo}
            >
              <Text style={styles.settingLabel}>Storage Info</Text>
              <Text style={styles.settingValue}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, styles.dangerItem]}
              onPress={handleClearStorage}
            >
              <Text style={[styles.settingLabel, styles.dangerText]}>
                Clear All Data
              </Text>
              <Text style={styles.dangerText}>⚠️</Text>
            </TouchableOpacity>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ABOUT</Text>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Data Version</Text>
              <Text style={styles.settingValue}>
                {storage.getString('palette_data_version') || 'Not set'}
              </Text>
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>💾 Data Persistence</Text>
            <Text style={styles.infoText}>
              Your collection is automatically saved to your device.
              All changes (marking paintings as seen, adding to palette)
              are saved instantly and will persist across app restarts.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '300',
    letterSpacing: 2,
    color: '#1a4d3e',
    fontStyle: 'italic',
  },
  brushStroke: {
    marginTop: 4,
    width: 100,
    height: 2,
    backgroundColor: '#2d6a4f',
    borderRadius: 2,
    opacity: 0.6,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 1,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  dangerItem: {
    borderColor: '#ff4444',
  },
  dangerText: {
    color: '#ff4444',
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f7f4',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2d6a4f',
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a4d3e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
});
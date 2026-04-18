import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/paths';
import type { RootScreenProps } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/App';
import { usePaintings } from '@/contexts/PaintingsContext';
import { shared, typography } from '@/styles';
import { COLORS } from '@/constants';
import { settingsStyles as styles } from './Settings.styles';

export function Settings() {
  const { paintings, palettePaintingIds } = usePaintings();
  const navigation = useNavigation<RootScreenProps['navigation']>();
  const { user, signOut } = useAuth();

  const [curatorName, setCuratorName] = useState(
    storage.getString('curator_name') ?? '',
  );

  const saveCuratorName = (name: string) => {
    setCuratorName(name);
    if (name.trim()) {
      storage.set('curator_name', name.trim());
    } else {
      storage.delete('curator_name');
    }
  };

  const handleClearStorage = () => {
    Alert.alert(
      'Clear Archive',
      'This will remove all paintings and palette selections. This action cannot be undone.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: () => {
            storage.clearAll();
            Alert.alert(
              'Archive Cleared',
              'Restart the app to reload default data.',
            );
          },
          style: 'destructive',
          text: 'Clear',
        },
      ],
    );
  };

  const handleShowStorageInfo = () => {
    Alert.alert(
      'Archive Status',
      `Paintings: ${paintings.length}\n` +
        `Seen: ${paintings.filter((p) => p.isSeen).length}\n` +
        `Palette: ${palettePaintingIds.length}/8`,
      [{ text: 'OK' }],
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Signed Out', 'You have successfully signed out.');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <>
      <StatusBar backgroundColor={COLORS.black} barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[shared.container, styles.scrollView]}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[typography.h1, styles.title]}>SETTINGS</Text>
        <View style={shared.artDecoDivider} />

        <View style={styles.sectionGroup}>
          <Text style={[typography.label, styles.sectionLabel]}>ACCOUNT</Text>

          {user ? (
            <>
              <View style={[shared.row, shared.rowBetween, styles.row]}>
                <Text style={[typography.body, styles.bodyTextCream]}>
                  Logged in as
                </Text>
                <Text style={[typography.bodySmall, styles.bodyTextCreamMuted]}>
                  {user.email || `User ${user.id.substring(0, 8)}`}
                </Text>
              </View>

              <View style={styles.curatorNameRow}>
                <Text style={[typography.body, styles.curatorNameLabel]}>
                  Curator Name
                </Text>
                <TextInput
                  style={styles.curatorNameInput}
                  value={curatorName}
                  onChangeText={saveCuratorName}
                  placeholder={user.email?.split('@')[0] ?? 'Curator'}
                  placeholderTextColor={COLORS.cream + '55'}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                onPress={handleSignOut}
                style={[shared.row, shared.rowBetween, styles.dangerRow]}
              >
                <Text style={[typography.body, styles.dangerText]}>
                  Sign Out
                </Text>
                <Text style={styles.dangerText}>→</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate(Paths.Auth)}
              style={[shared.row, shared.rowBetween, styles.row]}
            >
              <Text style={[typography.body, styles.bodyTextCream]}>
                Sign In / Sign Up
              </Text>
              <Text style={[typography.body, styles.goldChevron]}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.sectionGroup}>
          <Text style={[typography.label, styles.sectionLabel]}>ARCHIVE</Text>

          <TouchableOpacity
            onPress={handleShowStorageInfo}
            style={[shared.row, shared.rowBetween, styles.row]}
          >
            <Text style={[typography.body, styles.bodyTextCream]}>
              Archive Status
            </Text>
            <Text style={[typography.body, styles.goldChevron]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearStorage}
            style={[shared.row, shared.rowBetween, styles.dangerRow]}
          >
            <Text style={[typography.body, styles.dangerText]}>
              Clear Archive
            </Text>
            <Text style={styles.dangerText}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionGroup}>
          <Text style={[typography.label, styles.sectionLabel]}>SYSTEM</Text>

          <View style={[shared.row, shared.rowBetween, styles.row]}>
            <Text style={[typography.body, styles.bodyTextCream]}>Version</Text>
            <Text style={[typography.bodySmall, styles.bodyTextCreamMuted]}>
              1.0.0
            </Text>
          </View>

          <View style={[shared.row, shared.rowBetween, styles.row]}>
            <Text style={[typography.body, styles.bodyTextCream]}>
              Data Version
            </Text>
            <Text style={[typography.bodySmall, styles.bodyTextCreamMuted]}>
              {storage.getString('palette_data_version') || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.footerBox}>
          <Text style={[typography.caption, styles.footerText]}>
            All changes are saved locally on this device.{'\n'}
            Your collection persists automatically.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

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
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/App';
import { usePaintings } from '@/contexts/PaintingsContext';
import { shared, typography } from '@/styles';
import { COLORS, SPACING } from '@/constants';

export function Settings() {
  const { paintings, palettePaintingIds } = usePaintings();
  const navigation = useNavigation();
  const { user, signOut } = useAuth();

  const [curatorName, setCuratorName] = useState(
    storage.getString('curator_name') ?? ''
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
        style={[shared.container, { backgroundColor: COLORS.black }]}
        contentContainerStyle={{ padding: SPACING.xl }}
      >
        <Text style={[typography.h1, { color: COLORS.gold, textAlign: 'center', marginBottom: SPACING.lg }]}>
          SETTINGS
        </Text>
        <View style={shared.artDecoDivider} />

        <View style={{ marginBottom: SPACING.xl }}>
          <Text style={[typography.label, { color: COLORS.gold + 'CC', marginBottom: SPACING.md }]}>
            ACCOUNT
          </Text>

          {user ? (
            <>
              <View style={[shared.row, shared.rowBetween, { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gold + '40' }]}>
                <Text style={[typography.body, { color: COLORS.cream }]}>Logged in as</Text>
                <Text style={[typography.bodySmall, { color: COLORS.cream + 'AA' }]}>
                  {user.email || `User ${user.id.substring(0, 8)}`}
                </Text>
              </View>

              <View style={{ paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gold + '40' }}>
                <Text style={[typography.body, { color: COLORS.cream, marginBottom: SPACING.xs }]}>Curator Name</Text>
                <TextInput
                  style={{ color: COLORS.cream, fontSize: 15, backgroundColor: COLORS.gold + '15', borderRadius: 4, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: COLORS.gold + '40' }}
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
                style={[shared.row, shared.rowBetween, { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#e63946' + '40' }]}
              >
                <Text style={[typography.body, { color: '#e63946' }]}>Sign Out</Text>
                <Text style={{ color: '#e63946' }}>→</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate(Paths.Auth as never)}
              style={[shared.row, shared.rowBetween, { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gold + '40' }]}
            >
              <Text style={[typography.body, { color: COLORS.cream }]}>Sign In / Sign Up</Text>
              <Text style={[typography.body, { color: COLORS.gold }]}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ marginBottom: SPACING.xl }}>
          <Text style={[typography.label, { color: COLORS.gold + 'CC', marginBottom: SPACING.md }]}>
            ARCHIVE
          </Text>

          <TouchableOpacity
            onPress={handleShowStorageInfo}
            style={[shared.row, shared.rowBetween, { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gold + '40' }]}
          >
            <Text style={[typography.body, { color: COLORS.cream }]}>Archive Status</Text>
            <Text style={[typography.body, { color: COLORS.gold }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearStorage}
            style={[shared.row, shared.rowBetween, { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: '#e63946' + '40' }]}
          >
            <Text style={[typography.body, { color: '#e63946' }]}>Clear Archive</Text>
            <Text style={{ color: '#e63946' }}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: SPACING.xl }}>
          <Text style={[typography.label, { color: COLORS.gold + 'CC', marginBottom: SPACING.md }]}>
            SYSTEM
          </Text>

          <View style={[shared.row, shared.rowBetween, { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gold + '40' }]}>
            <Text style={[typography.body, { color: COLORS.cream }]}>Version</Text>
            <Text style={[typography.bodySmall, { color: COLORS.cream + 'AA' }]}>1.0.0</Text>
          </View>

          <View style={[shared.row, shared.rowBetween, { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.gold + '40' }]}>
            <Text style={[typography.body, { color: COLORS.cream }]}>Data Version</Text>
            <Text style={[typography.bodySmall, { color: COLORS.cream + 'AA' }]}>
              {storage.getString('palette_data_version') || '—'}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: SPACING.lg, padding: SPACING.md, backgroundColor: COLORS.gold + '10', borderRadius: 8 }}>
          <Text style={[typography.caption, { color: COLORS.cream + 'AA', textAlign: 'center', lineHeight: 18 }]}>
            All changes are saved locally on this device.{'\n'}
            Your collection persists automatically.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

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
import FastImage from 'react-native-fast-image';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/paths';
import type { RootScreenProps } from '@/navigation/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAppStore } from '@/store';
import { storage } from '@/store/storage';
import { shared, typography } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { settingsStyles as styles } from './Settings.styles';

export function Settings() {
  const paintings = useAppStore((s) => s.paintings);
  const palettePaintingIds = useAppStore((s) => s.palettePaintingIds);
  const deadLetterQueue = useAppStore((s) => s.deadLetterQueue);
  const retryDeadLetterItem = useAppStore((s) => s.retryDeadLetterItem);
  const clearDeadLetter = useAppStore((s) => s.clearDeadLetter);

  const navigation = useNavigation<RootScreenProps['navigation']>();
  const { user, signOut, curatorName, avatarUrl, updateProfile, uploadAvatar, deleteAccount } = useAuth();

  const [nameInput, setNameInput] = useState(curatorName);
  const [nameChanged, setNameChanged] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleChangeAvatar = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 400,
      maxHeight: 400,
      quality: 0.8,
    });

    if (result.didCancel || !result.assets?.[0]?.uri) return;

    setUploadingAvatar(true);
    const { error } = await uploadAvatar(result.assets[0].uri);
    setUploadingAvatar(false);

    if (error) {
      Alert.alert('Upload Failed', 'Could not upload your photo. Please try again.');
    }
  };

  const handleNameChange = (text: string) => {
    setNameInput(text);
    setNameChanged(text.trim() !== curatorName);
  };

  const handleSaveName = async () => {
    await updateProfile({ curatorName: nameInput });
    setNameChanged(false);
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
        `Palette: ${palettePaintingIds.length}/8\n` +
        `Failed sync operations: ${deadLetterQueue.length}`,
      [{ text: 'OK' }],
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { style: 'cancel', text: 'Cancel' },
        {
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
          style: 'destructive',
          text: 'Delete Account',
        },
      ],
    );
  };

  const handleRetryAll = () => {
    for (const item of deadLetterQueue) {
      retryDeadLetterItem(item.operation.id);
    }
    Alert.alert('Retrying', 'All failed operations have been re-queued for sync.');
  };

  return (
    <>
      <StatusBar backgroundColor={COLORS.black} barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[shared.container, styles.scrollView]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={{ paddingRight: SPACING.md }}
          >
            <Text style={{ color: COLORS.gold, fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={[typography.h1, { flex: 1, textAlign: 'center', marginRight: 32 }]}>SETTINGS</Text>
        </View>
        <View style={shared.artDecoDivider} />

        <View style={styles.sectionGroup}>
          <Text style={[typography.label, styles.sectionLabel]}>ACCOUNT</Text>

          {user ? (
            <>
              <TouchableOpacity
                onPress={handleChangeAvatar}
                disabled={uploadingAvatar}
                style={styles.avatarRow}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                {avatarUrl ? (
                  <FastImage
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    resizeMode={FastImage.resizeMode.cover}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {curatorName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <Text style={[typography.body, styles.bodyTextCream]}>
                  {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </Text>
              </TouchableOpacity>

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <TextInput
                    style={[styles.curatorNameInput, { flex: 1 }]}
                    value={nameInput}
                    onChangeText={handleNameChange}
                    placeholder={user.email?.split('@')[0] ?? 'Curator'}
                    placeholderTextColor={COLORS.cream + '55'}
                    autoCapitalize="words"
                    autoCorrect={false}
                    accessibilityLabel="Curator name"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  {nameChanged && (
                    <TouchableOpacity
                      onPress={handleSaveName}
                      style={{
                        backgroundColor: COLORS.gold,
                        paddingHorizontal: SPACING.md,
                        paddingVertical: SPACING.xs,
                        borderRadius: 4,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Save curator name"
                    >
                      <Text style={{ color: COLORS.black, fontWeight: '600', fontSize: 13 }}>
                        SAVE
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSignOut}
                style={[shared.row, shared.rowBetween, styles.dangerRow]}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                <Text style={[typography.body, styles.dangerText]}>
                  Sign Out
                </Text>
                <Text style={styles.dangerText}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={[shared.row, shared.rowBetween, styles.dangerRow]}
                accessibilityRole="button"
                accessibilityLabel="Delete account"
              >
                <Text style={[typography.body, styles.dangerText]}>
                  Delete Account
                </Text>
                <Text style={styles.dangerText}>×</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate(Paths.Auth)}
              style={[shared.row, shared.rowBetween, styles.row]}
              accessibilityRole="button"
            >
              <Text style={[typography.body, styles.bodyTextCream]}>
                Sign In / Sign Up
              </Text>
              <Text style={[typography.body, styles.goldChevron]}>›</Text>
            </TouchableOpacity>
          )}
        </View>

        {deadLetterQueue.length > 0 && (
          <View style={styles.sectionGroup}>
            <Text style={[typography.label, styles.sectionLabel]}>
              SYNC ISSUES
            </Text>
            <View style={[shared.row, shared.rowBetween, styles.row]}>
              <Text style={[typography.body, styles.bodyTextCream]}>
                {deadLetterQueue.length} failed operation
                {deadLetterQueue.length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity
                onPress={handleRetryAll}
                accessibilityRole="button"
                accessibilityLabel="Retry all failed operations"
              >
                <Text style={[typography.body, { color: COLORS.gold }]}>
                  Retry All
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={clearDeadLetter}
              style={[shared.row, shared.rowBetween, styles.dangerRow]}
              accessibilityRole="button"
              accessibilityLabel="Discard all failed operations"
            >
              <Text style={[typography.body, styles.dangerText]}>
                Discard Failed Operations
              </Text>
              <Text style={styles.dangerText}>×</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionGroup}>
          <Text style={[typography.label, styles.sectionLabel]}>ARCHIVE</Text>

          <TouchableOpacity
            onPress={handleShowStorageInfo}
            style={[shared.row, shared.rowBetween, styles.row]}
            accessibilityRole="button"
          >
            <Text style={[typography.body, styles.bodyTextCream]}>
              Archive Status
            </Text>
            <Text style={[typography.body, styles.goldChevron]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearStorage}
            style={[shared.row, shared.rowBetween, styles.dangerRow]}
            accessibilityRole="button"
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
        </View>

        <View style={styles.footerBox}>
          <Text style={[typography.caption, styles.footerText]}>
            Your collection syncs across devices when signed in.{'\n'}
            Changes are saved locally and uploaded automatically.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

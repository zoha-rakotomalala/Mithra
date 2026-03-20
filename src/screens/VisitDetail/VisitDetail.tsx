import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Modal, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ModalHeader } from '@/components/molecules';
import { shared, typography, buttons } from '@/styles';
import { COLORS } from '@/constants';
import { formatDate } from '@/utils';
import { visitDetailStyles as styles } from './VisitDetail.styles';
import { useVisitDetail } from '@/hooks/domain/visits/useVisitDetail';

export function VisitDetail() {
  const navigation = useNavigation<RootScreenProps['navigation']>();
  const route = useRoute();
  const { visitId } = route.params as { visitId: string };

  const {
    visit,
    loading,
    likedCount,
    hasPalette,
    showEditModal,
    setShowEditModal,
    editForm,
    handleEdit,
    handleDelete,
    updateEditFormField,
  } = useVisitDetail(visitId);

  if (loading || !visit) {
    return (
      <View style={shared.container}>
        <Text style={typography.body}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={shared.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={typography.artDecoTitle}>{visit.museum_name.toUpperCase()}</Text>
          <View style={shared.artDecoDivider} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={typography.label}>Date</Text>
              <Text style={typography.body}>{formatDate(visit.visit_date)}</Text>
            </View>

            {visit.notes && (
              <View style={styles.infoRow}>
                <Text style={typography.label}>Notes</Text>
                <Text style={typography.body}>{visit.notes}</Text>
              </View>
            )}

            <View style={styles.infoRow}>
              <Text style={typography.label}>Liked Artworks</Text>
              <Text style={typography.body}>{likedCount} artworks</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={buttons.primary}
              onPress={() => navigation.navigate(Paths.MuseumBrowser, { visitId })}
            >
              <Text style={buttons.primaryText}>Browse Museums</Text>
            </TouchableOpacity>

            {likedCount > 0 && (
              <TouchableOpacity
                style={buttons.secondary}
                onPress={() => navigation.navigate(Paths.LikedPaintings, { visitId })}
              >
                <Text style={buttons.secondaryText}>View Liked Artworks ({likedCount})</Text>
              </TouchableOpacity>
            )}

            {hasPalette ? (
              <TouchableOpacity
                style={buttons.primary}
                onPress={() => navigation.navigate(Paths.ViewPalette, { visitId })}
              >
                <Text style={buttons.primaryText}>View Palette</Text>
              </TouchableOpacity>
            ) : likedCount >= 8 ? (
              <TouchableOpacity
                style={buttons.primary}
                onPress={() => navigation.navigate(Paths.VisitPalette, { visitId })}
              >
                <Text style={buttons.primaryText}>Create Palette</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={buttons.secondary}
              onPress={() => setShowEditModal(true)}
            >
              <Text style={buttons.secondaryText}>Edit Visit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[buttons.secondary, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={[buttons.secondaryText, styles.deleteText]}>Delete Visit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <View style={shared.container}>
          <ModalHeader
            title="Edit Visit"
            onClose={() => setShowEditModal(false)}
            titleStyle={typography.h2}
            style={{ backgroundColor: undefined, borderBottomWidth: 1 }}
            closeButtonStyle={{ fontSize: 32, color: COLORS.text }}
          />

          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Museum Name"
              placeholderTextColor={COLORS.textLight}
              value={editForm.museumName}
              onChangeText={(text) => updateEditFormField('museumName', text)}
            />

            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={COLORS.textLight}
              value={editForm.visitDate}
              onChangeText={(text) => updateEditFormField('visitDate', text)}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.textLight}
              value={editForm.notes}
              onChangeText={(text) => updateEditFormField('notes', text)}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[buttons.primary, !editForm.museumName && styles.buttonDisabled]}
              onPress={handleEdit}
              disabled={!editForm.museumName}
            >
              <Text style={buttons.primaryText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

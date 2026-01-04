import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Alert, Modal, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getVisitById, updateVisit, deleteVisit, getLikedPaintingsForVisit, getVisitPalette } from '@/services';
import { shared, typography, buttons } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { formatDate } from '@/utils';
import { visitDetailStyles as styles } from './styles';
import type { Visit } from '@/types/database';

export function VisitDetail() {
  const navigation = useNavigation<RootScreenProps['navigation']>();
  const route = useRoute();
  const { visitId } = route.params as { visitId: string };

  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedCount, setLikedCount] = useState(0);
  const [likedPaintings, setLikedPaintings] = useState([]); // ✅ Add this
  const [hasPalette, setHasPalette] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    museumName: '',
    visitDate: '',
    notes: '',
  });

  useEffect(() => {
    loadVisit();
  }, [visitId]);

  const loadVisit = async () => {
    setLoading(true);
    const data = await getVisitById(visitId);
    if (data) {
      setVisit(data);
      setEditForm({
        museumName: data.museum_name,
        visitDate: data.visit_date,
        notes: data.notes || '',
      });
      const likes = await getLikedPaintingsForVisit(visitId);
      setLikedCount(likes.length);
      setLikedPaintings(likes); // ✅ Store the paintings
      
      const palette = await getVisitPalette(visitId);
      setHasPalette(!!palette);
    }
    setLoading(false);
  };

  const handleEdit = async () => {
    if (!editForm.museumName) return;
    
    await updateVisit(visitId, {
      museum_name: editForm.museumName,
      visit_date: editForm.visitDate,
      notes: editForm.notes || undefined,
    });
    
    setShowEditModal(false);
    loadVisit();
  };

const handleDelete = () => {
  Alert.alert(
    'Delete Visit',
    'Are you sure you want to delete this visit? This cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const success = await deleteVisit(visitId);
          if (success) {
            // ✅ Navigate back and the focus listener will refresh
            navigation.goBack();
          } else {
            Alert.alert('Error', 'Failed to delete visit');
          }
        },
      },
    ]
  );
};

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

            {/* ✅ ALWAYS show browse button */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={buttons.primary}
                onPress={() => navigation.navigate(Paths.MuseumBrowser, { visitId })}
              >
                <Text style={buttons.primaryText}>Browse Museums</Text>
              </TouchableOpacity>

              {/* ✅ Show liked paintings list if any */}
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
          <View style={styles.modalHeader}>
            <Text style={typography.h2}>Edit Visit</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Museum Name"
              placeholderTextColor={COLORS.textLight}
              value={editForm.museumName}
              onChangeText={(text) => setEditForm({...editForm, museumName: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={COLORS.textLight}
              value={editForm.visitDate}
              onChangeText={(text) => setEditForm({...editForm, visitDate: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.textLight}
              value={editForm.notes}
              onChangeText={(text) => setEditForm({...editForm, notes: text})}
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

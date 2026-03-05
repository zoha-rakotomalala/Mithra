import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getVisits, createVisit } from '@/services/visits.service';
import { shared, typography, buttons } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { formatDate } from '@/utils';
import { visitsStyles as styles } from './styles';
import type { Visit } from '@/types/database';

const MUSEUMS = [
  { id: 'MET', name: 'Metropolitan Museum of Art' },
  { id: 'RIJKS', name: 'Rijksmuseum' },
  { id: 'CHICAGO', name: 'Art Institute of Chicago' },
  { id: 'CLEVELAND', name: 'Cleveland Museum of Art' },
  { id: 'NATIONAL_GALLERY', name: 'National Gallery' },
  { id: 'HARVARD', name: 'Harvard Art Museums' },
];

export function Visits() {
  const navigation = useNavigation<RootScreenProps['navigation']>();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMuseumPicker, setShowMuseumPicker] = useState(false);
  const [newVisit, setNewVisit] = useState({
    museumId: '',
    museumName: '',
    visitDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadVisits();
  }, []);

  // ✅ Add focus listener to refresh when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadVisits();
    });
    return unsubscribe;
  }, [navigation]);

  const loadVisits = async () => {
    setLoading(true);
    const data = await getVisits();
    setVisits(data);
    setLoading(false);
  };

  const handleAddVisit = async () => {
    if (!newVisit.museumId || !newVisit.museumName) return;

    await createVisit(
      newVisit.museumId,
      newVisit.visitDate,
      newVisit.notes || undefined
    );

    setShowAddModal(false);
    setNewVisit({
      museumId: '',
      museumName: '',
      visitDate: new Date().toISOString().split('T')[0],
      notes: ''
    });

    // ✅ Reload immediately after creating
    await loadVisits();
  };

  const renderVisit = ({ item }: { item: Visit }) => (
    <TouchableOpacity
      style={styles.visitCard}
      onPress={() => navigation.navigate(Paths.VisitDetail , { visitId: item.id } )}
    >
      <View style={styles.visitHeader}>
        <Text style={[typography.h3, { color: COLORS.black }]}>{item.museum?.name ?? item.museum_id}</Text>
        <Text style={[typography.caption, { color: COLORS.black + 'AA' }]}>{formatDate(item.visit_date)}</Text>
      </View>
      {item.notes && (
        <Text style={[typography.bodySmall, styles.visitNotes]} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <View style={[shared.container, { backgroundColor: COLORS.cream }]}>
        <View style={styles.header}>
          <Text style={[typography.artDecoTitle, { color: COLORS.gold }]}>MY VISITS</Text>
          <View style={styles.headerDivider}>
            <View style={shared.artDecoDivider} />
            <Text style={[typography.caption, { color: COLORS.gold, marginHorizontal: SPACING.sm }]}>◆</Text>
            <View style={shared.artDecoDivider} />
          </View>
        </View>

        <FlatList
          data={visits}
          renderItem={renderVisit}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏛️</Text>
              <Text style={[typography.h2, { color: COLORS.black, marginBottom: SPACING.sm }]}>No Visits Yet</Text>
              <Text style={[typography.body, styles.emptyText]}>
                Log your first museum visit to get started!
              </Text>
            </View>
          }
        />

        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[shared.container, { backgroundColor: COLORS.cream }]}>
          <View style={styles.modalHeader}>
            <Text style={[typography.h2, { color: COLORS.gold }]}>LOG MUSEUM VISIT</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowMuseumPicker(true)}
            >
              <Text style={newVisit.museumName ? styles.inputText : styles.inputPlaceholder}>
                {newVisit.museumName || 'Select Museum'}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={COLORS.black + '60'}
              value={newVisit.visitDate}
              onChangeText={(text) => setNewVisit({...newVisit, visitDate: text})}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.black + '60'}
              value={newVisit.notes}
              onChangeText={(text) => setNewVisit({...newVisit, notes: text})}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[buttons.primary, !newVisit.museumName && styles.buttonDisabled]}
              onPress={handleAddVisit}
              disabled={!newVisit.museumName}
            >
              <Text style={buttons.primaryText}>SAVE VISIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showMuseumPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={[shared.container, { backgroundColor: COLORS.cream }]}>
          <View style={styles.modalHeader}>
            <Text style={[typography.h2, { color: COLORS.gold }]}>SELECT MUSEUM</Text>
            <TouchableOpacity onPress={() => setShowMuseumPicker(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={MUSEUMS}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.museumOption}
                onPress={() => {
                  setNewVisit({...newVisit, museumId: item.id, museumName: item.name});
                  setShowMuseumPicker(false);
                }}
              >
                <Text style={[typography.body, { color: COLORS.black }]}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

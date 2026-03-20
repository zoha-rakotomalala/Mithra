import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EmptyState, ModalHeader } from '@/components/molecules';
import { shared, typography, buttons } from '@/styles';
import { COLORS, SPACING } from '@/constants';
import { formatDate } from '@/utils';
import { visitsStyles as styles } from './Visits.styles';
import { useVisits } from '@/hooks/domain/visits/useVisits';
import type { Visit } from '@/types/database';

export function Visits() {
  const navigation = useNavigation<RootScreenProps['navigation']>();
  const {
    visits,
    showAddModal,
    setShowAddModal,
    showMuseumPicker,
    setShowMuseumPicker,
    newVisit,
    museums,
    handleAddVisit,
    selectMuseum,
    updateNewVisitField,
  } = useVisits();

  const renderVisit = ({ item }: { item: Visit }) => (
    <TouchableOpacity
      style={styles.visitCard}
      onPress={() => navigation.navigate(Paths.VisitDetail, { visitId: item.id })}
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
            <EmptyState
              icon="🏛️"
              title="No Visits Yet"
              subtitle="Log your first museum visit to get started!"
            />
          }
        />

        <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[shared.container, { backgroundColor: COLORS.cream }]}>
          <ModalHeader
            title="LOG MUSEUM VISIT"
            onClose={() => setShowAddModal(false)}
            titleStyle={[typography.h2, { color: COLORS.gold }]}
          />

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
              onChangeText={(text) => updateNewVisitField('visitDate', text)}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              placeholderTextColor={COLORS.black + '60'}
              value={newVisit.notes}
              onChangeText={(text) => updateNewVisitField('notes', text)}
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
          <ModalHeader
            title="SELECT MUSEUM"
            onClose={() => setShowMuseumPicker(false)}
            titleStyle={[typography.h2, { color: COLORS.gold }]}
          />
          <FlatList
            data={museums}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.museumOption}
                onPress={() => selectMuseum(item)}
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

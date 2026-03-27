import type { RootScreenProps } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StatusBar, Modal, TextInput, Platform, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { EmptyState, ModalHeader } from '@/components/molecules';
import { shared, typography, buttons } from '@/styles';
import { COLORS } from '@/constants';
import { formatDate } from '@/utils';
import { visitsStyles as styles } from './Visits.styles';
import { useVisits } from '@/hooks/domain/visits/useVisits';
import type { Visit } from '@/types/database';
import type { MuseumConfig } from '@/services/museumRegistry';

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

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const canSave = !!newVisit.museumName && !!newVisit.visitDate;

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.black} />
      <View style={[shared.container, { backgroundColor: COLORS.cream }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MY VISITS</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCompact}>
            <Text style={styles.statNumber}>{visits.length}</Text>
            <Text style={styles.statLabel}>visits</Text>
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

        <TouchableOpacity style={styles.fab} onPress={() => {
          const today = new Date();
          setSelectedDate(today);
          updateNewVisitField('visitDate', today.toISOString().split('T')[0]);
          setShowAddModal(true);
        }}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[shared.container, { backgroundColor: COLORS.cream }]}>
          <ModalHeader
            title="LOG MUSEUM VISIT"
            onClose={() => setShowAddModal(false)}
            titleStyle={[typography.h2, { color: COLORS.gold }]}
          />

          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.museumPickerField}
              onPress={() => setShowMuseumPicker(true)}
            >
              <Text style={newVisit.museumName ? styles.inputText : styles.inputPlaceholder}>
                {newVisit.museumName || 'Select Museum'}
              </Text>
              <Text style={styles.chevronIcon}>⌵</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.datePickerField}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={newVisit.visitDate ? styles.inputText : styles.inputPlaceholder}>
                {newVisit.visitDate || 'Select Date'}
              </Text>
              <Text style={[styles.chevronIcon, { fontSize: 18 }]}>▩</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setSelectedDate(date);
                    updateNewVisitField('visitDate', date.toISOString().split('T')[0]);
                  }
                }}
              />
            )}

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
              style={[buttons.primary, !canSave && styles.buttonDisabled]}
              onPress={handleAddVisit}
              disabled={!canSave}
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
            renderItem={({ item }: { item: MuseumConfig }) => (
              <TouchableOpacity
                style={styles.museumOption}
                onPress={() => selectMuseum(item)}
              >
                <View style={[styles.colorBadge, { backgroundColor: item.color }]} />
                <View style={styles.museumOptionText}>
                  <Text style={[typography.h4, { color: COLORS.black }]}>{item.name}</Text>
                  <Text style={[typography.caption, { color: COLORS.gold + 'AA' }]}>{item.shortName} · {item.country}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

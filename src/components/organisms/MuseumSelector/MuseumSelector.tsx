import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { SectionHeader } from '@/components/molecules';
import {
  DEFAULT_MUSEUMS,
  getAllMuseums,
  type MuseumConfig,
} from '@/services/museumRegistry';

import { styles } from './MuseumSelector.styles';

export type MuseumSelectorProps = {
  readonly onMuseumsChange: (museums: string[]) => void;
  readonly selectedMuseums: string[];
};

export function MuseumSelector({
  onMuseumsChange,
  selectedMuseums,
}: MuseumSelectorProps) {
  const allMuseums = getAllMuseums();
  const everywhere = allMuseums.filter((m) => DEFAULT_MUSEUMS.includes(m.id));
  const withOwnApi = allMuseums.filter((m) => !DEFAULT_MUSEUMS.includes(m.id));

  const toggleMuseum = (museumId: string) => {
    if (selectedMuseums.includes(museumId)) {
      if (selectedMuseums.length > 1) {
        onMuseumsChange(selectedMuseums.filter((id) => id !== museumId));
      }
    } else {
      onMuseumsChange([...selectedMuseums, museumId]);
    }
  };

  const selectAll = () => {
    onMuseumsChange(allMuseums.map((m) => m.id));
  };

  const selectDefault = () => {
    onMuseumsChange(DEFAULT_MUSEUMS);
  };

  const renderMuseum = (museum: MuseumConfig) => {
    const isSelected = selectedMuseums.includes(museum.id);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        key={museum.id}
        onPress={() => {
          toggleMuseum(museum.id);
        }}
        style={[
          styles.museumCard,
          isSelected && [
            styles.museumCardSelected,
            { borderColor: museum.color },
          ],
        ]}
      >
        <View style={styles.museumCardHeader}>
          <View
            style={[
              styles.checkbox,
              isSelected && [
                styles.checkboxSelected,
                { backgroundColor: museum.color },
              ],
            ]}
          >
            {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <View style={styles.museumInfo}>
            <Text
              style={[
                styles.museumName,
                isSelected && styles.museumNameSelected,
              ]}
            >
              {museum.name}
            </Text>
            <Text style={styles.museumCountry}>{museum.country}</Text>
          </View>
        </View>
        <Text style={styles.museumDescription}>{museum.description}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity onPress={selectAll} style={styles.quickButton}>
          <Text style={styles.quickButtonText}>All ({allMuseums.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={selectDefault}
          style={[styles.quickButton, styles.quickButtonClear]}
        >
          <Text style={[styles.quickButtonText, styles.quickButtonClearText]}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Count */}
      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>
          {selectedMuseums.length} museum
          {selectedMuseums.length === 1 ? '' : 's'} selected
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.section}>
          <SectionHeader title="EVERYWHERE" titleStyle={styles.sectionTitle} />
          <Text style={styles.sectionSubtitle}>
            One catalog for every museum, with or without an API
          </Text>
          {everywhere.map(renderMuseum)}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="MUSEUMS WITH THEIR OWN API"
            titleStyle={styles.sectionTitle}
          />
          <Text style={styles.sectionSubtitle}>
            Add one to search it directly; some need a free key
          </Text>
          {withOwnApi.map(renderMuseum)}
        </View>
      </ScrollView>
    </View>
  );
}

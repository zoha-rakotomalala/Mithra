import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { SectionHeader } from '@/components/molecules';
import { getAllMuseums, getMuseumsByTier, type MuseumConfig } from '@/services/museumRegistry';

import { styles } from './MuseumSelector.styles';

type MuseumSelectorProps = {
  readonly onMuseumsChange: (museums: string[]) => void;
  readonly selectedMuseums: string[];
}

export function MuseumSelector({ onMuseumsChange, selectedMuseums }: MuseumSelectorProps) {
  const allMuseums = getAllMuseums();
  const tier1 = getMuseumsByTier(1);
  const tier2 = getMuseumsByTier(2);
  const tier3 = getMuseumsByTier(3);

  const toggleMuseum = (museumId: string) => {
    if (selectedMuseums.includes(museumId)) {
      if (selectedMuseums.length > 1) {
        onMuseumsChange(selectedMuseums.filter(id => id !== museumId));
      }
    } else {
      onMuseumsChange([...selectedMuseums, museumId]);
    }
  };

  const selectAll = () => {
    onMuseumsChange(allMuseums.map(m => m.id));
  };

  const selectQuick = () => {
    onMuseumsChange(tier1.map(m => m.id));
  };

  const unselectAll = () => {
    onMuseumsChange(['MET']);
  };

  const renderMuseum = (museum: MuseumConfig) => {
    const isSelected = selectedMuseums.includes(museum.id);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        key={museum.id}
        onPress={() => { toggleMuseum(museum.id); }}
        style={[
          styles.museumCard,
          isSelected && [styles.museumCardSelected, { borderColor: museum.color }]
        ]}
      >
        <View style={styles.museumCardHeader}>
          <View style={[styles.checkbox, isSelected && [styles.checkboxSelected, { backgroundColor: museum.color }]]}>
            {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <View style={styles.museumInfo}>
            <Text style={[styles.museumName, isSelected && styles.museumNameSelected]}>
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
        <TouchableOpacity onPress={selectQuick} style={styles.quickButton}>
          <Text style={styles.quickButtonText}>Quick (4)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={selectAll} style={styles.quickButton}>
          <Text style={styles.quickButtonText}>All ({allMuseums.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={unselectAll} style={[styles.quickButton, styles.quickButtonClear]}>
          <Text style={[styles.quickButtonText, styles.quickButtonClearText]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Count */}
      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>
          {selectedMuseums.length} museum{selectedMuseums.length === 1 ? '' : 's'} selected
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Tier 1: Best Collections */}
        <View style={styles.section}>
          <SectionHeader title="BEST COLLECTIONS" titleStyle={styles.sectionTitle} />
          <Text style={styles.sectionSubtitle}>Fast, reliable, high-quality</Text>
          {tier1.map(renderMuseum)}
        </View>

        {/* Tier 2: More Options */}
        <View style={styles.section}>
          <SectionHeader title="MORE MUSEUMS" titleStyle={styles.sectionTitle} />
          <Text style={styles.sectionSubtitle}>Specialized collections</Text>
          {tier2.map(renderMuseum)}
        </View>

        {/* Tier 3: Advanced */}
        <View style={styles.section}>
          <SectionHeader title="ADVANCED" titleStyle={styles.sectionTitle} />
          <Text style={styles.sectionSubtitle}>Aggregators · Variable quality</Text>
          {tier3.map(renderMuseum)}
        </View>
      </ScrollView>
    </View>
  );
}

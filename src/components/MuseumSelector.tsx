import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getAllMuseums, getMuseumsByTier, type MuseumConfig } from '@/services/museumRegistry';

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
      // Unselect - but keep at least one
      if (selectedMuseums.length > 1) {
        onMuseumsChange(selectedMuseums.filter(id => id !== museumId));
      }
    } else {
      // Select
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
    // Keep at least MET selected
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
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>BEST COLLECTIONS</Text>
            <View style={styles.sectionDivider} />
          </View>
          <Text style={styles.sectionSubtitle}>Fast, reliable, high-quality</Text>
          {tier1.map(renderMuseum)}
        </View>

        {/* Tier 2: More Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>MORE MUSEUMS</Text>
            <View style={styles.sectionDivider} />
          </View>
          <Text style={styles.sectionSubtitle}>Specialized collections</Text>
          {tier2.map(renderMuseum)}
        </View>

        {/* Tier 3: Advanced */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionDivider} />
            <Text style={styles.sectionTitle}>ADVANCED</Text>
            <View style={styles.sectionDivider} />
          </View>
          <Text style={styles.sectionSubtitle}>Aggregators · Variable quality</Text>
          {tier3.map(renderMuseum)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  checkbox: {
    alignItems: 'center',
    borderColor: '#999',
    borderRadius: 4,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    marginRight: 12,
    width: 24,
  },
  checkboxSelected: {
    borderColor: 'transparent',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#f5f3ed',
    flex: 1,
  },
  museumCard: {
    backgroundColor: '#fff',
    borderColor: '#e0ddd5',
    borderRadius: 4,
    borderWidth: 2,
    marginBottom: 10,
    padding: 14,
  },
  museumCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  museumCardSelected: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderWidth: 2,
  },
  museumCountry: {
    color: '#999',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  museumDescription: {
    color: '#666',
    fontSize: 11,
    lineHeight: 16,
  },
  museumInfo: {
    flex: 1,
  },
  museumName: {
    color: '#2c2c2c',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  museumNameSelected: {
    color: '#004d40',
  },
  quickActions: {
    borderBottomColor: '#e0ddd5',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  quickButton: {
    alignItems: 'center',
    backgroundColor: '#004d40',
    borderColor: '#d4af37',
    borderRadius: 4,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  quickButtonClear: {
    backgroundColor: 'transparent',
    borderColor: '#999',
  },
  quickButtonClearText: {
    color: '#666',
  },
  quickButtonText: {
    color: '#d4af37',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionDivider: {
    backgroundColor: '#d4af37',
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    color: '#004d40',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  selectedInfo: {
    backgroundColor: '#fff',
    borderBottomColor: '#e0ddd5',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedText: {
    color: '#004d40',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
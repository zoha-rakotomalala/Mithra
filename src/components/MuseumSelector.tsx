import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { getAllMuseums, getMuseumsByTier, type MuseumConfig } from '@/services/museumRegistry';

interface MuseumSelectorProps {
  selectedMuseums: string[];
  onMuseumsChange: (museums: string[]) => void;
}

export function MuseumSelector({ selectedMuseums, onMuseumsChange }: MuseumSelectorProps) {
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
        key={museum.id}
        style={[
          styles.museumCard,
          isSelected && [styles.museumCardSelected, { borderColor: museum.color }]
        ]}
        onPress={() => toggleMuseum(museum.id)}
        activeOpacity={0.7}
      >
        <View style={styles.museumCardHeader}>
          <View style={[styles.checkbox, isSelected && [styles.checkboxSelected, { backgroundColor: museum.color }]]}>
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
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
        <TouchableOpacity style={styles.quickButton} onPress={selectQuick}>
          <Text style={styles.quickButtonText}>Quick (4)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={selectAll}>
          <Text style={styles.quickButtonText}>All ({allMuseums.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickButton, styles.quickButtonClear]} onPress={unselectAll}>
          <Text style={[styles.quickButtonText, styles.quickButtonClearText]}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Count */}
      <View style={styles.selectedInfo}>
        <Text style={styles.selectedText}>
          {selectedMuseums.length} museum{selectedMuseums.length !== 1 ? 's' : ''} selected
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
  container: {
    flex: 1,
    backgroundColor: '#f5f3ed',
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0ddd5',
  },
  quickButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#004d40',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d4af37',
    alignItems: 'center',
  },
  quickButtonClear: {
    backgroundColor: 'transparent',
    borderColor: '#999',
  },
  quickButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d4af37',
    letterSpacing: 1,
  },
  quickButtonClearText: {
    color: '#666',
  },
  selectedInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0ddd5',
  },
  selectedText: {
    fontSize: 12,
    color: '#004d40',
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#d4af37',
    opacity: 0.3,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#004d40',
    letterSpacing: 2,
    marginHorizontal: 12,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
    textAlign: 'center',
  },
  museumCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e0ddd5',
  },
  museumCardSelected: {
    borderWidth: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  museumCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: 'transparent',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  museumInfo: {
    flex: 1,
  },
  museumName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 2,
  },
  museumNameSelected: {
    color: '#004d40',
  },
  museumCountry: {
    fontSize: 10,
    color: '#999',
    letterSpacing: 0.5,
  },
  museumDescription: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
});
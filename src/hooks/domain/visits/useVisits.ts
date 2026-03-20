import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { getVisits, createVisit } from '@/services/visits.service';
import type { Visit } from '@/types/database';

const MUSEUMS = [
  { id: 'MET', name: 'Metropolitan Museum of Art' },
  { id: 'RIJKS', name: 'Rijksmuseum' },
  { id: 'CHICAGO', name: 'Art Institute of Chicago' },
  { id: 'CLEVELAND', name: 'Cleveland Museum of Art' },
  { id: 'NATIONAL_GALLERY', name: 'National Gallery' },
  { id: 'HARVARD', name: 'Harvard Art Museums' },
];

export function useVisits() {
  const navigation = useNavigation();
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

  const loadVisits = async () => {
    setLoading(true);
    const data = await getVisits();
    setVisits(data);
    setLoading(false);
  };

  useEffect(() => {
    loadVisits();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadVisits();
    });
    return unsubscribe;
  }, [navigation]);

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
      notes: '',
    });

    await loadVisits();
  };

  const selectMuseum = (museum: { id: string; name: string }) => {
    setNewVisit({ ...newVisit, museumId: museum.id, museumName: museum.name });
    setShowMuseumPicker(false);
  };

  const updateNewVisitField = (field: string, value: string) => {
    setNewVisit({ ...newVisit, [field]: value });
  };

  return {
    visits,
    loading,
    showAddModal,
    setShowAddModal,
    showMuseumPicker,
    setShowMuseumPicker,
    newVisit,
    museums: MUSEUMS,
    handleAddVisit,
    selectMuseum,
    updateNewVisitField,
  };
}

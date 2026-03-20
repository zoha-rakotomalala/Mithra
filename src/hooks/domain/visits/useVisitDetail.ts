import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getVisitById, updateVisit, deleteVisit, getLikedPaintingsForVisit, getVisitPalette } from '@/services';
import type { Visit } from '@/types/database';

export function useVisitDetail(visitId: string) {
  const navigation = useNavigation();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedCount, setLikedCount] = useState(0);
  const [likedPaintings, setLikedPaintings] = useState<any[]>([]);
  const [hasPalette, setHasPalette] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    museumName: '',
    visitDate: '',
    notes: '',
  });

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
      setLikedPaintings(likes);

      const palette = await getVisitPalette(visitId);
      setHasPalette(!!palette);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVisit();
  }, [visitId]);

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
              navigation.goBack();
            } else {
              Alert.alert('Error', 'Failed to delete visit');
            }
          },
        },
      ]
    );
  };

  const updateEditFormField = (field: string, value: string) => {
    setEditForm({ ...editForm, [field]: value });
  };

  return {
    visit,
    loading,
    likedCount,
    likedPaintings,
    hasPalette,
    showEditModal,
    setShowEditModal,
    editForm,
    handleEdit,
    handleDelete,
    updateEditFormField,
  };
}

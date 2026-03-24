import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getVisitById, updateVisit, deleteVisit, getLikedPaintingsForVisit } from '@/services';
import type { Visit } from '@/types/database';

export function useVisitDetail(visitId: string) {
  const navigation = useNavigation();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedCount, setLikedCount] = useState(0);
  const [likedPaintings, setLikedPaintings] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    visitDate: '',
    notes: '',
  });

  const loadVisit = async () => {
    setLoading(true);
    const data = await getVisitById(visitId);
    if (data) {
      setVisit(data);
      setEditForm({
        visitDate: data.visit_date,
        notes: data.notes || '',
      });
      const likes = await getLikedPaintingsForVisit(visitId);
      setLikedCount(likes.length);
      setLikedPaintings(likes);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVisit();
  }, [visitId]);

  const handleEdit = async () => {
    if (!editForm.visitDate) return;

    await updateVisit(visitId, {
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

  const museumShortName = visit?.museum?.short_name ?? '';

  return {
    visit,
    loading,
    likedCount,
    likedPaintings,
    museumShortName,
    showEditModal,
    setShowEditModal,
    editForm,
    handleEdit,
    handleDelete,
    updateEditFormField,
  };
}

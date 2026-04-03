import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';
import { usePaintings } from '@/contexts/PaintingsContext';
import { useCollection } from './useCollection';

/**
 * Composition hook for the Collection screen.
 * Wraps useCollection (filter/sort state) and adds sync state + navigation.
 */
export function useCollectionFilter() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const collection = useCollection();
  const { syncing, syncError } = usePaintings();

  const handlePaintingPress = useCallback((painting: Painting) => {
    navigation.navigate(Paths.PaintingDetail, { paintingId: painting.id });
  }, [navigation]);

  return {
    ...collection,
    syncing,
    syncError,
    handlePaintingPress,
  };
}

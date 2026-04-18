import { useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';
import { useMuseumSearch } from './useMuseumSearch';

/**
 * Composition hook for the Search screen.
 * Wraps useMuseumSearch and adds navigation-level callbacks.
 */
export function useSearch() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { museumId, visitId } =
    (route.params as { museumId?: string; visitId?: string } | undefined) ?? {};

  const museumSearch = useMuseumSearch({ initialMuseumId: museumId, visitId });

  const handlePaintingPress = useCallback(
    (painting: Painting) => {
      navigation.navigate(Paths.PaintingDetail, { paintingId: painting.id });
    },
    [navigation],
  );

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    ...museumSearch,
    handlePaintingPress,
    goBack,
    hasVisitId: !!visitId,
  };
}

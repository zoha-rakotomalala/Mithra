import type { Painting } from '@/types/painting';

export type CardVariant = 'museum' | 'status' | 'minimal';

export interface GridPaintingCardProps {
  painting: Painting;
  variant?: CardVariant;
  onPress: () => void;
}

import type { Painting } from '@/types/painting';
import type { StackScreenProps } from '@react-navigation/stack';

import { Paths } from '@/navigation/paths';

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, S>;

export type RootStackParamList = {
  [Paths.ArtistProfile]: { artistName: string };
  [Paths.Example]: undefined;
  [Paths.Home]: undefined;
  [Paths.PaintingDetail]: { painting: Painting };
  [Paths.Profile]: undefined;
  [Paths.Search]: undefined;
  [Paths.Settings]: undefined;
  [Paths.Startup]: undefined;
  Main: undefined;
};
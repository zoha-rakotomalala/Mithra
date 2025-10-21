import type { StackScreenProps } from '@react-navigation/stack';
import { Paths } from '@/navigation/paths';
import type { Painting } from '@/types/painting';

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, S>;

export type RootStackParamList = {
  [Paths.Example]: undefined;
  [Paths.Startup]: undefined;
  [Paths.Home]: undefined;
  [Paths.Profile]: undefined;
  [Paths.Settings]: undefined;
  [Paths.Search]: undefined;
  [Paths.PaintingDetail]: { painting: Painting };
  Main: undefined;
};
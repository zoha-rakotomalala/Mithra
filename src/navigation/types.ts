import type { StackScreenProps } from '@react-navigation/stack';
import { Paths } from '@/navigation/paths';

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
  Main: undefined;
};
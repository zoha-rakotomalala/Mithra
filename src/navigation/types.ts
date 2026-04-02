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
  [Paths.Palette]: undefined;
  [Paths.Settings]: undefined;
  [Paths.Search]: { museumId?: string; visitId?: string } | undefined;
  [Paths.Palette]: undefined;
  [Paths.PaintingDetail]: { painting: Painting };
  [Paths.ArtistProfile]: { artistName: string };
  [Paths.Visits]: undefined;
  [Paths.VisitDetail]: { visitId: string };
  [Paths.MuseumCollection]: { visitId: string; museumId: string };
  [Paths.LikedPaintings]: { visitId: string };
  [Paths.VisitPalette]: { visitId: string };
  [Paths.ViewPalette]: { visitId: string };
  [Paths.Auth]: undefined;
  Main: undefined;
};

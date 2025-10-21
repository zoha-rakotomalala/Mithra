import type { Painting, UserProfile } from '@/types/painting';

export const mockUserProfile: UserProfile = {
  username: 'art_lover',
  profileColor: '#95E1D3',
  stats: {
    paintings: 8,
    followers: '1.2K',
    following: 567,
  },
};

export const mockPaintings: Painting[] = [
  { id: 1, title: 'Starry Night', artist: 'Vincent van Gogh', color: '#FF6B6B' },
  { id: 2, title: 'The Scream', artist: 'Edvard Munch', color: '#4ECDC4' },
  { id: 3, title: 'Girl with a Pearl Earring', artist: 'Johannes Vermeer', color: '#45B7D1' },
  { id: 5, title: 'The Kiss', artist: 'Gustav Klimt', color: '#F38181' },
  { id: 6, title: 'Water Lilies', artist: 'Claude Monet', color: '#AA96DA' },
  { id: 7, title: 'The Birth of Venus', artist: 'Sandro Botticelli', color: '#FCBAD3' },
  { id: 8, title: 'American Gothic', artist: 'Grant Wood', color: '#FFFFD2' },
  { id: 9, title: 'The Persistence of Memory', artist: 'Salvador Dalí', color: '#A8D8EA' },
];
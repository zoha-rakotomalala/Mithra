import {
  selectIdentifier,
  visionIdentifier,
  type ArtworkIdentifier,
} from '@/services/identification';
import { buildCandidatesFromLlm } from '@/services/identification/bedrockIdentifier';

// The identification modules read react-native-config at call time; stub it so
// imports are inert (selection is tested with injected identifiers instead).
jest.mock('react-native-config', () => ({}));

function stubIdentifier(
  id: string,
  configured: boolean,
): ArtworkIdentifier {
  return {
    id,
    label: id,
    isConfigured: () => configured,
    identify: jest.fn(),
  };
}

describe('selectIdentifier', () => {
  it('honours an explicit, configured preference', () => {
    const a = stubIdentifier('a', true);
    const b = stubIdentifier('b', true);
    expect(selectIdentifier('b', [a, b])).toBe(b);
  });

  it('ignores a preference that is not configured and uses first configured', () => {
    const a = stubIdentifier('a', true);
    const b = stubIdentifier('b', false);
    expect(selectIdentifier('b', [a, b])).toBe(a);
  });

  it('uses the first configured identifier when no preference is given', () => {
    const a = stubIdentifier('a', false);
    const b = stubIdentifier('b', true);
    expect(selectIdentifier(undefined, [a, b])).toBe(b);
  });

  it('falls back to the Vision identifier when nothing is configured', () => {
    const a = stubIdentifier('a', false);
    expect(selectIdentifier('a', [a])).toBe(visionIdentifier);
  });
});

describe('buildCandidatesFromLlm', () => {
  it('emits title before artist, with correct search types', () => {
    const candidates = buildCandidatesFromLlm({
      artist: 'Vincent van Gogh',
      confidence: 0.9,
      title: 'The Starry Night',
    });
    expect(candidates[0]).toMatchObject({
      query: 'The Starry Night',
      searchType: 'title',
    });
    expect(candidates[1]).toMatchObject({
      query: 'Vincent van Gogh',
      searchType: 'artist',
    });
    expect(candidates[0].confidence).toBeGreaterThan(candidates[1].confidence);
  });

  it('omits missing fields and short queries', () => {
    const candidates = buildCandidatesFromLlm({ artist: 'ab', title: '' });
    expect(candidates).toHaveLength(0);
  });

  it('clamps confidence into [0, 1]', () => {
    const [candidate] = buildCandidatesFromLlm({
      confidence: 5,
      title: 'Guernica',
    });
    expect(candidate.confidence).toBe(1);
  });

  it('includes alternates at lower confidence and dedupes repeats', () => {
    const candidates = buildCandidatesFromLlm({
      alternates: [
        { confidence: 0.5, title: 'The Starry Night' }, // dupe of primary
        { confidence: 0.4, title: 'Wheatfield with Crows' },
      ],
      confidence: 0.9,
      title: 'The Starry Night',
    });
    const starry = candidates.filter(
      (c) => c.searchType === 'title' && c.query === 'The Starry Night',
    );
    expect(starry).toHaveLength(1);
    expect(
      candidates.some((c) => c.query === 'Wheatfield with Crows'),
    ).toBe(true);
  });

  it('returns candidates sorted by confidence descending', () => {
    const candidates = buildCandidatesFromLlm({
      alternates: [{ confidence: 0.3, title: 'Irises' }],
      artist: 'Van Gogh',
      confidence: 0.9,
      title: 'Sunflowers',
    });
    for (let i = 1; i < candidates.length; i += 1) {
      expect(candidates[i - 1].confidence).toBeGreaterThanOrEqual(
        candidates[i].confidence,
      );
    }
  });
});

import {
  buildSearchCandidates,
  parseVisionResponse,
  type VisionArtworkGuess,
} from '@/services/visionService';

// visionService imports react-native-config at module scope; provide a stub so
// the import is inert in the test environment (analyzeArtwork is not exercised
// here — only the pure helpers are).
jest.mock('react-native-config', () => ({ GOOGLE_VISION_API_KEY: 'test-key' }));

describe('visionService.parseVisionResponse', () => {
  it('extracts best-guess labels, sorted+filtered web entities, text and labels', () => {
    const raw = {
      webDetection: {
        bestGuessLabels: [{ label: 'the starry night', languageCode: 'en' }],
        webEntities: [
          { description: 'Painting', score: 0.99 }, // generic -> dropped
          { description: 'Vincent van Gogh', score: 0.8 },
          { description: 'The Starry Night', score: 0.95 },
          { description: 'a', score: 0.9 }, // too short -> dropped
        ],
      },
      fullTextAnnotation: { text: 'Vincent van Gogh\nThe Starry Night\n1889' },
      labelAnnotations: [
        { description: 'Painting', score: 0.97 },
        { description: 'Sky', score: 0.9 },
      ],
    };

    const guess = parseVisionResponse(raw);

    expect(guess.bestGuessLabels).toEqual(['the starry night']);
    // Sorted by score desc, generic + short removed:
    expect(guess.webEntities).toEqual([
      'The Starry Night',
      'Vincent van Gogh',
    ]);
    expect(guess.detectedText).toBe('Vincent van Gogh The Starry Night 1889');
    expect(guess.labels).toEqual(['Painting', 'Sky']);
  });

  it('returns empty structure for an empty response', () => {
    const guess = parseVisionResponse({});
    expect(guess.bestGuessLabels).toEqual([]);
    expect(guess.webEntities).toEqual([]);
    expect(guess.detectedText).toBeNull();
    expect(guess.labels).toEqual([]);
  });
});

describe('visionService.buildSearchCandidates', () => {
  const baseGuess: VisionArtworkGuess = {
    bestGuessLabels: [],
    detectedText: null,
    labels: [],
    webEntities: [],
  };

  it('prioritises the best-guess label as a title search', () => {
    const candidates = buildSearchCandidates({
      ...baseGuess,
      bestGuessLabels: ['The Starry Night'],
    });
    expect(candidates[0]).toMatchObject({
      query: 'The Starry Night',
      searchType: 'title',
      source: 'bestGuess',
    });
  });

  it('emits both a title and an artist attempt for the leading web entity', () => {
    const candidates = buildSearchCandidates({
      ...baseGuess,
      webEntities: ['Vincent van Gogh'],
    });
    const titleAttempt = candidates.find(
      (c) => c.searchType === 'title' && c.query === 'Vincent van Gogh',
    );
    const artistAttempt = candidates.find(
      (c) => c.searchType === 'artist' && c.query === 'Vincent van Gogh',
    );
    expect(titleAttempt).toBeDefined();
    expect(artistAttempt).toBeDefined();
  });

  it('drops generic art terms and too-short queries', () => {
    const candidates = buildSearchCandidates({
      ...baseGuess,
      bestGuessLabels: ['Painting'], // generic
      webEntities: ['ab', 'art'], // too short / generic
    });
    expect(candidates).toHaveLength(0);
  });

  it('deduplicates identical query+type pairs', () => {
    const candidates = buildSearchCandidates({
      ...baseGuess,
      bestGuessLabels: ['Mona Lisa'],
      webEntities: ['Mona Lisa'],
    });
    const titleMonaLisa = candidates.filter(
      (c) => c.searchType === 'title' && c.query === 'Mona Lisa',
    );
    expect(titleMonaLisa).toHaveLength(1);
  });

  it('treats the first placard line as artist, following lines as title', () => {
    const candidates = buildSearchCandidates({
      ...baseGuess,
      detectedText: 'Claude Monet\nWater Lilies',
    });
    const artistLine = candidates.find(
      (c) => c.source === 'placardLine' && c.query === 'Claude Monet',
    );
    const titleLine = candidates.find(
      (c) => c.source === 'placardLine' && c.query === 'Water Lilies',
    );
    expect(artistLine?.searchType).toBe('artist');
    expect(titleLine?.searchType).toBe('title');
  });

  it('returns candidates sorted by confidence descending', () => {
    const candidates = buildSearchCandidates({
      ...baseGuess,
      bestGuessLabels: ['The Kiss'],
      detectedText: 'Gustav Klimt',
      webEntities: ['Gustav Klimt'],
    });
    for (let i = 1; i < candidates.length; i += 1) {
      expect(candidates[i - 1].confidence).toBeGreaterThanOrEqual(
        candidates[i].confidence,
      );
    }
  });
});

/**
 * Generate a consistent color from a string input.
 * Uses a simple hash function to map any string to one of 15 predefined colors.
 * Deterministic: same input always produces the same color.
 */
export function generateColorFromString(input: string): string {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#95E1D3',
    '#F38181',
    '#AA96DA',
    '#FCBAD3',
    '#FFFFD2',
    '#A8D8EA',
    '#E8B86D',
    '#F4976C',
    '#4A5F7A',
    '#2C3639',
    '#D4AF37',
    '#7FB3D5',
  ];

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

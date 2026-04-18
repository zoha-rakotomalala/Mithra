/**
 * Image URL utilities
 */

/**
 * Get optimized image URL with size parameters
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
): string {
  if (!url) return '';

  // For IIIF images, add size parameters
  if (url.includes('iiif')) {
    const baseUrl = url.split('/full/')[0];
    const size =
      width && height ? `${width},${height}` : width ? `${width},` : 'full';
    return `${baseUrl}/full/${size}/0/default.jpg`;
  }

  return url;
}

/**
 * Get thumbnail URL (smaller version)
 */
export function getThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, 400);
}

/**
 * Check if URL is valid image
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const lowerUrl = url.toLowerCase();

  return (
    imageExtensions.some((ext) => lowerUrl.includes(ext)) ||
    lowerUrl.includes('iiif')
  );
}

/**
 * Get fallback color for painting
 */
export function getFallbackColor(title: string): string {
  const colors = [
    '#8B4513', // Brown
    '#2F4F4F', // Dark slate gray
    '#556B2F', // Dark olive green
    '#8B0000', // Dark red
    '#483D8B', // Dark slate blue
    '#2E8B57', // Sea green
  ];

  // Use title to generate consistent color
  const hash = title
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

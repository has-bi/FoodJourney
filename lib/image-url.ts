/**
 * Convert a stored photo URL/key to a displayable URL.
 * - "r2:visits/..." → "/api/images?key=visits/..."
 * - "https://pub-....r2.dev/..." → "/api/images?key=..." (old R2 URLs)
 * - "data:image/..." → returned as-is (legacy base64)
 */
export function getImageUrl(storedValue: string): string {
  if (!storedValue) return "";

  // New format: r2: prefix
  if (storedValue.startsWith("r2:")) {
    const key = storedValue.slice(3);
    return `/api/images?key=${encodeURIComponent(key)}`;
  }

  // Old format: full r2.dev public URL
  if (storedValue.includes(".r2.dev/")) {
    const key = storedValue.split(".r2.dev/")[1];
    return `/api/images?key=${encodeURIComponent(key)}`;
  }

  // Legacy base64 or other URL
  return storedValue;
}

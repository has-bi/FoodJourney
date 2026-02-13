/**
 * Convert a stored photo URL/key to a displayable URL.
 * - "r2:visits/..." → "/api/images?key=visits/..."
 * - "https://pub-....r2.dev/..." → "/api/images?key=..." (old R2 URLs)
 * - "/api/images?key=..." or encoded keys → normalized to a single format
 * - "data:image/..." → returned as-is (legacy base64)
 */
export function getImageUrl(storedValue: string): string {
  if (!storedValue) return "";

  if (storedValue.startsWith("data:image/")) {
    return storedValue;
  }

  const key = extractR2Key(storedValue);
  if (key) {
    return `/api/images?key=${encodeURIComponent(key)}`;
  }

  return storedValue;
}

function extractR2Key(value: string): string | null {
  // New format: r2: prefix
  if (value.startsWith("r2:")) {
    return normalizeKey(value.slice(3));
  }

  // Old format: full public r2.dev URL
  if (value.includes(".r2.dev/")) {
    return normalizeKey(value.split(".r2.dev/")[1] || "");
  }

  // Already-proxied API URL (stored by older flows)
  if (value.startsWith("/api/images?")) {
    const params = new URLSearchParams(value.split("?")[1] || "");
    const key = params.get("key");
    return key ? normalizeKey(key) : null;
  }

  // Raw key in DB
  if (value.startsWith("visits/") || value.startsWith("visits%2F")) {
    return normalizeKey(value);
  }

  return null;
}

function normalizeKey(input: string): string {
  let key = input.trim().replace(/^\/+/, "");

  // Handle keys that were encoded more than once.
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(key);
      if (decoded === key) break;
      key = decoded;
    } catch {
      break;
    }
  }

  return key;
}

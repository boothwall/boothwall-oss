/** Preserve case-sensitive paths and fail closed for unsafe or unencodable guest URLs. */
export function guestLink(path: string, origin: string): string | null {
  try {
    const url = new URL(path, origin);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    const value = url.toString();
    return new TextEncoder().encode(value).length <= 2000 ? value : null;
  } catch {
    return null;
  }
}

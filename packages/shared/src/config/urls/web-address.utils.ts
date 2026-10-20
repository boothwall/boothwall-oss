// Parsed by hand: React Native's URL has no origin, protocol, host or pathname.
const WEB_URL = /^(https?:\/\/[^/?#]+)([^?#]*)/i;

function parts(web: string): { origin: string; path: string } {
  const match = WEB_URL.exec(web);
  if (!match) throw new Error(`urls.web must be an http(s) address, got "${web}".`);
  return { origin: match[1]!.toLowerCase(), path: match[2]! };
}

/**
 * Where the web app is served, from `urls.web`: "/" at a bare origin, "/demo/" for
 * "https://example.com/demo". Its pages and assets live under this path.
 */
export function webBasePath(web: string): string {
  return `${parts(web).path.replace(/\/+$/, "")}/`;
}

/** The Origin browsers send from the web app's pages: never a path. */
export function webOrigin(web: string): string {
  return parts(web).origin;
}

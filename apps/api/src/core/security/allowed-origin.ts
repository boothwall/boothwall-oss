/**
 * Whether `origin` (like `https://wall.example.com`) is one of `allowed`. An entry ending in
 * `:*` allows any port on that host, so `http://localhost:*` covers a dev server that had to
 * move from 5173 to 5174.
 */
export function isAllowedOrigin(origin: string, allowed: readonly string[]): boolean {
  return allowed.some((entry) =>
    entry.endsWith(":*") ? onAnyPort(origin, entry.slice(0, -2)) : entry === origin,
  );
}

const onAnyPort = (origin: string, base: string) =>
  origin === base || (origin.startsWith(`${base}:`) && /^\d+$/.test(origin.slice(base.length + 1)));

/**
 * Counts hits per client in fixed windows, in memory. Bounded: every new window starts from
 * an empty map. It lives in the wall's Durable Object, so a restart only resets the counts.
 */
export class ClientLimiter {
  private windowStart = 0;
  private readonly hits = new Map<string, number>();

  /** Takes one hit for `key`; false once it has used `max` in the current window. */
  take(key: string, max: number, windowMs: number, now: number, legacyKey?: string): boolean {
    if (now - this.windowStart >= windowMs) {
      this.windowStart = now;
      this.hits.clear();
    }
    const used = this.hits.get(key) ?? 0;
    if (used + (legacyKey ? (this.hits.get(legacyKey) ?? 0) : 0) >= max) return false;
    this.hits.set(key, used + 1);
    return true;
  }
}

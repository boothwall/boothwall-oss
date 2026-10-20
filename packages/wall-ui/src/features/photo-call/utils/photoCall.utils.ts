import type { Category } from "@boothwall/shared";

export function formatCountdown(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/** The call's mission: the named categories in turn, none when there is only a catch-all. */
export function missionFor(categories: readonly Category[], index: number): string | null {
  const named = categories.filter((category) => !category.catchAll);
  return named.length > 0 ? (named[index % named.length]?.label ?? null) : null;
}

/** The join address as people read it: no scheme. */
export const readableUrl = (url: string) => url.replace(/^https?:\/\//, "");

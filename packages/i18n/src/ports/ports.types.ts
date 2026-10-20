import type { Language } from "#languages";

/** Where a language choice is remembered (device storage, a saved preference). `null` means "automatic". */
export interface PreferenceStore {
  read(): Language | null;
  write(language: Language | null): void;
}

/** What the device says about its owner, best first. It only refines the language. */
export interface DeviceLocale {
  languages(): readonly string[];
  timeZone(): string;
}

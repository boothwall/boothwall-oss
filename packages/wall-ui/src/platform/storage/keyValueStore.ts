/**
 * Small string storage that survives a restart, supplied by each app: AsyncStorage on Vega,
 * localStorage in a browser (AsyncStorage fits as is). The wall works without one; it just
 * can't remember anything across launches.
 */
export type KeyValueStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

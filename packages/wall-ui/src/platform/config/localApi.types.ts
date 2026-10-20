/** A local API that overrides boothwall.config.ts (see localApi.ts). */
export type LocalApi = {
  /** The API to use instead of `urls.api`. */
  apiBaseUrl: string;
  /** The web app serving this wall, for the upload QR code. */
  webUrl: string;
};

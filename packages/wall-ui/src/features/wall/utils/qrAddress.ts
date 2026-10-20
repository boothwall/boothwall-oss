/**
 * The address a QR encodes, as short and coarse as it can be: GitHub ignores case in owner and
 * repo paths, so a plain repo address goes in capitals, which QR alphanumeric mode packs denser.
 * Anything else keeps its case.
 */
export function qrAddress(url: string): string {
  return /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(url) ? url.toUpperCase() : url;
}

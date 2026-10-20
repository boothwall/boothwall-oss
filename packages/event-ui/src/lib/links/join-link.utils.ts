export type JoinLink = {
  /** Exact URL; event paths and query parameters may be case-sensitive. */
  qrValue: string;
  /** For people: omit the scheme, preserve path and query case. */
  display: string;
};

/** The upload page’s exact address, for a QR code or a link. */
export function joinLink(webUrl: string, path: string): JoinLink {
  const url = `${webUrl.replace(/\/+$/, "")}${path}`;
  return {
    qrValue: url,
    display: url.replace(/^https?:\/\//, ""),
  };
}

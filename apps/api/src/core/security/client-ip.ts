import { hmacHex, sha256Hex } from "./crypto";

/**
 * The unit we rate-limit: an IPv4 address, or the /64 an IPv6 client gets from its ISP
 * (one device can rotate through billions of addresses inside it).
 */
export function clientKey(ip: string): string {
  if (!ip.includes(":")) return ip;
  const [head = "", tail = ""] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = ip.includes("::")
    ? [...left, ...Array(8 - left.length - right.length).fill("0"), ...right]
    : left;
  return `${groups
    .slice(0, 4)
    .map((g) => g.replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

/** A purpose-separated daily pseudonym. The key must be a separately configured server secret. */
export async function hashClient(ip: string, now: Date, key: string | undefined, purpose: string) {
  if (typeof key !== "string" || key.length < 32)
    throw new Error("Client fingerprint key unavailable");
  if (!purpose || purpose.length > 128) throw new Error("Client fingerprint purpose unavailable");
  return `hmac-v1:${await hmacHex(key, JSON.stringify(["client-fingerprint:v1", purpose, now.toISOString().slice(0, 10), clientKey(ip)]))}`;
}

/** Legacy digest is only a read candidate for still-active counters; never persist it again. */
export async function clientFingerprints(
  ip: string,
  now: Date,
  key: string | undefined,
  purpose: string,
) {
  const current = await hashClient(ip, now, key, purpose);
  const legacy = await sha256Hex(`${now.toISOString().slice(0, 10)}:${clientKey(ip)}`);
  return { current, legacy };
}

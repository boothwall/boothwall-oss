import { EventApiError } from "../errors";
import type { EventTransport } from "../types";

type TransportOptions = {
  apiBaseUrl: string;
  wallId?: string;
  getPasscode?: () => string;
};

/** Neutral HTTP mechanics; each application owns its credential policy inputs. */
export function createEventTransport({
  apiBaseUrl,
  wallId,
  getPasscode,
}: TransportOptions): EventTransport {
  const base = new URL(apiBaseUrl);
  if (
    !["http:", "https:"].includes(base.protocol) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    throw new TypeError("Invalid API origin");
  }
  const endpoint = (path: string) => {
    if (!path.startsWith("/") || path.startsWith("//") || /[\\\s]/.test(path)) {
      throw new TypeError("Expected a relative API endpoint");
    }
    const prefix = base.pathname.replace(/\/+$/, "");
    const url = new URL(`${prefix}${path}`, base.origin);
    const rawPath = path.split(/[?#]/, 1)[0]!;
    if (rawPath.split("/").some((part) => /^(?:\.|%2e){1,2}$/i.test(part)))
      throw new TypeError("Endpoint traversal is not allowed");
    if (prefix && !url.pathname.startsWith(`${prefix}/`))
      throw new TypeError("Endpoint escaped API base");
    if (url.origin !== base.origin) throw new TypeError("Endpoint origin mismatch");
    if (wallId !== undefined) url.searchParams.set("wall", wallId);
    return url;
  };
  return {
    async request(path, { access, ...options }) {
      const headers = new Headers(options.headers);
      headers.delete("authorization");
      headers.delete("cookie");
      if (access === "control" && getPasscode)
        headers.set("authorization", `Bearer ${getPasscode()}`);
      if (options.body instanceof FormData) headers.delete("content-type");
      const response = await fetch(endpoint(path), {
        ...options,
        headers,
        credentials:
          access === "control" && wallId !== undefined && !getPasscode ? "include" : "omit",
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const error = body && typeof body === "object" && "error" in body ? body.error : null;
        const code = error && typeof error === "object" && "code" in error ? error.code : null;
        throw new EventApiError(
          response.status,
          typeof code === "string" ? code : `HTTP_${response.status}`,
        );
      }
      return response;
    },
    socketUrl(kind, ticket) {
      if (kind === "control" && !ticket) throw new TypeError("Control socket requires a ticket");
      const url = endpoint(kind === "public" ? "/wall/live" : "/wall/control");
      if (kind === "control") url.searchParams.set("ticket", ticket!);
      url.protocol = base.protocol === "https:" ? "wss:" : "ws:";
      return url.toString();
    },
  };
}

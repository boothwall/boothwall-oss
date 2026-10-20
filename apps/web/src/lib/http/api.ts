import { EventApiError as ApiError } from "@boothwall/event-ui/runtime";

import { appConfig } from "@/config";

export { EventApiError as ApiError } from "@boothwall/event-ui/runtime";

/** fetch against the wall API; non-2xx responses become ApiError with the server code. */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${appConfig.apiBaseUrl}${path}`, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { code?: string } } | null;
    throw new ApiError(res.status, body?.error?.code ?? "UNKNOWN");
  }
  return res;
}

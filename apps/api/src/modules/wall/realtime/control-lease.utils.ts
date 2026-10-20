import type { ControlLease } from "@/contracts/runtime";

export const CONTROL_ADMISSION_MS = 60_000;
const OPAQUE_ID = /^[a-zA-Z0-9_-]{20,100}$/;
export const validControlLeaseId = (id: string) => OPAQUE_ID.test(id);

/** Only the host's room connector creates these internal URL fields. */
export function readControlLease(url: URL, now: number): ControlLease | null | false {
  const names = ["lease", "admissionExpiresAt", "connectionExpiresAt"];
  if (!names.some((name) => url.searchParams.has(name))) return null;
  if (
    url.pathname !== "/control" ||
    names.some((name) => url.searchParams.getAll(name).length !== 1)
  )
    return false;
  const id = url.searchParams.get("lease")!;
  const admissionExpiresAt = Number(url.searchParams.get("admissionExpiresAt"));
  const connectionExpiresAt = Number(url.searchParams.get("connectionExpiresAt"));
  if (
    !validControlLeaseId(id) ||
    !Number.isSafeInteger(admissionExpiresAt) ||
    !Number.isSafeInteger(connectionExpiresAt) ||
    admissionExpiresAt <= now ||
    admissionExpiresAt > now + CONTROL_ADMISSION_MS ||
    connectionExpiresAt < admissionExpiresAt
  )
    return false;
  return { id, admissionExpiresAt, connectionExpiresAt };
}

export function socketControlLease(socket: WebSocket): ControlLease | null {
  const attachment: unknown = socket.deserializeAttachment?.();
  if (!attachment || typeof attachment !== "object" || !("controlLease" in attachment)) return null;
  return attachment.controlLease as ControlLease;
}

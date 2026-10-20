import type { RemoteCommand } from "@boothwall/shared";

/** Every button an app's remote adapter can report: the phone remote's commands plus up and down. */
export type RemoteKey = RemoteCommand | "up" | "down";

export type RemoteHandlers = Partial<Record<RemoteKey, () => void>>;

/**
 * The platform's remote, supplied by the app shell: the TV remote on Vega, the keyboard on the
 * web. It calls the matching handler once per press.
 */
export type RemoteInputHook = (handlers: RemoteHandlers) => void;

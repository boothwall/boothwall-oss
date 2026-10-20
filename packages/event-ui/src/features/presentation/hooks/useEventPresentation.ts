import { type EventPresentation, resolveEventPresentation } from "@boothwall/shared";

import { useEventRuntime } from "#runtime";
export function useEventPresentation(override?: EventPresentation) {
  const runtime = useEventRuntime();
  const live = override ?? runtime.defaults.presentation;
  const value = resolveEventPresentation(runtime.presentation, live);
  const absolute = (url: string | null | undefined, fromApi: boolean) =>
    url
      ? new URL(
          url,
          fromApi ? runtime.wall.apiBaseUrl || window.location.origin : window.location.origin,
        ).toString()
      : url;
  return {
    ...value,
    logoUrl: absolute(value.logoUrl, live?.logoUrl !== undefined),
    backdropUrl: absolute(value.backdropUrl, live?.backdropUrl !== undefined),
  };
}

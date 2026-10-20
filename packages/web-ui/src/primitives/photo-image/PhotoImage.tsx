import { type ComponentPropsWithoutRef, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "#foundations";

export type PhotoImageProps = Omit<
  ComponentPropsWithoutRef<"img">,
  "src" | "alt" | "onLoad" | "onError" | "className"
> & {
  src: string;
  /** Required: what the photo shows, or "" inside a control that already names it. */
  alt: string;
  /** A small copy (a thumbnail) shown blurred until `src` has loaded. */
  placeholderSrc?: string;
  /** Sizes the box; the image fills it. Give it an aspect ratio or a height. */
  className?: string;
  /** "contain" shows the whole photo inside the box, e.g. to judge it; "cover" fills it. */
  fit?: "cover" | "contain";
  /** Hears loading (including the quiet retry), loaded or failed, e.g. to wait for the photo. */
  onPhaseChange?: (phase: PhotoImagePhase) => void;
};

export type PhotoImagePhase = "loading" | "loaded" | "failed";

/** One quiet retry after a failed load: venue Wi-Fi drops requests more than it breaks images. */
const RETRY_MS = 2500;

type Phase = "loading" | "loaded" | "retrying" | "failed";

/**
 * A photo that never shows as a blank or broken box. While it loads, a light band sweeps across
 * (or its thumbnail shows, blurred); a failed load is retried once, then a neutral tile with an
 * image icon takes its place, still named by `alt`.
 */
export function PhotoImage({
  src,
  alt,
  placeholderSrc,
  className,
  fit = "cover",
  onPhaseChange,
  ...img
}: PhotoImageProps) {
  const [load, setLoad] = useState<{ src: string; phase: Phase; attempt: number }>({
    src,
    phase: "loading",
    attempt: 0,
  });
  // A new photo starts over (reset while rendering, so the old phase never shows on it).
  if (load.src !== src) setLoad({ src, phase: "loading", attempt: 0 });
  const { phase, attempt } = load;
  const reported: PhotoImagePhase = phase === "retrying" ? "loading" : phase;
  const report = useRef(onPhaseChange);
  report.current = onPhaseChange;
  useEffect(() => {
    report.current?.(reported);
  }, [reported]);

  useEffect(() => {
    if (phase !== "retrying") return;
    const timer = setTimeout(
      () => setLoad((current) => ({ ...current, phase: "loading", attempt: current.attempt + 1 })),
      RETRY_MS,
    );
    return () => clearTimeout(timer);
  }, [phase]);
  const setPhase = (next: Phase) => setLoad((current) => ({ ...current, phase: next }));
  // A server-rendered photo can finish loading before React attaches onLoad: count it as loaded.
  const markLoadedIfComplete = useCallback((image: HTMLImageElement | null) => {
    if (!image?.complete || image.naturalWidth === 0) return;
    setLoad((current) => (current.phase === "loaded" ? current : { ...current, phase: "loaded" }));
  }, []);

  if (phase === "failed") {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        className={cn("flex items-center justify-center bg-ink-subtle/25", className)}
      >
        <BrokenImageIcon />
      </div>
    );
  }

  const loading = phase !== "loaded";
  return (
    <div className={cn("relative overflow-hidden bg-ink-subtle/25", className)}>
      {loading && placeholderSrc && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full scale-110 object-cover blur-md"
        />
      )}
      {loading && !placeholderSrc && (
        <span aria-hidden className="absolute inset-0 motion-safe:animate-shimmer" />
      )}
      <img
        key={attempt}
        ref={markLoadedIfComplete}
        src={src}
        alt={alt}
        {...img}
        onLoad={() => setPhase("loaded")}
        onError={() => setPhase(attempt === 0 ? "retrying" : "failed")}
        className={cn(
          "relative size-full transition-opacity duration-300",
          fit === "contain" ? "object-contain" : "object-cover",
          loading ? "opacity-0" : "opacity-100",
        )}
      />
    </div>
  );
}

/** A picture frame with a slash: the photo couldn't be loaded. */
function BrokenImageIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-1/4 max-w-10 text-ink-subtle"
    >
      <path d="M3 3l18 18" />
      <path d="M21 15V5a2 2 0 0 0-2-2H9" />
      <path d="M3 7v12a2 2 0 0 0 2 2h12" />
      <path d="M3 16l5-5 4 4" />
      <path d="M14.5 9.5a1.5 1.5 0 1 0 0-.01" />
    </svg>
  );
}

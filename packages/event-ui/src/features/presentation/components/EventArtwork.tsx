import { cn } from "@boothwall/web-ui";
import { useState } from "react";
export function EventArtwork({
  src,
  alt,
  className,
  fallback,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return src && failed !== src ? (
    <img
      src={src}
      alt={alt}
      className={cn("max-w-full object-contain", className)}
      onError={() => setFailed(src)}
    />
  ) : fallback ? (
    <span className="font-bold">{fallback}</span>
  ) : null;
}

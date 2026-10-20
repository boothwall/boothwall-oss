import qrcode from "qrcode-generator";
import { useMemo } from "react";

import { cn } from "#foundations";

export type QrCodeProps = {
  value: string;
  /** Required: says where the code leads, for anyone who can't scan it. */
  label: string;
  /** "M" survives a smudge or a fold; "L" keeps a long value coarse. */
  errorCorrection?: "L" | "M" | "Q" | "H";
  className?: string;
};

// What QR alphanumeric mode can encode: denser than bytes, so an upper-case URL scans easier.
const ALPHANUMERIC = /^[0-9A-Z $%*+\-./:]*$/;

/** Quiet zone in modules on every side, as the QR spec asks for. */
const QUIET = 2;

/**
 * A QR code as one SVG path: crisp at any size, on screen and in print. It fills its box, so
 * size it with the className; colours come from `currentColor` on a transparent background.
 */
export function QrCode({ value, label, errorCorrection = "M", className }: QrCodeProps) {
  const { path, size } = useMemo(() => {
    const qr = qrcode(0, errorCorrection);
    qr.addData(value, ALPHANUMERIC.test(value) ? "Alphanumeric" : "Byte");
    qr.make();
    const count = qr.getModuleCount();
    let d = "";
    for (let row = 0; row < count; row++) {
      for (let col = 0; col < count; col++) {
        if (qr.isDark(row, col)) d += `M${col + QUIET} ${row + QUIET}h1v1h-1z`;
      }
    }
    return { path: d, size: count + QUIET * 2 };
  }, [errorCorrection, value]);

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={cn("block", className)}
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}

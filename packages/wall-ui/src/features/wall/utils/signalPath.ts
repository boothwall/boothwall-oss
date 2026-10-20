import { signal } from "#foundation/tokens";

import { PANEL, type SlotPosition } from "../constants/layout";
import { metaLineExtent, polaroidHeight } from "./polaroidGeometry";

export type Point = readonly [number, number];

/** Where a new photo's light leaves from: the middle of the join card. */
export const SIGNAL_SOURCE: Point = [
  PANEL.left + PANEL.width / 2,
  PANEL.top + signal.arrival.sourceDrop,
];

/** The middle of a resting card in its slot (no category line under its caption). */
export function slotCentre(slot: SlotPosition): Point {
  const height = polaroidHeight(slot.width) - metaLineExtent(slot.width);
  return [slot.x + slot.width / 2, slot.y + height / 2];
}

/** A wavy line between two points: `waves` swings either side of the straight line, easing out at both ends. */
export function wavePath(from: Point, to: Point, amplitude: number, waves: number, steps: number) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const length = Math.hypot(dx, dy) || 1;
  const [nx, ny] = [-dy / length, dx / length];
  return Array.from({ length: steps + 1 }, (_, i): Point => {
    const t = i / steps;
    const swing = amplitude * Math.sin(Math.PI * 2 * waves * t) * Math.sin(Math.PI * t);
    return [from[0] + dx * t + nx * swing, from[1] + dy * t + ny * swing];
  });
}

/**
 * A path as interpolation ranges: each point's share of the length, its position and the heading
 * there in degrees (unwrapped, so a turn never spins the long way round).
 */
export function pathFrames(points: readonly Point[]) {
  const lengths = points.reduce<number[]>(
    (sums, point, i) =>
      i === 0
        ? [0]
        : [
            ...sums,
            sums[i - 1]! + Math.hypot(point[0] - points[i - 1]![0], point[1] - points[i - 1]![1]),
          ],
    [],
  );
  const total = lengths[lengths.length - 1] || 1;
  let last: number | null = null;
  const angles = points.map((_, i) => {
    const a = points[Math.min(i, points.length - 2)]!;
    const b = points[Math.min(i + 1, points.length - 1)]!;
    let deg = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    while (last !== null && deg - last > 180) deg -= 360;
    while (last !== null && deg - last < -180) deg += 360;
    last = deg;
    return `${deg}deg`;
  });
  return {
    input: lengths.map((length) => length / total),
    x: points.map((point) => point[0]),
    y: points.map((point) => point[1]),
    angles,
  };
}

/**
 * React Native turns a view about its middle; the design turns its bands about their top-left corner.
 * Adding this to the band's translation makes the two the same.
 */
export function cornerPivot(width: number, height: number, degrees: number): Point {
  const [cx, cy] = [width / 2, height / 2];
  const rad = (degrees * Math.PI) / 180;
  return [
    cx * Math.cos(rad) - cy * Math.sin(rad) - cx,
    cx * Math.sin(rad) + cy * Math.cos(rad) - cy,
  ];
}

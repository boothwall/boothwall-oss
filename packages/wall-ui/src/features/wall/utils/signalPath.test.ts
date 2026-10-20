import { cornerPivot, pathFrames, wavePath } from "./signalPath";

describe("signal paths", () => {
  it("rides a wave between its ends and keeps its heading continuous", () => {
    const points = wavePath([800, 200], [100, 150], 34, 1.5, 28);
    expect(points).toHaveLength(29);
    expect(points[0]).toEqual([800, 200]);
    expect(points[28]![0]).toBeCloseTo(100);
    expect(points[28]![1]).toBeCloseTo(150);
    const { input, angles } = pathFrames(points);
    expect(input[0]).toBe(0);
    expect(input[28]).toBe(1);
    expect(input.every((share, i) => i === 0 || share > input[i - 1]!)).toBe(true);
    // Heading left, it never jumps a full turn between neighbours.
    const degrees = angles.map((angle) => parseFloat(angle));
    expect(degrees.every((deg, i) => i === 0 || Math.abs(deg - degrees[i - 1]!) < 90)).toBe(true);
    // Turning about the middle plus this shift lands the top-left corner where it was.
    expect(cornerPivot(100, 50, 0)).toEqual([0, 0]);
    const [dx, dy] = cornerPivot(200, 100, 90);
    expect(dx).toBeCloseTo(-150);
    expect(dy).toBeCloseTo(50);
  });
});

import { layout } from "#theme/tokens";

import {
  HEADER,
  PANEL,
  SAFE_AREA,
  SLOT_COUNT,
  SLOTS,
  STAGE,
  type StageBox,
} from "../constants/layout";
import { cardEnvelope, LIFTED_REACH, shiftInside } from "./cardEnvelope";
import { drawnBox, fitSlots, SLOT_POSITIONS } from "./collageLayout";

const EPSILON = 0.001;
const expectInside = (box: StageBox, bounds: StageBox) => {
  expect(box.left).toBeGreaterThanOrEqual(bounds.left - EPSILON);
  expect(box.top).toBeGreaterThanOrEqual(bounds.top - EPSILON);
  expect(box.right).toBeLessThanOrEqual(bounds.right + EPSILON);
  expect(box.bottom).toBeLessThanOrEqual(bounds.bottom + EPSILON);
};

describe("SLOT_POSITIONS", () => {
  it("keeps the stage inside the safe area, one gap below the header and beside the panel", () => {
    expectInside(STAGE, SAFE_AREA);
    expect(STAGE.top - (HEADER.top + HEADER.height)).toBe(layout.headerGap);
    expect(PANEL.left - STAGE.right).toBe(layout.columnGap);
    expect(PANEL.top).toBe(STAGE.top);
  });

  it("is the hand-placed wall: 12 cards in rows of 4, upper rows drawn above", () => {
    expect(SLOT_COUNT).toBe(12);
    expect(SLOT_POSITIONS).toHaveLength(SLOT_COUNT);
    expect(SLOT_POSITIONS.map((slot) => slot.layer)).toEqual([2, 2, 2, 2, 1, 1, 1, 1, 0, 0, 0, 0]);
    expect(SLOT_POSITIONS.map((slot) => slot.rotate)).toEqual(SLOTS.map((slot) => slot.rotate));
  });

  it("keeps the composition's proportions, only scaled to the stage", () => {
    const scale = SLOT_POSITIONS[0]!.width / SLOTS[0]!.width;
    expect(scale).toBeGreaterThan(0.8);
    expect(scale).toBeLessThanOrEqual(1);
    SLOT_POSITIONS.forEach((slot, i) => {
      expect(slot.width).toBeCloseTo(SLOTS[i]!.width * scale, 6);
      expect(slot.x - SLOT_POSITIONS[0]!.x).toBeCloseTo((SLOTS[i]!.x - SLOTS[0]!.x) * scale, 6);
      expect(slot.y - SLOT_POSITIONS[0]!.y).toBeCloseTo((SLOTS[i]!.y - SLOTS[0]!.y) * scale, 6);
    });
  });

  it("keeps every resting card, tilt, shadow and float included, on the stage", () => {
    const drawn = drawnBox(SLOT_POSITIONS);
    expectInside(drawn, STAGE);
    // It fills the stage on its tighter axis.
    const slackX = STAGE.right - STAGE.left - (drawn.right - drawn.left);
    const slackY = STAGE.bottom - STAGE.top - (drawn.bottom - drawn.top);
    expect(Math.min(slackX, slackY)).toBeLessThan(0.5);
  });

  it("keeps a lifted card on the stage once nudged in", () => {
    for (const slot of SLOT_POSITIONS) {
      const lifted = cardEnvelope(slot, LIFTED_REACH);
      const shift = shiftInside(lifted, STAGE);
      expectInside(
        {
          left: lifted.left + shift.x,
          top: lifted.top + shift.y,
          right: lifted.right + shift.x,
          bottom: lifted.bottom + shift.y,
        },
        STAGE,
      );
    }
  });

  it("never enlarges a composition that already fits", () => {
    const small = [{ x: 0, y: 0, rotate: 0, width: 50 }];
    expect(fitSlots(small)[0]!.width).toBe(50);
  });
});

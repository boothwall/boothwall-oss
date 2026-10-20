import { describe, expect, it } from "vitest";

import { boothwallConfig } from "../boothwall.config.ts";
import { boothwallConfigSchema } from "./boothwall-config.schemas.ts";

describe("boothwall config", () => {
  it("accepts the shipped config", () => {
    expect(boothwallConfigSchema.safeParse(boothwallConfig).success).toBe(true);
  });

  it("makes the badge optional but keeps it short", () => {
    const noBadge = { ...boothwallConfig, badge: undefined };
    expect(boothwallConfigSchema.safeParse(noBadge).success).toBe(true);
    const longBadge = { ...boothwallConfig, badge: "x".repeat(33) };
    expect(boothwallConfigSchema.safeParse(longBadge).success).toBe(false);
  });

  it("takes an optional one-line notice, trimmed and short", () => {
    expect(boothwallConfigSchema.parse({ ...boothwallConfig, notice: "  Be kind.  " }).notice).toBe(
      "Be kind.",
    );
    expect(boothwallConfigSchema.safeParse({ ...boothwallConfig, notice: "   " }).success).toBe(
      false,
    );
    const long = { ...boothwallConfig, notice: "x".repeat(161) };
    expect(boothwallConfigSchema.safeParse(long).success).toBe(false);
  });

  it("takes an optional event wordmark from the web app's public folder", () => {
    const parse = (wordmark: unknown) =>
      boothwallConfigSchema.safeParse({
        ...boothwallConfig,
        event: { ...boothwallConfig.event, wordmark },
      }).success;
    expect(parse(undefined)).toBe(true);
    expect(parse("event-wordmark.png")).toBe(true);
    expect(parse("brand/event.svg")).toBe(true);
    expect(parse("https://example.com/logo.png")).toBe(false);
    expect(parse("../secret.png")).toBe(false);
    expect(parse("/event.png")).toBe(false);
  });

  it("rejects duplicate category ids, two catch-alls and a bad hashtag", () => {
    const broken = {
      ...boothwallConfig,
      event: { ...boothwallConfig.event, hashtag: "no hash" },
      categories: [
        { id: "a", label: "A", catchAll: true },
        { id: "a", label: "A again", catchAll: true },
      ],
    };
    const result = boothwallConfigSchema.safeParse(broken);
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((issue) => issue.message) ?? [];
    expect(messages).toEqual(
      expect.arrayContaining([
        "hashtag must look like #yourevent",
        "category ids must be unique",
        "only one catch-all category",
      ]),
    );
  });

  it("fixes the TV wall at build time and keeps the display credential optional", () => {
    const parse = (tv: unknown) =>
      boothwallConfigSchema.safeParse({ ...boothwallConfig, tv }).success;
    expect(parse({ wallId: "front-hall" })).toBe(true);
    expect(parse({ wallId: "default", displayCredential: "a".repeat(32) })).toBe(true);
    expect(parse({ wallId: "Not A Wall" })).toBe(false);
    expect(parse({ displayCredential: "short" })).toBe(false);
    expect(parse({ wallCode: "ABC123" })).toBe(false);
  });

  it("ships the open-source look, allows the classic one and checks the source card's fields", () => {
    const parse = (wall: unknown) =>
      boothwallConfigSchema.safeParse({ ...boothwallConfig, wall }).success;
    expect(boothwallConfig.wall).toMatchObject({ header: "split" });
    expect(boothwallConfig.wall).not.toHaveProperty("announcement");
    expect(boothwallConfig.wall).not.toHaveProperty("motion");
    expect(parse({})).toBe(true);
    expect(parse(undefined)).toBe(true);
    expect(
      parse({
        header: "split",
        announcement: "filled",
        motion: "signal",
        source: { repo: "boothwall/boothwall-oss", host: "github.com", license: "MIT" },
      }),
    ).toBe(true);
    expect(parse({ header: "stacked" })).toBe(false);
    expect(parse({ motion: "stage" })).toBe(false);
    expect(parse({ source: { repo: "https://github.com/boothwall/boothwall-oss" } })).toBe(false);
    expect(parse({ source: { repo: "boothwall/boothwall-oss", host: "https://github.com" } })).toBe(
      false,
    );
    expect(parse({ source: { repo: "boothwall/boothwall-oss", url: "https://x.test" } })).toBe(
      false,
    );
  });
});

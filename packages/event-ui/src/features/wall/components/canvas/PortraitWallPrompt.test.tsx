// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { LOCALES } from "#i18n/constants";
import { EventProvider } from "#runtime";
import { createRuntimeFixture } from "#testing/runtime";

import { PortraitWallPrompt } from "./PortraitWallPrompt";

afterEach(() => {
  window.history.replaceState(null, "", "/");
  localStorage.clear();
});

const CASES = [
  ["en", "Turn your phone sideways", "Add your photo"],
  ["de", "Drehe dein Smartphone", "Dein Foto hinzufügen"],
  ["es", "Gira el teléfono", "Añade tu foto"],
  ["hr", "Okreni mobitel", "Dodaj svoju fotografiju"],
] as const;
const offered = (locale: string) => (LOCALES as readonly string[]).includes(locale);

it.each(CASES.filter(([locale]) => offered(locale)))(
  "uses %s guidance and keeps the invitation and language on capture",
  (locale, title, label) => {
    window.history.replaceState(null, "", "/?lang=" + locale);
    const runtime = createRuntimeFixture();
    runtime.links.snap = "/snap?invite=fixture";
    render(
      <EventProvider runtime={runtime}>
        <PortraitWallPrompt kiosk={false} />
      </EventProvider>,
    );
    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    const destination = new URL(screen.getByRole("link", { name: label }).getAttribute("href")!);
    expect(destination.pathname).toBe("/snap");
    expect(destination.searchParams.get("invite")).toBe("fixture");
    expect(destination.searchParams.get("lang")).toBe(locale);
  },
);

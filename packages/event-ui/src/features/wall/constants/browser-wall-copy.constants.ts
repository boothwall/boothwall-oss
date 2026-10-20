import type { Language } from "@boothwall/i18n";

/**
 * Browser guidance uses the visitor's language, independently of the displayed event. Copy for
 * every language BoothWall speaks; a surface shows only the locales it offers.
 */
export const BROWSER_WALL_COPY = {
  en: {
    rotateTitle: "Turn your phone sideways",
    rotateBody: "The wall will appear automatically in landscape.",
    addPhoto: "Add your photo",
  },
  de: {
    rotateTitle: "Drehe dein Smartphone",
    rotateBody: "Die Live-Wall erscheint automatisch im Querformat.",
    addPhoto: "Dein Foto hinzufügen",
  },
  es: {
    rotateTitle: "Gira el teléfono",
    rotateBody: "El muro en directo aparecerá automáticamente al ponerlo en horizontal.",
    addPhoto: "Añade tu foto",
  },
  hr: {
    rotateTitle: "Okreni mobitel",
    rotateBody: "Zid uživo prikazat će se automatski u vodoravnom položaju.",
    addPhoto: "Dodaj svoju fotografiju",
  },
} as const satisfies Record<
  Language,
  { rotateTitle: string; rotateBody: string; addPhoto: string }
>;

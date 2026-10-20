import { type Category, categoryName, type PhotoDTO } from "@boothwall/shared";

import { deskCopy } from "../constants";

/** The caption to show and to name a photo by; a photo sent without one still gets a name. */
export function photoCaption(photo: Pick<PhotoDTO, "caption">): string {
  return photo.caption || deskCopy.review.submitted;
}

/** "just now", "2 min ago", "3 h ago", "2 d ago"; a clock running ahead reads as "just now". */
export function photoAge(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.floor(hours / 24)} d ago`;
}

/** The guest's category as the wall names it, e.g. "On the team". */
export function photoCategory(photo: Pick<PhotoDTO, "tribe">, categories: readonly Category[]) {
  return categoryName(categories, photo.tribe);
}

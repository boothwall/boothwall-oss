import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DEMO_PHOTOS_DIR, DEMO_PHOTOS_LIST } from "../paths.mjs";

/** Enough for a full first page of polaroids on the wall. */
const SEED_COUNT = 12;

/**
 * The bundled demo photos with their captions and categories, read from the wall's own list
 * (demoPhotos.ts) so the two never drift apart.
 */
function demoPhotos() {
  const list = readFileSync(DEMO_PHOTOS_LIST, "utf8");
  const entries = [...list.matchAll(/source: demo(\d+), caption: "([^"]*)", category: "([^"]*)"/g)];
  if (entries.length === 0) {
    throw new Error(`Found no demo photos in ${DEMO_PHOTOS_LIST}; did its format change?`);
  }
  return entries.map(([, number, caption, category]) => ({
    file: join(DEMO_PHOTOS_DIR, `demo-${number}.jpg`),
    caption,
    category,
  }));
}

const json = async (res, what) => {
  if (!res.ok) throw new Error(`${what} failed with ${res.status}: ${await res.text()}`);
  return res.json();
};

/** Keeps a demo photo's category if the wall has it, else spreads photos over the named ones. */
export function seedCategory(category, index, categories) {
  if (categories.some((entry) => entry.id === category)) return category;
  const named = categories.filter((entry) => !entry.catchAll);
  const pool = named.length > 0 ? named : categories;
  return pool[index % pool.length].id;
}

/** Keep the local servers available when a previous seed needs recovery in Control. */
export const seedStatusMessage = ({ seeded, notice }) =>
  notice ?? (seeded ? `${seeded} demo photos on the wall` : "The wall already has photos");

/** Seed only an empty local wall, then explicitly approve the bundled sample photos. */
export async function seedLocalWall(apiUrl, passcode) {
  const auth = { authorization: `Bearer ${passcode}` };
  const occupancy = await json(
    await fetch(`${apiUrl}/photos/stats`, { headers: auth }),
    "Checking all existing photos before seeding",
  );
  const counts = [occupancy?.onWall, occupancy?.pending, occupancy?.hidden];
  if (!counts.every((count) => Number.isSafeInteger(count) && count >= 0))
    throw new Error("Could not verify existing photos. No samples were added.");
  if (occupancy.pending > 0 || occupancy.hidden > 0)
    return {
      seeded: 0,
      notice:
        "This wall has pending or hidden photos. No samples were added or approved; review them in Control.",
    };
  if (occupancy.onWall > 0) return { seeded: 0 };

  const wall = await json(await fetch(`${apiUrl}/photos?limit=1`), "Reading the wall");
  if (wall.stats.total > 0) return { seeded: 0 };

  const { settings } = wall;
  if (settings.smartModeration?.enabled) {
    throw new Error(
      "Legacy review is enabled. Follow docs/config-migration.md and explicitly disable legacy review in the reviewed configuration before seeding; no settings or photos were changed.",
    );
  }

  const photos = demoPhotos().slice(0, SEED_COUNT);
  const uploads = [];
  for (const [index, photo] of photos.entries()) {
    const image = new Blob([readFileSync(photo.file)], { type: "image/jpeg" });
    const form = new FormData();
    form.set("image", image, "photo.jpg");
    form.set("thumb", image, "thumb.jpg");
    form.set("caption", photo.caption);
    form.set("tribe", seedCategory(photo.category, index, settings.categories));
    form.set("consent", "true");
    const { photo: uploaded } = await json(
      await fetch(`${apiUrl}/photos`, { method: "POST", body: form }),
      "Uploading a demo photo",
    );
    uploads.push(uploaded.id);
  }
  // Approval uses the same authenticated route as the basic Control page.
  for (const id of uploads) {
    await json(
      await fetch(`${apiUrl}/photos/${id}/approve`, { method: "POST", headers: auth }),
      "Approving a demo photo",
    );
  }

  return { seeded: photos.length };
}

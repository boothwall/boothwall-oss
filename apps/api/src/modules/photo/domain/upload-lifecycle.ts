export type { UploadLifecycle } from "@/contracts/runtime";

export async function uploadPayloadHash(
  image: ArrayBuffer,
  thumb: ArrayBuffer | undefined,
  caption: string | null,
  tribe: string,
): Promise<string> {
  const digest = async (bytes: ArrayBuffer) =>
    [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("");
  return digest(
    new TextEncoder().encode(
      JSON.stringify([await digest(image), thumb ? await digest(thumb) : null, caption, tribe]),
    ).buffer as ArrayBuffer,
  );
}

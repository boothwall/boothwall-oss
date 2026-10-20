import { checkIcc, joinBytes, requireImage } from "./binary";

/** Bounded decompression only for the retained PNG color-profile exception. */
export async function checkCompressedIcc(data: Uint8Array) {
  requireImage(data.length <= 1024 * 1024);
  const stream = new Blob([data as Uint8Array<ArrayBuffer>])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"));
  const reader = stream.getReader(),
    parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.length;
      requireImage(size <= 1024 * 1024);
      parts.push(result.value);
    }
    checkIcc(joinBytes(parts));
  } catch {
    await reader.cancel().catch(() => {});
    requireImage(false);
  } finally {
    reader.releaseLock();
  }
}

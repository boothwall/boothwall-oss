import { be32, requireImage } from "./binary";

/** APNG frame/sequence structure; compressed pixels are retained, not decoded. */
export class PngAnimation {
  private sequence = 0;
  private expected = 0;
  private frames = 0;
  private data = 0;
  private frameUsesIdat = false;
  constructor(
    private width: number,
    private height: number,
  ) {}
  control(b: Uint8Array, imageStarted: boolean) {
    requireImage(
      !imageStarted && !this.expected && b.length === 8 && be32(b, 0) > 0 && be32(b, 0) <= 4096,
    );
    this.expected = be32(b, 0);
  }
  frame(b: Uint8Array, imageStarted: boolean) {
    requireImage(this.expected && b.length === 26 && be32(b, 0) === this.sequence++);
    if (this.frames) requireImage(this.data > 0);
    const width = be32(b, 4),
      height = be32(b, 8),
      x = be32(b, 12),
      y = be32(b, 16);
    requireImage(
      width > 0 &&
        height > 0 &&
        x + width <= this.width &&
        y + height <= this.height &&
        b[24]! <= 2 &&
        b[25]! <= 1,
    );
    this.frameUsesIdat = !imageStarted;
    if (this.frameUsesIdat)
      requireImage(
        this.frames === 0 && x === 0 && y === 0 && width === this.width && height === this.height,
      );
    this.frames++;
    this.data = 0;
  }
  imageData(size: number) {
    if (this.frameUsesIdat) this.data += size;
  }
  frameData(b: Uint8Array, imageStarted: boolean) {
    requireImage(
      this.expected &&
        this.frames &&
        !this.frameUsesIdat &&
        imageStarted &&
        b.length >= 4 &&
        be32(b, 0) === this.sequence++,
    );
    this.data += b.length - 4;
  }
  finish() {
    requireImage(this.expected ? this.frames === this.expected && this.data > 0 : !this.frames);
  }
}

import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

export function safePath(value) {
  if (
    typeof value !== "string" ||
    !value ||
    isAbsolute(value) ||
    /[\\:]/.test(value) ||
    [...value].some((char) => char.codePointAt(0) < 32 || char.codePointAt(0) === 127) ||
    value.split("/").some((part) => !part || part === "." || part === ".." || /[. ]$/.test(part))
  )
    throw new Error("Unsafe packet path");
  return value;
}
export function contained(path, root) {
  const suffix = relative(resolve(root), resolve(path));
  if (
    suffix === ".." ||
    suffix.startsWith(`..${sep}`) ||
    isAbsolute(suffix) ||
    lstatSync(root).isSymbolicLink()
  )
    throw new Error("Packet path escape");
  let current = realpathSync(root);
  for (const part of suffix ? suffix.split(sep) : []) {
    current = join(current, part);
    if (lstatSync(current).isSymbolicLink() || realpathSync(current) !== current)
      throw new Error("Symbolic packet component");
  }
  return current;
}
export function readFile(path, root) {
  contained(path, root);
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = fstatSync(fd, { bigint: true });
    if (!before.isFile() || before.nlink !== 1n || before.size > 128n * 1024n * 1024n)
      throw new Error("Bounded regular file required");
    const bytes = readFileSync(fd),
      after = fstatSync(fd, { bigint: true }),
      current = lstatSync(path, { bigint: true });
    contained(path, root);
    if (
      before.ino !== current.ino ||
      before.dev !== current.dev ||
      before.mtimeNs !== after.mtimeNs ||
      before.ctimeNs !== after.ctimeNs ||
      before.mtimeNs !== current.mtimeNs ||
      before.ctimeNs !== current.ctimeNs ||
      before.size !== current.size ||
      BigInt(bytes.length) !== before.size
    )
      throw new Error("File changed while reading");
    return { bytes, mode: before.mode & 0o111n ? "100755" : "100644" };
  } finally {
    closeSync(fd);
  }
}

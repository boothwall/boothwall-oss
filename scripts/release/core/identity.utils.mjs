import { createHash } from "node:crypto";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function canonical(value) {
  if (value === null || ["string", "boolean"].includes(typeof value)) return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && Object.getPrototypeOf(value) === Object.prototype)
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(",")}}`;
  throw new Error("Canonical JSON value required");
}
export const digest = (value) => sha256(canonical(value));
export function closed(value, required, optional = []) {
  if (
    !value ||
    Object.getPrototypeOf(value) !== Object.prototype ||
    required.some((key) => !Object.hasOwn(value, key)) ||
    Object.keys(value).some((key) => ![...required, ...optional].includes(key))
  )
    throw new Error("Unexpected receipt/request fields");
}
export function fullHash(value, length = 64) {
  if (typeof value !== "string" || !new RegExp(`^[a-f0-9]{${length}}$`).test(value))
    throw new Error("Full immutable identity required");
  return value;
}
export function version(value) {
  if (
    typeof value !== "string" ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(
      value,
    ) ||
    value
      .split("+")[0]
      .split("-")
      .slice(1)
      .join("-")
      .split(".")
      .some((part) => /^0\d+$/.test(part))
  )
    throw new Error("Exact SemVer required");
}

export function freeze(value) {
  if (value && typeof value === "object") Object.values(value).forEach(freeze);
  return Object.freeze(value);
}

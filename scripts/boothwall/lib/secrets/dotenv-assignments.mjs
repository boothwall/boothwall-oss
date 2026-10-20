// Match dotenv's assignment/quoting grammar, including colon assignments and multiline quotes.
// Parse every variable so a look-alike line inside another quoted value is not a key.
const ASSIGNMENT =
  /^\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?$/gm;

/** Line endings as dotenv reads them; offsets below refer to this text. */
export const normalizeLines = (source) => source.replace(/\r\n?/g, "\n");

/**
 * Every assignment of `name`, with its value as the provider reads it and the bounds of the line
 * that holds its key (`start` to `end`, without the line break).
 */
export function assignments(source, name) {
  const text = normalizeLines(source);
  const found = [];
  for (const match of text.matchAll(ASSIGNMENT)) {
    if (match[1] !== name) continue;
    let value = (match[2] ?? "").trim();
    const quote = value[0];
    value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");
    if (quote === '"') value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    const key = match.index + match[0].indexOf(name);
    const end = text.indexOf("\n", key);
    found.push({ value, start: text.lastIndexOf("\n", key) + 1, end: end < 0 ? text.length : end });
  }
  return found;
}

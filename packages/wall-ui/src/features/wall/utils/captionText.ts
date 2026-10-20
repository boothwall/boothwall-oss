/** An emoji, a symbol or a number like "#3", with no letters: it never starts a line alone. */
const rides = (word: string) => !/\p{L}/u.test(word);

/**
 * A caption set on two balanced lines, broken only between words, with an emoji or a number kept
 * on the line of the word before it (no lone "☕" on line two). One word stays as it is.
 */
export function twoLineCaption(caption: string): string {
  const words = caption.trim().split(/\s+/);
  // Glue each riding word onto the one before it, so no split falls between them.
  const units = words.reduce<string[]>((all, word) => {
    if (all.length > 0 && rides(word)) all[all.length - 1] += ` ${word}`;
    else all.push(word);
    return all;
  }, []);
  if (units.length < 2) return caption;
  let best = { at: 1, longest: Infinity };
  for (let at = 1; at < units.length; at++) {
    const longest = Math.max(
      [...units.slice(0, at).join(" ")].length,
      [...units.slice(at).join(" ")].length,
    );
    if (longest < best.longest) best = { at, longest };
  }
  return `${units.slice(0, best.at).join(" ")}\n${units.slice(best.at).join(" ")}`;
}

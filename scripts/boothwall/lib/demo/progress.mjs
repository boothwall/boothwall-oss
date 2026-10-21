import { stdout } from "node:process";

import { ok, step, terminalOutput } from "../ui.mjs";
import { painter } from "./style.mjs";

const FRAMES = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏";
const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;

/**
 * One startup stage with its measured time: a spinner line that settles into a tick on capable
 * terminals, the usual step and tick lines everywhere else. `done` names the result.
 */
export async function stage(
  label,
  run,
  done = () => label,
  { output = terminalOutput(), write = (text) => stdout.write(text), now = Date.now } = {},
) {
  if (!output.rich) {
    step(label);
    const result = await run();
    ok(done(result));
    return result;
  }
  const s = painter(output);
  const started = now();
  let frame = 0;
  const draw = () =>
    write(
      `\r\x1b[2K  ${s.accent(FRAMES[frame++ % FRAMES.length])} ${label} ${s.dim(seconds(now() - started))}`,
    );
  draw();
  const timer = setInterval(draw, 80);
  try {
    const result = await run();
    clearInterval(timer);
    write(`\r\x1b[2K  ${s.good("✓")} ${done(result)}  ${s.dim(seconds(now() - started))}\n`);
    return result;
  } catch (error) {
    clearInterval(timer);
    write(`\r\x1b[2K  ${s.accent("✗")} ${label}\n`);
    throw error;
  }
}

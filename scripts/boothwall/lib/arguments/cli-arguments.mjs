import { UserError } from "../ui.mjs";

const allowed = {
  setup: ["yes"],
  deploy: ["yes"],
  migrate: ["yes", "local"],
  demo: ["lan", "tv"],
  example: ["yes"],
  "settings-preview": ["output"],
  "settings-apply": [
    "preview",
    "source-config",
    "retain-ended",
    "disable-legacy-review",
    "local",
    "yes",
  ],
};

export function parseCliArguments(command, args) {
  const parsed = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (!arg.startsWith("-")) {
      if (
        !["example", "settings-preview", "settings-apply"].includes(command) ||
        parsed.arg !== undefined
      )
        throw new UserError("Unexpected positional argument. Run `pnpm boothwall help` for usage.");
      parsed.arg = arg;
      continue;
    }
    const key = arg.slice(2);
    if (!arg.startsWith("--") || !allowed[command]?.includes(key) || Object.hasOwn(parsed, key))
      throw new UserError(
        `Unknown or repeated option ${arg}. Run \`pnpm boothwall help\` for usage.`,
      );
    if (!["output", "preview", "source-config"].includes(key)) parsed[key] = true;
    else {
      const value = args[++index];
      if (!value || value.startsWith("-")) throw new UserError(`--${key} requires a file path.`);
      parsed[key] = value;
    }
  }
  return parsed;
}

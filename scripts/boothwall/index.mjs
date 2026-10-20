#!/usr/bin/env node
// BoothWall CLI: `pnpm boothwall <command>`. Set up and deploy your own wall on Cloudflare.
import { demo } from "./commands/demo.mjs";
import { deployAll } from "./commands/deploy.mjs";
import { applyExample } from "./commands/example.mjs";
import { migrate } from "./commands/migrate.mjs";
import { applySettings } from "./commands/settings-apply.mjs";
import { setup } from "./commands/setup.mjs";
import { parseCliArguments } from "./lib/arguments/index.mjs";
import { exportSettingsMigration } from "./lib/configuration/index.mjs";
import { bold, dim, log, UserError } from "./lib/ui.mjs";

const HELP = `${bold("BoothWall")}: an open-source Amazon Vega OS sample, a live photo wall for event booths.

${bold("Usage")}  pnpm boothwall <command>

  setup            Create the Cloudflare resources, deploy the API and web app,
                   and write the ids and URLs into boothwall.config.ts. Safe to resume.
  deploy           Apply migrations and redeploy the API and web app.
  settings-preview <file> --output <new-file>
                   Export a reviewed legacy-settings migration preview (offline).
  settings-apply <raw-file> --preview <file>
                   Verify the edited config and explicitly migrate the matching saved row.
                   --local targets local state only; --retain-ended and
                   --disable-legacy-review record those explicit legacy decisions.
  migrate          Apply database migrations (${dim("--local")} for local dev).
  demo             Run the API and the web app locally with demo photos
                   (the same as ${dim("pnpm demo")}). ${dim("--lan")} serves them on this
                   machine's network address, for phones, a Fire TV or the Virtual Device.
                   ${dim("--tv")} (${dim("pnpm try")}) also points the config at them and opens the
                   TV app on a running Vega Virtual Device.
  example [name]   List examples, or apply one's config and brand files.

Edit packages/shared/src/config/boothwall.config.ts to make the wall yours.
Setup/deploy/migrate confirm the account and resources. Use --yes only after review.
Select an account explicitly with CLOUDFLARE_ACCOUNT_ID when login lists several.
Docs: docs/customising.md`;

const [command, ...rest] = process.argv.slice(2);
let options;

const commands = {
  setup: () => setup({ yes: options.yes }),
  deploy: () => deployAll({ yes: options.yes }),
  migrate: () => migrate({ local: options.local, yes: options.yes }),
  "settings-preview": async () => {
    const report = await exportSettingsMigration({ input: options.arg, output: options.output });
    log(
      `Preview written. ${report.preview.ready ? "Ready for operator review." : "Resolve the named issues before applying anything."}`,
    );
    if (!report.preview.ready) process.exitCode = 2;
  },
  "settings-apply": () =>
    applySettings({
      input: options.arg,
      preview: options.preview,
      sourceConfig: options["source-config"],
      retainEnded: options["retain-ended"],
      disableLegacyReview: options["disable-legacy-review"],
      local: options.local,
      yes: options.yes,
    }),
  demo: () => demo({ lan: options.lan, tv: options.tv }),
  example: () => applyExample(options.arg, { yes: options.yes }),
};

try {
  options = parseCliArguments(command, rest);
  const run = commands[command];
  if (!run) {
    log(HELP);
    process.exitCode = command && !["help", "--help", "-h"].includes(command) ? 1 : 0;
  } else {
    await run();
  }
} catch (error) {
  if (!(error instanceof UserError)) throw error;
  console.error(`\n${error.message}`);
  process.exitCode = 1;
}

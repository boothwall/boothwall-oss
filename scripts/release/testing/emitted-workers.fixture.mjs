import { outputPath, workerProfiles } from "../artifacts/index.mjs";

export function emitWorkers(fixture) {
  for (const app of ["api", "web"])
    fixture.write(`${outputPath(app)}/worker.config.json`, JSON.stringify(workerProfiles[app]));
  fixture.write(`${outputPath("api")}/bundle/index.js`, "export const fixture = true;");
  fixture.write(
    `${outputPath("web")}/assets/index.html`,
    "<!doctype html><h1>Emitted fixture</h1>",
  );
}

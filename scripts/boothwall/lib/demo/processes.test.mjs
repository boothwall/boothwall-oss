import assert from "node:assert/strict";
import { createServer } from "node:net";
import { test } from "node:test";

import { freePort, isPortFree } from "./processes.mjs";

const listen = (host) =>
  new Promise((resolve) => {
    const server = createServer().listen(0, host, () => resolve(server));
  });
const close = (server) => new Promise((resolve) => server.close(resolve));

test("a port held on any local address is not free", async () => {
  for (const host of ["0.0.0.0", "127.0.0.1"]) {
    const server = await listen(host);
    const { port } = server.address();
    assert.equal(await isPortFree(port), false, `held on ${host}`);
    assert.notEqual(await freePort(port), port);
    await close(server);
  }
});

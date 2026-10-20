import { networkInterfaces } from "node:os";

// Virtual adapters (Docker, VMs, VPNs) have addresses other devices on the network can't reach.
const VIRTUAL = /^(bridge|docker|br-|veth|vboxnet|vmnet|utun|tun|tap|llw|awdl|anpi)/;

/** This machine's IPv4 address on the local network, preferring physical adapters; null if offline. */
export function lanAddress(interfaces = networkInterfaces()) {
  const candidates = Object.entries(interfaces).flatMap(([name, entries]) =>
    (entries ?? [])
      .filter(
        (entry) =>
          entry.family === "IPv4" && !entry.internal && !entry.address.startsWith("169.254."),
      )
      .map((entry) => ({ address: entry.address, virtual: VIRTUAL.test(name) })),
  );
  return (candidates.find((entry) => !entry.virtual) ?? candidates[0])?.address ?? null;
}

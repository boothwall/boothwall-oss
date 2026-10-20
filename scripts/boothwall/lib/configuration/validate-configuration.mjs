import { UserError } from "../ui.mjs";
import { sharedConfig } from "./shared-config.mjs";

export function validateConfiguration(input) {
  try {
    const config = sharedConfig.boothwallConfigSchema.parse(input);
    // Also checks the effective renderer settings (including category bounds).
    const preview = sharedConfig.previewSettingsMigration(config, null);
    if (!preview.ready)
      throw new UserError(
        `Unsupported configured policy: ${preview.issues.map(({ field }) => field).join(", ")}. Review the settings migration guidance before setup.`,
      );
    for (const [name, value] of Object.entries(config.urls)) {
      const url = new URL(value);
      if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        (name !== "source" && url.pathname !== "/")
      )
        throw Error(
          "URLs must not include credentials, queries, fragments or application subpaths.",
        );
    }
    const domains = [
      config.deploy.apiDomain,
      config.deploy.webDomain,
      ...(config.deploy.extraApiDomains ?? []),
    ].filter(Boolean);
    if (
      domains.some((domain) => !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(domain))
    )
      throw Error("Use hostnames without a scheme, path or wildcard in deploy domains.");
    if (new Set(domains.map((domain) => domain.toLowerCase())).size !== domains.length)
      throw Error("API and web domains must be distinct.");
    return config;
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError(
      "Invalid configuration. Check boothwall.config.ts against the shared schema, category bounds and deployment URLs. No resources changed.",
    );
  }
}

export function deploymentUrls(webUrl) {
  const url = new URL(webUrl);
  if (
    !/^https?:$/.test(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new UserError("Expected an HTTP(S) web origin without a path or credentials.");
  return {
    display: `${url.origin}/`,
    snap: `${url.origin}/snap`,
    control: `${url.origin}/control`,
  };
}

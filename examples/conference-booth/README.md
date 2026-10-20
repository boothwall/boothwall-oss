# Example: a conference booth

A fully branded wall for a made-up developer conference, Acme DevDays. It shows everything you'd change for your own event: the config (name, hashtag, venue, photo missions as the categories, the conference theme, colours, the badge next to the logo and a starting announcement), the logo, the backdrop and the app icons.

The folder mirrors the repo layout. Apply it from the repo root with:

```sh
pnpm boothwall example conference-booth
```

It starts in demo mode, so `pnpm web:dev` shows the branded wall on the bundled photos straight away. Run `pnpm boothwall setup` to deploy it for real. To go back to the default BoothWall look, restore the files with `git checkout -- apps packages`.

The backdrop replaces the universal theme's night sky: `backdrop.jpg` (1920×1080) on the TV and `backdrop-web.jpg` (2880×1620) in the browser. This example picks the conference theme, which brings its own stage, so you see the backdrop once you set `settings.theme` to `"universal"` or open the browser wall with `?theme=universal`.

## Brand sources

The images are rendered from the SVGs in [`brand/`](brand), the same way as the default artwork (see [`brand/README.md`](../../brand/README.md)). `pnpm boothwall example` copies only `apps/` and `packages/`, so the sources stay here. Everything in this folder is MIT, like the rest of the repo.

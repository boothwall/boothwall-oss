## What and why

<!-- What this changes and why. Link the issue if there is one. -->

## Checks

- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm format:check` passes
- [ ] If it touches the TV app or `packages/wall-ui`: `pnpm tv:build:debug` builds, and the wall still runs at `/` in `pnpm web:dev`
- [ ] Docs updated where behaviour or setup changed
- [ ] Screenshots for visible changes (TV at 960×540 or a 1080p capture, phone at 390 px wide)

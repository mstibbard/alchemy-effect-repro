# Alchemy Effect Repro

Rolling reproduction monorepo for Alchemy / Cloudflare / Effect issues.

## What exists

- `apps/api`: Cloudflare Worker with in-memory task RPCs.
  - HTTP API still exists for basic task create/get.
  - Effect RPC group: `createTask`, `getTask`.
  - Exposes one Cloudflare native service-binding method: `effectRpc(...)`.
- `apps/web`: TanStack Start app bound to `api` via Cloudflare service binding.
  - Uses a custom Effect RPC transport over the native `effectRpc` method.
  - Index route runs a proof call from the browser/server-function path.

## Expected index page behavior

Visiting `web` should show JSON with:

- `created`: task created in `api`
- `found`: same task loaded from `api`
- `recoveredMissingTask`: typed `TaskNotFound` recovered with `Effect.catchTag`

There is no persistence; task state is in-memory per Worker instance.

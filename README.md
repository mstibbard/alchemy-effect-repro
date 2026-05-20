# Alchemy Effect Repro

Rolling reproduction monorepo for Alchemy / Cloudflare / Effect issues.

## What exists

- `apps/api`: Cloudflare Worker backed by Cloudflare KV task storage.
  - HTTP API exposes basic task create/get/list endpoints.
  - Effect RPC group: `createTask`, `getTask` exposed at `/rpc` with Effect's HTTP RPC transport.
- `apps/web`: Vite React app configured with the deployed API URL.
  - Uses Effect's built-in HTTP RPC client transport through `fetch`.
  - The app entrypoint runs a proof RPC call from the browser.

## Expected index page behavior

Visiting `web` should show JSON with:

- `created`: task created in `api`
- `found`: same task loaded from `api`

Tasks are persisted in the API worker's Cloudflare KV namespace.

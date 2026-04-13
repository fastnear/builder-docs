# Legacy Redocly Backend Notes

This document is historical context for the legacy Redocly backend in `mike-docs`.

## Current Reality

The public docs no longer use Redocly as their primary runtime.

- Public API and RPC pages render directly in `builder-docs`
- Canonical `/rpcs/...` and `/apis/...` routes are hosted by `builder-docs`
- `mike-docs` keeps Redocly only for verification, parity checks, and migration cleanup

## Where Redocly Still Matters

Use the Redocly path only when you need to validate:

- `@theme/ext/configure.ts` behavior
- request-shaping inputs such as `preset`, `body`, `path.*`, `query.*`, and `header.*`
- local parity between the direct runtime and the legacy portal

Local commands:

```bash
cd /Users/mikepurvis/near/mike-docs
npm run preview:headless
npm run preview:portal
```

## Current Auth Notes

The shared browser auth contract is:

1. `?apiKey=`
2. `localStorage.fastnear:apiKey`
3. legacy `localStorage.fastnear_api_key`

Bearer tokens continue to use:

1. `?token=`
2. `localStorage.fastnear:bearer`

## Current Source Of Truth

For current implementation details, use:

- `mike-docs/README.md`
- `mike-docs/INTEGRATION_GUIDE.md`
- `builder-docs/CLAUDE.md`

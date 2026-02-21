# Redocly Configuration Guide

This document outlines the required Redocly configuration to enable headless operation embedding with API key support.

## 1. Reference Page Configuration

Create or update your reference page configuration file (e.g., `reference.page.yaml`):

```yaml
type: reference-docs
definitionId: near
label: Near RPC
settings:
  pagination: item        # Enables per-operation pages
  showConsole: true       # Shows Try-It console
  hideInfoSection: true   # Hides info section for cleaner embed
  hideDownloadButton: true # Removes download button
  disableSidebar: true    # Disables internal Reference sidebar
```

Key setting: `pagination: item` creates individual operation pages at `/reference/operation/<operationId>`

## 2. Portal-Wide Chrome Configuration

Update your `redocly.yaml` to hide portal chrome:

```yaml
sidebar:
  hide: true    # Hides portal sidebar
navbar:
  hide: true    # Hides portal navbar
openapi:
  settings:
    showConsole: true
```

## 3. Auto-Inject Authentication (configure.ts)

Eject and customize the configure.ts file to handle auth injection:

```bash
npx @redocly/cli eject component ext/configure.ts
```

Then update `@theme/ext/configure.ts`:

```typescript
/* eslint-disable no-restricted-globals */
type RequestValues = {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  security?: Record<string, any>;
  envVariables?: Record<string, string>;
};

const API_KEY_SCHEMES = ["ApiKeyAuth", "api_key", "api_keys"];
const BEARER_SCHEMES = ["bearerAuth", "jwt"];

export function configure(context: any) {
  const search =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();

  const apiKey =
    search.get("apiKey") ||
    (typeof window !== "undefined" ? window.localStorage.getItem("fastnear:apiKey") : null) ||
    undefined;

  const bearer =
    search.get("token") ||
    (typeof window !== "undefined" ? window.localStorage.getItem("fastnear:bearer") : null) ||
    undefined;

  const rv: RequestValues = { headers: {}, query: {}, security: {}, envVariables: {} };

  if (apiKey) {
    rv.query!["apiKey"] = apiKey;                 // API key as query param
    rv.headers!["x-api-key"] = apiKey;            // API key as header
    for (const id of API_KEY_SCHEMES) rv.security![id] = apiKey;
    rv.envVariables!.API_KEY = apiKey;            // For code samples
  }

  if (bearer) {
    rv.headers!["Authorization"] = `Bearer ${bearer}`;
    for (const id of BEARER_SCHEMES) rv.security![id] = bearer;
    rv.envVariables!.ACCESS_TOKEN = bearer;
  }

  return { requestValues: rv };
}
```

## 4. URL Structure

With these configurations, you'll have:

- **Pretty routes** (if configured): `/rpcs/account/view_account`
- **Operation routes** (with pagination): `/reference/operation/view_account`

## 5. Embedding Considerations

### CORS and Frame Options
If you encounter iframe blocking issues, ensure your Redocly domain allows embedding:
- Check `X-Frame-Options` headers
- Verify `Content-Security-Policy: frame-ancestors` settings
- Consider using a custom domain or proxy for same-site embedding

### API Key Flow
1. User sets API key in the Docusaurus site (stored in localStorage)
2. RpcRedoc component reads the key from localStorage
3. Key is appended as URL parameter: `?apiKey=USER_KEY`
4. Redocly's configure.ts picks up the key and injects it into:
   - Query parameters for the API
   - Headers for authentication
   - Code samples as environment variables

## Testing

To test the integration:
1. Set an API key using the ApiKeyManager component
2. Visit a documentation page with RpcRedoc
3. Check browser DevTools Network tab to verify the iframe URL includes `?apiKey=YOUR_KEY`
4. Verify the Try-It console includes the API key in requests
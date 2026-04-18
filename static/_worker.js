const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
const MARKDOWN_ACCEPT_TOKEN = "text/markdown";
const LOCALE_ROOTS = new Set(["/ru"]);
const DISCOVERY_LINKS_BY_PATH = {
  "/": [
    '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
    '</agents>; rel="service-doc"; type="text/html"',
    '</.well-known/agent-skills/index.json>; rel="service-meta"; type="application/json"',
    '</structured-data/site-graph.json>; rel="service-meta"; type="application/json"',
  ],
  "/ru": [
    '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
    '</ru/agents>; rel="service-doc"; type="text/html"',
    '</.well-known/agent-skills/index.json>; rel="service-meta"; type="application/json"',
    '</ru/structured-data/site-graph.json>; rel="service-meta"; type="application/json"',
  ],
  "/.well-known/api-catalog": [
    '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  ],
};

function wantsMarkdown(request) {
  const accept = request.headers.get("Accept") || "";
  return accept.toLowerCase().includes(MARKDOWN_ACCEPT_TOKEN);
}

function appendVaryAccept(headers) {
  const vary = headers.get("Vary");
  if (!vary) {
    headers.set("Vary", "Accept");
    return;
  }

  const parts = vary
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!parts.some((value) => value.toLowerCase() === "accept")) {
    parts.push("Accept");
    headers.set("Vary", parts.join(", "));
  }
}

function appendDiscoveryLinks(headers, pathname) {
  const normalizedPathname =
    pathname !== "/" && pathname.endsWith("/") ? pathname.replace(/\/+$/, "") : pathname;
  const links = DISCOVERY_LINKS_BY_PATH[normalizedPathname];
  if (!links) {
    return;
  }

  for (const link of links) {
    headers.append("Link", link);
  }
}

function resolveMarkdownPathname(pathname) {
  if (!pathname || pathname.includes(".")) {
    return null;
  }

  if (pathname === "/") {
    return "/index.md";
  }

  if (LOCALE_ROOTS.has(pathname)) {
    return `${pathname}/index.md`;
  }

  if (pathname.endsWith("/")) {
    return `${pathname}index.md`;
  }

  return `${pathname}.md`;
}

async function fetchAsset(request, env, pathname) {
  const url = new URL(request.url);
  url.pathname = pathname;
  return env.ASSETS.fetch(new Request(url.toString(), request));
}

function cloneResponse(response, headers) {
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const markdownPathname = resolveMarkdownPathname(url.pathname);

    if (!markdownPathname) {
      return env.ASSETS.fetch(request);
    }

    if (!wantsMarkdown(request)) {
      const response = await env.ASSETS.fetch(request);
      const headers = new Headers(response.headers);
      appendVaryAccept(headers);
      return cloneResponse(response, headers);
    }

    const markdownResponse = await fetchAsset(request, env, markdownPathname);
    if (markdownResponse.status >= 400) {
      const fallback = await env.ASSETS.fetch(request);
      const headers = new Headers(fallback.headers);
      appendVaryAccept(headers);
      return cloneResponse(fallback, headers);
    }

    const headers = new Headers(markdownResponse.headers);
    headers.set("Content-Type", MARKDOWN_CONTENT_TYPE);
    appendVaryAccept(headers);
    appendDiscoveryLinks(headers, url.pathname);
    return cloneResponse(markdownResponse, headers);
  },
};

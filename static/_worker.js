const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";
const MARKDOWN_ACCEPT_TOKEN = "text/markdown";
const AGENT_SKILLS_INDEX_PATH = "/.well-known/agent-skills/index.json";
const API_CATALOG_LINK = '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"';
const FASTNEAR_OPENAPI_LINK = '</openapi/fastnear.json>; rel="service-desc"; type="application/json"';
const NEARDATA_OPENAPI_LINK = '</openapi/neardata.json>; rel="service-desc"; type="application/json"';
const RPC_OPENAPI_LINK =
  '<https://rpc.mainnet.fastnear.com/openapi.json>; rel="service-desc"; type="application/json"';
const SERVICE_META_JSON_TYPE = 'rel="service-meta"; type="application/json"';

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

function appendUniqueLink(headers, linkValue) {
  const existing = headers.get("Link") || "";
  if (!existing.includes(linkValue)) {
    headers.append("Link", linkValue);
  }
}

function isHtmlResponse(response) {
  const contentType = response.headers.get("Content-Type") || "";
  return contentType.toLowerCase().includes("text/html");
}

function normalizePathname(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.replace(/\/+$/, "") || "/" : pathname;
}

function getLocalePrefix(pathname) {
  return pathname === "/ru" || pathname.startsWith("/ru/") ? "/ru" : "";
}

function stripLocalePrefix(pathname) {
  const localePrefix = getLocalePrefix(pathname);
  if (!localePrefix) {
    return pathname;
  }

  const stripped = pathname.slice(localePrefix.length);
  return stripped || "/";
}

function buildLocalizedSiteGraphPath(localePrefix) {
  return localePrefix ? `${localePrefix}/structured-data/site-graph.json` : "/structured-data/site-graph.json";
}

function buildLocalizedAgentsPath(localePrefix) {
  return localePrefix ? `${localePrefix}/agents` : "/agents";
}

function matchesRoute(pathname, baseRoute) {
  return pathname === baseRoute || pathname.startsWith(`${baseRoute}/`);
}

function getDiscoveryLinks(pathname) {
  const normalizedPathname = normalizePathname(pathname);
  const localePrefix = getLocalePrefix(normalizedPathname);
  const strippedPathname = stripLocalePrefix(normalizedPathname);
  const siteGraphLink = `<${buildLocalizedSiteGraphPath(localePrefix)}>; ${SERVICE_META_JSON_TYPE}`;

  if (normalizedPathname === "/.well-known/api-catalog") {
    return [API_CATALOG_LINK];
  }

  if (strippedPathname === "/") {
    return [
      API_CATALOG_LINK,
      `<${buildLocalizedAgentsPath(localePrefix)}>; rel="service-doc"; type="text/html"`,
      `<${AGENT_SKILLS_INDEX_PATH}>; ${SERVICE_META_JSON_TYPE}`,
      siteGraphLink,
    ];
  }

  if (matchesRoute(strippedPathname, "/rpc")) {
    return [API_CATALOG_LINK, RPC_OPENAPI_LINK, siteGraphLink];
  }

  if (matchesRoute(strippedPathname, "/api")) {
    return [API_CATALOG_LINK, FASTNEAR_OPENAPI_LINK, siteGraphLink];
  }

  if (matchesRoute(strippedPathname, "/neardata")) {
    return [API_CATALOG_LINK, NEARDATA_OPENAPI_LINK, siteGraphLink];
  }

  if (matchesRoute(strippedPathname, "/agents")) {
    return [
      API_CATALOG_LINK,
      `<${AGENT_SKILLS_INDEX_PATH}>; ${SERVICE_META_JSON_TYPE}`,
      siteGraphLink,
    ];
  }

  if (matchesRoute(strippedPathname, "/auth")) {
    return [API_CATALOG_LINK, siteGraphLink];
  }

  return [];
}

function appendDiscoveryLinks(headers, pathname) {
  for (const link of getDiscoveryLinks(pathname)) {
    appendUniqueLink(headers, link);
  }
}

function resolveMarkdownPathname(pathname) {
  if (!pathname || pathname.includes(".")) {
    return null;
  }

  if (pathname === "/") {
    return "/index.md";
  }

  if (pathname === "/ru") {
    return "/ru/index.md";
  }

  if (pathname.endsWith("/")) {
    return `${pathname}index.md`;
  }

  return `${pathname}.md`;
}

function appendMarkdownAlternate(headers, markdownPathname) {
  if (!markdownPathname) {
    return;
  }

  appendUniqueLink(
    headers,
    `<${markdownPathname}>; rel="alternate"; type="text/markdown"`
  );
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

function finalizeHtmlResponse(response, pathname, markdownPathname) {
  const headers = new Headers(response.headers);
  appendVaryAccept(headers);

  if (response.status < 400 && isHtmlResponse(response)) {
    appendDiscoveryLinks(headers, pathname);
    appendMarkdownAlternate(headers, markdownPathname);
  }

  return cloneResponse(response, headers);
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
      return finalizeHtmlResponse(response, url.pathname, markdownPathname);
    }

    const markdownResponse = await fetchAsset(request, env, markdownPathname);
    if (markdownResponse.status >= 400) {
      const fallback = await env.ASSETS.fetch(request);
      const headers = new Headers(fallback.headers);
      appendVaryAccept(headers);
      if (fallback.status < 400 && isHtmlResponse(fallback)) {
        appendDiscoveryLinks(headers, url.pathname);
      }
      return cloneResponse(fallback, headers);
    }

    const headers = new Headers(markdownResponse.headers);
    headers.set("Content-Type", MARKDOWN_CONTENT_TYPE);
    appendVaryAccept(headers);
    appendDiscoveryLinks(headers, url.pathname);
    return cloneResponse(markdownResponse, headers);
  },
};

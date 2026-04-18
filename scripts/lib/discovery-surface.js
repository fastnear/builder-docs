const {
  normalizeRoute: normalizeLocalizedRoute,
  stripLocalePrefix,
} = require("./localized-routes");

const PUBLIC_DOC_ROUTE_PATTERNS = [
  "/",
  "/rpc/**",
  "/api/**",
  "/tx/**",
  "/transfers/**",
  "/neardata/**",
  "/fastdata/**",
  "/auth/**",
  "/agents/**",
  "/snapshots/**",
];

const EXCLUDED_ROUTE_PATTERNS = [
  "/transaction-flow",
  "/transaction-flow/**",
  "/rpcs/**",
  "/apis/**",
  "/**/*.md",
  "/llms.txt",
  "/llms-full.txt",
  "/guides/llms.txt",
  "/rpcs/llms.txt",
  "/apis/llms.txt",
  "/structured-data/**",
  "/api/reference",
  "/redocly-config",
];

const EXCLUDED_SITEMAP_ROUTES = [
  "/api/reference",
  "/redocly-config",
];

const EXCLUDED_SITEMAP_ROUTE_PREFIXES = [
  "/transaction-flow",
];

const HIDDEN_DOC_PREFIXES = [
  "/transfers",
  "/fastdata",
];

const HIDDEN_CANONICAL_PREFIXES = ["/apis/transfers", "/apis/kv-fastdata"];

const ALWAYS_HIDDEN_DOC_PREFIXES = ["/transaction-flow"];

const COLLECTION_ROUTE_SET = new Set([
  "/",
  "/api",
  "/api/reference",
  "/auth",
  "/fastdata/kv",
  "/neardata",
  "/rpc",
  "/snapshots",
  "/transaction-flow",
  "/transfers",
  "/tx",
]);

function normalizeDiscoveryRoute(route, { fallbackRoot = false, stripLocale = false } = {}) {
  const candidate = stripLocale ? stripLocalePrefix(route) : route;
  const normalized = normalizeLocalizedRoute(candidate);
  return normalized || (fallbackRoot ? "/" : null);
}

function matchesRoutePrefix(route, prefix) {
  const normalizedRoute = normalizeDiscoveryRoute(route);
  const normalizedPrefix = normalizeDiscoveryRoute(prefix);
  return Boolean(normalizedRoute && normalizedPrefix) && (
    normalizedRoute === normalizedPrefix ||
    normalizedRoute.startsWith(`${normalizedPrefix}/`)
  );
}

function matchesRoutePattern(route, pattern, { stripLocale = false } = {}) {
  const normalizedRoute = normalizeDiscoveryRoute(route, { stripLocale });
  const normalizedPattern = normalizeDiscoveryRoute(pattern);
  if (!normalizedRoute || !normalizedPattern) {
    return false;
  }

  if (normalizedPattern === "/") {
    return normalizedRoute === "/";
  }

  if (normalizedPattern === "/**/*.md") {
    return normalizedRoute.endsWith(".md");
  }

  if (normalizedPattern.endsWith("/**")) {
    return matchesRoutePrefix(normalizedRoute, normalizedPattern.slice(0, -3));
  }

  return normalizedRoute === normalizedPattern;
}

function isHiddenDocsRoute(route, { hideEarlyApiFamilies = false } = {}) {
  const normalizedRoute = normalizeDiscoveryRoute(route, { stripLocale: true });
  if (!normalizedRoute) {
    return false;
  }

  return (
    ALWAYS_HIDDEN_DOC_PREFIXES.some((prefix) => matchesRoutePrefix(normalizedRoute, prefix)) ||
    (
      hideEarlyApiFamilies &&
      HIDDEN_DOC_PREFIXES.some((prefix) => matchesRoutePrefix(normalizedRoute, prefix))
    )
  );
}

function isHiddenCanonicalRoute(route, { hideEarlyApiFamilies = false } = {}) {
  const normalizedRoute = normalizeDiscoveryRoute(route);
  if (!normalizedRoute) {
    return false;
  }

  return (
    hideEarlyApiFamilies &&
    HIDDEN_CANONICAL_PREFIXES.some((prefix) => matchesRoutePrefix(normalizedRoute, prefix))
  );
}

function isCollectionRoute(route) {
  const normalizedRoute = normalizeDiscoveryRoute(route, {
    fallbackRoot: true,
    stripLocale: true,
  });
  return COLLECTION_ROUTE_SET.has(normalizedRoute);
}

function isPublicDocsSurfaceRoute(route) {
  const normalizedRoute = normalizeDiscoveryRoute(route, { stripLocale: true });
  return Boolean(normalizedRoute) && (
    PUBLIC_DOC_ROUTE_PATTERNS.some((pattern) => matchesRoutePattern(normalizedRoute, pattern)) &&
    !EXCLUDED_ROUTE_PATTERNS.some((pattern) => matchesRoutePattern(normalizedRoute, pattern))
  );
}

function isDiscoverableDocsRoute(route, { hideEarlyApiFamilies = false } = {}) {
  return (
    isPublicDocsSurfaceRoute(route) &&
    !isHiddenDocsRoute(route, { hideEarlyApiFamilies })
  );
}

module.exports = {
  ALWAYS_HIDDEN_DOC_PREFIXES,
  COLLECTION_ROUTE_SET,
  EXCLUDED_ROUTE_PATTERNS,
  EXCLUDED_SITEMAP_ROUTES,
  EXCLUDED_SITEMAP_ROUTE_PREFIXES,
  HIDDEN_CANONICAL_PREFIXES,
  HIDDEN_DOC_PREFIXES,
  PUBLIC_DOC_ROUTE_PATTERNS,
  isCollectionRoute,
  isDiscoverableDocsRoute,
  isHiddenCanonicalRoute,
  isHiddenDocsRoute,
  isPublicDocsSurfaceRoute,
  matchesRoutePattern,
  matchesRoutePrefix,
  normalizeDiscoveryRoute,
};

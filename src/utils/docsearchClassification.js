const localeRegistry = require("../data/localeRegistry.json");

const DEFAULT_LOCALE = localeRegistry.defaultLocale;
const SUPPORTED_LOCALES = Object.keys(localeRegistry.locales);

const DOCSEARCH_CATEGORY_RULES = [
  { prefix: "/api/reference", value: "guide" },
  { prefix: "/rpc", value: "rpc-reference" },
  { prefix: "/api", value: "api-reference" },
  { prefix: "/tx", value: "api-reference" },
  { prefix: "/transfers", value: "api-reference" },
  { prefix: "/neardata", value: "api-reference" },
  { prefix: "/fastdata", value: "api-reference" },
  { prefix: "/auth", value: "guide" },
  { prefix: "/agents", value: "guide" },
  { prefix: "/internationalization", value: "guide" },
  { prefix: "/snapshots", value: "guide" },
  { prefix: "/transaction-flow", value: "guide" },
  { prefix: "/redocly-config", value: "guide" },
  { prefix: "/", value: "guide" },
];

const DOCSEARCH_METHOD_TYPE_RULES = [
  { prefix: "/api/reference", value: null },
  { prefix: "/rpc/account", value: "account" },
  { prefix: "/rpc/block", value: "block" },
  { prefix: "/rpc/contract", value: "contract" },
  { prefix: "/rpc/protocol", value: "protocol" },
  { prefix: "/rpc/transaction", value: "transaction" },
  { prefix: "/rpc/validators", value: "validators" },
  { prefix: "/api", value: "fastnear" },
  { prefix: "/tx", value: "transactions" },
  { prefix: "/transfers", value: "transfers" },
  { prefix: "/neardata", value: "neardata" },
  { prefix: "/fastdata", value: "kv-fastdata" },
];

const DOCSEARCH_SURFACE_RULES = [
  { prefix: "/rpc", value: "rpc" },
  { prefix: "/api", value: "api" },
  { prefix: "/tx", value: "tx" },
  { prefix: "/transfers", value: "transfers" },
  { prefix: "/neardata", value: "neardata" },
  { prefix: "/fastdata", value: "fastdata" },
  { prefix: "/auth", value: "auth" },
  { prefix: "/agents", value: "agents" },
  { prefix: "/internationalization", value: "guide" },
  { prefix: "/snapshots", value: "snapshots" },
  { prefix: "/transaction-flow", value: "transaction-flow" },
  { prefix: "/redocly-config", value: "guide" },
  { prefix: "/", value: "guide" },
];

const DOCSEARCH_FAMILY_RULES = [
  { prefix: "/rpc/account", value: "account" },
  { prefix: "/rpc/block", value: "block" },
  { prefix: "/rpc/contract", value: "contract" },
  { prefix: "/rpc/protocol", value: "protocol" },
  { prefix: "/rpc/transaction", value: "transaction" },
  { prefix: "/rpc/validators", value: "validators" },
  { prefix: "/api", value: "fastnear" },
  { prefix: "/tx", value: "transactions" },
  { prefix: "/transfers", value: "transfers" },
  { prefix: "/neardata", value: "neardata" },
  { prefix: "/fastdata/kv", value: "kv-fastdata" },
];

const REFERENCE_COLLECTION_ROUTES = new Set([
  "/api",
  "/fastdata/kv",
  "/neardata",
  "/rpc",
  "/transfers",
  "/tx",
]);

const HIDDEN_PUBLIC_DOC_PREFIXES = ["/transaction-flow"];

const OPERATION_CANONICAL_RULES = [
  { prefix: "/rpcs/account", family: "account", methodType: "account", surface: "rpc" },
  { prefix: "/rpcs/block", family: "block", methodType: "block", surface: "rpc" },
  { prefix: "/rpcs/contract", family: "contract", methodType: "contract", surface: "rpc" },
  { prefix: "/rpcs/protocol", family: "protocol", methodType: "protocol", surface: "rpc" },
  { prefix: "/rpcs/transaction", family: "transaction", methodType: "transaction", surface: "rpc" },
  { prefix: "/rpcs/validators", family: "validators", methodType: "validators", surface: "rpc" },
  { prefix: "/apis/fastnear", family: "fastnear", methodType: "fastnear", surface: "api" },
  { prefix: "/apis/transactions", family: "transactions", methodType: "transactions", surface: "tx" },
  { prefix: "/apis/transfers", family: "transfers", methodType: "transfers", surface: "transfers" },
  { prefix: "/apis/neardata", family: "neardata", methodType: "neardata", surface: "neardata" },
  { prefix: "/apis/kv-fastdata", family: "kv-fastdata", methodType: "kv-fastdata", surface: "fastdata" },
];

function stripOrigin(value) {
  const input = String(value || "").trim();
  if (!input) {
    return "";
  }

  try {
    const url = new URL(input, "https://builder-docs.fastnear.invalid/");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch (_error) {
    return input;
  }
}

function splitPathSuffix(value) {
  const match = String(value || "").match(/^([^?#]*)(.*)$/);
  return {
    path: match?.[1] || "",
    suffix: match?.[2] || "",
  };
}

function normalizeRoute(value) {
  const input = stripOrigin(value);
  if (!input) {
    return null;
  }

  const { path, suffix } = splitPathSuffix(input);
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return "/";
  }

  if (trimmedPath === "/") {
    return `/${suffix}`;
  }

  const prefixed = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  return `${prefixed.replace(/\/+$/, "") || "/"}${suffix}`;
}

function splitLocalizedRoute(value) {
  const normalized = normalizeRoute(value);
  if (!normalized) {
    return {
      locale: DEFAULT_LOCALE,
      route: "/",
      localizedRoute: "/",
      suffix: "",
    };
  }

  const { path, suffix } = splitPathSuffix(normalized);
  const segments = path.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (SUPPORTED_LOCALES.includes(maybeLocale)) {
    const route = `/${segments.slice(1).join("/")}`.replace(/\/+$/, "") || "/";
    return {
      locale: maybeLocale,
      route,
      localizedRoute: `${route}${suffix}`,
      suffix,
    };
  }

  return {
    locale: DEFAULT_LOCALE,
    route: path || "/",
    localizedRoute: normalized,
    suffix,
  };
}

function stripLocalePrefix(value) {
  const { route, suffix } = splitLocalizedRoute(value);
  return `${route}${suffix}`;
}

function normalizeDocsearchRoute(value) {
  return stripLocalePrefix(value) || null;
}

function matchesRoutePrefix(route, prefix) {
  const normalizedRoute = normalizeDocsearchRoute(route);
  const normalizedPrefix = normalizeDocsearchRoute(prefix);
  return Boolean(normalizedRoute && normalizedPrefix) && (
    normalizedRoute === normalizedPrefix ||
    normalizedRoute.startsWith(`${normalizedPrefix}/`)
  );
}

function resolveDocsearchValue(route, rules) {
  const normalizedRoute = normalizeDocsearchRoute(route);
  if (!normalizedRoute) {
    return null;
  }

  return rules.find((rule) => matchesRoutePrefix(normalizedRoute, rule.prefix))?.value || null;
}

function getDocsearchCategory(permalink) {
  return resolveDocsearchValue(permalink, DOCSEARCH_CATEGORY_RULES);
}

function getDocsearchMethodType(permalink) {
  return resolveDocsearchValue(permalink, DOCSEARCH_METHOD_TYPE_RULES);
}

function getDocsearchSurface(permalink) {
  return resolveDocsearchValue(permalink, DOCSEARCH_SURFACE_RULES);
}

function getDocsearchFamily(permalink) {
  return resolveDocsearchValue(permalink, DOCSEARCH_FAMILY_RULES);
}

function getDocsearchAudience(permalink) {
  const normalizedRoute = normalizeDocsearchRoute(permalink);
  if (!normalizedRoute) {
    return null;
  }

  if (matchesRoutePrefix(normalizedRoute, "/agents")) {
    return "agent";
  }

  if (matchesRoutePrefix(normalizedRoute, "/snapshots")) {
    return "operator";
  }

  return "builder";
}

function isReferenceLeafRoute(route, prefix) {
  const normalizedRoute = normalizeDocsearchRoute(route);
  const normalizedPrefix = normalizeDocsearchRoute(prefix);
  return Boolean(
    normalizedRoute &&
    normalizedPrefix &&
    matchesRoutePrefix(normalizedRoute, normalizedPrefix) &&
    normalizedRoute !== normalizedPrefix
  );
}

function getDocsearchPageType(permalink) {
  const normalizedRoute = normalizeDocsearchRoute(permalink);
  if (!normalizedRoute) {
    return null;
  }

  if (normalizedRoute === "/api/reference") {
    return "guide";
  }

  if (REFERENCE_COLLECTION_ROUTES.has(normalizedRoute)) {
    return "collection";
  }

  if (
    isReferenceLeafRoute(normalizedRoute, "/api") ||
    isReferenceLeafRoute(normalizedRoute, "/tx") ||
    isReferenceLeafRoute(normalizedRoute, "/transfers") ||
    isReferenceLeafRoute(normalizedRoute, "/neardata") ||
    isReferenceLeafRoute(normalizedRoute, "/fastdata/kv")
  ) {
    return "reference";
  }

  const routeParts = normalizedRoute.split("/").filter(Boolean);
  if (matchesRoutePrefix(normalizedRoute, "/rpc") && routeParts.length >= 3) {
    return "reference";
  }

  return "guide";
}

function getDocsearchSemanticMeta(permalink) {
  const normalizedRoute = normalizeDocsearchRoute(permalink);
  if (!normalizedRoute) {
    return null;
  }

  return {
    audience: getDocsearchAudience(normalizedRoute),
    category: getDocsearchCategory(normalizedRoute),
    family: getDocsearchFamily(normalizedRoute),
    methodType: getDocsearchMethodType(normalizedRoute),
    pageType: getDocsearchPageType(normalizedRoute),
    surface: getDocsearchSurface(normalizedRoute),
  };
}

function getOperationSemanticMeta(pageModel) {
  const normalizedCanonicalPath = normalizeDocsearchRoute(pageModel?.canonicalPath);
  const matchedRule = OPERATION_CANONICAL_RULES.find((rule) =>
    matchesRoutePrefix(normalizedCanonicalPath, rule.prefix)
  );

  if (!matchedRule) {
    return null;
  }

  return {
    audience: "builder",
    category: matchedRule.surface === "rpc" ? "rpc-reference" : "api-reference",
    family: matchedRule.family,
    methodType: matchedRule.methodType,
    pageType: "reference",
    surface: matchedRule.surface,
  };
}

function isPublicDocsPermalink(permalink) {
  const normalizedRoute = normalizeDocsearchRoute(permalink);
  return Boolean(
    normalizedRoute &&
      !HIDDEN_PUBLIC_DOC_PREFIXES.some((prefix) => matchesRoutePrefix(normalizedRoute, prefix)) &&
      !matchesRoutePrefix(normalizedRoute, "/rpcs") &&
      !matchesRoutePrefix(normalizedRoute, "/apis")
  );
}

module.exports = {
  DOCSEARCH_CATEGORY_RULES,
  DOCSEARCH_FAMILY_RULES,
  DOCSEARCH_METHOD_TYPE_RULES,
  DOCSEARCH_SURFACE_RULES,
  REFERENCE_COLLECTION_ROUTES,
  getDocsearchAudience,
  getDocsearchCategory,
  getDocsearchFamily,
  getDocsearchMethodType,
  getDocsearchPageType,
  getDocsearchSemanticMeta,
  getOperationSemanticMeta,
  isPublicDocsPermalink,
  matchesRoutePrefix,
  normalizeDocsearchRoute,
};

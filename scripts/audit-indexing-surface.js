#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  localizeRoute,
  stripLocalePrefix,
} = require("./lib/localized-routes");
const {
  EXCLUDED_SITEMAP_ROUTES,
  EXCLUDED_SITEMAP_ROUTE_PREFIXES,
  isCollectionRoute,
  isHiddenCanonicalRoute,
  isHiddenDocsRoute,
  matchesRoutePrefix,
} = require("./lib/discovery-surface");
const {
  getDocsearchSemanticMeta,
} = require("../src/utils/docsearchClassification");
const {
  createCrawlerConfig,
  renderCrawlerConfigSource,
} = require("../algolia/crawler/shared");

const ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(ROOT, "docs");
const BUILD_ROOT = path.join(ROOT, "build");
const CONFIG_PATH = path.join(ROOT, "docusaurus.config.js");
const LOCALE_REGISTRY_PATH = path.join(ROOT, "src/data/localeRegistry.json");
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");
const ALGOLIA_CRAWLER_SHARED_PATH = path.join(ROOT, "algolia/crawler/shared.js");
const ALGOLIA_CRAWLER_CONFIG_PATH = path.join(ROOT, "algolia/docsearch-crawler.config.js");
const ALGOLIA_INDEX_SETTINGS_PATH = path.join(ROOT, "algolia/index-settings.json");
const ALGOLIA_RULES_PATH = path.join(ROOT, "algolia/rules.json");
const ALGOLIA_SYNONYMS_PATH = path.join(ROOT, "algolia/synonyms.json");
const ALGOLIA_RELEVANCE_CASES_PATH = path.join(ROOT, "algolia/relevance-cases.json");
const ALGOLIA_OPERATIONS_PATH = path.join(ROOT, "algolia/operations.md");
const ALGOLIA_RELEVANCE_AUDIT_PATH = path.join(ROOT, "scripts/audit-algolia-relevance.js");
const SEARCH_BAR_PATH = path.join(ROOT, "src/theme/SearchBar/index.js");
const SEARCH_BAR_RUNTIME_PATH = path.join(ROOT, "src/theme/SearchBar/AlgoliaSearchRuntime.js");
const SEARCH_BAR_STYLES_PATH = path.join(ROOT, "src/theme/SearchBar/styles.css");
const HEADERS_PATH = path.join(BUILD_ROOT, "_headers");
const REDIRECTS_PATH = path.join(BUILD_ROOT, "_redirects");
const ROBOTS_PATH = path.join(BUILD_ROOT, "robots.txt");
const API_CATALOG_PATH = path.join(BUILD_ROOT, ".well-known", "api-catalog");
const AGENT_SKILLS_INDEX_PATH = path.join(
  BUILD_ROOT,
  ".well-known",
  "agent-skills",
  "index.json"
);
const WORKER_SOURCE_PATH = path.join(ROOT, "static", "_worker.js");
const PAGE_MODELS_PATH = path.join(ROOT, "src/data/generatedFastnearPageModels.json");
const STRUCTURED_GRAPH_PATH = path.join(ROOT, "src/data/generatedFastnearStructuredGraph.json");
const PRODUCTION_SITE_URL = "https://docs.fastnear.com";
const WEBSITE_ID = `${PRODUCTION_SITE_URL}/#website`;
const ORGANIZATION_ID = `${PRODUCTION_SITE_URL}/#organization`;
const EXPECTED_CONTENT_SIGNAL = "Content-Signal: search=yes, ai-input=yes, ai-train=yes";
const API_CATALOG_LINK_HEADER =
  'Link: </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"';
const AGENT_SKILLS_LINK_HEADER =
  'Link: </.well-known/agent-skills/index.json>; rel="service-meta"; type="application/json"';
const ROOT_SITE_GRAPH_LINK_HEADER =
  'Link: </structured-data/site-graph.json>; rel="service-meta"; type="application/json"';
const RU_SITE_GRAPH_LINK_HEADER =
  'Link: </ru/structured-data/site-graph.json>; rel="service-meta"; type="application/json"';
const ROOT_SERVICE_DOC_LINK_HEADER = 'Link: </agents>; rel="service-doc"; type="text/html"';
const RU_SERVICE_DOC_LINK_HEADER = 'Link: </ru/agents>; rel="service-doc"; type="text/html"';
const RPC_SERVICE_DESC_LINK_HEADER =
  'Link: <https://rpc.mainnet.fastnear.com/openapi.json>; rel="service-desc"; type="application/json"';
const FASTNEAR_SERVICE_DESC_LINK_HEADER =
  'Link: </openapi/fastnear.json>; rel="service-desc"; type="application/json"';
const NEARDATA_SERVICE_DESC_LINK_HEADER =
  'Link: </openapi/neardata.json>; rel="service-desc"; type="application/json"';
const EXPECTED_ROOT_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  ROOT_SERVICE_DOC_LINK_HEADER,
  AGENT_SKILLS_LINK_HEADER,
  ROOT_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_RU_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  RU_SERVICE_DOC_LINK_HEADER,
  AGENT_SKILLS_LINK_HEADER,
  RU_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_RPC_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  RPC_SERVICE_DESC_LINK_HEADER,
  ROOT_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_RU_RPC_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  RPC_SERVICE_DESC_LINK_HEADER,
  RU_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_API_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  FASTNEAR_SERVICE_DESC_LINK_HEADER,
  ROOT_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_RU_API_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  FASTNEAR_SERVICE_DESC_LINK_HEADER,
  RU_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_NEARDATA_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  NEARDATA_SERVICE_DESC_LINK_HEADER,
  ROOT_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_RU_NEARDATA_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  NEARDATA_SERVICE_DESC_LINK_HEADER,
  RU_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_AGENTS_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  AGENT_SKILLS_LINK_HEADER,
  ROOT_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_RU_AGENTS_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  AGENT_SKILLS_LINK_HEADER,
  RU_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_AUTH_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  ROOT_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_RU_AUTH_LINK_HEADERS = [
  API_CATALOG_LINK_HEADER,
  RU_SITE_GRAPH_LINK_HEADER,
];
const EXPECTED_DISCOVERY_HEADER_RULES = [
  {
    path: "/",
    lines: EXPECTED_ROOT_LINK_HEADERS,
  },
  {
    path: "/ru",
    lines: EXPECTED_RU_LINK_HEADERS,
  },
  {
    path: "/rpc",
    lines: EXPECTED_RPC_LINK_HEADERS,
  },
  {
    path: "/rpc/*",
    lines: EXPECTED_RPC_LINK_HEADERS,
  },
  {
    path: "/ru/rpc",
    lines: EXPECTED_RU_RPC_LINK_HEADERS,
  },
  {
    path: "/ru/rpc/*",
    lines: EXPECTED_RU_RPC_LINK_HEADERS,
  },
  {
    path: "/api",
    lines: EXPECTED_API_LINK_HEADERS,
  },
  {
    path: "/api/*",
    lines: EXPECTED_API_LINK_HEADERS,
  },
  {
    path: "/ru/api",
    lines: EXPECTED_RU_API_LINK_HEADERS,
  },
  {
    path: "/ru/api/*",
    lines: EXPECTED_RU_API_LINK_HEADERS,
  },
  {
    path: "/neardata",
    lines: EXPECTED_NEARDATA_LINK_HEADERS,
  },
  {
    path: "/neardata/*",
    lines: EXPECTED_NEARDATA_LINK_HEADERS,
  },
  {
    path: "/ru/neardata",
    lines: EXPECTED_RU_NEARDATA_LINK_HEADERS,
  },
  {
    path: "/ru/neardata/*",
    lines: EXPECTED_RU_NEARDATA_LINK_HEADERS,
  },
  {
    path: "/agents",
    lines: EXPECTED_AGENTS_LINK_HEADERS,
  },
  {
    path: "/agents/*",
    lines: EXPECTED_AGENTS_LINK_HEADERS,
  },
  {
    path: "/ru/agents",
    lines: EXPECTED_RU_AGENTS_LINK_HEADERS,
  },
  {
    path: "/ru/agents/*",
    lines: EXPECTED_RU_AGENTS_LINK_HEADERS,
  },
  {
    path: "/auth",
    lines: EXPECTED_AUTH_LINK_HEADERS,
  },
  {
    path: "/auth/*",
    lines: EXPECTED_AUTH_LINK_HEADERS,
  },
  {
    path: "/ru/auth",
    lines: EXPECTED_RU_AUTH_LINK_HEADERS,
  },
  {
    path: "/ru/auth/*",
    lines: EXPECTED_RU_AUTH_LINK_HEADERS,
  },
];
const EXPECTED_HEADER_RULES = [
  ...EXPECTED_DISCOVERY_HEADER_RULES,
  {
    path: "/.well-known/api-catalog",
    lines: [
      'Content-Type: application/linkset+json; charset=utf-8; profile="https://www.rfc-editor.org/info/rfc9727"',
      API_CATALOG_LINK_HEADER,
    ],
  },
  {
    path: "/.well-known/agent-skills/index.json",
    lines: ['Content-Type: application/json; charset=utf-8'],
  },
  {
    path: "/.well-known/agent-skills/*/SKILL.md",
    lines: ['Content-Type: text/markdown; charset=utf-8'],
  },
];
const EXPECTED_API_CATALOG_ANCHORS = [
  "https://api.fastnear.com",
  "https://mainnet.neardata.xyz",
  "https://rpc.mainnet.fastnear.com",
];
const EXPECTED_AGENT_SKILLS = ["auth", "overview", "playbooks", "surface-routing"];

const hideEarlyApiFamilies = /^(1|true|yes|on)$/i.test(
  process.env.HIDE_EARLY_API_FAMILIES || ""
);

const DISALLOWED_CANONICAL_PREFIXES = [
  "/rpc-api/fastnear-api",
  "/rpc-api/transactions-api",
  "/rpc-api/transfers-api",
  "/rpc-api/neardata-api",
  "/rpc-api/kv-fastdata-api",
  "/rpc-api/api-key",
  "/rpc-api/auth-browser-demo",
  "/rpc-api/auth-production-backend",
  "/ai-agents",
  "/docs",
];

const REQUIRED_SITEMAP_ROUTES = [
  "/",
  "/rpc",
  "/api",
  "/auth",
  "/agents/choosing-surfaces",
  "/api/v1/public-key",
  "/fastdata/kv/all-by-predecessor",
];

const REQUIRED_ROBOTS_USER_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "CCBot",
  "Googlebot",
  "Google-Extended",
];

const REQUIRED_REDIRECT_LINES = [
  "/docs / 301",
  "/docs/rpc-api / 301",
  "/docs/rpc-api/rpc /rpc 301",
  "/docs/rpc-api/rpc/* /rpc/:splat 301",
  "/docs/rpc-api/account/* /rpc/account/:splat 301",
  "/docs/rpc-api/api/* /api/:splat 301",
  "/docs/rpc-api/tx/* /tx/:splat 301",
  "/docs/rpc-api/api-key /auth 301",
  // /auth collapsed to a single page (commit 0a1c719); no sub-paths to preserve.
  "/docs/rpc-api/auth/* /auth 301",
  "/docs/transaction-flow/* /transaction-flow/:splat 301",
];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function loadJson(filePath, label) {
  assert(fs.existsSync(filePath), `Missing ${label}: ${path.relative(ROOT, filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256File(filePath) {
  return `sha256:${crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")}`;
}

function walkDocs(dirPath) {
  const collected = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collected.push(...walkDocs(fullPath));
      continue;
    }

    if (/\.(md|mdx)$/.test(entry.name)) {
      collected.push(fullPath);
    }
  }

  return collected.sort();
}

function parseFrontmatter(rawContent) {
  const match = rawContent.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return {};
  }

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!fieldMatch) {
      continue;
    }

    const [, key, value] = fieldMatch;
    frontmatter[key] = value.trim().replace(/^['"]|['"]$/g, "");
  }

  return frontmatter;
}

function normalizeRoute(route) {
  const normalized = String(route || "").trim();
  if (!normalized) {
    return null;
  }

  if (normalized === "/") {
    return "/";
  }

  const prefixed = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return prefixed.replace(/\/+$/, "") || "/";
}

function normalizeAbsoluteUrl(value) {
  return new URL(String(value), `${PRODUCTION_SITE_URL}/`).toString();
}

function normalizeComparableUrl(value) {
  const url = new URL(String(value), `${PRODUCTION_SITE_URL}/`);
  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }
  return url.toString();
}

function buildLocalizedProductionUrl(route, locale = DEFAULT_LOCALE) {
  return normalizeAbsoluteUrl(localizeRoute(route, locale));
}

function buildCrawlerUrl(route, locale = DEFAULT_LOCALE) {
  if (route === "/") {
    return locale === DEFAULT_LOCALE
      ? `${PRODUCTION_SITE_URL}/`
      : `${PRODUCTION_SITE_URL}/${locale}/`;
  }

  return `${PRODUCTION_SITE_URL}${localizeRoute(route, locale)}`;
}

function buildSiteGraphDocumentUrl(locale = DEFAULT_LOCALE) {
  return buildLocalizedProductionUrl("/structured-data/site-graph.json", locale);
}

function buildExpectedSiteGraphFamilyEntityId(familyId, locale = DEFAULT_LOCALE) {
  return `${buildSiteGraphDocumentUrl(locale)}#family-${familyId}`;
}

function buildExpectedSiteGraphOperationEntityId(pageModelId, locale = DEFAULT_LOCALE) {
  return `${buildSiteGraphDocumentUrl(locale)}#operation-${pageModelId}`;
}

function getSiteGraphPath(locale = DEFAULT_LOCALE) {
  return path.join(BUILD_ROOT, localizeRoute("/structured-data/site-graph.json", locale));
}

function getExpectedMarkdownMirrorUrl(route) {
  return normalizeAbsoluteUrl(getExpectedMarkdownMirrorPath(route));
}

function getExpectedMarkdownMirrorPath(route) {
  if (route === "/") {
    return "/index.md";
  }

  const segments = String(route || "").split("/").filter(Boolean);
  if (segments.length === 1 && SUPPORTED_LOCALES.includes(segments[0])) {
    return `${route}/index.md`;
  }

  return `${route}.md`;
}

function getLegacyMarkdownMirrorPath(route) {
  return route === "/" ? "/index.md" : `${route}/index.md`;
}

function routeToBuildHtmlPath(route) {
  const withoutTrailingSlash = String(route).replace(/\/+$/, "");
  if (!withoutTrailingSlash) {
    return path.join(BUILD_ROOT, "index.html");
  }
  const segments = withoutTrailingSlash.split("/").filter(Boolean);
  if (segments.length === 1 && SUPPORTED_LOCALES.includes(segments[0])) {
    return path.join(BUILD_ROOT, segments[0], "index.html");
  }
  return path.join(BUILD_ROOT, `${withoutTrailingSlash}.html`);
}

function routeToBuildAssetPath(route) {
  return path.join(BUILD_ROOT, String(route || "/").replace(/^\//, ""));
}

function getExpectedDocsPageSchemaType({ hasFastnearOperation, route }) {
  if (hasFastnearOperation) {
    return "WebPage";
  }

  return isCollectionRoute(route) ? "CollectionPage" : "TechArticle";
}

function countOccurrences(value, pattern) {
  return (value.match(pattern) || []).length;
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getExpectedOperationDocsearchCanonicalTarget(pageModel) {
  if (!pageModel) {
    return null;
  }

  const operationId = pageModel.info?.operationId || null;
  if (pageModel.route?.transport === "json-rpc") {
    const requestMethod = pageModel.interaction?.requestMethod || null;
    const requestType = pageModel.interaction?.requestType || null;
    if (requestMethod && requestType) {
      return `${requestMethod} · request_type=${requestType}`;
    }

    return operationId;
  }

  const routeMethod = pageModel.route?.method || null;
  const routePath = pageModel.route?.path || null;
  if (routeMethod && routePath) {
    return `${routeMethod} ${routePath}`;
  }

  return operationId;
}

function buildMetaPattern(name, value) {
  return new RegExp(
    `<meta[^>]+name="${escapeRegExp(name)}"[^>]+content="${escapeRegExp(value)}"[^>]*>`,
    "i"
  );
}

function stripHeaderName(line) {
  return String(line || "").replace(/^[^:]+:\s*/, "");
}

function parseJsonLdScripts(html, label) {
  return [...html.matchAll(/<script(?: data-rh="true")? type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match, index) => {
      try {
        return JSON.parse(match[1]);
      } catch (error) {
        fail(`${label} contains invalid JSON-LD in script ${index + 1}: ${error.message}`);
      }
    });
}

function flattenJsonLdNodes(blocks) {
  return blocks.flatMap((block) => (Array.isArray(block?.["@graph"]) ? block["@graph"] : [block]));
}

function getNodeRefId(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value["@id"]) {
    return value["@id"];
  }

  return null;
}

function getNodeRefIds(value) {
  if (!value) {
    return [];
  }

  return (Array.isArray(value) ? value : [value]).map(getNodeRefId).filter(Boolean);
}

function findNodeByType(nodes, type) {
  return nodes.find((node) => node?.["@type"] === type) || null;
}

function findNodeById(nodes, id) {
  return nodes.find((node) => node?.["@id"] === id) || null;
}

function assertGlobalStructuredDataNodes(nodes, label) {
  const websiteNode = findNodeById(nodes, WEBSITE_ID);
  assert(websiteNode, `${label} is missing the global WebSite node`);
  assert(websiteNode["@type"] === "WebSite", `${label} has the wrong global WebSite type`);
  assert(websiteNode.url === PRODUCTION_SITE_URL, `${label} has the wrong global WebSite URL`);
  assert(
    getNodeRefId(websiteNode.publisher) === ORGANIZATION_ID,
    `${label} should link the global WebSite publisher to the Organization node`
  );

  const organizationNode = findNodeById(nodes, ORGANIZATION_ID);
  assert(organizationNode, `${label} is missing the global Organization node`);
  assert(
    organizationNode["@type"] === "Organization",
    `${label} has the wrong global Organization type`
  );
  assert(
    organizationNode.logo === `${PRODUCTION_SITE_URL}/img/fastnear_logo_black.png`,
    `${label} should use the stable docs-hosted Organization logo`
  );
}

function findIndexNowKeyFile(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return null;
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .find((entry) => entry.isFile() && /^[a-f0-9]{32}\.txt$/i.test(entry.name));
}

function auditConfigSurface() {
  assert(
    fs.existsSync(CONFIG_PATH),
    `Missing Docusaurus config: ${path.relative(ROOT, CONFIG_PATH)}`
  );
  const configText = fs.readFileSync(CONFIG_PATH, "utf8");
  assert(
    fs.existsSync(LOCALE_REGISTRY_PATH),
    `Missing locale registry: ${path.relative(ROOT, LOCALE_REGISTRY_PATH)}`
  );
  const localeRegistry = loadJson(LOCALE_REGISTRY_PATH, "locale registry");
  assert(
    fs.existsSync(ENV_EXAMPLE_PATH),
    `Missing env example: ${path.relative(ROOT, ENV_EXAMPLE_PATH)}`
  );
  const envExampleText = fs.readFileSync(ENV_EXAMPLE_PATH, "utf8");
  assert(
    fs.existsSync(ALGOLIA_CRAWLER_SHARED_PATH),
    `Missing shared Algolia crawler definition: ${path.relative(ROOT, ALGOLIA_CRAWLER_SHARED_PATH)}`
  );
  const crawlerSharedText = fs.readFileSync(ALGOLIA_CRAWLER_SHARED_PATH, "utf8");
  assert(
    fs.existsSync(ALGOLIA_CRAWLER_CONFIG_PATH),
    `Missing Algolia crawler config: ${path.relative(ROOT, ALGOLIA_CRAWLER_CONFIG_PATH)}`
  );
  const crawlerConfigText = fs.readFileSync(ALGOLIA_CRAWLER_CONFIG_PATH, "utf8");
  const searchBarText = fs.readFileSync(SEARCH_BAR_PATH, "utf8");
  const searchBarRuntimeText = fs.existsSync(SEARCH_BAR_RUNTIME_PATH)
    ? fs.readFileSync(SEARCH_BAR_RUNTIME_PATH, "utf8")
    : "";
  const crawlerConfig = createCrawlerConfig();
  const crawlerPathsToMatch = crawlerConfig.actions?.[0]?.pathsToMatch || [];
  const crawlerSitemaps = crawlerConfig.sitemaps || [];
  const crawlerStartUrls = crawlerConfig.startUrls || [];
  const indexSettings = loadJson(ALGOLIA_INDEX_SETTINGS_PATH, "Algolia index settings");
  const rules = loadJson(ALGOLIA_RULES_PATH, "Algolia rules");
  const synonyms = loadJson(ALGOLIA_SYNONYMS_PATH, "Algolia synonyms");
  assert(
    fs.existsSync(ALGOLIA_RELEVANCE_CASES_PATH),
    `Missing Algolia relevance cases: ${path.relative(ROOT, ALGOLIA_RELEVANCE_CASES_PATH)}`
  );
  assert(
    fs.existsSync(ALGOLIA_OPERATIONS_PATH),
    `Missing Algolia operations guide: ${path.relative(ROOT, ALGOLIA_OPERATIONS_PATH)}`
  );
  assert(
    fs.existsSync(ALGOLIA_RELEVANCE_AUDIT_PATH),
    `Missing Algolia relevance audit: ${path.relative(ROOT, ALGOLIA_RELEVANCE_AUDIT_PATH)}`
  );
  assert(
    fs.existsSync(SEARCH_BAR_PATH),
    `Missing swizzled SearchBar: ${path.relative(ROOT, SEARCH_BAR_PATH)}`
  );
  assert(
    fs.existsSync(SEARCH_BAR_STYLES_PATH),
    `Missing SearchBar styles: ${path.relative(ROOT, SEARCH_BAR_STYLES_PATH)}`
  );

  assert(
    !configText.includes("DOCSEARCH_ASSISTANT_ID"),
    "docusaurus.config.js should not expose a DOCSEARCH_ASSISTANT_ID seam"
  );
  assert(!configText.includes("assistantId"), "docusaurus.config.js should not expose assistantId");
  assert(!configText.includes("askAi"), "docusaurus.config.js should not expose askAi config");
  assert(
    configText.includes("breadcrumbs: true"),
    "docusaurus.config.js should keep docs breadcrumbs enabled"
  );
  assert(
    configText.includes("showLastUpdateTime: true"),
    "docusaurus.config.js should enable visible last-updated dates"
  );
  assert(
    configText.includes("showLastUpdateAuthor: false"),
    "docusaurus.config.js should hide last-updated author names"
  );
  assert(
    /locales:\s*(?:DOCS_LOCALES|\['en', 'ru'\]|\["en", "ru"\])/.test(configText),
    "docusaurus.config.js should enable English and Russian locales"
  );
  assert(
    configText.includes("localeDropdown"),
    "docusaurus.config.js should expose a locale dropdown in the navbar"
  );
  assert(
    configText.includes("language: ['en', 'ru']") || configText.includes('language: ["en", "ru"]'),
    "docusaurus.config.js should configure local search for English and Russian"
  );
  assert(
    localeRegistry.locales?.ru?.htmlLang === "ru",
    "localeRegistry.json should set htmlLang=ru for the Russian locale"
  );
  assert(
    searchBarText.includes("language:${currentLocale}") ||
      searchBarRuntimeText.includes("language:${currentLocale}"),
    "SearchBar (index.js or AlgoliaSearchRuntime.js) should hard-filter Algolia results to the active locale"
  );
  [
    "NODE_ENV=production",
    "DOCS_SEARCH_PROVIDER=algolia",
    "DOCSEARCH_APP_ID",
    "DOCSEARCH_API_KEY",
    "DOCSEARCH_INDEX_NAME",
    "ALGOLIA_CRAWLER_USER_ID",
    "ALGOLIA_CRAWLER_API_KEY",
    "ALGOLIA_CRAWLER_NAME",
  ].forEach((needle) => {
    assert(
      envExampleText.includes(needle),
      `.env.example should document ${needle}`
    );
  });
  [
    "ALGOLIA_CRAWLER_ID",
    "ALGOLIA_CRAWLER_BASIC_AUTH",
  ].forEach((needle) => {
    assert(
      !envExampleText.includes(needle),
      `.env.example should not document ${needle}`
    );
  });
  assert(
    !/ALGOLIA_[A-Z_]*ADMIN[A-Z_]*API_KEY/.test(envExampleText),
    ".env.example should not document an Algolia admin key"
  );
  assert(
    !envExampleText.includes("DOCSEARCH_ANALYTICS_API_KEY"),
    ".env.example should not document DOCSEARCH_ANALYTICS_API_KEY"
  );
  [
    'indexName: "YOUR_DOCSEARCH_INDEX_NAME"',
    "pathsToMatch",
    '"category"',
    '"method_type"',
    '"surface"',
    '"family"',
    '"audience"',
    '"page_type"',
    '"transport"',
    '"operation_id"',
    '"canonical_target"',
    '"keywords"',
    "data-fastnear-crawler-skip",
    "removeCrawlerNoise",
    "getMetaContent",
    'attributeForDistinct: "url_without_anchor"',
  ].forEach((needle) => {
    assert(
      crawlerConfigText.includes(needle),
      `algolia/docsearch-crawler.config.js should include ${needle}`
    );
  });
  [
    "createCrawlerConfig",
    "renderCrawlerConfigSource",
    "RECORD_EXTRACTOR_SOURCE",
  ].forEach((needle) => {
    assert(
      crawlerSharedText.includes(needle),
      `algolia/crawler/shared.js should include ${needle}`
    );
  });
  assert(
    indexSettings.attributeForDistinct === "url_without_anchor",
    "algolia/index-settings.json should set attributeForDistinct=url_without_anchor"
  );
  assert(
    JSON.stringify(indexSettings.attributesToSnippet) === JSON.stringify(["content:14"]),
    "algolia/index-settings.json should set attributesToSnippet=[\"content:14\"]"
  );
  ["transport", "operation_id", "canonical_target", "keywords"].forEach((attribute) => {
    assert(
      indexSettings.attributesToRetrieve.includes(attribute),
      `algolia/index-settings.json should retrieve ${attribute}`
    );
  });
  // Content must remain the last (lowest-priority) searchable attribute.
  const contentIndex = indexSettings.searchableAttributes.indexOf("content");
  assert(
    contentIndex === indexSettings.searchableAttributes.length - 1,
    "algolia/index-settings.json should keep content last in searchableAttributes"
  );
  // Machine-name search is prioritized (see commits 0db6469 + 67a9aab):
  // operation_id leads the searchable-attribute list so queries like
  // `view_account` rank the canonical endpoint above incidental mentions;
  // keywords sits second to carry synonym/tail matches above hierarchy
  // levels. canonical_target is retained as a filterOnly facet only.
  assert(
    indexSettings.searchableAttributes[0] === "unordered(operation_id)",
    "algolia/index-settings.json should rank operation_id first for machine-name search priority"
  );
  assert(
    indexSettings.searchableAttributes[1] === "unordered(keywords)",
    "algolia/index-settings.json should rank keywords second so synonyms/tails outrank hierarchy"
  );
  assert(
    !indexSettings.searchableAttributes.some((attr) => attr.includes("canonical_target")),
    "algolia/index-settings.json should keep canonical_target out of searchableAttributes (filterOnly facet only)"
  );
  assert(
    rules.every((rule) => String(rule.objectID || "").startsWith("fastnear-")),
    "algolia/rules.json should only contain fastnear-* object IDs"
  );
  assert(
    synonyms.every((synonym) => String(synonym.objectID || "").startsWith("fastnear-")),
    "algolia/synonyms.json should only contain fastnear-* object IDs"
  );
  assert(
    crawlerConfigText.trim() === renderCrawlerConfigSource().trim(),
    "algolia/docsearch-crawler.config.js should be generated from algolia/crawler/shared.js"
  );
  [
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
  ].forEach((routePattern) => {
    SUPPORTED_LOCALES.forEach((locale) => {
      const expectedUrl = buildCrawlerUrl(routePattern, locale);
      assert(
        crawlerPathsToMatch.includes(expectedUrl),
        `Crawler config should include ${expectedUrl} in pathsToMatch`
      );
    });
  });
  [
    "/transaction-flow",
    "/transaction-flow/**",
    "/rpcs/**",
    "/apis/**",
    "/**/*.md",
    "/structured-data/**",
  ].forEach((routePattern) => {
    SUPPORTED_LOCALES.forEach((locale) => {
      const expectedUrl = `!${buildCrawlerUrl(routePattern, locale)}`;
      assert(
        crawlerPathsToMatch.includes(expectedUrl),
        `Crawler config should exclude ${expectedUrl} from pathsToMatch`
      );
    });
  });
  SUPPORTED_LOCALES.forEach((locale) => {
    const expectedRootUrl = buildCrawlerUrl("/", locale);
    const expectedSitemapUrl = buildCrawlerUrl("/sitemap.xml", locale);
    assert(
      crawlerStartUrls.includes(expectedRootUrl),
      `Crawler config should include ${expectedRootUrl} in startUrls`
    );
    assert(
      crawlerSitemaps.includes(expectedSitemapUrl),
      `Crawler config should include ${expectedSitemapUrl} in sitemaps`
    );
  });
}

function auditDocsSource() {
  const docsFiles = walkDocs(DOCS_ROOT);
  const seenRoutes = new Map();
  const routeEntries = [];

  for (const filePath of docsFiles) {
    const rawContent = fs.readFileSync(filePath, "utf8");
    const frontmatter = parseFrontmatter(rawContent);
    const relativePath = path.relative(ROOT, filePath);
    const slug = frontmatter.slug;

    assert(slug, `Missing explicit slug in ${relativePath}`);
    assert(slug.startsWith("/"), `Slug must be absolute in ${relativePath}: ${slug}`);
    assert(frontmatter.description, `Missing description in ${relativePath}`);

    const route = normalizeRoute(slug);
    assert(route, `Could not normalize slug in ${relativePath}: ${slug}`);

    if (isHiddenDocsRoute(route)) {
      continue;
    }

    for (const prefix of DISALLOWED_CANONICAL_PREFIXES) {
      assert(
        route !== prefix && !route.startsWith(`${prefix}/`),
        `Legacy canonical route is still in use for ${relativePath}: ${route}`
      );
    }

    const existing = seenRoutes.get(route);
    assert(
      !existing,
      `Duplicate canonical docs route ${route} found in ${existing} and ${relativePath}`
    );
    seenRoutes.set(route, relativePath);

    const expectedDocsearchMeta = getDocsearchSemanticMeta(route);
    assert(
      expectedDocsearchMeta?.category,
      `No docsearch:category mapping exists for ${relativePath}: ${route}`
    );

    const fastnearOperationMatch = rawContent.match(
      /<FastnearDirectOperation[^>]+pageModelId=["']([^"']+)["']/
    );
    const hasFastnearOperation = Boolean(fastnearOperationMatch);
    routeEntries.push({
      expectedAudience: expectedDocsearchMeta.audience,
      expectedCategory: expectedDocsearchMeta.category,
      expectedFamily: expectedDocsearchMeta.family,
      expectedMethodType: expectedDocsearchMeta.methodType,
      expectedPageType: expectedDocsearchMeta.pageType,
      expectedPageSchemaType: getExpectedDocsPageSchemaType({
        hasFastnearOperation,
        route,
      }),
      expectedSurface: expectedDocsearchMeta.surface,
      hasFastnearOperation,
      operationPageModelId: fastnearOperationMatch?.[1] || null,
      relativePath,
      route,
    });
  }

  return { routeEntries, routes: [...seenRoutes.keys()] };
}

function getSitemapPath(locale = DEFAULT_LOCALE) {
  return locale === DEFAULT_LOCALE
    ? path.join(BUILD_ROOT, "sitemap.xml")
    : path.join(BUILD_ROOT, locale, "sitemap.xml");
}

function parseSitemapUrls(locale = DEFAULT_LOCALE) {
  const sitemapPath = getSitemapPath(locale);
  assert(fs.existsSync(sitemapPath), `Missing sitemap: ${path.relative(ROOT, sitemapPath)}`);
  const sitemapText = fs.readFileSync(sitemapPath, "utf8");

  return [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    normalizeComparableUrl(match[1])
  );
}

function auditAgentDiscoveryArtifacts() {
  assert(fs.existsSync(HEADERS_PATH), `Missing _headers: ${path.relative(ROOT, HEADERS_PATH)}`);
  const headersText = fs.readFileSync(HEADERS_PATH, "utf8");
  EXPECTED_HEADER_RULES.forEach(({ path: rulePath, lines }) => {
    assert(headersText.includes(`${rulePath}\n`), `_headers is missing the ${rulePath} rule`);
    lines.forEach((line) => {
      assert(
        headersText.includes(line),
        `_headers is missing "${line}" for ${rulePath}`
      );
    });
  });

  assert(
    fs.existsSync(API_CATALOG_PATH),
    `Missing API catalog: ${path.relative(ROOT, API_CATALOG_PATH)}`
  );
  const apiCatalog = loadJson(API_CATALOG_PATH, "API catalog");
  assert(Array.isArray(apiCatalog.linkset), "API catalog must expose a linkset array");
  const apiCatalogAnchors = apiCatalog.linkset.map((entry) => entry.anchor).sort();
  assert(
    JSON.stringify(apiCatalogAnchors) === JSON.stringify(EXPECTED_API_CATALOG_ANCHORS),
    `API catalog anchors are out of sync. Expected ${EXPECTED_API_CATALOG_ANCHORS.join(", ")}, got ${apiCatalogAnchors.join(", ")}`
  );
  apiCatalog.linkset.forEach((entry) => {
    ["service-desc", "service-doc", "status"].forEach((relation) => {
      assert(
        Array.isArray(entry[relation]) && entry[relation].length > 0,
        `API catalog entry ${entry.anchor} must include ${relation}`
      );
      entry[relation].forEach((target) => {
        assert(
          typeof target.href === "string" && /^https:\/\//.test(target.href),
          `API catalog entry ${entry.anchor} has an invalid ${relation} target`
        );
      });
    });
  });
  [
    "/openapi/fastnear.json",
    "/openapi/neardata.json",
  ].forEach((route) => {
    const filePath = routeToBuildAssetPath(route);
    assert(
      fs.existsSync(filePath),
      `Build is missing the vendored OpenAPI snapshot ${route}`
    );
  });

  assert(
    fs.existsSync(AGENT_SKILLS_INDEX_PATH),
    `Missing Agent Skills index: ${path.relative(ROOT, AGENT_SKILLS_INDEX_PATH)}`
  );
  const agentSkillsIndex = loadJson(AGENT_SKILLS_INDEX_PATH, "Agent Skills index");
  assert(
    agentSkillsIndex.$schema === "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    "Agent Skills index must use the v0.2.0 schema URI"
  );
  assert(Array.isArray(agentSkillsIndex.skills), "Agent Skills index must expose a skills array");
  const skillNames = agentSkillsIndex.skills.map((skill) => skill.name).sort();
  assert(
    JSON.stringify(skillNames) === JSON.stringify(EXPECTED_AGENT_SKILLS),
    `Agent Skills index names are out of sync. Expected ${EXPECTED_AGENT_SKILLS.join(", ")}, got ${skillNames.join(", ")}`
  );
  agentSkillsIndex.skills.forEach((skill) => {
    assert(skill.type === "skill-md", `Agent skill ${skill.name} must use type=skill-md`);
    assert(
      typeof skill.description === "string" && skill.description.length > 0,
      `Agent skill ${skill.name} must include a description`
    );
    assert(
      typeof skill.url === "string" && skill.url.startsWith("/.well-known/agent-skills/"),
      `Agent skill ${skill.name} must use a stable well-known URL`
    );
    const filePath = routeToBuildAssetPath(skill.url);
    assert(
      fs.existsSync(filePath),
      `Agent skill artifact is missing: ${path.relative(ROOT, filePath)}`
    );
    assert(
      skill.digest === sha256File(filePath),
      `Agent skill digest mismatch for ${skill.name}`
    );
    const content = fs.readFileSync(filePath, "utf8");
    assert(
      content.startsWith("---\n"),
      `Agent skill ${skill.name} must include YAML frontmatter`
    );
    assert(
      content.includes(`name: "${skill.name}"`) || content.includes(`name: '${skill.name}'`),
      `Agent skill ${skill.name} frontmatter must declare its name`
    );
  });
}

async function auditMarkdownDiscoveryWorker({ routeEntries, structuredGraph }) {
  assert(
    fs.existsSync(WORKER_SOURCE_PATH),
    `Missing worker source: ${path.relative(ROOT, WORKER_SOURCE_PATH)}`
  );
  const workerSource = fs.readFileSync(WORKER_SOURCE_PATH, "utf8");
  const workerModule = await import(
    `data:text/javascript;base64,${Buffer.from(workerSource, "utf8").toString("base64")}`
  );
  const workerFetch = workerModule?.default?.fetch;
  assert(typeof workerFetch === "function", "static/_worker.js must export a default fetch handler");

  const env = {
    ASSETS: {
      async fetch(request) {
        const url = new URL(request.url);
        const headers = new Headers();

        if (url.pathname.endsWith(".md")) {
          headers.set("Content-Type", "text/markdown; charset=utf-8");
          return new Response(`# ${url.pathname}\n`, {
            headers,
            status: 200,
          });
        }

        headers.set("Content-Type", "text/html; charset=utf-8");
        return new Response(`<!doctype html><html><body>${url.pathname}</body></html>`, {
          headers,
          status: 200,
        });
      },
    },
  };

  const visibleOperations = structuredGraph.operations.filter(
    (operation) => !isHiddenCanonicalRoute(operation.canonicalPath)
  );
  const localizedRoutes = [
    ...routeEntries.map((entry) => entry.route),
    ...visibleOperations.map((operation) => operation.canonicalPath),
  ];

  for (const locale of SUPPORTED_LOCALES) {
    for (const route of localizedRoutes) {
      const localizedRoute = localizeRoute(route, locale);
      const response = await workerFetch(new Request(buildLocalizedProductionUrl(route, locale)), env);
      const link = response.headers.get("Link") || "";
      assert(
        link.includes(
          `<${getExpectedMarkdownMirrorPath(localizedRoute)}>; rel="alternate"; type="text/markdown"`
        ),
        `Worker should advertise markdown alternate for ${localizedRoute}`
      );
      assert(
        response.headers.get("Vary")?.toLowerCase().includes("accept"),
        `Worker should add Vary: Accept for ${localizedRoute}`
      );
    }
  }

  const discoveryChecks = [
    {
      route: "/",
      expectedLinks: EXPECTED_ROOT_LINK_HEADERS,
    },
    {
      route: "/ru",
      expectedLinks: EXPECTED_RU_LINK_HEADERS,
    },
    {
      route: "/rpc/account/view-account",
      expectedLinks: EXPECTED_RPC_LINK_HEADERS,
    },
    {
      route: "/ru/rpc/account/view-account",
      expectedLinks: EXPECTED_RU_RPC_LINK_HEADERS,
    },
    {
      route: "/api/v1/account-full",
      expectedLinks: EXPECTED_API_LINK_HEADERS,
    },
    {
      route: "/ru/api/v1/account-full",
      expectedLinks: EXPECTED_RU_API_LINK_HEADERS,
    },
    {
      route: "/neardata/last-block-final",
      expectedLinks: EXPECTED_NEARDATA_LINK_HEADERS,
    },
    {
      route: "/ru/neardata/last-block-final",
      expectedLinks: EXPECTED_RU_NEARDATA_LINK_HEADERS,
    },
    {
      route: "/agents",
      expectedLinks: EXPECTED_AGENTS_LINK_HEADERS,
    },
    {
      route: "/ru/agents",
      expectedLinks: EXPECTED_RU_AGENTS_LINK_HEADERS,
    },
    {
      route: "/auth",
      expectedLinks: EXPECTED_AUTH_LINK_HEADERS,
    },
    {
      route: "/ru/auth",
      expectedLinks: EXPECTED_RU_AUTH_LINK_HEADERS,
    },
  ];

  for (const { route, expectedLinks } of discoveryChecks) {
    const htmlResponse = await workerFetch(new Request(`${PRODUCTION_SITE_URL}${route}`), env);
    const markdownResponse = await workerFetch(
      new Request(`${PRODUCTION_SITE_URL}${route}`, {
        headers: {
          Accept: "text/markdown",
        },
      }),
      env
    );

    const htmlLinks = htmlResponse.headers.get("Link") || "";
    const markdownLinks = markdownResponse.headers.get("Link") || "";

    expectedLinks.forEach((line) => {
      const linkValue = stripHeaderName(line);
      assert(htmlLinks.includes(linkValue), `Worker should add ${linkValue} to HTML route ${route}`);
      assert(
        markdownLinks.includes(linkValue),
        `Worker should preserve ${linkValue} on markdown route ${route}`
      );
    });

    assert(
      markdownResponse.headers.get("Content-Type")?.includes("text/markdown"),
      `Worker should return markdown content-type for ${route}`
    );
  }

  const headResponse = await workerFetch(
    new Request(`${PRODUCTION_SITE_URL}/rpc/account/view-account`, {
      method: "HEAD",
    }),
    env
  );
  assert(
    (headResponse.headers.get("Link") || "").includes(
      '</rpc/account/view-account.md>; rel="alternate"; type="text/markdown"'
    ),
    "Worker should advertise markdown alternate on HEAD responses"
  );
}

function auditDocsBuildOutput(routeEntries, structuredGraph) {
  const pageModels = loadJson(PAGE_MODELS_PATH, "generated FastNear page models");
  const pageModelsById = Object.fromEntries(
    pageModels.map((pageModel) => [pageModel.pageModelId, pageModel])
  );

  assert(fs.existsSync(ROBOTS_PATH), `Missing robots.txt: ${path.relative(ROOT, ROBOTS_PATH)}`);
  const robotsText = fs.readFileSync(ROBOTS_PATH, "utf8");

  assert(
    robotsText.includes(`Sitemap: ${PRODUCTION_SITE_URL}/sitemap.xml`),
    "robots.txt must advertise the production sitemap URL"
  );
  SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).forEach((locale) => {
    assert(
      robotsText.includes(`Sitemap: ${PRODUCTION_SITE_URL}/${locale}/sitemap.xml`),
      `robots.txt must advertise the localized sitemap URL for ${locale}`
    );
  });
  REQUIRED_ROBOTS_USER_AGENTS.forEach((userAgent) => {
    assert(
      robotsText.includes(`User-agent: ${userAgent}`),
      `robots.txt must explicitly allow ${userAgent}`
    );
  });
  assert(
    robotsText.includes(EXPECTED_CONTENT_SIGNAL),
    "robots.txt must declare the agreed Content-Signal policy"
  );
  auditAgentDiscoveryArtifacts();

  assert(fs.existsSync(REDIRECTS_PATH), `Missing redirects file: ${path.relative(ROOT, REDIRECTS_PATH)}`);
  const redirectsText = fs.readFileSync(REDIRECTS_PATH, "utf8");
  REQUIRED_REDIRECT_LINES.forEach((line) => {
    assert(redirectsText.includes(line), `_redirects is missing "${line}"`);
  });

  const indexNowKeyFile = findIndexNowKeyFile(BUILD_ROOT);
  assert(indexNowKeyFile, "build is missing the root IndexNow key file");
  const indexNowKey = fs
    .readFileSync(path.join(BUILD_ROOT, indexNowKeyFile.name), "utf8")
    .trim();
  assert(
    indexNowKeyFile.name.toLowerCase() === `${indexNowKey.toLowerCase()}.txt`,
    "IndexNow key file contents must match the filename"
  );

  SUPPORTED_LOCALES.forEach((locale) => {
    const sitemapPath = getSitemapPath(locale);
    const sitemapUrls = parseSitemapUrls(locale);

    REQUIRED_SITEMAP_ROUTES.forEach((route) => {
      if (isHiddenDocsRoute(route)) {
        return;
      }

      const localizedUrl = buildLocalizedProductionUrl(route, locale);
      assert(
        sitemapUrls.includes(localizedUrl),
        `${path.relative(ROOT, sitemapPath)} is missing required canonical route ${localizeRoute(route, locale)}`
      );
    });

    EXCLUDED_SITEMAP_ROUTES.forEach((route) => {
      const localizedUrl = buildLocalizedProductionUrl(route, locale);
      assert(
        !sitemapUrls.includes(localizedUrl),
        `${path.relative(ROOT, sitemapPath)} should exclude low-value route ${localizeRoute(route, locale)}`
      );
    });
    EXCLUDED_SITEMAP_ROUTE_PREFIXES.forEach((routePrefix) => {
      const localizedPrefixUrl = buildLocalizedProductionUrl(routePrefix, locale);
      assert(
        !sitemapUrls.some(
          (url) => url === localizedPrefixUrl || url.startsWith(`${localizedPrefixUrl}/`)
        ),
        `${path.relative(ROOT, sitemapPath)} should exclude hidden route prefix ${localizeRoute(routePrefix, locale)}`
      );
    });

    assert(
      !sitemapUrls.some((url) => url.includes("/blog/")),
      `${path.relative(ROOT, sitemapPath)} should not include blog routes for builder-docs`
    );
    assert(
      !sitemapUrls.some((url) => url.includes("/rpcs/") || url.includes("/apis/")),
      `${path.relative(ROOT, sitemapPath)} should prefer root-mounted public docs routes over hosted /rpcs or /apis routes`
    );

    const sitemapText = fs.readFileSync(sitemapPath, "utf8");
    if (locale === DEFAULT_LOCALE) {
      assert(
        sitemapText.includes("<lastmod>"),
        `${path.relative(ROOT, sitemapPath)} should include lastmod metadata`
      );
    }
    assert(
      !sitemapText.includes("<changefreq>"),
      `${path.relative(ROOT, sitemapPath)} should omit changefreq noise`
    );
    assert(
      !sitemapText.includes("<priority>"),
      `${path.relative(ROOT, sitemapPath)} should omit priority noise`
    );
  });

  const operationsByDocsPath = Object.fromEntries(
    structuredGraph.operations.map((operation) => [normalizeRoute(operation.docsPath), operation])
  );

  routeEntries.forEach((entry) => {
    SUPPORTED_LOCALES.forEach((locale) => {
      const localizedRoute = localizeRoute(entry.route, locale);
      const htmlPath = routeToBuildHtmlPath(localizedRoute);
      assert(
        fs.existsSync(htmlPath),
        `Built HTML missing for docs route ${localizedRoute} (${entry.relativePath})`
      );

      const html = fs.readFileSync(htmlPath, "utf8");
      const jsonLdNodes = flattenJsonLdNodes(parseJsonLdScripts(html, localizedRoute));
      const localePattern = new RegExp(
        `<meta[^>]+name="docusaurus_locale"[^>]+content="${locale}"[^>]*>`,
        "i"
      );
      assert(
        localePattern.test(html),
        `Docs page is missing docusaurus_locale=${locale}: ${localizedRoute} (${entry.relativePath})`
      );
      const languagePattern = new RegExp(
        `<meta[^>]+name="docsearch:language"[^>]+content="${locale}"[^>]*>`,
        "i"
      );
      assert(
        languagePattern.test(html),
        `Docs page is missing docsearch:language=${locale}: ${localizedRoute} (${entry.relativePath})`
      );
      const categoryPattern = new RegExp(
        `<meta[^>]+name="docsearch:category"[^>]+content="${entry.expectedCategory}"[^>]*>`,
        "i"
      );
      assert(
        categoryPattern.test(html),
        `Docs page is missing docsearch:category=${entry.expectedCategory}: ${localizedRoute} (${entry.relativePath})`
      );
      const surfacePattern = new RegExp(
        `<meta[^>]+name="docsearch:surface"[^>]+content="${entry.expectedSurface}"[^>]*>`,
        "i"
      );
      assert(
        surfacePattern.test(html),
        `Docs page is missing docsearch:surface=${entry.expectedSurface}: ${localizedRoute} (${entry.relativePath})`
      );
      const audiencePattern = new RegExp(
        `<meta[^>]+name="docsearch:audience"[^>]+content="${entry.expectedAudience}"[^>]*>`,
        "i"
      );
      assert(
        audiencePattern.test(html),
        `Docs page is missing docsearch:audience=${entry.expectedAudience}: ${localizedRoute} (${entry.relativePath})`
      );
      const pageTypePattern = new RegExp(
        `<meta[^>]+name="docsearch:page_type"[^>]+content="${entry.expectedPageType}"[^>]*>`,
        "i"
      );
      assert(
        pageTypePattern.test(html),
        `Docs page is missing docsearch:page_type=${entry.expectedPageType}: ${localizedRoute} (${entry.relativePath})`
      );

      if (entry.expectedMethodType) {
        const methodPattern = new RegExp(
          `<meta[^>]+name="docsearch:method_type"[^>]+content="${entry.expectedMethodType}"[^>]*>`,
          "i"
        );
        assert(
          methodPattern.test(html),
          `Docs page is missing docsearch:method_type=${entry.expectedMethodType}: ${localizedRoute} (${entry.relativePath})`
        );
      } else {
        assert(
          !html.includes('name="docsearch:method_type"'),
          `Guide page should not emit docsearch:method_type: ${localizedRoute} (${entry.relativePath})`
        );
      }

      if (entry.expectedFamily) {
        const familyPattern = new RegExp(
          `<meta[^>]+name="docsearch:family"[^>]+content="${entry.expectedFamily}"[^>]*>`,
          "i"
        );
        assert(
          familyPattern.test(html),
          `Docs page is missing docsearch:family=${entry.expectedFamily}: ${localizedRoute} (${entry.relativePath})`
        );
      } else {
        assert(
          !html.includes('name="docsearch:family"'),
          `Guide page should not emit docsearch:family: ${localizedRoute} (${entry.relativePath})`
        );
      }

      assert(
        html.includes('data-fastnear-crawler-root="docs"'),
        `Docs page is missing the stable crawler root attribute: ${localizedRoute} (${entry.relativePath})`
      );
      assert(
        html.includes(`data-fastnear-surface="${entry.expectedSurface}"`),
        `Docs page is missing data-fastnear-surface=${entry.expectedSurface}: ${localizedRoute} (${entry.relativePath})`
      );
      assert(
        html.includes(`data-fastnear-audience="${entry.expectedAudience}"`),
        `Docs page is missing data-fastnear-audience=${entry.expectedAudience}: ${localizedRoute} (${entry.relativePath})`
      );
      assert(
        html.includes(`data-fastnear-page-type="${entry.expectedPageType}"`),
        `Docs page is missing data-fastnear-page-type=${entry.expectedPageType}: ${localizedRoute} (${entry.relativePath})`
      );

      assert(
        html.includes(`"@type":"${entry.expectedPageSchemaType}"`),
        `Docs page is missing ${entry.expectedPageSchemaType} JSON-LD: ${localizedRoute} (${entry.relativePath})`
      );
      assert(
        html.includes(`"url":"${buildLocalizedProductionUrl(entry.route, locale)}"`),
        `Docs page JSON-LD is missing its canonical URL: ${localizedRoute} (${entry.relativePath})`
      );
      assert(
        countOccurrences(html, /"@type":"BreadcrumbList"/g) === 1,
        `Docs page should emit exactly one BreadcrumbList JSON-LD block: ${localizedRoute} (${entry.relativePath})`
      );
      assertGlobalStructuredDataNodes(jsonLdNodes, `${localizedRoute} (${entry.relativePath})`);

      const pageNodeId = `${buildLocalizedProductionUrl(entry.route, locale)}#page`;
      const pageNode = findNodeById(jsonLdNodes, pageNodeId);
      assert(pageNode, `Docs page is missing its page entity node: ${localizedRoute} (${entry.relativePath})`);
      assert(
        pageNode["@type"] === entry.expectedPageSchemaType,
        `Docs page page entity has the wrong type: ${localizedRoute} (${entry.relativePath})`
      );
      assert(
        pageNode.url === buildLocalizedProductionUrl(entry.route, locale),
        `Docs page entity has the wrong canonical URL: ${localizedRoute} (${entry.relativePath})`
      );
      assert(
        getNodeRefId(pageNode.isPartOf) === WEBSITE_ID,
        `Docs page entity should point isPartOf to the global WebSite node: ${localizedRoute} (${entry.relativePath})`
      );
      assert(
        getNodeRefId(pageNode.publisher) === ORGANIZATION_ID,
        `Docs page entity should point publisher to the global Organization node: ${localizedRoute} (${entry.relativePath})`
      );
      assert(
        pageNode.inLanguage === locale,
        `Docs page entity should emit inLanguage=${locale}: ${localizedRoute} (${entry.relativePath})`
      );
      if (locale === DEFAULT_LOCALE && pageNode.dateModified) {
        assert(
          html.includes('itemprop="dateModified"') || html.includes('itemProp="dateModified"'),
          `Docs page should show a visible last-updated date: ${localizedRoute} (${entry.relativePath})`
        );
      }

      if (entry.hasFastnearOperation) {
        const operation = operationsByDocsPath[entry.route];
        const pageModel = pageModelsById[entry.operationPageModelId];
        assert(operation, `Missing structured operation registry entry for docs route ${entry.route}`);
        assert(
          pageModel,
          `Missing page model ${entry.operationPageModelId} for docs route ${entry.route}`
        );
        const operationEntityId = `${PRODUCTION_SITE_URL}/structured-data/operations/${operation.pageModelId}`;
        const familyEntityId = `${PRODUCTION_SITE_URL}/structured-data/families/${operation.familyId}`;
        const expectedTransport = pageModel.route?.transport || null;
        const expectedOperationId = pageModel.info?.operationId || null;
        const expectedCanonicalTarget = getExpectedOperationDocsearchCanonicalTarget(pageModel);

        assert(
          html.includes('name="keywords"'),
          `Operation docs page is missing keyword metadata: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          expectedTransport && buildMetaPattern("docsearch:transport", expectedTransport).test(html),
          `Operation docs page is missing docsearch:transport=${expectedTransport}: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          expectedOperationId &&
            buildMetaPattern("docsearch:operation_id", expectedOperationId).test(html),
          `Operation docs page is missing docsearch:operation_id=${expectedOperationId}: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          expectedCanonicalTarget &&
            buildMetaPattern("docsearch:canonical_target", expectedCanonicalTarget).test(html),
          `Operation docs page is missing docsearch:canonical_target=${expectedCanonicalTarget}: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          html.includes('"@type":"APIReference"'),
          `Operation docs page is missing APIReference JSON-LD: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          html.includes('"@type":"WebAPI"'),
          `Operation docs page is missing WebAPI JSON-LD: ${localizedRoute} (${entry.relativePath})`
        );

        assert(
          getNodeRefId(pageNode.mainEntity) === operationEntityId,
          `Operation docs page should point mainEntity to ${operationEntityId}: ${localizedRoute} (${entry.relativePath})`
        );

        const operationNode = findNodeById(jsonLdNodes, operationEntityId);
        assert(operationNode, `Operation docs page is missing APIReference node ${operationEntityId}`);
        assert(
          getNodeRefId(operationNode.isPartOf) === familyEntityId,
          `APIReference node should point isPartOf to ${familyEntityId}: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          getNodeRefId(operationNode.mainEntityOfPage) === pageNodeId,
          `APIReference node should point mainEntityOfPage to ${pageNodeId}: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          getNodeRefIds(operationNode.subjectOf).includes(pageNodeId),
          `APIReference node should include the docs page in subjectOf: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          getNodeRefIds(operationNode.subjectOf).includes(
            `${buildLocalizedProductionUrl(operation.canonicalPath, locale)}#page`
          ),
          `APIReference node should include the hosted page in subjectOf: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          operationNode.inLanguage === locale,
          `APIReference node should emit inLanguage=${locale}: ${localizedRoute} (${entry.relativePath})`
        );

        const familyNode = findNodeById(jsonLdNodes, familyEntityId);
        assert(familyNode, `Operation docs page is missing WebAPI node ${familyEntityId}`);
        assert(
          getNodeRefId(familyNode.provider) === ORGANIZATION_ID,
          `WebAPI node should point provider to the global Organization node: ${localizedRoute} (${entry.relativePath})`
        );
        assert(
          familyNode.documentation === buildLocalizedProductionUrl(
            structuredGraph.families.find((family) => family.id === operation.familyId).docsPath,
            locale
          ),
          `WebAPI node should point documentation to the family docs page: ${localizedRoute} (${entry.relativePath})`
        );
      }
    });
  });

  SUPPORTED_LOCALES.forEach((locale) => {
    const representativeDocsHtml = fs.readFileSync(
      routeToBuildHtmlPath(localizeRoute("/rpc", locale)),
      "utf8"
    );
    assert(
      representativeDocsHtml.includes('"@type":"WebSite"'),
      `Built docs HTML should include the global WebSite JSON-LD block for ${locale}`
    );
    assert(
      representativeDocsHtml.includes('"@type":"Organization"'),
      `Built docs HTML should include the global Organization JSON-LD block for ${locale}`
    );
    assert(
      representativeDocsHtml.includes(
        `"logo":"${PRODUCTION_SITE_URL}/img/fastnear_logo_black.png"`
      ),
      `Built docs HTML should include the stable docs-hosted Organization logo for ${locale}`
    );
  });
}

function auditHostedBuildOutput(structuredGraph) {
  const visibleOperations = structuredGraph.operations.filter(
    (operation) => !isHiddenCanonicalRoute(operation.canonicalPath)
  );

  visibleOperations.forEach((operation) => {
    SUPPORTED_LOCALES.forEach((locale) => {
      const localizedCanonicalPath = localizeRoute(operation.canonicalPath, locale);
      const htmlPath = routeToBuildHtmlPath(localizedCanonicalPath);
      assert(
        fs.existsSync(htmlPath),
        `Built HTML missing for hosted route ${localizedCanonicalPath}`
      );

      const html = fs.readFileSync(htmlPath, "utf8");
      const jsonLdNodes = flattenJsonLdNodes(parseJsonLdScripts(html, localizedCanonicalPath));
      assert(
        html.includes('name="robots" content="noindex"'),
        `Hosted route must remain noindex: ${localizedCanonicalPath}`
      );
      assert(
        html.includes('"@type":"WebPage"'),
        `Hosted route is missing WebPage JSON-LD: ${localizedCanonicalPath}`
      );
      assert(
        html.includes('"@type":"APIReference"'),
        `Hosted route is missing APIReference JSON-LD: ${localizedCanonicalPath}`
      );
      assert(
        html.includes('"@type":"WebAPI"'),
        `Hosted route is missing WebAPI JSON-LD: ${localizedCanonicalPath}`
      );
      assert(
        countOccurrences(html, /"@type":"BreadcrumbList"/g) === 1,
        `Hosted route should emit exactly one BreadcrumbList JSON-LD block: ${localizedCanonicalPath}`
      );

      assertGlobalStructuredDataNodes(jsonLdNodes, localizedCanonicalPath);

      const pageNodeId = `${buildLocalizedProductionUrl(operation.canonicalPath, locale)}#page`;
      const operationEntityId = `${PRODUCTION_SITE_URL}/structured-data/operations/${operation.pageModelId}`;
      const familyEntityId = `${PRODUCTION_SITE_URL}/structured-data/families/${operation.familyId}`;
      const pageNode = findNodeById(jsonLdNodes, pageNodeId);
      assert(pageNode, `Hosted route is missing its page entity node: ${localizedCanonicalPath}`);
      assert(
        getNodeRefId(pageNode.mainEntity) === operationEntityId,
        `Hosted route should point mainEntity to ${operationEntityId}: ${localizedCanonicalPath}`
      );
      assert(
        getNodeRefIds(pageNode.about).includes(familyEntityId),
        `Hosted route should point about to ${familyEntityId}: ${localizedCanonicalPath}`
      );
      assert(
        pageNode.inLanguage === locale,
        `Hosted route page entity should emit inLanguage=${locale}: ${localizedCanonicalPath}`
      );

      const operationNode = findNodeById(jsonLdNodes, operationEntityId);
      assert(operationNode, `Hosted route is missing APIReference node ${operationEntityId}`);
      assert(
        getNodeRefId(operationNode.mainEntityOfPage) === `${buildLocalizedProductionUrl(operation.docsPath, locale)}#page`,
        `Hosted route APIReference should point mainEntityOfPage to the docs page: ${localizedCanonicalPath}`
      );
      assert(
        getNodeRefIds(operationNode.subjectOf).includes(pageNodeId),
        `Hosted route APIReference should include the hosted page in subjectOf: ${localizedCanonicalPath}`
      );
    });
  });

  ["/transaction-flow", "/transaction-flow/foundations"].forEach((route) => {
    SUPPORTED_LOCALES.forEach((locale) => {
      const localizedRoute = localizeRoute(route, locale);
      const htmlPath = routeToBuildHtmlPath(localizedRoute);
      assert(
        fs.existsSync(htmlPath),
        `Built HTML missing for hidden docs route ${localizedRoute}`
      );

      const html = fs.readFileSync(htmlPath, "utf8");
      assert(
        html.includes('name="robots" content="noindex"'),
        `Hidden docs route must remain noindex: ${localizedRoute}`
      );
    });
  });
}

function auditGeneratedTextArtifacts({ routeEntries, structuredGraph }) {
  SUPPORTED_LOCALES.forEach((locale) => {
    const textArtifactPaths = [
      path.join(BUILD_ROOT, localizeRoute("/llms.txt", locale)),
      path.join(BUILD_ROOT, localizeRoute("/llms-full.txt", locale)),
      path.join(BUILD_ROOT, localizeRoute("/guides/llms.txt", locale)),
      path.join(BUILD_ROOT, localizeRoute("/rpcs/llms.txt", locale)),
      path.join(BUILD_ROOT, localizeRoute("/apis/llms.txt", locale)),
    ];

    textArtifactPaths.forEach((filePath) => {
      assert(fs.existsSync(filePath), `Missing generated text artifact: ${path.relative(ROOT, filePath)}`);
      const content = fs.readFileSync(filePath, "utf8");
      assert(
        content.includes(PRODUCTION_SITE_URL),
        `${path.basename(filePath)} should use production absolute URLs`
      );
      assert(
        !/\]\(\/[^)]+\)/.test(content),
        `${path.basename(filePath)} should not contain root-relative markdown links`
      );
      if (locale !== DEFAULT_LOCALE) {
        assert(
          content.includes(`${PRODUCTION_SITE_URL}/${locale}/`),
          `${path.basename(filePath)} should point at localized ${locale} URLs`
        );
      }
    });
  });

  SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).forEach((locale) => {
    const nestedLocaleRoot = path.join(BUILD_ROOT, locale, locale);
    assert(
      !fs.existsSync(nestedLocaleRoot),
      `Localized build output should not keep a nested locale artifact root: ${path.relative(ROOT, nestedLocaleRoot)}`
    );
  });

  const visibleOperations = structuredGraph.operations.filter(
    (operation) => !isHiddenCanonicalRoute(operation.canonicalPath)
  );

  SUPPORTED_LOCALES.forEach((locale) => {
    [...routeEntries.map((entry) => localizeRoute(entry.route, locale)), ...visibleOperations.map((operation) => localizeRoute(operation.canonicalPath, locale))].forEach(
      (route) => {
        const preferredPath = routeToBuildAssetPath(getExpectedMarkdownMirrorPath(route));
        const legacyPath = routeToBuildAssetPath(getLegacyMarkdownMirrorPath(route));

        assert(
          fs.existsSync(preferredPath),
          `Missing preferred markdown mirror for ${route}: ${path.relative(ROOT, preferredPath)}`
        );
        assert(
          fs.existsSync(legacyPath),
          `Missing legacy markdown mirror for ${route}: ${path.relative(ROOT, legacyPath)}`
        );
      }
    );
  });
}

function auditSiteGraphArtifact({ routeEntries, structuredGraph }) {
  const visibleOperations = structuredGraph.operations.filter(
    (operation) => !isHiddenCanonicalRoute(operation.canonicalPath)
  );
  const visibleFamilyIds = [...new Set(visibleOperations.map((operation) => operation.familyId))].sort();

  SUPPORTED_LOCALES.forEach((locale) => {
    const siteGraph = loadJson(getSiteGraphPath(locale), `site graph artifact (${locale})`);

    assert(siteGraph.version === 1, `site-graph.json should use version 1 for ${locale}`);
    assert(siteGraph.website?.["@type"] === "WebSite", `site-graph.json is missing the WebSite entity for ${locale}`);
    assert(siteGraph.website?.["@id"] === WEBSITE_ID, `site-graph.json has the wrong WebSite @id for ${locale}`);
    assert(
      siteGraph.website?.url === PRODUCTION_SITE_URL,
      `site-graph.json has the wrong WebSite URL for ${locale}`
    );
    assert(
      siteGraph.website?.publisher?.["@id"] === ORGANIZATION_ID,
      `site-graph.json should link the WebSite publisher to the Organization node for ${locale}`
    );
    assert(siteGraph.website?.inLanguage === locale, `site-graph.json should emit website inLanguage=${locale}`);
    assert(
      siteGraph.organization?.["@type"] === "Organization",
      `site-graph.json is missing the Organization entity for ${locale}`
    );
    assert(
      siteGraph.organization?.["@id"] === ORGANIZATION_ID,
      `site-graph.json has the wrong Organization @id for ${locale}`
    );
    assert(
      siteGraph.organization?.logo === `${PRODUCTION_SITE_URL}/img/fastnear_logo_black.png`,
      `site-graph.json should use the stable docs-hosted logo URL for ${locale}`
    );

    assert(Array.isArray(siteGraph.families), `site-graph.json families must be an array for ${locale}`);
    assert(Array.isArray(siteGraph.operations), `site-graph.json operations must be an array for ${locale}`);
    assert(Array.isArray(siteGraph.pages), `site-graph.json pages must be an array for ${locale}`);

    const familyIds = siteGraph.families.map((family) => family.id).sort();
    assert(
      JSON.stringify(familyIds) === JSON.stringify(visibleFamilyIds),
      `site-graph.json family set is out of sync for ${locale}. Expected ${visibleFamilyIds.join(", ")}, got ${familyIds.join(", ")}`
    );
    assert(
      siteGraph.operations.length === visibleOperations.length,
      `site-graph.json should contain ${visibleOperations.length} operations for ${locale}, got ${siteGraph.operations.length}`
    );
    assert(
      siteGraph.pages.length === routeEntries.length + visibleOperations.length,
      `site-graph.json should contain ${routeEntries.length + visibleOperations.length} pages for ${locale}, got ${siteGraph.pages.length}`
    );

    const pagesByRoute = Object.fromEntries(siteGraph.pages.map((page) => [page.route, page]));

    routeEntries.forEach((entry) => {
      const localizedRoute = localizeRoute(entry.route, locale);
      const page = pagesByRoute[localizedRoute];
      assert(page, `site-graph.json is missing docs page ${localizedRoute}`);
      assert(page.routeType === "docs", `Docs page has wrong routeType in site-graph.json: ${localizedRoute}`);
      assert(page.indexable === true, `Docs page should be indexable in site-graph.json: ${localizedRoute}`);
      assert(
        page.pageSchemaType === entry.expectedPageSchemaType,
        `Docs page has wrong pageSchemaType in site-graph.json: ${localizedRoute}`
      );
      assert(
        page.markdownMirrorUrl === getExpectedMarkdownMirrorUrl(localizedRoute),
        `Docs page has wrong markdownMirrorUrl in site-graph.json: ${localizedRoute}`
      );
    });

    visibleOperations.forEach((operation) => {
      const localizedCanonicalPath = localizeRoute(operation.canonicalPath, locale);
      const page = pagesByRoute[localizedCanonicalPath];
      assert(page, `site-graph.json is missing hosted page ${localizedCanonicalPath}`);
      assert(
        page.routeType === (operation.canonicalPath.startsWith("/rpcs/") ? "hosted-rpc" : "hosted-api"),
        `Hosted page has wrong routeType in site-graph.json: ${localizedCanonicalPath}`
      );
      assert(
        page.indexable === false,
        `Hosted page should be non-indexable in site-graph.json: ${localizedCanonicalPath}`
      );
      assert(
        page.pageSchemaType === "WebPage",
        `Hosted page should use WebPage in site-graph.json: ${localizedCanonicalPath}`
      );
      assert(
        page.markdownMirrorUrl === getExpectedMarkdownMirrorUrl(localizedCanonicalPath),
        `Hosted page has wrong markdownMirrorUrl in site-graph.json: ${localizedCanonicalPath}`
      );
      assert(
        page.entityIds?.mainEntityId ===
          buildExpectedSiteGraphOperationEntityId(operation.pageModelId, locale),
        `Hosted page has wrong mainEntityId in site-graph.json: ${localizedCanonicalPath}`
      );
    });

    siteGraph.families.forEach((family) => {
      assert(
        family["@id"] === buildExpectedSiteGraphFamilyEntityId(family.id, locale),
        `site-graph.json family ${family.id} should use an anchored @id in ${locale}`
      );
      assert(
        family.providerId === ORGANIZATION_ID,
        `site-graph.json family ${family.id} should point providerId to the Organization node`
      );
      assert(
        family.docsPageId === `${PRODUCTION_SITE_URL}${family.docsPath}#page`,
        `site-graph.json family ${family.id} should expose docsPageId for its collection page`
      );
      assert(
        family.documentationUrl === `${PRODUCTION_SITE_URL}${family.docsPath}`,
        `site-graph.json family ${family.id} should expose documentationUrl for its docs page`
      );
    });

    siteGraph.operations.forEach((operation) => {
      assert(
        operation["@id"] === buildExpectedSiteGraphOperationEntityId(operation.pageModelId, locale),
        `site-graph.json operation ${operation.pageModelId} should use an anchored @id in ${locale}`
      );
      assert(
        operation.familyEntityId === buildExpectedSiteGraphFamilyEntityId(operation.familyId, locale),
        `site-graph.json operation ${operation.pageModelId} should use an anchored familyEntityId`
      );
      assert(
        operation.publisherId === ORGANIZATION_ID,
        `site-graph.json operation ${operation.pageModelId} should point publisherId to the Organization node`
      );
      assert(
        operation.mainEntityOfPageId === `${PRODUCTION_SITE_URL}${operation.docsPath}#page`,
        `site-graph.json operation ${operation.pageModelId} should expose mainEntityOfPageId for the docs page`
      );
      assert(
        operation.docsPageId === `${PRODUCTION_SITE_URL}${operation.docsPath}#page`,
        `site-graph.json operation ${operation.pageModelId} should expose docsPageId for the docs page`
      );
      assert(
        operation.canonicalPageId === `${PRODUCTION_SITE_URL}${operation.canonicalPath}#page`,
        `site-graph.json operation ${operation.pageModelId} should expose canonicalPageId for the hosted page`
      );
      assert(
        Array.isArray(operation.subjectOfPageIds) &&
          operation.subjectOfPageIds.includes(`${PRODUCTION_SITE_URL}${operation.docsPath}#page`) &&
          operation.subjectOfPageIds.includes(`${PRODUCTION_SITE_URL}${operation.canonicalPath}#page`),
        `site-graph.json operation ${operation.pageModelId} should expose both docs and hosted subjectOfPageIds`
      );
      assert(
        operation.inLanguage === locale,
        `site-graph.json operation ${operation.pageModelId} should emit inLanguage=${locale}`
      );
    });

    assert(
      !JSON.stringify(siteGraph).includes('"/structured-data/families/'),
      `site-graph.json should not reference nonexistent /structured-data/families URLs for ${locale}`
    );
    assert(
      !JSON.stringify(siteGraph).includes('"/structured-data/operations/'),
      `site-graph.json should not reference nonexistent /structured-data/operations URLs for ${locale}`
    );

    assert(
      siteGraph.discovery?.llmsIndexUrl === buildLocalizedProductionUrl("/llms.txt", locale),
      `site-graph.json should advertise ${localizeRoute("/llms.txt", locale)}`
    );
    assert(
      siteGraph.discovery?.llmsFullUrl === buildLocalizedProductionUrl("/llms-full.txt", locale),
      `site-graph.json should advertise ${localizeRoute("/llms-full.txt", locale)}`
    );
    assert(
      siteGraph.discovery?.docsLlmsIndexUrl === buildLocalizedProductionUrl("/guides/llms.txt", locale),
      `site-graph.json should advertise ${localizeRoute("/guides/llms.txt", locale)}`
    );
  });
}

async function main() {
  auditConfigSurface();
  const structuredGraph = loadJson(STRUCTURED_GRAPH_PATH, "structured graph registry");
  const { routeEntries, routes } = auditDocsSource();
  auditDocsBuildOutput(routeEntries, structuredGraph);
  auditHostedBuildOutput(structuredGraph);
  auditGeneratedTextArtifacts({ routeEntries, structuredGraph });
  auditSiteGraphArtifact({ routeEntries, structuredGraph });
  await auditMarkdownDiscoveryWorker({ routeEntries, structuredGraph });

  console.log(
    `Indexing surface audit passed for ${routes.length} explicit docs routes, ${routeEntries.filter((entry) => entry.hasFastnearOperation).length} docs operation pages, and ${structuredGraph.operations.filter((operation) => !isHiddenCanonicalRoute(operation.canonicalPath)).length} hosted operation pages.`
  );
}

main().catch((error) => {
  console.error(`Indexing surface audit failed: ${error.message}`);
  process.exitCode = 1;
});

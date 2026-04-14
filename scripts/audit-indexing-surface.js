#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(ROOT, "docs");
const BUILD_ROOT = path.join(ROOT, "build");
const CONFIG_PATH = path.join(ROOT, "docusaurus.config.js");
const ROBOTS_PATH = path.join(BUILD_ROOT, "robots.txt");
const SITEMAP_PATH = path.join(BUILD_ROOT, "sitemap.xml");
const SITE_GRAPH_PATH = path.join(BUILD_ROOT, "structured-data/site-graph.json");
const STRUCTURED_GRAPH_PATH = path.join(ROOT, "src/data/generatedFastnearStructuredGraph.json");
const PRODUCTION_SITE_URL = "https://docs.fastnear.com";

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

const EXCLUDED_SITEMAP_ROUTES = [
  "/api/reference",
  "/redocly-config",
];

const HIDDEN_DOC_PREFIXES = [
  "/transfers",
  "/fastdata",
];
const HIDDEN_CANONICAL_PREFIXES = ["/apis/transfers", "/apis/kv-fastdata"];

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

function matchesRoutePrefix(route, prefix) {
  return route === prefix || route.startsWith(`${prefix}/`);
}

function resolveDocsearchValue(route, rules) {
  return rules.find((rule) => matchesRoutePrefix(route, rule.prefix))?.value || null;
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

function getExpectedMarkdownMirrorUrl(route) {
  return normalizeAbsoluteUrl(route === "/" ? "/index.md" : `${route}/index.md`);
}

function isHiddenDocsRoute(route) {
  return (
    hideEarlyApiFamilies &&
    HIDDEN_DOC_PREFIXES.some(
      (prefix) => route === prefix || route.startsWith(`${prefix}/`)
    )
  );
}

function isHiddenCanonicalRoute(route) {
  return (
    hideEarlyApiFamilies &&
    HIDDEN_CANONICAL_PREFIXES.some(
      (prefix) => route === prefix || route.startsWith(`${prefix}/`)
    )
  );
}

function routeToBuildHtmlPath(route) {
  const withoutTrailingSlash = String(route).replace(/\/+$/, "");
  if (!withoutTrailingSlash) {
    return path.join(BUILD_ROOT, "index.html");
  }
  return path.join(BUILD_ROOT, `${withoutTrailingSlash}.html`);
}

function getExpectedDocsearchCategory(route) {
  return resolveDocsearchValue(route, DOCSEARCH_CATEGORY_RULES);
}

function getExpectedDocsearchMethodType(route) {
  return resolveDocsearchValue(route, DOCSEARCH_METHOD_TYPE_RULES);
}

function getExpectedDocsPageSchemaType({ hasFastnearOperation, route }) {
  if (hasFastnearOperation) {
    return "WebPage";
  }

  return COLLECTION_ROUTE_SET.has(route) ? "CollectionPage" : "TechArticle";
}

function countOccurrences(value, pattern) {
  return (value.match(pattern) || []).length;
}

function auditConfigSurface() {
  assert(
    fs.existsSync(CONFIG_PATH),
    `Missing Docusaurus config: ${path.relative(ROOT, CONFIG_PATH)}`
  );
  const configText = fs.readFileSync(CONFIG_PATH, "utf8");

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

    const expectedCategory = getExpectedDocsearchCategory(route);
    assert(expectedCategory, `No docsearch:category mapping exists for ${relativePath}: ${route}`);

    const hasFastnearOperation = rawContent.includes("<FastnearDirectOperation");
    routeEntries.push({
      expectedCategory,
      expectedMethodType: getExpectedDocsearchMethodType(route),
      expectedPageSchemaType: getExpectedDocsPageSchemaType({
        hasFastnearOperation,
        route,
      }),
      hasFastnearOperation,
      relativePath,
      route,
    });
  }

  return { routeEntries, routes: [...seenRoutes.keys()] };
}

function parseSitemapUrls() {
  assert(fs.existsSync(SITEMAP_PATH), `Missing sitemap: ${path.relative(ROOT, SITEMAP_PATH)}`);
  const sitemapText = fs.readFileSync(SITEMAP_PATH, "utf8");

  return [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function auditDocsBuildOutput(routeEntries) {
  assert(fs.existsSync(ROBOTS_PATH), `Missing robots.txt: ${path.relative(ROOT, ROBOTS_PATH)}`);
  const robotsText = fs.readFileSync(ROBOTS_PATH, "utf8");

  assert(
    robotsText.includes(`Sitemap: ${PRODUCTION_SITE_URL}/sitemap.xml`),
    "robots.txt must advertise the production sitemap URL"
  );

  const sitemapUrls = parseSitemapUrls();

  REQUIRED_SITEMAP_ROUTES.forEach((route) => {
    if (isHiddenDocsRoute(route)) {
      return;
    }

    assert(
      sitemapUrls.includes(`${PRODUCTION_SITE_URL}${route}`),
      `sitemap.xml is missing required canonical route ${route}`
    );
  });

  EXCLUDED_SITEMAP_ROUTES.forEach((route) => {
    assert(
      !sitemapUrls.includes(`${PRODUCTION_SITE_URL}${route}`),
      `sitemap.xml should exclude low-value route ${route}`
    );
  });

  assert(
    !sitemapUrls.some((url) => url.includes("/blog/")),
    "sitemap.xml should not include blog routes for builder-docs"
  );
  assert(
    !sitemapUrls.some((url) => url.includes("/rpcs/") || url.includes("/apis/")),
    "sitemap.xml should prefer root-mounted public docs routes over hosted /rpcs or /apis routes"
  );

  const sitemapText = fs.readFileSync(SITEMAP_PATH, "utf8");
  assert(sitemapText.includes("<lastmod>"), "sitemap.xml should include lastmod metadata");
  assert(!sitemapText.includes("<changefreq>"), "sitemap.xml should omit changefreq noise");
  assert(!sitemapText.includes("<priority>"), "sitemap.xml should omit priority noise");

  routeEntries.forEach((entry) => {
    const htmlPath = routeToBuildHtmlPath(entry.route);
    assert(
      fs.existsSync(htmlPath),
      `Built HTML missing for docs route ${entry.route} (${entry.relativePath})`
    );

    const html = fs.readFileSync(htmlPath, "utf8");
    const categoryPattern = new RegExp(
      `<meta[^>]+name="docsearch:category"[^>]+content="${entry.expectedCategory}"[^>]*>`,
      "i"
    );
    assert(
      categoryPattern.test(html),
      `Docs page is missing docsearch:category=${entry.expectedCategory}: ${entry.route} (${entry.relativePath})`
    );

    if (entry.expectedMethodType) {
      const methodPattern = new RegExp(
        `<meta[^>]+name="docsearch:method_type"[^>]+content="${entry.expectedMethodType}"[^>]*>`,
        "i"
      );
      assert(
        methodPattern.test(html),
        `Docs page is missing docsearch:method_type=${entry.expectedMethodType}: ${entry.route} (${entry.relativePath})`
      );
    } else {
      assert(
        !html.includes('name="docsearch:method_type"'),
        `Guide page should not emit docsearch:method_type: ${entry.route} (${entry.relativePath})`
      );
    }

    assert(
      html.includes(`"@type":"${entry.expectedPageSchemaType}"`),
      `Docs page is missing ${entry.expectedPageSchemaType} JSON-LD: ${entry.route} (${entry.relativePath})`
    );
    assert(
      html.includes(`"url":"${PRODUCTION_SITE_URL}${entry.route}"`),
      `Docs page JSON-LD is missing its canonical URL: ${entry.route} (${entry.relativePath})`
    );
    assert(
      countOccurrences(html, /"@type":"BreadcrumbList"/g) === 1,
      `Docs page should emit exactly one BreadcrumbList JSON-LD block: ${entry.route} (${entry.relativePath})`
    );

    if (entry.hasFastnearOperation) {
      assert(
        html.includes('name="keywords"'),
        `Operation docs page is missing keyword metadata: ${entry.route} (${entry.relativePath})`
      );
      assert(
        html.includes('"@type":"APIReference"'),
        `Operation docs page is missing APIReference JSON-LD: ${entry.route} (${entry.relativePath})`
      );
      assert(
        html.includes('"@type":"WebAPI"'),
        `Operation docs page is missing WebAPI JSON-LD: ${entry.route} (${entry.relativePath})`
      );
    }
  });

  const representativeDocsHtml = fs.readFileSync(routeToBuildHtmlPath("/rpc"), "utf8");
  assert(
    representativeDocsHtml.includes('"@type":"WebSite"'),
    "Built docs HTML should include the global WebSite JSON-LD block"
  );
  assert(
    representativeDocsHtml.includes('"@type":"Organization"'),
    "Built docs HTML should include the global Organization JSON-LD block"
  );
  assert(
    representativeDocsHtml.includes(
      `"logo":"${PRODUCTION_SITE_URL}/img/fastnear_logo_black.png"`
    ),
    "Built docs HTML should include the stable docs-hosted Organization logo"
  );
}

function auditHostedBuildOutput(structuredGraph) {
  const visibleOperations = structuredGraph.operations.filter(
    (operation) => !isHiddenCanonicalRoute(operation.canonicalPath)
  );

  visibleOperations.forEach((operation) => {
    const htmlPath = routeToBuildHtmlPath(operation.canonicalPath);
    assert(
      fs.existsSync(htmlPath),
      `Built HTML missing for hosted route ${operation.canonicalPath}`
    );

    const html = fs.readFileSync(htmlPath, "utf8");
    assert(
      html.includes('name="robots" content="noindex"'),
      `Hosted route must remain noindex: ${operation.canonicalPath}`
    );
    assert(
      html.includes('"@type":"WebPage"'),
      `Hosted route is missing WebPage JSON-LD: ${operation.canonicalPath}`
    );
    assert(
      html.includes('"@type":"APIReference"'),
      `Hosted route is missing APIReference JSON-LD: ${operation.canonicalPath}`
    );
    assert(
      html.includes('"@type":"WebAPI"'),
      `Hosted route is missing WebAPI JSON-LD: ${operation.canonicalPath}`
    );
    assert(
      countOccurrences(html, /"@type":"BreadcrumbList"/g) === 1,
      `Hosted route should emit exactly one BreadcrumbList JSON-LD block: ${operation.canonicalPath}`
    );
  });
}

function auditSiteGraphArtifact({ routeEntries, structuredGraph }) {
  const siteGraph = loadJson(SITE_GRAPH_PATH, "site graph artifact");
  const visibleOperations = structuredGraph.operations.filter(
    (operation) => !isHiddenCanonicalRoute(operation.canonicalPath)
  );
  const visibleFamilyIds = [...new Set(visibleOperations.map((operation) => operation.familyId))].sort();

  assert(siteGraph.version === 1, "site-graph.json should use version 1");
  assert(siteGraph.website?.["@type"] === "WebSite", "site-graph.json is missing the WebSite entity");
  assert(
    siteGraph.website?.url === PRODUCTION_SITE_URL,
    "site-graph.json has the wrong WebSite URL"
  );
  assert(
    siteGraph.organization?.["@type"] === "Organization",
    "site-graph.json is missing the Organization entity"
  );
  assert(
    siteGraph.organization?.logo === `${PRODUCTION_SITE_URL}/img/fastnear_logo_black.png`,
    "site-graph.json should use the stable docs-hosted logo URL"
  );

  assert(Array.isArray(siteGraph.families), "site-graph.json families must be an array");
  assert(Array.isArray(siteGraph.operations), "site-graph.json operations must be an array");
  assert(Array.isArray(siteGraph.pages), "site-graph.json pages must be an array");

  const familyIds = siteGraph.families.map((family) => family.id).sort();
  assert(
    JSON.stringify(familyIds) === JSON.stringify(visibleFamilyIds),
    `site-graph.json family set is out of sync. Expected ${visibleFamilyIds.join(", ")}, got ${familyIds.join(", ")}`
  );
  assert(
    siteGraph.operations.length === visibleOperations.length,
    `site-graph.json should contain ${visibleOperations.length} operations, got ${siteGraph.operations.length}`
  );
  assert(
    siteGraph.pages.length === routeEntries.length + visibleOperations.length,
    `site-graph.json should contain ${routeEntries.length + visibleOperations.length} pages, got ${siteGraph.pages.length}`
  );

  const pagesByRoute = Object.fromEntries(siteGraph.pages.map((page) => [page.route, page]));

  routeEntries.forEach((entry) => {
    const page = pagesByRoute[entry.route];
    assert(page, `site-graph.json is missing docs page ${entry.route}`);
    assert(page.routeType === "docs", `Docs page has wrong routeType in site-graph.json: ${entry.route}`);
    assert(page.indexable === true, `Docs page should be indexable in site-graph.json: ${entry.route}`);
    assert(
      page.pageSchemaType === entry.expectedPageSchemaType,
      `Docs page has wrong pageSchemaType in site-graph.json: ${entry.route}`
    );
    assert(
      page.markdownMirrorUrl === getExpectedMarkdownMirrorUrl(entry.route),
      `Docs page has wrong markdownMirrorUrl in site-graph.json: ${entry.route}`
    );
  });

  visibleOperations.forEach((operation) => {
    const page = pagesByRoute[operation.canonicalPath];
    assert(page, `site-graph.json is missing hosted page ${operation.canonicalPath}`);
    assert(
      page.routeType === (operation.canonicalPath.startsWith("/rpcs/") ? "hosted-rpc" : "hosted-api"),
      `Hosted page has wrong routeType in site-graph.json: ${operation.canonicalPath}`
    );
    assert(
      page.indexable === false,
      `Hosted page should be non-indexable in site-graph.json: ${operation.canonicalPath}`
    );
    assert(
      page.pageSchemaType === "WebPage",
      `Hosted page should use WebPage in site-graph.json: ${operation.canonicalPath}`
    );
    assert(
      page.markdownMirrorUrl === getExpectedMarkdownMirrorUrl(operation.canonicalPath),
      `Hosted page has wrong markdownMirrorUrl in site-graph.json: ${operation.canonicalPath}`
    );
    assert(
      page.entityIds?.mainEntityId === `${PRODUCTION_SITE_URL}/structured-data/operations/${operation.pageModelId}`,
      `Hosted page has wrong mainEntityId in site-graph.json: ${operation.canonicalPath}`
    );
  });

  assert(
    siteGraph.discovery?.llmsIndexUrl === `${PRODUCTION_SITE_URL}/llms.txt`,
    "site-graph.json should advertise /llms.txt"
  );
  assert(
    siteGraph.discovery?.llmsFullUrl === `${PRODUCTION_SITE_URL}/llms-full.txt`,
    "site-graph.json should advertise /llms-full.txt"
  );
  assert(
    siteGraph.discovery?.docsLlmsIndexUrl === `${PRODUCTION_SITE_URL}/guides/llms.txt`,
    "site-graph.json should advertise /guides/llms.txt"
  );
}

function main() {
  auditConfigSurface();
  const structuredGraph = loadJson(STRUCTURED_GRAPH_PATH, "structured graph registry");
  const { routeEntries, routes } = auditDocsSource();
  auditDocsBuildOutput(routeEntries);
  auditHostedBuildOutput(structuredGraph);
  auditSiteGraphArtifact({ routeEntries, structuredGraph });

  console.log(
    `Indexing surface audit passed for ${routes.length} explicit docs routes, ${routeEntries.filter((entry) => entry.hasFastnearOperation).length} docs operation pages, and ${structuredGraph.operations.filter((operation) => !isHiddenCanonicalRoute(operation.canonicalPath)).length} hosted operation pages.`
  );
}

try {
  main();
} catch (error) {
  console.error(`Indexing surface audit failed: ${error.message}`);
  process.exitCode = 1;
}

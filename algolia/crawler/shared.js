const indexSettings = require("../index-settings.json");
const {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  localizeRoute,
} = require("../../scripts/lib/localized-routes");

const SITE_ROOT = "https://docs.fastnear.com";
const APP_ID_PLACEHOLDER = "YOUR_ALGOLIA_APP_ID";
const INDEX_NAME_PLACEHOLDER = "YOUR_DOCSEARCH_INDEX_NAME";

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

function buildSiteUrl(route) {
  if (route === "/") {
    return `${SITE_ROOT}/`;
  }

  return `${SITE_ROOT}${route}`;
}

function buildLocalizedSiteUrl(route, locale = DEFAULT_LOCALE) {
  if (route === "/") {
    return locale === DEFAULT_LOCALE ? `${SITE_ROOT}/` : `${SITE_ROOT}/${locale}/`;
  }

  return buildSiteUrl(localizeRoute(route, locale));
}

function buildLocalizedPaths(routePatterns, { negate = false } = {}) {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    routePatterns.map((route) => {
      const localizedRoute = buildLocalizedSiteUrl(route, locale);
      return negate ? `!${localizedRoute}` : localizedRoute;
    })
  );
}

function buildCrawlerPaths() {
  return buildLocalizedPaths(PUBLIC_DOC_ROUTE_PATTERNS);
}

function buildCrawlerExcludes() {
  return buildLocalizedPaths(EXCLUDED_ROUTE_PATTERNS, { negate: true });
}

function buildCrawlerSitemaps() {
  return SUPPORTED_LOCALES.map((locale) => buildLocalizedSiteUrl("/sitemap.xml", locale));
}

function buildCrawlerStartUrls() {
  return SUPPORTED_LOCALES.map((locale) => buildLocalizedSiteUrl("/", locale));
}

const CRAWL_PATHS = buildCrawlerPaths();
const CRAWL_EXCLUDES = buildCrawlerExcludes();

function dedent(source) {
  const lines = String(source).replace(/^\n/, "").replace(/\s+$/, "").split("\n");
  const margins = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^ */)[0].length);
  const margin = margins.length ? Math.min(...margins) : 0;

  return lines.map((line) => line.slice(margin)).join("\n");
}

const RECORD_EXTRACTOR_SOURCE = dedent(`
  ({ url, $, helpers }) => {
    const getMetaContent = (name, fallback = null) => {
      const value = $(\`meta[name="\${name}"]\`).attr("content");
      return value ? String(value).trim() : fallback;
    };

    const getRecordValue = (value) => {
      return value ? [String(value).trim()] : [];
    };

    const getKeywordValues = (value) => {
      return String(value || "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
    };

    const removeCrawlerNoise = () => {
      [
        "[data-fastnear-crawler-skip]",
        ".hash-link",
        ".table-of-contents",
        ".theme-edit-this-page",
        ".theme-last-updated",
        ".theme-doc-toc-mobile",
        ".breadcrumbs",
        ".pagination-nav",
        ".clean-btn",
      ].forEach((selector) => $(selector).remove());
    };

    const getTopLevelHeading = (surface) => {
      const lvl0BySurface = {
        agents: "Agents",
        api: "API",
        auth: "Auth",
        fastdata: "FastData",
        guide: "Guides",
        neardata: "NEAR Data",
        rpc: "RPC",
        snapshots: "Snapshots",
        transfers: "Transfers",
        "transaction-flow": "Transaction Flow",
        tx: "Transactions",
      };

      return lvl0BySurface[surface] || "Documentation";
    };

    const getPageRank = (pathname, surface, pageType) => {
      if (pathname === "/agents/choosing-surfaces") {
        return 44;
      }

      if (pageType === "reference" && surface === "rpc") {
        return 96;
      }

      if (pageType === "reference" && ["api", "tx", "transfers", "neardata", "fastdata"].includes(surface)) {
        return 90;
      }

      if (pageType === "reference") {
        return 86;
      }

      if (pageType === "collection" && pathname === "/") {
        return 16;
      }

      if (pageType === "collection") {
        return 22;
      }

      if (surface === "auth") {
        return 28;
      }

      return 24;
    };

    const getContentSelectors = (pageType) => {
      if (pageType === "reference") {
        return [
          "article .theme-doc-markdown > p",
          "article li",
          "article td:last-child",
          "article [data-fastnear-content]",
          "article .fastnear-reference__summary p",
          "article .fastnear-reference__response-description",
          "article .fastnear-reference-schema__description",
        ].join(", ");
      }

      if (pageType === "collection") {
        return [
          "article > p",
          "article > ul > li",
          "article .col p",
        ].join(", ");
      }

      return "article p, article li, article td:last-child";
    };

    removeCrawlerNoise();

    const pathname = (() => {
      try {
        const rawPath = url && url.pathname ? String(url.pathname) : "/";
        if (!rawPath || rawPath === "/") {
          return "/";
        }

        return rawPath.endsWith("/") ? rawPath.slice(0, -1) : rawPath;
      } catch (error) {
        return "/";
      }
    })();
    const category = getMetaContent("docsearch:category", "guide");
    const methodType = getMetaContent("docsearch:method_type");
    const surface = getMetaContent("docsearch:surface", "guide");
    const family = getMetaContent("docsearch:family");
    const audience = getMetaContent("docsearch:audience", "builder");
    const pageType = getMetaContent("docsearch:page_type", "guide");
    const transport = getMetaContent("docsearch:transport");
    const operationId = getMetaContent("docsearch:operation_id");
    const canonicalTarget = getMetaContent("docsearch:canonical_target");
    const keywords = getMetaContent("keywords");
    const pageRank = getPageRank(pathname, surface, pageType);

    return helpers.docsearch({
      recordProps: {
        lvl0: {
          selectors: "",
          defaultValue: getTopLevelHeading(surface),
        },
        lvl1: ["header h1", "article h1", "main h1"],
        lvl2: "article h2",
        lvl3: "article h3",
        lvl4: "article h4",
        lvl5: "article h5, article td:first-child",
        lvl6: "article h6",
        content: getContentSelectors(pageType),
        category: {
          defaultValue: getRecordValue(category),
        },
        method_type: {
          defaultValue: getRecordValue(methodType),
        },
        surface: {
          defaultValue: getRecordValue(surface),
        },
        family: {
          defaultValue: getRecordValue(family),
        },
        audience: {
          defaultValue: getRecordValue(audience),
        },
        page_type: {
          defaultValue: getRecordValue(pageType),
        },
        transport: {
          defaultValue: getRecordValue(transport),
        },
        operation_id: {
          defaultValue: getRecordValue(operationId),
        },
        canonical_target: {
          defaultValue: getRecordValue(canonicalTarget),
        },
        keywords: {
          defaultValue: getKeywordValues(keywords),
        },
        pageRank,
      },
      indexHeadings: true,
      aggregateContent: true,
      recordVersion: "v3",
    });
  }
`);

function createCrawlerConfig({
  appId = APP_ID_PLACEHOLDER,
  indexName = INDEX_NAME_PLACEHOLDER,
} = {}) {
  return {
    actions: [
      {
        indexName,
        pathsToMatch: [...CRAWL_PATHS, ...CRAWL_EXCLUDES],
        recordExtractor: {
          __type: "function",
          source: RECORD_EXTRACTOR_SOURCE,
        },
      },
    ],
    appId,
    discoveryPatterns: [`${SITE_ROOT}/**`],
    ignoreCanonicalTo: true,
    initialIndexSettings: {
      [indexName]: indexSettings,
    },
    maxDepth: 10,
    rateLimit: 8,
    renderJavaScript: false,
    sitemaps: buildCrawlerSitemaps(),
    startUrls: buildCrawlerStartUrls(),
  };
}

function stringifyEditorValue(value, indentLevel = 0) {
  const indent = "  ".repeat(indentLevel);
  const nextIndent = "  ".repeat(indentLevel + 1);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    return `[\n${value
      .map((entry) => `${nextIndent}${stringifyEditorValue(entry, indentLevel + 1)}`)
      .join(",\n")}\n${indent}]`;
  }

  if (value && typeof value === "object") {
    if (value.__type === "function") {
      const indentation = "  ".repeat(indentLevel);
      return value.source
        .split("\n")
        .map((line, index) => {
          if (index === 0 || !line) {
            return line;
          }

          return `${indentation}${line}`;
        })
        .join("\n");
    }

    const entries = Object.entries(value);
    if (!entries.length) {
      return "{}";
    }

    return `{\n${entries
      .map(([key, entry]) => `${nextIndent}${key}: ${stringifyEditorValue(entry, indentLevel + 1)}`)
      .join(",\n")}\n${indent}}`;
  }

  return JSON.stringify(value);
}

function renderCrawlerConfigSource(options = {}) {
  const config = createCrawlerConfig(options);
  return `new Crawler(${stringifyEditorValue(config, 0)});\n`;
}

module.exports = {
  APP_ID_PLACEHOLDER,
  CRAWL_EXCLUDES,
  CRAWL_PATHS,
  DEFAULT_LOCALE,
  EXCLUDED_ROUTE_PATTERNS,
  INDEX_NAME_PLACEHOLDER,
  PUBLIC_DOC_ROUTE_PATTERNS,
  RECORD_EXTRACTOR_SOURCE,
  SITE_ROOT,
  SUPPORTED_LOCALES,
  buildCrawlerExcludes,
  buildCrawlerPaths,
  buildCrawlerSitemaps,
  buildCrawlerStartUrls,
  buildLocalizedSiteUrl,
  createCrawlerConfig,
  renderCrawlerConfigSource,
};

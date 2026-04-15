#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { algoliasearch } = require("algoliasearch");
const {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
} = require("./lib/localized-routes");

const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const CASES_PATH = path.join(ROOT, "algolia/relevance-cases.json");
const DISALLOWED_PREFIXES = ["/rpcs/", "/apis/", "/structured-data/"];
const DISALLOWED_PATHS = new Set([
  "/llms.txt",
  "/llms-full.txt",
  "/guides/llms.txt",
  "/rpcs/llms.txt",
  "/apis/llms.txt",
]);

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  });
}

function getRequiredEnv() {
  loadDotEnv(ENV_PATH);

  const env = {
    appId: process.env.DOCSEARCH_APP_ID,
    apiKey: process.env.DOCSEARCH_API_KEY,
    indexName: process.env.DOCSEARCH_INDEX_NAME,
  };

  const presentCount = Object.values(env).filter(Boolean).length;
  if (presentCount === 0) {
    console.log("Skipping Algolia relevance audit because DOCSEARCH_APP_ID, DOCSEARCH_API_KEY, and DOCSEARCH_INDEX_NAME are not configured.");
    process.exit(0);
  }

  const missing = Object.entries(env)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required Algolia env vars: ${missing.join(", ")}`);
  }

  return env;
}

function readCases() {
  if (!fs.existsSync(CASES_PATH)) {
    throw new Error(`Missing relevance cases file: ${path.relative(ROOT, CASES_PATH)}`);
  }

  return JSON.parse(fs.readFileSync(CASES_PATH, "utf8"));
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

function firstValue(value) {
  return toArray(value)[0] || "";
}

function getPathname(url) {
  try {
    const parsed = new URL(url, "https://docs.fastnear.com");
    return parsed.pathname === "/" ? "/" : parsed.pathname.replace(/\/$/, "") || "/";
  } catch {
    return String(url || "").replace(/^https?:\/\/[^/]+/i, "").split("#")[0] || "/";
  }
}

function groupHitsByPage(hits) {
  const grouped = new Map();

  hits.forEach((hit) => {
    const pagePath = getPathname(hit.url_without_anchor || hit.url);
    if (!grouped.has(pagePath)) {
      grouped.set(pagePath, {
        path: pagePath,
        title:
          firstValue(hit?.hierarchy?.lvl1) ||
          firstValue(hit?.hierarchy?.lvl2) ||
          pagePath,
        hit,
      });
    }
  });

  return [...grouped.values()];
}

function isDisallowedPath(pathname) {
  return DISALLOWED_PATHS.has(pathname) || DISALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getCaseLocale(relevanceCase) {
  return relevanceCase.locale || DEFAULT_LOCALE;
}

function buildFacetFilters(relevanceCase) {
  const localeFilter = `language:${getCaseLocale(relevanceCase)}`;
  const additionalFacetFilters = relevanceCase.facetFilters;

  if (!additionalFacetFilters) {
    return [localeFilter];
  }

  if (Array.isArray(additionalFacetFilters)) {
    return [localeFilter, ...additionalFacetFilters];
  }

  return [localeFilter, additionalFacetFilters];
}

async function getLocaleCoverage(client, indexName) {
  const response = await client.searchSingleIndex({
    indexName,
    searchParams: {
      facets: ["language"],
      hitsPerPage: 0,
      maxValuesPerFacet: Math.max(SUPPORTED_LOCALES.length + 4, 10),
      query: "",
    },
  });

  const languageFacetCounts = response.facets?.language || {};
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, Number(languageFacetCounts[locale] || 0)])
  );
}

async function run() {
  const { appId, apiKey, indexName } = getRequiredEnv();
  const relevanceCases = readCases();
  const client = algoliasearch(appId, apiKey);
  const failures = [];
  const localeCoverage = await getLocaleCoverage(client, indexName);
  const uncoveredLocales = Object.entries(localeCoverage)
    .filter(([, count]) => count <= 0)
    .map(([locale]) => locale);

  if (uncoveredLocales.length) {
    throw new Error(
      `Algolia locale coverage is missing for: ${uncoveredLocales.join(", ")}. Current language facet counts: ${JSON.stringify(localeCoverage)}`
    );
  }

  for (const relevanceCase of relevanceCases) {
    const caseLocale = getCaseLocale(relevanceCase);
    const response = await client.searchSingleIndex({
      indexName,
      searchParams: {
        attributesToRetrieve: [
          "hierarchy",
          "content",
          "anchor",
          "url",
          "url_without_anchor",
          "category",
          "method_type",
          "surface",
          "family",
          "audience",
          "page_type",
          "language",
          "lang",
        ],
        attributesToSnippet: ["content:14"],
        clickAnalytics: true,
        facetFilters: buildFacetFilters(relevanceCase),
        hitsPerPage: 12,
        query: relevanceCase.query,
      },
    });

    const groupedHits = groupHitsByPage(response.hits || []);
    const topPaths = groupedHits.slice(0, 5).map((entry) => entry.path);
    const topPath = topPaths[0] || null;
    const disallowedHit = groupedHits.find((entry) => isDisallowedPath(entry.path));
    const expectedPaths = relevanceCase.expectedAnyOf || [relevanceCase.expectedPath];

    if (disallowedHit) {
      failures.push(
        `[${caseLocale}] ${relevanceCase.query}: disallowed result surfaced at ${disallowedHit.path}`
      );
      continue;
    }

    if (!topPath) {
      failures.push(`[${caseLocale}] ${relevanceCase.query}: no results returned`);
      continue;
    }

    if (!expectedPaths.includes(topPath)) {
      failures.push(
        `[${caseLocale}] ${relevanceCase.query}: expected ${expectedPaths.join(" or ")} first, got ${topPath} (top 5: ${topPaths.join(", ")})`
      );
      continue;
    }

    console.log(`✓ [${caseLocale}] ${relevanceCase.query} -> ${topPath}`);
  }

  if (failures.length) {
    console.error("\nAlgolia relevance audit failed:\n");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`\nAlgolia relevance audit passed for ${relevanceCases.length} queries.`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

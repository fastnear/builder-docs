#!/usr/bin/env node

const { algoliasearch } = require("algoliasearch");

const {
  loadDotEnv,
  requireEnv,
} = require("./lib/algolia-common");
const {
  DEFAULT_LOCALE,
} = require("./lib/localized-routes");

function parseArgs(argv) {
  const options = {
    hits: 5,
    json: false,
    locale: DEFAULT_LOCALE,
    query: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === "--query") {
      options.query = argv[index + 1] || "";
      index += 1;
      continue;
    }

    if (value === "--locale") {
      options.locale = argv[index + 1] || DEFAULT_LOCALE;
      index += 1;
      continue;
    }

    if (value === "--hits") {
      const parsed = Number.parseInt(argv[index + 1] || "", 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.hits = parsed;
      }
      index += 1;
      continue;
    }

    if (value === "--json") {
      options.json = true;
    }
  }

  return options;
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

function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getTitle(hit) {
  return (
    stripHtml(hit?._highlightResult?.hierarchy?.lvl1?.value) ||
    stripHtml(hit?._highlightResult?.hierarchy?.lvl2?.value) ||
    firstValue(hit?.hierarchy?.lvl1) ||
    firstValue(hit?.hierarchy?.lvl2) ||
    getPathname(hit.url_without_anchor || hit.url)
  );
}

function getSnippet(hit) {
  return (
    stripHtml(hit?._snippetResult?.content?.value) ||
    stripHtml(hit?._highlightResult?.content?.value) ||
    firstValue(hit?.content) ||
    ""
  );
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => {
      if (Array.isArray(entry)) {
        return entry.length > 0;
      }

      return entry !== undefined && entry !== null && entry !== "";
    })
  );
}

function normalizeHit(hit) {
  return compactObject({
    title: getTitle(hit),
    path: getPathname(hit.url_without_anchor || hit.url),
    url: hit.url,
    category: firstValue(hit?.category),
    method_type: firstValue(hit?.method_type),
    surface: firstValue(hit?.surface),
    family: firstValue(hit?.family),
    audience: firstValue(hit?.audience),
    page_type: firstValue(hit?.page_type),
    transport: firstValue(hit?.transport),
    operation_id: firstValue(hit?.operation_id),
    canonical_target: firstValue(hit?.canonical_target),
    language: firstValue(hit?.language),
    lang: firstValue(hit?.lang),
    snippet: getSnippet(hit),
  });
}

function groupHitsByPage(hits) {
  const grouped = new Map();

  hits.forEach((hit) => {
    const normalized = normalizeHit(hit);
    if (!grouped.has(normalized.path)) {
      grouped.set(normalized.path, normalized);
    }
  });

  return [...grouped.values()];
}

function printHit(hit, index) {
  console.log(`${index + 1}. ${hit.title}`);
  console.log(`   ${hit.path}`);

  const facts = [
    hit.surface ? `surface=${hit.surface}` : "",
    hit.family ? `family=${hit.family}` : "",
    hit.page_type ? `page_type=${hit.page_type}` : "",
    hit.transport ? `transport=${hit.transport}` : "",
    hit.language ? `language=${hit.language}` : hit.lang ? `lang=${hit.lang}` : "",
    hit.category ? `category=${hit.category}` : "",
    hit.method_type ? `method_type=${hit.method_type}` : "",
    hit.audience ? `audience=${hit.audience}` : "",
  ].filter(Boolean);

  if (facts.length) {
    console.log(`   ${facts.join("  ")}`);
  }

  if (hit.operation_id) {
    console.log(`   operation_id=${hit.operation_id}`);
  }

  if (hit.canonical_target) {
    console.log(`   canonical_target=${hit.canonical_target}`);
  }

  if (hit.snippet) {
    console.log(`   snippet=${hit.snippet}`);
  }
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.query) {
    throw new Error('Missing required argument: --query "..."');
  }

  loadDotEnv();
  const appId = requireEnv("DOCSEARCH_APP_ID");
  const apiKey = requireEnv("DOCSEARCH_API_KEY");
  const indexName = requireEnv("DOCSEARCH_INDEX_NAME");

  const client = algoliasearch(appId, apiKey);
  const response = await client.searchSingleIndex({
    indexName,
    searchParams: {
      attributesToRetrieve: [
        "hierarchy",
        "content",
        "anchor",
        "url",
        "url_without_anchor",
        "type",
        "category",
        "method_type",
        "surface",
        "family",
        "audience",
        "page_type",
        "transport",
        "operation_id",
        "canonical_target",
        "language",
        "lang",
      ],
      attributesToSnippet: ["content:10"],
      facetFilters: [`language:${options.locale}`],
      hitsPerPage: Math.max(options.hits * 3, 12),
      query: options.query,
    },
  });

  const groupedHits = groupHitsByPage(response.hits || []).slice(0, options.hits);

  if (options.json) {
    console.log(JSON.stringify({
      hits: groupedHits,
      locale: options.locale,
      nbHits: response.nbHits || 0,
      query: options.query,
    }, null, 2));
    return;
  }

  console.log(`Algolia Inspect`);
  console.log(`- Query: ${JSON.stringify(options.query)}`);
  console.log(`- Locale: ${options.locale}`);
  console.log(`- Approximate hits: ${response.nbHits || 0}`);
  console.log(`- Showing grouped pages: ${groupedHits.length}`);

  if (!groupedHits.length) {
    return;
  }

  console.log("");
  groupedHits.forEach((hit, index) => {
    printHit(hit, index);
    if (index < groupedHits.length - 1) {
      console.log("");
    }
  });
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

new Crawler({
  actions: [
    {
      indexName: "YOUR_DOCSEARCH_INDEX_NAME",
      pathsToMatch: [
        "https://docs.fastnear.com/",
        "https://docs.fastnear.com/rpc/**",
        "https://docs.fastnear.com/api/**",
        "https://docs.fastnear.com/tx/**",
        "https://docs.fastnear.com/transfers/**",
        "https://docs.fastnear.com/neardata/**",
        "https://docs.fastnear.com/fastdata/**",
        "https://docs.fastnear.com/auth/**",
        "https://docs.fastnear.com/agents/**",
        "https://docs.fastnear.com/snapshots/**",
        "https://docs.fastnear.com/ru/",
        "https://docs.fastnear.com/ru/rpc/**",
        "https://docs.fastnear.com/ru/api/**",
        "https://docs.fastnear.com/ru/tx/**",
        "https://docs.fastnear.com/ru/transfers/**",
        "https://docs.fastnear.com/ru/neardata/**",
        "https://docs.fastnear.com/ru/fastdata/**",
        "https://docs.fastnear.com/ru/auth/**",
        "https://docs.fastnear.com/ru/agents/**",
        "https://docs.fastnear.com/ru/snapshots/**",
        "!https://docs.fastnear.com/transaction-flow",
        "!https://docs.fastnear.com/transaction-flow/**",
        "!https://docs.fastnear.com/rpcs/**",
        "!https://docs.fastnear.com/apis/**",
        "!https://docs.fastnear.com/**/*.md",
        "!https://docs.fastnear.com/llms.txt",
        "!https://docs.fastnear.com/llms-full.txt",
        "!https://docs.fastnear.com/guides/llms.txt",
        "!https://docs.fastnear.com/rpcs/llms.txt",
        "!https://docs.fastnear.com/apis/llms.txt",
        "!https://docs.fastnear.com/structured-data/**",
        "!https://docs.fastnear.com/api/reference",
        "!https://docs.fastnear.com/redocly-config",
        "!https://docs.fastnear.com/ru/transaction-flow",
        "!https://docs.fastnear.com/ru/transaction-flow/**",
        "!https://docs.fastnear.com/ru/rpcs/**",
        "!https://docs.fastnear.com/ru/apis/**",
        "!https://docs.fastnear.com/ru/**/*.md",
        "!https://docs.fastnear.com/ru/llms.txt",
        "!https://docs.fastnear.com/ru/llms-full.txt",
        "!https://docs.fastnear.com/ru/guides/llms.txt",
        "!https://docs.fastnear.com/ru/rpcs/llms.txt",
        "!https://docs.fastnear.com/ru/apis/llms.txt",
        "!https://docs.fastnear.com/ru/structured-data/**",
        "!https://docs.fastnear.com/ru/api/reference",
        "!https://docs.fastnear.com/ru/redocly-config"
      ],
      recordExtractor: ({ url, $, helpers }) => {
        const getMetaContent = (name, fallback = null) => {
          const value = $(`meta[name="${name}"]`).attr("content");
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
          if (pathname === "/auth/backend") {
            return 91;
          }

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
              "article > p",
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
    }
  ],
  appId: "YOUR_ALGOLIA_APP_ID",
  discoveryPatterns: [
    "https://docs.fastnear.com/**"
  ],
  ignoreCanonicalTo: true,
  initialIndexSettings: {
    YOUR_DOCSEARCH_INDEX_NAME: {
      attributesForFaceting: [
        "type",
        "lang",
        "language",
        "category",
        "method_type",
        "surface",
        "family",
        "audience",
        "page_type",
        "transport",
        "operation_id",
        "canonical_target"
      ],
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
        "keywords"
      ],
      attributesToHighlight: [
        "hierarchy",
        "content"
      ],
      attributesToSnippet: [
        "content:14"
      ],
      camelCaseAttributes: [
        "hierarchy",
        "content"
      ],
      searchableAttributes: [
        "unordered(hierarchy.lvl1)",
        "unordered(hierarchy.lvl2)",
        "unordered(hierarchy.lvl3)",
        "unordered(hierarchy.lvl4)",
        "unordered(hierarchy.lvl5)",
        "unordered(hierarchy.lvl6)",
        "unordered(hierarchy.lvl0)",
        "unordered(keywords)",
        "unordered(operation_id)",
        "unordered(canonical_target)",
        "content"
      ],
      distinct: true,
      attributeForDistinct: "url_without_anchor",
      customRanking: [
        "desc(weight.pageRank)",
        "desc(weight.level)",
        "asc(weight.position)"
      ],
      ranking: [
        "words",
        "filters",
        "typo",
        "attribute",
        "proximity",
        "exact",
        "custom"
      ],
      highlightPreTag: "<span class=\"algolia-docsearch-suggestion--highlight\">",
      highlightPostTag: "</span>",
      minWordSizefor1Typo: 3,
      minWordSizefor2Typos: 7,
      allowTyposOnNumericTokens: false,
      minProximity: 1,
      ignorePlurals: true,
      advancedSyntax: true,
      attributeCriteriaComputedByMinProximity: true,
      removeWordsIfNoResults: "allOptional",
      separatorsToIndex: "_"
    }
  },
  maxDepth: 10,
  rateLimit: 8,
  renderJavaScript: false,
  sitemaps: [
    "https://docs.fastnear.com/sitemap.xml",
    "https://docs.fastnear.com/ru/sitemap.xml"
  ],
  startUrls: [
    "https://docs.fastnear.com/",
    "https://docs.fastnear.com/ru/"
  ]
});

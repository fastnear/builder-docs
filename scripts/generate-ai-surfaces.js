#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  localizeRoute,
  stripLocalePrefix,
} = require("./lib/localized-routes");
const {
  NON_DEFAULT_LOCALES,
  getLocaleDocsRoot,
} = require("./lib/locale-framework");
const {
  localizePageModel,
  localizeStructuredFamily,
  localizeStructuredOperation,
} = require("./lib/fastnear-localization");

const ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.resolve(ROOT, "docs");
const PAGE_MODELS_PATH = path.resolve(ROOT, "src/data/generatedFastnearPageModels.json");
const STRUCTURED_GRAPH_PATH = path.resolve(
  ROOT,
  "src/data/generatedFastnearStructuredGraph.json"
);
const STATIC_ROOT = path.resolve(ROOT, "static");
const SITE_ORIGIN = "https://docs.fastnear.com";
const WEBSITE_ID = `${SITE_ORIGIN}/#website`;
const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
const ORGANIZATION_LOGO_URL = `${SITE_ORIGIN}/img/fastnear_logo_black.png`;
const ORGANIZATION_SAME_AS = ["https://github.com/fastnear", "https://x.com/fast_near"];

const hideEarlyApiFamilies = /^(1|true|yes|on)$/i.test(
  process.env.HIDE_EARLY_API_FAMILIES || ""
);

const GENERATED_STATIC_ROOTS = [
  path.join(STATIC_ROOT, "docs"),
  path.join(STATIC_ROOT, "guides"),
  path.join(STATIC_ROOT, "rpc"),
  path.join(STATIC_ROOT, "api"),
  path.join(STATIC_ROOT, "tx"),
  path.join(STATIC_ROOT, "transfers"),
  path.join(STATIC_ROOT, "neardata"),
  path.join(STATIC_ROOT, "fastdata"),
  path.join(STATIC_ROOT, "auth"),
  path.join(STATIC_ROOT, "agents"),
  path.join(STATIC_ROOT, "snapshots"),
  path.join(STATIC_ROOT, "transaction-flow"),
  path.join(STATIC_ROOT, "rpcs"),
  path.join(STATIC_ROOT, "apis"),
  path.join(STATIC_ROOT, "structured-data"),
];
const GENERATED_STATIC_FILES = [
  path.join(STATIC_ROOT, "index.md"),
  path.join(STATIC_ROOT, "llms.txt"),
  path.join(STATIC_ROOT, "llms-full.txt"),
];

const HIDDEN_DOC_PREFIXES = [
  "/transfers",
  "/fastdata",
];
const HIDDEN_CANONICAL_PREFIXES = ["/apis/transfers", "/apis/kv-fastdata"];
const ALWAYS_HIDDEN_DOC_PREFIXES = ["/transaction-flow"];
const SECRET_QUERY_PARAM_PATTERNS = [/^apiKey$/i, /^token$/i, /^header\./i];

const API_SERVICE_LABELS = {
  en: {
    fastnear: "FastNear API",
    "kv-fastdata": "KV FastData API",
    neardata: "NEAR Data API",
    transactions: "Transactions API",
    transfers: "Transfers API",
  },
  ru: {
    fastnear: "FastNear API",
    "kv-fastdata": "KV FastData API",
    neardata: "NEAR Data API",
    transactions: "Транзакции API",
    transfers: "API переводов",
  },
};

const RPC_CATEGORY_LABELS = {
  en: {
    account: "Account RPC",
    block: "Block RPC",
    contract: "Contract RPC",
    protocol: "Protocol RPC",
    transaction: "Transaction RPC",
    validators: "Validators RPC",
  },
  ru: {
    account: "RPC аккаунта",
    block: "RPC блоков",
    contract: "RPC контрактов",
    protocol: "RPC протокола",
    transaction: "RPC транзакций",
    validators: "RPC валидаторов",
  },
};

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

const AUTHORED_MARKDOWN_LABELS = {
  en: {
    aiAndAgents: "AI & Agents",
    bestFor: "Best for:",
    guidesArchiveTitle: "FastNear Builder Docs Full Documentation Archive",
    guidesArchiveIntro:
      "AI-readable Markdown mirrors for authored docs plus canonical `/rpcs/**` and `/apis/**` routes.",
    htmlPath: "HTML path",
    indexes: "Indexes",
    llmsFull: "Full archive",
    llmsGuidesIndex: "Guides index",
    llmsGuidesIntro: "Author-written guides and overview pages in AI-readable Markdown form.",
    llmsGuidesTitle: "FastNear Builder Docs Guides",
    llmsIntro:
      "AI-readable indexes for FastNear guides, RPC reference, and REST API reference.",
    llmsRootTitle: "FastNear Builder Docs",
    llmsTopLevelIndex: "Top-level index",
    markdownPath: "Markdown path",
    open: "Open",
    otherGuides: "Other Guides",
    rpcApiGuides: "RPC / API Guides",
    rpcReferenceIndex: "RPC reference index",
    rpcReferenceIntro: "Canonical RPC reference pages in AI-readable Markdown form.",
    rpcReferenceTitle: "FastNear RPC Reference",
    restApiReferenceIndex: "REST API reference index",
    restApiReferenceIntro: "Canonical REST API reference pages in AI-readable Markdown form.",
    restApiReferenceTitle: "FastNear REST API Reference",
    snapshots: "Snapshots",
    source: "Source",
    topLevelIndex: "Top-level index",
    transactionFlow: "Transaction Flow",
  },
  ru: {
    aiAndAgents: "AI и агенты",
    bestFor: "Лучше всего подходит для:",
    guidesArchiveTitle: "Полный архив документации FastNear Builder Docs",
    guidesArchiveIntro:
      "AI-читабельные Markdown-копии авторских гайдов и канонических маршрутов `/rpcs/**` и `/apis/**`.",
    htmlPath: "HTML-маршрут",
    indexes: "Индексы",
    llmsFull: "Полный архив",
    llmsGuidesIndex: "Индекс гайдов",
    llmsGuidesIntro: "Авторские гайды и обзорные страницы в AI-читабельном Markdown-формате.",
    llmsGuidesTitle: "Гайды FastNear Builder Docs",
    llmsIntro:
      "AI-читабельные индексы для гайдов FastNear, RPC-справочника и справочника REST API.",
    llmsRootTitle: "FastNear Builder Docs",
    llmsTopLevelIndex: "Верхний индекс",
    markdownPath: "Markdown-маршрут",
    open: "Открыть",
    otherGuides: "Другие гайды",
    rpcApiGuides: "Гайды по RPC / API",
    rpcReferenceIndex: "Индекс RPC-справочника",
    rpcReferenceIntro: "Канонические страницы RPC-справочника в AI-читабельном Markdown-формате.",
    rpcReferenceTitle: "RPC-справочник FastNear",
    restApiReferenceIndex: "Индекс REST API",
    restApiReferenceIntro:
      "Канонические страницы справочника REST API в AI-читабельном Markdown-формате.",
    restApiReferenceTitle: "Справочник REST API FastNear",
    snapshots: "Снапшоты",
    source: "Источник",
    topLevelIndex: "Верхний индекс",
    transactionFlow: "Поток транзакции",
  },
};

const OPERATION_MARKDOWN_LABELS = {
  en: {
    activeExample: "Active example",
    apiKeyVia: "API key via",
    array: "array",
    auth: "Auth",
    bearerTokenViaHeader: "Bearer token via `Authorization: Bearer <token>` header",
    body: "body",
    currentRequest: "Current request",
    endpoint: "Endpoint",
    finality: "Finality",
    headerParameters: "Header parameters",
    inputs: "Inputs",
    mediaType: "Media type",
    method: "Method",
    network: "Network",
    networks: "Networks",
    noAuthRequired: "No auth required",
    notSpecified: "Not specified",
    object: "object",
    operation: "Operation",
    path: "Path",
    pathField: "path",
    pathParameters: "Path parameters",
    queryField: "query",
    queryParameters: "Query parameters",
    requestBody: "Request body",
    requestBodyField: "body",
    requestReference: "Request reference",
    requestSchema: "Request schema",
    required: "required",
    responseReference: "Response reference",
    responseSchema: "Response schema",
    sourceLinks: "Source links",
    sourceSpec: "Source spec",
    status: "Status",
    summary: "Summary",
    transport: "Transport",
    url: "URL",
    value: "value",
    withoutSavedCredentials: "This export intentionally omits any locally saved credentials",
  },
  ru: {
    activeExample: "Активный пример",
    apiKeyVia: "API-ключ через",
    array: "массив",
    auth: "Авторизация",
    bearerTokenViaHeader: "Bearer-токен через заголовок `Authorization: Bearer <token>`",
    body: "тело",
    currentRequest: "Текущий запрос",
    endpoint: "Эндпоинт",
    finality: "Финальность",
    headerParameters: "Параметры заголовков",
    inputs: "Входные данные",
    mediaType: "Тип данных",
    method: "Метод",
    network: "Сеть",
    networks: "Сети",
    noAuthRequired: "Авторизация не требуется",
    notSpecified: "Не указано",
    object: "объект",
    operation: "Операция",
    path: "Путь",
    pathField: "путь",
    pathParameters: "Параметры пути",
    queryField: "query",
    queryParameters: "Параметры запроса",
    requestBody: "Тело запроса",
    requestBodyField: "тело",
    requestReference: "Справка по запросу",
    requestSchema: "Схема запроса",
    required: "обязательный",
    responseReference: "Справка по ответу",
    responseSchema: "Схема ответа",
    sourceLinks: "Ссылки на источник",
    sourceSpec: "Исходная спецификация",
    status: "Статус",
    summary: "Краткое описание",
    transport: "Транспорт",
    url: "URL",
    value: "значение",
    withoutSavedCredentials:
      "Этот экспорт намеренно не включает локально сохранённые учётные данные",
  },
};

const pageModels = JSON.parse(fs.readFileSync(PAGE_MODELS_PATH, "utf8"));
const structuredGraph = JSON.parse(fs.readFileSync(STRUCTURED_GRAPH_PATH, "utf8"));
const pageModelsById = Object.fromEntries(
  pageModels.map((pageModel) => [pageModel.pageModelId, pageModel])
);
const structuredFamiliesById = Object.fromEntries(
  (structuredGraph.families || []).map((family) => [family.id, family])
);
const structuredOperationsByPageModelId = Object.fromEntries(
  (structuredGraph.operations || []).map((operation) => [operation.pageModelId, operation])
);

function removeGeneratedStaticRoots() {
  for (const root of GENERATED_STATIC_ROOTS) {
    fs.rmSync(root, { recursive: true, force: true });
  }
  NON_DEFAULT_LOCALES.forEach((locale) => {
    fs.rmSync(path.join(STATIC_ROOT, locale), { recursive: true, force: true });
  });

  if (fs.existsSync(STATIC_ROOT)) {
    for (const entry of fs.readdirSync(STATIC_ROOT, { withFileTypes: true })) {
      if (entry.isFile() && /\.md$/i.test(entry.name)) {
        fs.rmSync(path.join(STATIC_ROOT, entry.name), { force: true });
      }
    }
  }

  for (const filePath of GENERATED_STATIC_FILES) {
    fs.rmSync(filePath, { force: true });
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeTextFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, "utf8");
}

function normalizeRoute(route) {
  if (!route) {
    return "/";
  }

  const normalized = String(route).trim();
  if (!normalized) {
    return "/";
  }

  const prefixed = normalized.startsWith("/") ? normalized : `/${normalized}`;
  if (prefixed === "/") {
    return prefixed;
  }

  return prefixed.replace(/\/+$/, "");
}

function buildLegacyMarkdownMirrorPath(route) {
  const normalizedRoute = normalizeRoute(route).replace(/\/index\.md$/, "").replace(/\.html$/, "");
  if (normalizedRoute === "/") {
    return "/index.md";
  }

  return `${normalizedRoute}/index.md`;
}

function buildMarkdownMirrorPath(route) {
  const normalizedRoute = normalizeRoute(route).replace(/\/index\.md$/, "").replace(/\.html$/, "");
  if (normalizedRoute === "/") {
    return "/index.md";
  }

  const segments = normalizedRoute.split("/").filter(Boolean);
  if (segments.length === 1 && SUPPORTED_LOCALES.includes(segments[0])) {
    return `${normalizedRoute}/index.md`;
  }

  return `${normalizedRoute}.md`;
}

function buildMarkdownMirrorAliases(route) {
  const preferredPath = buildMarkdownMirrorPath(route);
  const legacyPath = buildLegacyMarkdownMirrorPath(route);
  return legacyPath === preferredPath ? [preferredPath] : [preferredPath, legacyPath];
}

function buildAbsoluteUrl(route) {
  return new URL(normalizeRoute(route).replace(/^\//, ""), `${SITE_ORIGIN}/`).toString();
}

function getAuthoredMarkdownLabels(locale = DEFAULT_LOCALE) {
  return AUTHORED_MARKDOWN_LABELS[locale] || AUTHORED_MARKDOWN_LABELS[DEFAULT_LOCALE];
}

function getOperationMarkdownLabels(locale = DEFAULT_LOCALE) {
  return OPERATION_MARKDOWN_LABELS[locale] || OPERATION_MARKDOWN_LABELS[DEFAULT_LOCALE];
}

function getDocsRoot(locale = DEFAULT_LOCALE) {
  const docsRoot = locale === DEFAULT_LOCALE ? DOCS_ROOT : getLocaleDocsRoot(locale);

  if (!fs.existsSync(docsRoot)) {
    throw new Error(
      `Missing translated docs root for locale "${locale}". Run "yarn bootstrap:i18n --locale ${locale}" first.`
    );
  }

  return docsRoot;
}

function buildLocalizedAbsoluteUrl(route, locale = DEFAULT_LOCALE) {
  return buildAbsoluteUrl(localizeRoute(route, locale));
}

function localizeInternalHref(href, locale = DEFAULT_LOCALE) {
  const normalizedHref = String(href || "").trim();
  if (!normalizedHref.startsWith("/")) {
    return normalizedHref;
  }

  return localizeRoute(normalizedHref, locale);
}

function buildPageEntityId(url) {
  return `${url}#page`;
}

function buildFamilyEntityId(familyId) {
  return `${SITE_ORIGIN}/structured-data/families/${familyId}`;
}

function buildOperationEntityId(pageModelId) {
  return `${SITE_ORIGIN}/structured-data/operations/${pageModelId}`;
}

function isCollectionRoute(route) {
  return COLLECTION_ROUTE_SET.has(normalizeRoute(route));
}

function getDocsPageSchemaType(entry) {
  if (entry.kind === "wrapper") {
    return "WebPage";
  }

  return isCollectionRoute(stripLocalePrefix(entry.route)) ? "CollectionPage" : "TechArticle";
}

function normalizeMarkdown(markdown) {
  return markdown.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function rewriteRootRelativeMarkdownLinks(markdown, locale = DEFAULT_LOCALE) {
  return markdown.replace(
    /(!?\[[^\]]*]\()((?:<)?\/[^)\s>]+(?:>)?)(\))/g,
    (_match, prefix, href, suffix) =>
      `${prefix}${sanitizePublicUrl(localizeRoute(href.replace(/^<|>$/g, ""), locale), SITE_ORIGIN)}${suffix}`
  );
}

function sanitizePublicUrl(input, baseUrl) {
  if (!input) {
    return "";
  }

  let url;

  try {
    url = new URL(
      input,
      baseUrl || "https://builder-docs.fastnear.invalid"
    );
  } catch (_error) {
    return String(input);
  }

  [...url.searchParams.keys()].forEach((key) => {
    if (SECRET_QUERY_PARAM_PATTERNS.some((pattern) => pattern.test(key))) {
      url.searchParams.delete(key);
    }
  });

  if (!baseUrl && url.hostname === "builder-docs.fastnear.invalid") {
    return `${url.pathname}${url.search}${url.hash}`;
  }

  return url.toString();
}

function walkDocsFiles(dirPath) {
  const collected = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collected.push(...walkDocsFiles(fullPath));
      continue;
    }

    if (/\.(md|mdx)$/.test(entry.name)) {
      collected.push(fullPath);
    }
  }

  return collected;
}

function parseFrontmatter(rawContent) {
  const match = rawContent.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { content: rawContent, data: {} };
  }

  const data = {};
  for (const line of match[1].split("\n")) {
    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!fieldMatch) {
      continue;
    }

    const [, key, value] = fieldMatch;
    data[key] = value.trim().replace(/^['"]|['"]$/g, "");
  }

  return {
    content: rawContent.slice(match[0].length),
    data,
  };
}

function computeDocRoute(relativePath, frontmatter) {
  const parsedPath = path.parse(relativePath);
  const directorySegments = parsedPath.dir ? parsedPath.dir.split(path.sep) : [];

  if (frontmatter.slug) {
    if (frontmatter.slug.startsWith("/")) {
      return normalizeRoute(frontmatter.slug);
    }

    return normalizeRoute(`/${[...directorySegments, frontmatter.slug].filter(Boolean).join("/")}`);
  }

  const routeSegments =
    parsedPath.name === "index"
      ? directorySegments
      : [...directorySegments, parsedPath.name];

  const route = `/${routeSegments.filter(Boolean).join("/")}`;
  return normalizeRoute(route);
}

function isHiddenRoute(route) {
  return (
    ALWAYS_HIDDEN_DOC_PREFIXES.some(
      (prefix) => route === prefix || route.startsWith(`${prefix}/`)
    ) ||
    (
      hideEarlyApiFamilies &&
      HIDDEN_DOC_PREFIXES.some(
        (prefix) => route === prefix || route.startsWith(`${prefix}/`)
      )
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

function extractPageModelId(content) {
  const match = content.match(
    /<FastnearDirectOperation\b[^>]*pageModelId=["']([^"']+)["'][^>]*\/>/
  );
  return match?.[1] || null;
}

function stripInlineTags(value) {
  return String(value || "")
    .replace(/<\/?strong>/g, "")
    .replace(/<\/?span[^>]*>/g, "")
    .replace(/<\/?em>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildRpcApiServiceLinks(locale = DEFAULT_LOCALE) {
  const labelSets = {
    en: {
      fastnearDescription:
        "Indexed account views for balances, NFTs, staking, and public-key lookups.",
      fastdataDescription:
        "Indexed key-value history and latest-state lookups for contract storage analysis.",
      neardataDescription:
        "Recent finalized and optimistic block-family reads for low-latency polling workflows.",
      transactionsDescription:
        "Account, block, receipt, and transaction history from indexed execution data.",
      transfersDescription:
        "Purpose-built transfer history for account activity and pagination-heavy UIs.",
    },
    ru: {
      fastnearDescription:
        "Индексированные представления аккаунтов для балансов, NFT, стейкинга и поиска по публичным ключам.",
      fastdataDescription:
        "Индексированная история данных «ключ-значение» и выборки последнего состояния для анализа хранилища контрактов.",
      neardataDescription:
        "Недавние финализированные и оптимистичные чтения семейств блоков для низколатентного опроса.",
      transactionsDescription:
        "История аккаунтов, блоков, квитанций и транзакций из индексированных данных исполнения.",
      transfersDescription:
        "Специализированная история переводов для активности аккаунтов и интерфейсов с тяжёлой пагинацией.",
    },
  };
  const labels = labelSets[locale] || labelSets[DEFAULT_LOCALE];
  const links = [
    {
      href: localizeRoute("/api", locale),
      label: "FastNear API",
      description: labels.fastnearDescription,
    },
    {
      href: localizeRoute("/tx", locale),
      label: locale === "ru" ? "Транзакции API" : "Transactions API",
      description: labels.transactionsDescription,
    },
    ...(!hideEarlyApiFamilies
      ? [
          {
            href: localizeRoute("/transfers", locale),
            label: locale === "ru" ? "API переводов" : "Transfers API",
            description: labels.transfersDescription,
          },
        ]
      : []),
    ...(!hideEarlyApiFamilies
      ? [
          {
            href: localizeRoute("/fastdata/kv", locale),
            label: "KV FastData API",
            description: labels.fastdataDescription,
          },
        ]
      : []),
    {
      href: localizeRoute("/neardata", locale),
      label: "NEAR Data API",
      description: labels.neardataDescription,
    },
  ];

  return links
    .map((link) => `- [${link.label}](${link.href}): ${link.description}`)
    .join("\n");
}

function transformCardGrid(markdown, locale = DEFAULT_LOCALE) {
  const labels = getAuthoredMarkdownLabels(locale);
  return markdown.replace(
    /<div className="fastnear-doc-card-grid(?: [^"]*)?">([\s\S]*?)<\/div>/g,
    (_match, inner) => {
      const cardMatches = [
        ...inner.matchAll(
          /<article\b[^>]*className="fastnear-doc-card"[^>]*>([\s\S]*?)<\/article>/g
        ),
      ];
      if (!cardMatches.length) {
        throw new Error("Unsupported card grid without fastnear-doc-card items");
      }

      return cardMatches
        .map((cardMatch) => {
          const body = cardMatch[1];
          const eyebrow = stripInlineTags(
            body.match(
              /<span[^>]*className="fastnear-doc-card__eyebrow"[^>]*>([\s\S]*?)<\/span>/
            )?.[1] || ""
          );
          const title = stripInlineTags(
            body.match(/<strong>([\s\S]*?)<\/strong>/)?.[1] || "Reference"
          );
          const titleHref = (
            body.match(
              /<Link\b[^>]*className="fastnear-doc-card__title"[^>]*to="([^"]+)"[^>]*>[\s\S]*?<strong>/
            )?.[1] || ""
          ).trim();
          const summary = stripInlineTags(
            body.match(
              /<span(?![^>]*fastnear-doc-card__(?:eyebrow|bestfor-label))[^>]*>([\s\S]*?)<\/span>/
            )?.[1] || ""
          );
          const ctaHref = (
            body.match(
              /<Link\b[^>]*className="fastnear-doc-card__cta"[^>]*to="([^"]+)"[^>]*>/
            )?.[1] || ""
          ).trim();
          const ctaLabel = stripInlineTags(
            body.match(
              /<Link\b[^>]*className="fastnear-doc-card__cta"[^>]*>([\s\S]*?)<\/Link>/
            )?.[1] || title
          );
          const bestForMatches = [
            ...body.matchAll(
              /<li>\s*<Link\b[^>]*to="([^"]+)"[^>]*>([\s\S]*?)<\/Link>\s*<\/li>/g
            ),
          ];

          const lines = [];
          lines.push(
            `### ${
              titleHref
                ? `[${title}](${localizeInternalHref(titleHref, locale)})`
                : ctaHref
                  ? `[${title}](${localizeInternalHref(ctaHref, locale)})`
                  : title
            }`
          );

          if (eyebrow) {
            lines.push(`*${eyebrow}*`);
          }

          if (summary) {
            lines.push(summary);
          }

          if (bestForMatches.length) {
            lines.push(labels.bestFor);
            lines.push(
              bestForMatches
                .map(
                  (bestForMatch) =>
                    `- [${stripInlineTags(bestForMatch[2])}](${localizeInternalHref(bestForMatch[1].trim(), locale)})`
                )
                .join("\n")
            );
          }

          if (ctaHref && ctaHref !== titleHref) {
            lines.push(`${labels.open}: [${ctaLabel}](${localizeInternalHref(ctaHref, locale)})`);
          }

          return lines.filter(Boolean).join("\n\n");
        })
        .join("\n\n");
    }
  );
}

function transformInlineLinks(markdown, locale = DEFAULT_LOCALE) {
  return markdown
    .replace(
      /<SimpleButton\b[^>]*to="([^"]+)"[^>]*>([\s\S]*?)<\/SimpleButton>/g,
      (_match, href, inner) => `- [${stripInlineTags(inner)}](${localizeInternalHref(href.trim(), locale)})`
    )
    .replace(
      /<Link\b[^>]*to="([^"]+)"[^>]*>([\s\S]*?)<\/Link>/g,
      (_match, href, inner) => `[${stripInlineTags(inner)}](${localizeInternalHref(href.trim(), locale)})`
    );
}

function transformSimpleJsx(markdown, locale = DEFAULT_LOCALE) {
  let transformed = markdown
    .replace(/<RpcApiServiceLinks\s*\/>/g, buildRpcApiServiceLinks(locale))
    .replace(/<\/?React\.Fragment[^>]*>/g, "")
    .replace(/<strong>([\s\S]*?)<\/strong>/g, "**$1**");

  let previous;
  do {
    previous = transformed;
    transformed = transformed
      .replace(/<span[^>]*>([\s\S]*?)<\/span>/g, "$1")
      .replace(/<p[^>]*>([\s\S]*?)<\/p>/g, "$1")
      .replace(/<div[^>]*>([\s\S]*?)<\/div>/g, "$1");
  } while (transformed !== previous);

  return transformed;
}

function removeImports(markdown) {
  return markdown.replace(/^import\s+.+?;?\n/gm, "");
}

function stripCodeBlocksForValidation(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]+`/g, "");
}

function assertNoUnsupportedJsx(markdown, filePath) {
  const stripped = stripCodeBlocksForValidation(markdown);
  const unsupportedMatch = stripped.match(/<\/?[A-Za-z][^>]*>/);
  if (unsupportedMatch) {
    throw new Error(
      `Unsupported JSX remains in ${filePath}: ${unsupportedMatch[0]}`
    );
  }
}

function renderAuthoredMarkdown(content, route, filePath, locale = DEFAULT_LOCALE) {
  const labels = getAuthoredMarkdownLabels(locale);
  let markdown = removeImports(content);
  markdown = transformCardGrid(markdown, locale);
  markdown = transformInlineLinks(markdown, locale);
  markdown = transformSimpleJsx(markdown, locale);
  markdown = rewriteRootRelativeMarkdownLinks(markdown, locale);
  assertNoUnsupportedJsx(markdown, filePath);

  return `${normalizeMarkdown(
    `**${labels.source}:** [${buildAbsoluteUrl(route)}](${buildAbsoluteUrl(route)})\n\n${markdown}`
  )}\n`;
}

function getDocSectionLabel(route, locale = DEFAULT_LOCALE) {
  const labels = getAuthoredMarkdownLabels(locale);
  if (route.startsWith("/agents")) {
    return labels.aiAndAgents;
  }

  if (route.startsWith("/transaction-flow")) {
    return labels.transactionFlow;
  }

  if (route.startsWith("/snapshots")) {
    return labels.snapshots;
  }

  if (
    route === "/" ||
    route.startsWith("/rpc/") ||
    route === "/rpc" ||
    route === "/api" ||
    route === "/api/reference" ||
    route === "/tx" ||
    route === "/transfers" ||
    route === "/neardata" ||
    route === "/auth" ||
    route.startsWith("/fastdata")
  ) {
    return labels.rpcApiGuides;
  }

  return labels.otherGuides;
}

function getFirstMeaningfulParagraph(markdown) {
  const lines = markdown.split("\n");
  const paragraphs = [];
  let current = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current.length) {
        paragraphs.push(current.join(" ").trim());
        current = [];
      }
      continue;
    }

    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("> ") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith(":::")
    ) {
      continue;
    }

    current.push(trimmed);
  }

  if (current.length) {
    paragraphs.push(current.join(" ").trim());
  }

  return paragraphs.find(Boolean) || "";
}

function cloneJsonValue(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function getFieldTypeValues(field) {
  return Array.isArray(field.schema?.type)
    ? field.schema.type
    : field.schema?.type
      ? [field.schema.type]
      : [];
}

function fieldSupportsType(field, type) {
  const fieldTypes = getFieldTypeValues(field);
  const fieldOneOf = field.schema?.oneOf;

  return (
    fieldTypes.includes(type) ||
    (fieldOneOf || []).some((variant) => variant?.type === type)
  );
}

function isBooleanField(field) {
  return fieldSupportsType(field, "boolean");
}

function isArrayField(field) {
  return fieldSupportsType(field, "array") || Boolean(field.schema?.items);
}

function isObjectField(field) {
  return fieldSupportsType(field, "object") || Boolean(field.schema?.properties?.length);
}

function serializeFieldDraftValue(field, value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    if (field.schema?.items?.type === "string" || value.every((entry) => typeof entry === "string")) {
      return value.map((entry) => String(entry)).join("\n");
    }

    return JSON.stringify(value, null, 2);
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function parseFieldValue(field, rawValue) {
  const trimmedValue = rawValue.trim();
  const canBeArray = isArrayField(field);
  const canBeObject = isObjectField(field);
  const canBeBoolean = isBooleanField(field);
  const canBeInteger = fieldSupportsType(field, "integer");
  const canBeNumber = fieldSupportsType(field, "number");
  const fieldTypes = getFieldTypeValues(field);
  const canBeString = fieldSupportsType(field, "string") || fieldTypes.length === 0;

  if (canBeArray) {
    if (!trimmedValue) {
      return [];
    }

    if (trimmedValue.startsWith("[")) {
      try {
        return JSON.parse(trimmedValue);
      } catch (_error) {
        return trimmedValue
          .split(/\r?\n|,/)
          .map((entry) => entry.trim())
          .filter(Boolean);
      }
    }

    return trimmedValue
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (canBeObject) {
    if (!trimmedValue) {
      return {};
    }

    if (trimmedValue.startsWith("{")) {
      try {
        return JSON.parse(trimmedValue);
      } catch (_error) {
        return trimmedValue;
      }
    }
  }

  if (canBeBoolean && (trimmedValue === "true" || trimmedValue === "false")) {
    return trimmedValue === "true";
  }

  if (canBeInteger && /^-?\d+$/.test(trimmedValue)) {
    return Number(trimmedValue);
  }

  if (canBeNumber && /^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    return Number(trimmedValue);
  }

  if (canBeString || canBeInteger || canBeNumber || canBeBoolean) {
    return trimmedValue;
  }

  return trimmedValue;
}

function getDefaultFieldValue(pageModel, field, networkKey) {
  const selectedNetwork = pageModel.interaction.networks.find(
    (network) => network.key === networkKey
  );
  return serializeFieldDraftValue(field, selectedNetwork?.defaultFields?.[field.name]);
}

function getDefaultFieldValues(pageModel, networkKey) {
  return Object.fromEntries(
    pageModel.interaction.fields.map((field) => [
      field.name,
      getDefaultFieldValue(pageModel, field, networkKey),
    ])
  );
}

function buildRpcPayload(pageModel, fieldValues, finality, requestTemplate) {
  const parsedFieldValues = Object.fromEntries(
    pageModel.interaction.fields
      .map((field) => {
        const rawValue = fieldValues[field.name] || "";
        if (!rawValue.trim()) {
          return undefined;
        }

        return [field.name, parseFieldValue(field, rawValue)];
      })
      .filter(Boolean)
  );

  const template =
    requestTemplate && typeof requestTemplate === "object" && !Array.isArray(requestTemplate)
      ? cloneJsonValue(requestTemplate)
      : {};
  const templateParams = template.params;

  if (Array.isArray(templateParams)) {
    return {
      ...template,
      jsonrpc: typeof template.jsonrpc === "string" ? template.jsonrpc : "2.0",
      id: template.id !== undefined ? template.id : pageModel.interaction.defaultId || "fastnear",
      method:
        typeof template.method === "string"
          ? template.method
          : pageModel.interaction.requestMethod || pageModel.info.operationId,
      params: cloneJsonValue(templateParams),
    };
  }

  const baseParams =
    templateParams && typeof templateParams === "object"
      ? cloneJsonValue(templateParams)
      : {};

  return {
    ...template,
    jsonrpc: typeof template.jsonrpc === "string" ? template.jsonrpc : "2.0",
    id: template.id !== undefined ? template.id : pageModel.interaction.defaultId || "fastnear",
    method:
      typeof template.method === "string"
        ? template.method
        : pageModel.interaction.requestMethod || pageModel.info.operationId,
    params: {
      ...baseParams,
      ...(pageModel.interaction.supportsFinality ? { finality } : {}),
      ...(pageModel.interaction.requestType ? { request_type: pageModel.interaction.requestType } : {}),
      ...parsedFieldValues,
    },
  };
}

function buildHttpRequestUrl(pageModel, network, fieldValues) {
  const baseUrl = network?.url || "";
  const resolvedPath = Object.entries(fieldValues).reduce((currentPath, [fieldName, value]) => {
    const field = pageModel.interaction.fields.find((candidate) => candidate.name === fieldName);
    if (field?.location !== "path") {
      return currentPath;
    }

    return currentPath.replace(`{${fieldName}}`, encodeURIComponent(value.trim()));
  }, pageModel.route.path);

  const requestUrl = new URL(resolvedPath, baseUrl || "https://builder-docs.fastnear.invalid");
  for (const field of pageModel.interaction.fields) {
    if (field.location !== "query") {
      continue;
    }

    const value = fieldValues[field.name]?.trim();
    if (value) {
      requestUrl.searchParams.set(field.name, value);
    }
  }

  if (!baseUrl && requestUrl.hostname === "builder-docs.fastnear.invalid") {
    requestUrl.protocol = "https:";
    requestUrl.host = "builder-docs.fastnear.invalid";
  }

  return requestUrl;
}

function buildHttpRequestBody(pageModel, fieldValues) {
  const bodyEntries = pageModel.interaction.fields
    .filter((field) => field.location === "body")
    .map((field) => {
      const rawValue = fieldValues[field.name] || "";
      const trimmedValue = rawValue.trim();
      if (!trimmedValue) {
        return undefined;
      }

      return [field.name, parseFieldValue(field, rawValue)];
    })
    .filter(Boolean);

  if (bodyEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(bodyEntries);
}

function formatCodeBlock(language, value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  return `\`\`\`${language}\n${value}\n\`\`\``;
}

function formatJsonCodeBlock(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return formatCodeBlock("json", JSON.stringify(value, null, 2));
}

function formatNetworkLines(networks, labels) {
  if (!Array.isArray(networks) || !networks.length) {
    return `- ${labels.notSpecified}`;
  }

  return networks
    .map((network) => `- ${network.label || network.key}: ${sanitizePublicUrl(network.url)}`)
    .join("\n");
}

function formatSchemaType(schema = {}, labels = OPERATION_MARKDOWN_LABELS.en) {
  if (Array.isArray(schema.type)) {
    return schema.type.join(" | ");
  }

  if (schema.type) {
    return schema.type;
  }

  if (schema.oneOf?.length) {
    return schema.oneOf
      .map((variant) => variant?.type)
      .filter(Boolean)
      .join(" | ");
  }

  if (schema.properties) {
    return labels.object;
  }

  if (schema.items) {
    return labels.array;
  }

  return labels.value;
}

function formatFieldDescription(field, labels) {
  if (!field) {
    return "";
  }

  const parts = [];
  if (field.location === "path") {
    parts.push(labels.pathField);
  } else if (field.location === "query") {
    parts.push(labels.queryField);
  } else {
    parts.push(field.location || labels.requestBodyField || labels.body);
  }
  if (field.required) {
    parts.push(labels.required);
  }

  const type = formatSchemaType(field.schema, labels);
  if (type) {
    parts.push(type);
  }

  const description = field.description || field.schema?.description;
  const suffix = description ? `: ${description}` : "";

  return `- \`${field.name}\` (${parts.join(", ")})${suffix}`;
}

function formatParameterGroup(title, parameters, labels) {
  if (!parameters?.length) {
    return "";
  }

  return [
    `### ${title}`,
    "",
    ...parameters.map((parameter) => formatFieldDescription(parameter, labels)).filter(Boolean),
    "",
  ].join("\n");
}

function formatSecuritySummary(securitySchemes, labels) {
  if (!Array.isArray(securitySchemes) || !securitySchemes.length) {
    return `- ${labels.noAuthRequired}`;
  }

  const lines = securitySchemes.map((scheme) => {
    if (scheme.type === "apiKey") {
      return `- ${labels.apiKeyVia} ${scheme.in} \`${scheme.name}\`${scheme.description ? `: ${scheme.description}` : ""}`;
    }

    if (scheme.type === "http" && scheme.scheme === "bearer") {
      return `- ${labels.bearerTokenViaHeader}`;
    }

    return `- ${scheme.id || "Auth"} (${scheme.type || "custom"})${scheme.description ? `: ${scheme.description}` : ""}`;
  });

  lines.push(`- ${labels.withoutSavedCredentials}`);
  return lines.join("\n");
}

function sanitizeExampleRequest(example) {
  if (!example?.request) {
    return null;
  }

  const sanitized = JSON.parse(JSON.stringify(example.request));

  if (sanitized.query) {
    Object.keys(sanitized.query).forEach((key) => {
      if (SECRET_QUERY_PARAM_PATTERNS.some((pattern) => pattern.test(key))) {
        delete sanitized.query[key];
      }
    });
  }

  if (sanitized.headers) {
    Object.keys(sanitized.headers).forEach((key) => {
      if (/^authorization$/i.test(key) || /^x-api-key$/i.test(key)) {
        delete sanitized.headers[key];
      }
    });
  }

  return sanitized;
}

function formatCurrentRequestSection({
  locale = DEFAULT_LOCALE,
  pageModel,
  requestUrl,
  httpRequestBody,
  rpcPayload,
  selectedExample,
  selectedFinality,
  selectedNetworkDetails,
}) {
  const labels = getOperationMarkdownLabels(locale);
  const lines = [`## ${labels.currentRequest}`, ""];

  if (selectedNetworkDetails?.label || selectedNetworkDetails?.key) {
    lines.push(`- ${labels.network}: ${selectedNetworkDetails.label || selectedNetworkDetails.key}`);
  }

  if (pageModel.route.transport === "json-rpc") {
    if (selectedFinality) {
      lines.push(`- ${labels.finality}: ${selectedFinality}`);
    }
    lines.push(`- ${labels.endpoint}: ${sanitizePublicUrl(selectedNetworkDetails?.url)}`);
    lines.push("");
    lines.push(`### ${labels.requestBody}`);
    lines.push("");
    lines.push(formatJsonCodeBlock(rpcPayload));
  } else {
    lines.push(`- ${labels.method}: ${pageModel.route.method}`);
    lines.push(`- ${labels.url}: ${sanitizePublicUrl(requestUrl?.toString())}`);
    if (selectedExample?.label) {
      lines.push(`- ${labels.activeExample}: ${selectedExample.label}`);
    }
    lines.push("");
    if (httpRequestBody) {
      lines.push(`### ${labels.requestBody}`);
      lines.push("");
      lines.push(formatJsonCodeBlock(httpRequestBody));
    }
  }

  return lines.filter(Boolean).join("\n");
}

function formatRequestReference(pageModel, selectedExample, locale = DEFAULT_LOCALE) {
  const labels = getOperationMarkdownLabels(locale);
  const sections = [`## ${labels.requestReference}`, ""];
  const exampleRequest = sanitizeExampleRequest(selectedExample);

  if (exampleRequest) {
    sections.push(`### ${labels.activeExample}`);
    sections.push("");
    sections.push(formatJsonCodeBlock(exampleRequest));
    sections.push("");
  }

  if (pageModel.interaction?.fields?.length) {
    sections.push(`### ${labels.inputs}`);
    sections.push("");
    sections.push(...pageModel.interaction.fields.map((field) => formatFieldDescription(field, labels)));
    sections.push("");
  }

  if (pageModel.request?.bodySchema) {
    sections.push(`### ${labels.requestSchema}`);
    sections.push("");
    sections.push(formatJsonCodeBlock(pageModel.request.bodySchema));
    sections.push("");
  }

  if (pageModel.request?.parameters) {
    const { path = [], query = [], header = [] } = pageModel.request.parameters;
    sections.push(formatParameterGroup(labels.pathParameters, path, labels));
    sections.push(formatParameterGroup(labels.queryParameters, query, labels));
    sections.push(formatParameterGroup(labels.headerParameters, header, labels));
  }

  return sections.filter(Boolean).join("\n");
}

function formatResponseReference(response, locale = DEFAULT_LOCALE) {
  if (!response) {
    return "";
  }

  const labels = getOperationMarkdownLabels(locale);
  const lines = [`## ${labels.responseReference}`, ""];
  lines.push(`- ${labels.status}: ${response.status || "200"}`);
  if (response.mediaType) {
    lines.push(`- ${labels.mediaType}: ${response.mediaType}`);
  }
  if (response.description) {
    lines.push(`- ${labels.summary}: ${response.description}`);
  }
  lines.push("");
  if (response.schema) {
    lines.push(`### ${labels.responseSchema}`);
    lines.push("");
    lines.push(formatJsonCodeBlock(response.schema));
  }

  return lines.filter(Boolean).join("\n");
}

function buildOperationMarkdown({
  currentUrl,
  httpRequestBody,
  locale = DEFAULT_LOCALE,
  pageModel,
  requestUrl,
  rpcPayload,
  selectedExample,
  selectedFinality,
  selectedNetworkDetails,
}) {
  const labels = getOperationMarkdownLabels(locale);
  const sourceLinks = new Set();

  [currentUrl, pageModel.canonicalPath, ...(pageModel.routeAliases || [])]
    .filter(Boolean)
    .forEach((value) => sourceLinks.add(sanitizePublicUrl(value, SITE_ORIGIN)));

  const sections = [`# ${pageModel.info.title}`, ""];

  if (pageModel.info.summary) {
    sections.push(pageModel.info.summary, "");
  }

  if (pageModel.info.description && pageModel.info.description !== pageModel.info.summary) {
    sections.push(pageModel.info.description, "");
  }

  sections.push(`## ${labels.sourceLinks}`, "");
  sections.push(...[...sourceLinks].map((link) => `- ${link}`));
  sections.push("");
  sections.push(`## ${labels.operation}`, "");
  sections.push(`- ${labels.transport}: ${pageModel.route.transport}`);
  sections.push(`- ${labels.method}: ${pageModel.route.method}`);
  sections.push(`- ${labels.path}: \`${pageModel.route.path}\``);
  if (pageModel.sourceSpec) {
    sections.push(`- ${labels.sourceSpec}: \`${pageModel.sourceSpec}\``);
  }
  sections.push("");
  sections.push(`## ${labels.networks}`, "");
  sections.push(formatNetworkLines(pageModel.interaction?.networks, labels));
  sections.push("");
  sections.push(`## ${labels.auth}`, "");
  sections.push(formatSecuritySummary(pageModel.securitySchemes, labels));
  sections.push("");
  sections.push(
    formatCurrentRequestSection({
      locale,
      pageModel,
      requestUrl,
      httpRequestBody,
      rpcPayload,
      selectedExample,
      selectedFinality,
      selectedNetworkDetails,
    })
  );
  sections.push("");
  sections.push(formatRequestReference(pageModel, selectedExample, locale));
  sections.push("");
  sections.push(formatResponseReference(pageModel.responses?.[0], locale));

  return `${normalizeMarkdown(sections.filter(Boolean).join("\n"))}\n`;
}

function buildOperationMarkdownForRoute(pageModel, route, locale = DEFAULT_LOCALE) {
  const selectedNetworkKey = pageModel.interaction.networks[0]?.key || "mainnet";
  const selectedNetworkDetails =
    pageModel.interaction.networks.find((network) => network.key === selectedNetworkKey) ||
    pageModel.interaction.networks[0];
  const selectedExample =
    pageModel.request.examples.find((example) => example.network === selectedNetworkKey) ||
    pageModel.request.examples[0];
  const selectedFinality = "final";
  const fieldValues = getDefaultFieldValues(pageModel, selectedNetworkKey);
  const trimmedFieldValues = Object.fromEntries(
    Object.entries(fieldValues).map(([key, value]) => [key, value.trim()])
  );
  const requestUrl =
    pageModel.route.transport === "http"
      ? buildHttpRequestUrl(pageModel, selectedNetworkDetails, trimmedFieldValues)
      : undefined;
  const httpRequestBody =
    pageModel.route.transport === "http"
      ? buildHttpRequestBody(pageModel, fieldValues)
      : undefined;
  const rpcPayload =
    pageModel.route.transport === "json-rpc"
      ? buildRpcPayload(
          pageModel,
          trimmedFieldValues,
          selectedFinality,
          selectedExample?.request?.body
        )
      : undefined;

  const exportPageModel = {
    ...pageModel,
    canonicalPath: localizeRoute(pageModel.canonicalPath, locale),
    routeAliases: (pageModel.routeAliases || []).map((candidateRoute) =>
      localizeRoute(candidateRoute, locale)
    ),
  };

  return buildOperationMarkdown({
    currentUrl: route,
    httpRequestBody,
    locale,
    pageModel: exportPageModel,
    requestUrl,
    rpcPayload,
    selectedExample,
    selectedFinality,
    selectedNetworkDetails,
  });
}

function createAuthoredDocEntries(locale = DEFAULT_LOCALE) {
  const docsRoot = getDocsRoot(locale);

  return walkDocsFiles(docsRoot)
    .map((filePath) => {
      const relativePath = path.relative(docsRoot, filePath);
      const rawContent = fs.readFileSync(filePath, "utf8");
      const { content, data } = parseFrontmatter(rawContent);
      const baseRoute = computeDocRoute(relativePath, data);
      const route = localizeRoute(baseRoute, locale);

      if (isHiddenRoute(baseRoute)) {
        return null;
      }

      const pageModelId = extractPageModelId(content);
      if (pageModelId) {
        const pageModel = localizePageModel(pageModelsById[pageModelId], locale);
        if (!pageModel || isHiddenCanonicalRoute(pageModel.canonicalPath)) {
          return null;
        }

        return {
          description: pageModel.info.summary || pageModel.info.description || "",
          htmlPath: route,
          group: getDocSectionLabel(baseRoute, locale),
          kind: "wrapper",
          markdown: buildOperationMarkdownForRoute(pageModel, route, locale),
          markdownPath: buildMarkdownMirrorPath(route),
          markdownPaths: buildMarkdownMirrorAliases(route),
          route,
          title: pageModel.info.title,
        };
      }

      const markdown = renderAuthoredMarkdown(content, route, relativePath, locale);
      return {
        description:
          data.description || getFirstMeaningfulParagraph(markdown).replace(/^\*\*Source:\*\*.+$/m, "").trim(),
        htmlPath: route,
        group: getDocSectionLabel(baseRoute, locale),
        kind: "authored",
        markdown,
        markdownPath: buildMarkdownMirrorPath(route),
        markdownPaths: buildMarkdownMirrorAliases(route),
        route,
        title: data.title || path.parse(filePath).name,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.route.localeCompare(right.route));
}

function createCanonicalEntries(locale = DEFAULT_LOCALE) {
  return pageModels
    .filter((pageModel) => !isHiddenCanonicalRoute(pageModel.canonicalPath))
    .map((pageModel) => {
      const localizedPageModel = localizePageModel(pageModel, locale);
      const baseRoute = normalizeRoute(pageModel.canonicalPath);
      const route = localizeRoute(baseRoute, locale);
      const topLevel = baseRoute.split("/")[1];
      const groupKey = baseRoute.split("/")[2];

      return {
        description: localizedPageModel.info.summary || localizedPageModel.info.description || "",
        group:
          topLevel === "rpcs"
            ? RPC_CATEGORY_LABELS[locale]?.[groupKey] || RPC_CATEGORY_LABELS[DEFAULT_LOCALE]?.[groupKey] || groupKey
            : API_SERVICE_LABELS[locale]?.[groupKey] || API_SERVICE_LABELS[DEFAULT_LOCALE]?.[groupKey] || groupKey,
        htmlPath: route,
        kind: topLevel === "rpcs" ? "rpc" : "api",
        markdown: buildOperationMarkdownForRoute(localizedPageModel, route, locale),
        markdownPath: buildMarkdownMirrorPath(route),
        markdownPaths: buildMarkdownMirrorAliases(route),
        route,
        title: localizedPageModel.info.title,
      };
    })
    .sort((left, right) => left.route.localeCompare(right.route));
}

function buildWebsiteEntity(locale = DEFAULT_LOCALE) {
  return {
    "@id": WEBSITE_ID,
    "@type": "WebSite",
    description:
      "API and RPC documentation for FastNear, high-performance infrastructure for the NEAR Protocol.",
    inLanguage: locale,
    name: "FastNear Docs",
    publisher: {
      "@id": ORGANIZATION_ID,
    },
    url: SITE_ORIGIN,
  };
}

function buildOrganizationEntity() {
  return {
    "@id": ORGANIZATION_ID,
    "@type": "Organization",
    description:
      "High-performance RPC and API infrastructure for the NEAR Protocol blockchain.",
    logo: ORGANIZATION_LOGO_URL,
    name: "FastNear",
    sameAs: ORGANIZATION_SAME_AS,
    url: "https://fastnear.com",
  };
}

function buildSiteGraphFamilyRecord(family, locale = DEFAULT_LOCALE) {
  const localizedFamily = localizeStructuredFamily(family, locale);
  const docsPath = localizeRoute(family.docsPath, locale);
  const hostedPathPrefix = localizeRoute(family.hostedPathPrefix, locale);
  const docsUrl = buildAbsoluteUrl(docsPath);
  return {
    ...localizedFamily,
    "@id": buildFamilyEntityId(family.id),
    docsPageId: buildPageEntityId(docsUrl),
    docsPath,
    docsUrl,
    documentationUrl: docsUrl,
    hostedPathPrefix,
    hostedPathPrefixUrl: buildAbsoluteUrl(hostedPathPrefix),
    providerId: ORGANIZATION_ID,
    serviceType: family.kind === "rpc" ? "JSON-RPC API" : "REST API",
  };
}

function buildSiteGraphOperationRecord(operation, locale = DEFAULT_LOCALE) {
  const localizedOperation = localizeStructuredOperation(operation, locale);
  const docsPath = localizeRoute(operation.docsPath, locale);
  const canonicalPath = localizeRoute(operation.canonicalPath, locale);
  const routeAliases = (operation.routeAliases || []).map((route) => localizeRoute(route, locale));
  const docsUrl = buildAbsoluteUrl(docsPath);
  const canonicalUrl = buildAbsoluteUrl(canonicalPath);
  return {
    ...localizedOperation,
    "@id": buildOperationEntityId(operation.pageModelId),
    abstract: localizedOperation.summary || localizedOperation.name,
    canonicalPageId: buildPageEntityId(canonicalUrl),
    canonicalPath,
    canonicalUrl,
    docsPageId: buildPageEntityId(docsUrl),
    docsPath,
    docsUrl,
    familyEntityId: buildFamilyEntityId(operation.familyId),
    inLanguage: locale,
    mainEntityOfPageId: buildPageEntityId(docsUrl),
    publisherId: ORGANIZATION_ID,
    routeAliases,
    sameAs: [
      docsUrl,
      canonicalUrl,
      ...routeAliases.map((route) => buildAbsoluteUrl(route)),
    ].filter((value, index, values) => values.indexOf(value) === index),
    subjectOfPageIds: [
      buildPageEntityId(docsUrl),
      buildPageEntityId(canonicalUrl),
    ].filter((value, index, values) => values.indexOf(value) === index),
  };
}

function buildSiteGraphArtifact({ authoredDocEntries, canonicalEntries, docEntries, locale = DEFAULT_LOCALE }) {
  const visibleCanonicalRoutes = new Set(canonicalEntries.map((entry) => normalizeRoute(entry.route)));
  const visibleOperations = (structuredGraph.operations || []).filter((operation) =>
    visibleCanonicalRoutes.has(localizeRoute(normalizeRoute(operation.canonicalPath), locale))
  );
  const usedFamilyIds = [...new Set(visibleOperations.map((operation) => operation.familyId))];
  const families = usedFamilyIds
    .map((familyId) => structuredFamiliesById[familyId])
    .filter(Boolean)
    .map((family) => buildSiteGraphFamilyRecord(family, locale))
    .sort((left, right) => left.id.localeCompare(right.id));
  const operations = visibleOperations
    .map((operation) => buildSiteGraphOperationRecord(operation, locale))
    .sort((left, right) => left.canonicalPath.localeCompare(right.canonicalPath));
  const pages = [
    ...docEntries.map((entry) => {
      const route = normalizeRoute(entry.route);
      const url = buildAbsoluteUrl(route);
      const markdownMirrorUrl = buildAbsoluteUrl(entry.markdownPath);
      const linkedOperation =
        entry.kind === "wrapper"
          ? visibleOperations.find(
              (operation) => localizeRoute(normalizeRoute(operation.docsPath), locale) === route
            )
          : null;
      const linkedFamilies =
        entry.kind === "wrapper"
          ? linkedOperation
            ? [linkedOperation.familyId]
            : []
          : families
              .filter((family) => normalizeRoute(family.docsPath) === route)
              .map((family) => family.id);

      return {
        entityIds: {
          familyIds: linkedFamilies.map((familyId) => buildFamilyEntityId(familyId)),
          mainEntityId: linkedOperation ? buildOperationEntityId(linkedOperation.pageModelId) : null,
          pageId: buildPageEntityId(url),
        },
        indexable: true,
        markdownMirrorUrl,
        pageSchemaType: getDocsPageSchemaType(entry),
        route,
        routeType: "docs",
        url,
      };
    }),
    ...canonicalEntries.map((entry) => {
      const route = normalizeRoute(entry.route);
      const operation = visibleOperations.find(
        (candidate) => localizeRoute(normalizeRoute(candidate.canonicalPath), locale) === route
      );
      if (!operation) {
        throw new Error(`Missing structured operation for hosted route ${route}`);
      }

      const url = buildAbsoluteUrl(route);
      return {
        entityIds: {
          familyIds: [buildFamilyEntityId(operation.familyId)],
          mainEntityId: buildOperationEntityId(operation.pageModelId),
          pageId: buildPageEntityId(url),
        },
        indexable: false,
        markdownMirrorUrl: buildAbsoluteUrl(entry.markdownPath),
        pageSchemaType: "WebPage",
        route,
        routeType: entry.kind === "rpc" ? "hosted-rpc" : "hosted-api",
        url,
      };
    }),
  ].sort((left, right) => left.url.localeCompare(right.url));

  return {
    discovery: {
      apiLlmsIndexUrl: buildLocalizedAbsoluteUrl("/apis/llms.txt", locale),
      docsLlmsIndexUrl: buildLocalizedAbsoluteUrl("/guides/llms.txt", locale),
      llmsFullUrl: buildLocalizedAbsoluteUrl("/llms-full.txt", locale),
      llmsIndexUrl: buildLocalizedAbsoluteUrl("/llms.txt", locale),
      markdownMirrorRootUrl: buildLocalizedAbsoluteUrl("/index.md", locale),
      rpcLlmsIndexUrl: buildLocalizedAbsoluteUrl("/rpcs/llms.txt", locale),
    },
    families,
    operations,
    organization: buildOrganizationEntity(),
    pages,
    version: 1,
    website: buildWebsiteEntity(locale),
  };
}

function writeMirrorEntries(entries) {
  for (const entry of entries) {
    const markdownPaths = entry.markdownPaths || [entry.markdownPath];
    for (const markdownPath of markdownPaths) {
      writeTextFile(path.join(STATIC_ROOT, markdownPath), entry.markdown);
    }
  }
}

function groupEntries(entries) {
  const groups = new Map();

  for (const entry of entries) {
    if (!groups.has(entry.group)) {
      groups.set(entry.group, []);
    }

    groups.get(entry.group).push(entry);
  }

  return [...groups.entries()];
}

function formatLlmsEntry(entry) {
  const description = entry.description ? `: ${entry.description}` : "";
  return `- [${entry.title}](${buildAbsoluteUrl(entry.markdownPath)})${description}`;
}

function buildGroupedIndex(title, intro, sectionIndexes, entries, locale = DEFAULT_LOCALE) {
  const labels = getAuthoredMarkdownLabels(locale);
  const lines = [`# ${title}`, "", intro, ""];

  if (sectionIndexes?.length) {
    lines.push(`## ${labels.indexes}`, "");
    lines.push(...sectionIndexes.map((entry) => `- [${entry.label}](${buildAbsoluteUrl(entry.href)})`));
    lines.push("");
  }

  for (const [group, groupedEntries] of groupEntries(entries)) {
    lines.push(`## ${group}`, "");
    lines.push(...groupedEntries.map((entry) => formatLlmsEntry(entry)));
    lines.push("");
  }

  return `${normalizeMarkdown(lines.join("\n"))}\n`;
}

function buildFullArchive(entries, locale = DEFAULT_LOCALE) {
  const labels = getAuthoredMarkdownLabels(locale);
  const sections = [
    `# ${labels.guidesArchiveTitle}`,
    "",
    labels.guidesArchiveIntro,
    "",
  ];

  for (const entry of entries) {
    sections.push(
      "---",
      "",
      `## ${entry.title}`,
      "",
      `- ${labels.htmlPath}: ${buildAbsoluteUrl(entry.htmlPath)}`,
      `- ${labels.markdownPath}: ${buildAbsoluteUrl(entry.markdownPath)}`,
      ""
    );
    sections.push(entry.markdown.trim(), "");
  }

  return `${normalizeMarkdown(sections.join("\n"))}\n`;
}

function main() {
  removeGeneratedStaticRoots();

  for (const locale of SUPPORTED_LOCALES) {
    const labels = getAuthoredMarkdownLabels(locale);
    const docEntries = createAuthoredDocEntries(locale);
    const authoredDocEntries = docEntries.filter((entry) => entry.kind === "authored");
    const wrapperDocEntries = docEntries.filter((entry) => entry.kind === "wrapper");
    const canonicalEntries = createCanonicalEntries(locale);
    const rpcEntries = canonicalEntries.filter((entry) => entry.kind === "rpc");
    const apiEntries = canonicalEntries.filter((entry) => entry.kind === "api");

    writeMirrorEntries([...docEntries, ...canonicalEntries]);

    writeTextFile(
      path.join(STATIC_ROOT, localizeRoute("/guides/llms.txt", locale)),
      buildGroupedIndex(
        labels.llmsGuidesTitle,
        labels.llmsGuidesIntro,
        [{ href: localizeRoute("/llms.txt", locale), label: labels.topLevelIndex }],
        authoredDocEntries,
        locale
      )
    );

    writeTextFile(
      path.join(STATIC_ROOT, localizeRoute("/rpcs/llms.txt", locale)),
      buildGroupedIndex(
        labels.rpcReferenceTitle,
        labels.rpcReferenceIntro,
        [{ href: localizeRoute("/llms.txt", locale), label: labels.topLevelIndex }],
        rpcEntries,
        locale
      )
    );

    writeTextFile(
      path.join(STATIC_ROOT, localizeRoute("/apis/llms.txt", locale)),
      buildGroupedIndex(
        labels.restApiReferenceTitle,
        labels.restApiReferenceIntro,
        [{ href: localizeRoute("/llms.txt", locale), label: labels.topLevelIndex }],
        apiEntries,
        locale
      )
    );

    writeTextFile(
      path.join(STATIC_ROOT, localizeRoute("/llms.txt", locale)),
      buildGroupedIndex(
        labels.llmsRootTitle,
        labels.llmsIntro,
        [
          { href: localizeRoute("/guides/llms.txt", locale), label: labels.llmsGuidesIndex },
          { href: localizeRoute("/rpcs/llms.txt", locale), label: labels.rpcReferenceIndex },
          { href: localizeRoute("/apis/llms.txt", locale), label: labels.restApiReferenceIndex },
          { href: localizeRoute("/llms-full.txt", locale), label: labels.llmsFull },
        ],
        [...authoredDocEntries, ...rpcEntries, ...apiEntries],
        locale
      )
    );

    writeTextFile(
      path.join(STATIC_ROOT, localizeRoute("/llms-full.txt", locale)),
      buildFullArchive([...authoredDocEntries, ...rpcEntries, ...apiEntries], locale)
    );

    writeTextFile(
      path.join(STATIC_ROOT, localizeRoute("/structured-data/site-graph.json", locale)),
      `${JSON.stringify(
        buildSiteGraphArtifact({
          authoredDocEntries,
          canonicalEntries,
          docEntries,
          locale,
        }),
        null,
        2
      )}\n`
    );

    if (wrapperDocEntries.length === 0) {
      throw new Error("Expected docs operation wrapper pages to generate Markdown mirrors.");
    }
  }
}

main();

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

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
const SECRET_QUERY_PARAM_PATTERNS = [/^apiKey$/i, /^token$/i, /^header\./i];

const RPC_CATEGORY_LABELS = {
  account: "Account RPC",
  block: "Block RPC",
  contract: "Contract RPC",
  protocol: "Protocol RPC",
  transaction: "Transaction RPC",
  validators: "Validators RPC",
};

const API_SERVICE_LABELS = {
  fastnear: "FastNear API",
  "kv-fastdata": "KV FastData API",
  neardata: "NEAR Data API",
  transactions: "Transactions API",
  transfers: "Transfers API",
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

  return isCollectionRoute(entry.route) ? "CollectionPage" : "TechArticle";
}

function normalizeMarkdown(markdown) {
  return markdown.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function rewriteRootRelativeMarkdownLinks(markdown) {
  return markdown.replace(
    /(!?\[[^\]]*]\()((?:<)?\/[^)\s>]+(?:>)?)(\))/g,
    (_match, prefix, href, suffix) =>
      `${prefix}${sanitizePublicUrl(href.replace(/^<|>$/g, ""), SITE_ORIGIN)}${suffix}`
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

function buildRpcApiServiceLinks() {
  const links = [
    {
      href: "/api",
      label: "FastNear API",
      description:
        "Indexed account views for balances, NFTs, staking, and public-key lookups.",
    },
    {
      href: "/tx",
      label: "Transactions API",
      description:
        "Account, block, receipt, and transaction history from indexed execution data.",
    },
    ...(!hideEarlyApiFamilies
      ? [
          {
            href: "/transfers",
            label: "Transfers API",
            description:
              "Purpose-built transfer history for account activity and pagination-heavy UIs.",
          },
        ]
      : []),
    ...(!hideEarlyApiFamilies
      ? [
          {
            href: "/fastdata/kv",
            label: "KV FastData API",
            description:
              "Indexed key-value history and latest-state lookups for contract storage analysis.",
          },
        ]
      : []),
    {
      href: "/neardata",
      label: "NEAR Data API",
      description:
        "Recent finalized and optimistic block-family reads for low-latency polling workflows.",
    },
  ];

  return links
    .map((link) => `- [${link.label}](${link.href}): ${link.description}`)
    .join("\n");
}

function transformCardGrid(markdown) {
  return markdown.replace(
    /<div className="fastnear-doc-card-grid">([\s\S]*?)<\/div>/g,
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
            `### ${titleHref ? `[${title}](${titleHref})` : ctaHref ? `[${title}](${ctaHref})` : title}`
          );

          if (eyebrow) {
            lines.push(`*${eyebrow}*`);
          }

          if (summary) {
            lines.push(summary);
          }

          if (bestForMatches.length) {
            lines.push("Best for:");
            lines.push(
              bestForMatches
                .map(
                  (bestForMatch) =>
                    `- [${stripInlineTags(bestForMatch[2])}](${bestForMatch[1].trim()})`
                )
                .join("\n")
            );
          }

          if (ctaHref && ctaHref !== titleHref) {
            lines.push(`Open: [${ctaLabel}](${ctaHref})`);
          }

          return lines.filter(Boolean).join("\n\n");
        })
        .join("\n\n");
    }
  );
}

function transformInlineLinks(markdown) {
  return markdown
    .replace(
      /<SimpleButton\b[^>]*to="([^"]+)"[^>]*>([\s\S]*?)<\/SimpleButton>/g,
      (_match, href, inner) => `- [${stripInlineTags(inner)}](${href.trim()})`
    )
    .replace(
      /<Link\b[^>]*to="([^"]+)"[^>]*>([\s\S]*?)<\/Link>/g,
      (_match, href, inner) => `[${stripInlineTags(inner)}](${href.trim()})`
    );
}

function transformSimpleJsx(markdown) {
  return markdown
    .replace(/<RpcApiServiceLinks\s*\/>/g, buildRpcApiServiceLinks())
    .replace(
      /<ApiKeyManager\s*\/>/g,
      [
        "> The interactive browser key manager is omitted from this static Markdown mirror.",
        "> Use the live docs page for the browser demo flow, or see",
        "> [Production Backend Auth](/auth/backend)",
        "> for secure backend usage.",
      ].join(" ")
    )
    .replace(/<\/?React\.Fragment[^>]*>/g, "")
    .replace(/<strong>([\s\S]*?)<\/strong>/g, "**$1**")
    .replace(/<span[^>]*>([\s\S]*?)<\/span>/g, "$1")
    .replace(/<div[^>]*>([\s\S]*?)<\/div>/g, "$1");
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

function renderAuthoredMarkdown(content, route, filePath) {
  let markdown = removeImports(content);
  markdown = transformCardGrid(markdown);
  markdown = transformInlineLinks(markdown);
  markdown = transformSimpleJsx(markdown);
  markdown = rewriteRootRelativeMarkdownLinks(markdown);
  assertNoUnsupportedJsx(markdown, filePath);

  return `${normalizeMarkdown(
    `**Source:** [${buildAbsoluteUrl(route)}](${buildAbsoluteUrl(route)})\n\n${markdown}`
  )}\n`;
}

function getDocSectionLabel(route) {
  if (route.startsWith("/agents")) {
    return "AI & Agents";
  }

  if (route.startsWith("/transaction-flow")) {
    return "Transaction Flow";
  }

  if (route.startsWith("/snapshots")) {
    return "Snapshots";
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
    return "RPC / API Guides";
  }

  return "Other Guides";
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

function formatNetworkLines(networks) {
  if (!Array.isArray(networks) || !networks.length) {
    return "- Not specified";
  }

  return networks
    .map((network) => `- ${network.label || network.key}: ${sanitizePublicUrl(network.url)}`)
    .join("\n");
}

function formatSchemaType(schema = {}) {
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
    return "object";
  }

  if (schema.items) {
    return "array";
  }

  return "value";
}

function formatFieldDescription(field) {
  const parts = [];
  parts.push(field.location || "body");
  if (field.required) {
    parts.push("required");
  }

  const type = formatSchemaType(field.schema);
  if (type) {
    parts.push(type);
  }

  const description = field.description || field.schema?.description;
  const suffix = description ? `: ${description}` : "";

  return `- \`${field.name}\` (${parts.join(", ")})${suffix}`;
}

function formatParameterGroup(title, parameters) {
  if (!parameters?.length) {
    return "";
  }

  return [`### ${title}`, "", ...parameters.map((parameter) => formatFieldDescription(parameter)), ""].join(
    "\n"
  );
}

function formatSecuritySummary(securitySchemes) {
  if (!Array.isArray(securitySchemes) || !securitySchemes.length) {
    return "- No auth required";
  }

  const lines = securitySchemes.map((scheme) => {
    if (scheme.type === "apiKey") {
      return `- API key via ${scheme.in} \`${scheme.name}\`${scheme.description ? `: ${scheme.description}` : ""}`;
    }

    if (scheme.type === "http" && scheme.scheme === "bearer") {
      return "- Bearer token via `Authorization: Bearer <token>` header";
    }

    return `- ${scheme.id || "Auth"} (${scheme.type || "custom"})${scheme.description ? `: ${scheme.description}` : ""}`;
  });

  lines.push("- This export intentionally omits any locally saved credentials");
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
  pageModel,
  requestUrl,
  httpRequestBody,
  rpcPayload,
  selectedExample,
  selectedFinality,
  selectedNetworkDetails,
}) {
  const lines = ["## Current request", ""];

  if (selectedNetworkDetails?.label || selectedNetworkDetails?.key) {
    lines.push(`- Network: ${selectedNetworkDetails.label || selectedNetworkDetails.key}`);
  }

  if (pageModel.route.transport === "json-rpc") {
    if (selectedFinality) {
      lines.push(`- Finality: ${selectedFinality}`);
    }
    lines.push(`- Endpoint: ${sanitizePublicUrl(selectedNetworkDetails?.url)}`);
    lines.push("");
    lines.push("### Request body");
    lines.push("");
    lines.push(formatJsonCodeBlock(rpcPayload));
  } else {
    lines.push(`- Method: ${pageModel.route.method}`);
    lines.push(`- URL: ${sanitizePublicUrl(requestUrl?.toString())}`);
    if (selectedExample?.label) {
      lines.push(`- Active example: ${selectedExample.label}`);
    }
    lines.push("");
    if (httpRequestBody) {
      lines.push("### Request body");
      lines.push("");
      lines.push(formatJsonCodeBlock(httpRequestBody));
    }
  }

  return lines.filter(Boolean).join("\n");
}

function formatRequestReference(pageModel, selectedExample) {
  const sections = ["## Request reference", ""];
  const exampleRequest = sanitizeExampleRequest(selectedExample);

  if (exampleRequest) {
    sections.push("### Active example");
    sections.push("");
    sections.push(formatJsonCodeBlock(exampleRequest));
    sections.push("");
  }

  if (pageModel.interaction?.fields?.length) {
    sections.push("### Inputs");
    sections.push("");
    sections.push(...pageModel.interaction.fields.map((field) => formatFieldDescription(field)));
    sections.push("");
  }

  if (pageModel.request?.bodySchema) {
    sections.push("### Request schema");
    sections.push("");
    sections.push(formatJsonCodeBlock(pageModel.request.bodySchema));
    sections.push("");
  }

  if (pageModel.request?.parameters) {
    const { path = [], query = [], header = [] } = pageModel.request.parameters;
    sections.push(formatParameterGroup("Path parameters", path));
    sections.push(formatParameterGroup("Query parameters", query));
    sections.push(formatParameterGroup("Header parameters", header));
  }

  return sections.filter(Boolean).join("\n");
}

function formatResponseReference(response) {
  if (!response) {
    return "";
  }

  const lines = ["## Response reference", ""];
  lines.push(`- Status: ${response.status || "200"}`);
  if (response.mediaType) {
    lines.push(`- Media type: ${response.mediaType}`);
  }
  if (response.description) {
    lines.push(`- Summary: ${response.description}`);
  }
  lines.push("");
  if (response.schema) {
    lines.push("### Response schema");
    lines.push("");
    lines.push(formatJsonCodeBlock(response.schema));
  }

  return lines.filter(Boolean).join("\n");
}

function buildOperationMarkdown({
  currentUrl,
  httpRequestBody,
  pageModel,
  requestUrl,
  rpcPayload,
  selectedExample,
  selectedFinality,
  selectedNetworkDetails,
}) {
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

  sections.push("## Source links", "");
  sections.push(...[...sourceLinks].map((link) => `- ${link}`));
  sections.push("");
  sections.push("## Operation", "");
  sections.push(`- Transport: ${pageModel.route.transport}`);
  sections.push(`- Method: ${pageModel.route.method}`);
  sections.push(`- Path: \`${pageModel.route.path}\``);
  if (pageModel.sourceSpec) {
    sections.push(`- Source spec: \`${pageModel.sourceSpec}\``);
  }
  sections.push("");
  sections.push("## Networks", "");
  sections.push(formatNetworkLines(pageModel.interaction?.networks));
  sections.push("");
  sections.push("## Auth", "");
  sections.push(formatSecuritySummary(pageModel.securitySchemes));
  sections.push("");
  sections.push(
    formatCurrentRequestSection({
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
  sections.push(formatRequestReference(pageModel, selectedExample));
  sections.push("");
  sections.push(formatResponseReference(pageModel.responses?.[0]));

  return `${normalizeMarkdown(sections.filter(Boolean).join("\n"))}\n`;
}

function buildOperationMarkdownForRoute(pageModel, route) {
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

  return buildOperationMarkdown({
    currentUrl: route,
    httpRequestBody,
    pageModel,
    requestUrl,
    rpcPayload,
    selectedExample,
    selectedFinality,
    selectedNetworkDetails,
  });
}

function createAuthoredDocEntries() {
  return walkDocsFiles(DOCS_ROOT)
    .map((filePath) => {
      const relativePath = path.relative(DOCS_ROOT, filePath);
      const rawContent = fs.readFileSync(filePath, "utf8");
      const { content, data } = parseFrontmatter(rawContent);
      const route = computeDocRoute(relativePath, data);

      if (isHiddenRoute(route)) {
        return null;
      }

      const pageModelId = extractPageModelId(content);
      if (pageModelId) {
        const pageModel = pageModelsById[pageModelId];
        if (!pageModel || isHiddenCanonicalRoute(pageModel.canonicalPath)) {
          return null;
        }

        return {
          description: pageModel.info.summary || pageModel.info.description || "",
          htmlPath: route,
          group: getDocSectionLabel(route),
          kind: "wrapper",
          markdown: buildOperationMarkdownForRoute(pageModel, route),
          markdownPath: buildMarkdownMirrorPath(route),
          markdownPaths: buildMarkdownMirrorAliases(route),
          route,
          title: pageModel.info.title,
        };
      }

      const markdown = renderAuthoredMarkdown(content, route, relativePath);
      return {
        description:
          data.description || getFirstMeaningfulParagraph(markdown).replace(/^\*\*Source:\*\*.+$/m, "").trim(),
        htmlPath: route,
        group: getDocSectionLabel(route),
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

function createCanonicalEntries() {
  return pageModels
    .filter((pageModel) => !isHiddenCanonicalRoute(pageModel.canonicalPath))
    .map((pageModel) => {
      const route = normalizeRoute(pageModel.canonicalPath);
      const topLevel = route.split("/")[1];
      const groupKey = route.split("/")[2];

      return {
        description: pageModel.info.summary || pageModel.info.description || "",
        group:
          topLevel === "rpcs"
            ? RPC_CATEGORY_LABELS[groupKey] || groupKey
            : API_SERVICE_LABELS[groupKey] || groupKey,
        htmlPath: route,
        kind: topLevel === "rpcs" ? "rpc" : "api",
        markdown: buildOperationMarkdownForRoute(pageModel, route),
        markdownPath: buildMarkdownMirrorPath(route),
        markdownPaths: buildMarkdownMirrorAliases(route),
        route,
        title: pageModel.info.title,
      };
    })
    .sort((left, right) => left.route.localeCompare(right.route));
}

function buildWebsiteEntity() {
  return {
    "@id": WEBSITE_ID,
    "@type": "WebSite",
    description:
      "API and RPC documentation for FastNear, high-performance infrastructure for the NEAR Protocol.",
    inLanguage: "en",
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

function buildSiteGraphFamilyRecord(family) {
  const docsUrl = buildAbsoluteUrl(family.docsPath);
  return {
    ...family,
    "@id": buildFamilyEntityId(family.id),
    docsPageId: buildPageEntityId(docsUrl),
    docsUrl,
    documentationUrl: docsUrl,
    hostedPathPrefixUrl: buildAbsoluteUrl(family.hostedPathPrefix),
    providerId: ORGANIZATION_ID,
    serviceType: family.kind === "rpc" ? "JSON-RPC API" : "REST API",
  };
}

function buildSiteGraphOperationRecord(operation) {
  const docsUrl = buildAbsoluteUrl(operation.docsPath);
  const canonicalUrl = buildAbsoluteUrl(operation.canonicalPath);
  return {
    ...operation,
    "@id": buildOperationEntityId(operation.pageModelId),
    abstract: operation.summary || operation.name,
    canonicalPageId: buildPageEntityId(canonicalUrl),
    canonicalUrl,
    docsPageId: buildPageEntityId(docsUrl),
    docsUrl,
    familyEntityId: buildFamilyEntityId(operation.familyId),
    inLanguage: "en",
    mainEntityOfPageId: buildPageEntityId(docsUrl),
    publisherId: ORGANIZATION_ID,
    sameAs: [
      docsUrl,
      canonicalUrl,
      ...(operation.routeAliases || []).map((route) => buildAbsoluteUrl(route)),
    ].filter((value, index, values) => values.indexOf(value) === index),
    subjectOfPageIds: [
      buildPageEntityId(docsUrl),
      buildPageEntityId(canonicalUrl),
    ].filter((value, index, values) => values.indexOf(value) === index),
  };
}

function buildSiteGraphArtifact({ authoredDocEntries, canonicalEntries, docEntries }) {
  const visibleCanonicalRoutes = new Set(canonicalEntries.map((entry) => normalizeRoute(entry.route)));
  const visibleOperations = (structuredGraph.operations || []).filter((operation) =>
    visibleCanonicalRoutes.has(normalizeRoute(operation.canonicalPath))
  );
  const usedFamilyIds = [...new Set(visibleOperations.map((operation) => operation.familyId))];
  const families = usedFamilyIds
    .map((familyId) => structuredFamiliesById[familyId])
    .filter(Boolean)
    .map((family) => buildSiteGraphFamilyRecord(family))
    .sort((left, right) => left.id.localeCompare(right.id));
  const operations = visibleOperations
    .map((operation) => buildSiteGraphOperationRecord(operation))
    .sort((left, right) => left.canonicalPath.localeCompare(right.canonicalPath));
  const pages = [
    ...docEntries.map((entry) => {
      const route = normalizeRoute(entry.route);
      const url = buildAbsoluteUrl(route);
      const markdownMirrorUrl = buildAbsoluteUrl(entry.markdownPath);
      const linkedOperation =
        entry.kind === "wrapper"
          ? visibleOperations.find((operation) => normalizeRoute(operation.docsPath) === route)
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
        (candidate) => normalizeRoute(candidate.canonicalPath) === route
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
      apiLlmsIndexUrl: buildAbsoluteUrl("/apis/llms.txt"),
      docsLlmsIndexUrl: buildAbsoluteUrl("/guides/llms.txt"),
      llmsFullUrl: buildAbsoluteUrl("/llms-full.txt"),
      llmsIndexUrl: buildAbsoluteUrl("/llms.txt"),
      markdownMirrorRootUrl: buildAbsoluteUrl("/index.md"),
      rpcLlmsIndexUrl: buildAbsoluteUrl("/rpcs/llms.txt"),
    },
    families,
    operations,
    organization: buildOrganizationEntity(),
    pages,
    version: 1,
    website: buildWebsiteEntity(),
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

function buildGroupedIndex(title, intro, sectionIndexes, entries) {
  const lines = [`# ${title}`, "", intro, ""];

  if (sectionIndexes?.length) {
    lines.push("## Indexes", "");
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

function buildFullArchive(entries) {
  const sections = [
    "# FastNear Builder Docs Full Documentation Archive",
    "",
    "AI-readable Markdown mirrors for authored docs plus canonical `/rpcs/**` and `/apis/**` routes.",
    "",
  ];

  for (const entry of entries) {
    sections.push(
      "---",
      "",
      `## ${entry.title}`,
      "",
      `- HTML path: ${buildAbsoluteUrl(entry.htmlPath)}`,
      `- Markdown path: ${buildAbsoluteUrl(entry.markdownPath)}`,
      ""
    );
    sections.push(entry.markdown.trim(), "");
  }

  return `${normalizeMarkdown(sections.join("\n"))}\n`;
}

function main() {
  removeGeneratedStaticRoots();

  const docEntries = createAuthoredDocEntries();
  const authoredDocEntries = docEntries.filter((entry) => entry.kind === "authored");
  const wrapperDocEntries = docEntries.filter((entry) => entry.kind === "wrapper");
  const canonicalEntries = createCanonicalEntries();
  const rpcEntries = canonicalEntries.filter((entry) => entry.kind === "rpc");
  const apiEntries = canonicalEntries.filter((entry) => entry.kind === "api");

  writeMirrorEntries([...docEntries, ...canonicalEntries]);

  writeTextFile(
    path.join(STATIC_ROOT, "guides/llms.txt"),
    buildGroupedIndex(
      "FastNear Builder Docs Guides",
      "Author-written guides and overview pages in AI-readable Markdown form.",
      [{ href: "/llms.txt", label: "Top-level index" }],
      authoredDocEntries
    )
  );

  writeTextFile(
    path.join(STATIC_ROOT, "rpcs/llms.txt"),
    buildGroupedIndex(
      "FastNear RPC Reference",
      "Canonical RPC reference pages in AI-readable Markdown form.",
      [{ href: "/llms.txt", label: "Top-level index" }],
      rpcEntries
    )
  );

  writeTextFile(
    path.join(STATIC_ROOT, "apis/llms.txt"),
    buildGroupedIndex(
      "FastNear REST API Reference",
      "Canonical REST API reference pages in AI-readable Markdown form.",
      [{ href: "/llms.txt", label: "Top-level index" }],
      apiEntries
    )
  );

  writeTextFile(
    path.join(STATIC_ROOT, "llms.txt"),
    buildGroupedIndex(
      "FastNear Builder Docs",
      "AI-readable indexes for FastNear guides, RPC reference, and REST API reference.",
      [
        { href: "/guides/llms.txt", label: "Guides index" },
        { href: "/rpcs/llms.txt", label: "RPC reference index" },
        { href: "/apis/llms.txt", label: "REST API reference index" },
        { href: "/llms-full.txt", label: "Full archive" },
      ],
      [...authoredDocEntries, ...rpcEntries, ...apiEntries]
    )
  );

  writeTextFile(
    path.join(STATIC_ROOT, "llms-full.txt"),
    buildFullArchive([...authoredDocEntries, ...rpcEntries, ...apiEntries])
  );

  writeTextFile(
    path.join(STATIC_ROOT, "structured-data/site-graph.json"),
    `${JSON.stringify(
      buildSiteGraphArtifact({
        authoredDocEntries,
        canonicalEntries,
        docEntries,
      }),
      null,
      2
    )}\n`
  );

  if (wrapperDocEntries.length === 0) {
    throw new Error("Expected docs operation wrapper pages to generate Markdown mirrors.");
  }
}

main();

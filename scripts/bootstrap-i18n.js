#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const {
  ROOT,
  getLocaleDocsRoot,
  getLocaleFastnearTranslationsPath,
  getLocaleGlossary,
  getLocaleRoot,
  getLocaleTranslationPolicy,
  assertSupportedLocale,
} = require("./lib/locale-framework");

const DOCS_ROOT = path.join(ROOT, "docs");
const PAGE_MODELS_PATH = path.join(ROOT, "src/data/generatedFastnearPageModels.json");
const STRUCTURED_GRAPH_PATH = path.join(ROOT, "src/data/generatedFastnearStructuredGraph.json");

const TRANSLATABLE_FRONTMATTER_KEYS = new Set(["title", "description", "sidebar_label"]);
const TRANSLATABLE_VALUE_KEYS = new Set([
  "abstract",
  "description",
  "headline",
  "label",
  "name",
  "summary",
  "title",
]);

const TRANSLATION_JSON_PATHS = [
  "code.json",
  "docusaurus-plugin-content-docs/current.json",
  "docusaurus-theme-classic/footer.json",
  "docusaurus-theme-classic/navbar.json",
];

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDirectory(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cloneJsonValue(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
    return {
      content: rawContent,
      data: {},
      rawFrontmatter: "",
    };
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
    rawFrontmatter: match[1],
  };
}

function protectSegments(value) {
  const tokens = [];
  const patterns = [
    /`[^`\n]+`/g,
    /<[^>\n]+>/g,
    /\{[^}]+\}/g,
    /\]\([^)]+\)/g,
    /https?:\/\/[^\s)]+/g,
  ];

  let text = String(value || "");
  patterns.forEach((pattern) => {
    text = text.replace(pattern, (match) => {
      const token = `__I18N_TOKEN_${tokens.length}__`;
      tokens.push(match);
      return token;
    });
  });

  return {
    text,
    restore(translated) {
      return tokens.reduceRight((current, tokenValue, index) => {
        return current.replaceAll(`__I18N_TOKEN_${index}__`, tokenValue);
      }, translated);
    },
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyWordReplacements(input, replacements) {
  let output = input;

  replacements.forEach(({ from, to }) => {
    const pattern = new RegExp(`\\b${escapeRegExp(from)}\\b`, "g");
    output = output.replace(pattern, to);
  });

  return output;
}

function createTranslator(glossary) {
  const exactReplacements = [...glossary.translate.exact].sort(
    (left, right) => right.from.length - left.from.length
  );
  const wordReplacements = [...glossary.translate.words, ...glossary.transliterate.words];

  return function translatePlainText(input) {
    const raw = String(input || "");
    if (!/[A-Za-z]/.test(raw)) {
      return raw;
    }

    const { text, restore } = protectSegments(raw);
    let translated = text;

    exactReplacements.forEach(({ from, to }) => {
      translated = translated.split(from).join(to);
    });

    translated = applyWordReplacements(translated, wordReplacements)
      .replace(/\s+:/g, ":")
      .replace(/\s{2,}/g, " ")
      .replace(/ ,/g, ",");

    return restore(translated);
  };
}

function mergeScaffoldWithExisting(scaffold, existing) {
  if (existing === undefined) {
    return cloneJsonValue(scaffold);
  }

  if (Array.isArray(scaffold) || Array.isArray(existing)) {
    return cloneJsonValue(existing);
  }

  if (!isPlainObject(scaffold) || !isPlainObject(existing)) {
    return cloneJsonValue(existing);
  }

  const result = {};
  const keys = new Set([...Object.keys(scaffold), ...Object.keys(existing)]);
  keys.forEach((key) => {
    if (key in scaffold) {
      result[key] = mergeScaffoldWithExisting(scaffold[key], existing[key]);
      return;
    }

    result[key] = cloneJsonValue(existing[key]);
  });
  return result;
}

function mergeTranslationMessages(scaffold, existing) {
  if (!existing) {
    return scaffold;
  }

  const result = cloneJsonValue(scaffold);

  Object.entries(existing).forEach(([key, existingEntry]) => {
    if (!result[key]) {
      result[key] = cloneJsonValue(existingEntry);
      return;
    }

    if (isPlainObject(result[key]) && isPlainObject(existingEntry)) {
      result[key] = {
        ...result[key],
        ...existingEntry,
        message:
          typeof existingEntry.message === "string" ? existingEntry.message : result[key].message,
      };
      return;
    }

    result[key] = cloneJsonValue(existingEntry);
  });

  return result;
}

function translateFrontmatter(rawFrontmatter, translatePlainText) {
  return rawFrontmatter
    .split("\n")
    .map((line) => {
      const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
      if (!fieldMatch) {
        return line;
      }

      const [, key, value] = fieldMatch;
      if (!TRANSLATABLE_FRONTMATTER_KEYS.has(key)) {
        return line;
      }

      const prefix = `${key}: `;
      const rawValue = value.trim().replace(/^['"]|['"]$/g, "");
      const translatedValue = translatePlainText(rawValue);
      return `${prefix}${JSON.stringify(translatedValue)}`;
    })
    .join("\n");
}

function translateDocContent(content, translatePlainText) {
  const lines = content.split("\n");
  const translatedLines = [];
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
      translatedLines.push(line);
      continue;
    }

    if (
      inCodeFence ||
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export ") ||
      trimmed.startsWith("<FastnearDirectOperation") ||
      trimmed.startsWith("<ApiKeyManager") ||
      trimmed === ""
    ) {
      translatedLines.push(line);
      continue;
    }

    translatedLines.push(translatePlainText(line));
  }

  return translatedLines.join("\n");
}

function buildTranslatedDocFile(rawContent, translatePlainText) {
  const { content, rawFrontmatter } = parseFrontmatter(rawContent);
  const translatedFrontmatter = rawFrontmatter
    ? translateFrontmatter(rawFrontmatter, translatePlainText)
    : "";
  const translatedContent = translateDocContent(content, translatePlainText);

  if (!translatedFrontmatter) {
    return translatedContent;
  }

  return `---\n${translatedFrontmatter}\n---\n${translatedContent}`;
}

function collectTranslatedStrings(value, output, translatePlainText, keyPath = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectTranslatedStrings(entry, output, translatePlainText, [...keyPath, index])
    );
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entryValue]) => {
      collectTranslatedStrings(entryValue, output, translatePlainText, [...keyPath, key]);
    });
    return;
  }

  if (typeof value !== "string") {
    return;
  }

  const key = keyPath[keyPath.length - 1];
  if (!TRANSLATABLE_VALUE_KEYS.has(key)) {
    return;
  }

  const translated = translatePlainText(value);
  if (translated && translated !== value) {
    output[value] = translated;
  }
}

function buildFastnearTranslations(localeContext, translatePlainText) {
  const pageModels = JSON.parse(fs.readFileSync(PAGE_MODELS_PATH, "utf8"));
  const structuredGraph = JSON.parse(fs.readFileSync(STRUCTURED_GRAPH_PATH, "utf8"));

  const catalog = {
    locale: localeContext.locale,
    families: {},
    pageModels: {},
    routes: localeContext.policy.bootstrap.routeLabels,
    strings: {},
  };

  structuredGraph.families.forEach((family) => {
    catalog.families[family.id] = {
      description: translatePlainText(family.description),
      name: translatePlainText(family.name),
    };
    collectTranslatedStrings(family, catalog.strings, translatePlainText);
  });

  pageModels.forEach((pageModel) => {
    const pageEntry = {
      examples: {},
      info: {
        description: translatePlainText(pageModel.info.description),
        summary: translatePlainText(pageModel.info.summary),
        title: translatePlainText(pageModel.info.title),
      },
      interaction: {
        fields: {},
        networks: {},
      },
      request: {
        parameters: {
          header: {},
          path: {},
          query: {},
        },
      },
      responses: {},
      securitySchemes: {},
    };

    pageModel.interaction.fields.forEach((field) => {
      pageEntry.interaction.fields[field.name] = {
        description: translatePlainText(field.description || field.schema?.description || ""),
        label: translatePlainText(field.label || field.name),
      };
    });

    (pageModel.interaction.networks || []).forEach((network) => {
      pageEntry.interaction.networks[network.key || network.label] = {
        label: translatePlainText(network.label || network.key),
      };
    });

    (pageModel.request.examples || []).forEach((example) => {
      pageEntry.examples[example.id] = {
        label: translatePlainText(example.label || example.id),
      };
    });

    (pageModel.responses || []).forEach((response, index) => {
      pageEntry.responses[response.status || String(index)] = {
        description: translatePlainText(response.description || ""),
      };
    });

    (pageModel.securitySchemes || []).forEach((scheme) => {
      pageEntry.securitySchemes[scheme.id || scheme.name] = {
        description: translatePlainText(scheme.description || ""),
      };
    });

    Object.entries(pageModel.request.parameters || {}).forEach(([location, parameters]) => {
      (parameters || []).forEach((parameter) => {
        pageEntry.request.parameters[location][parameter.name] = {
          description: translatePlainText(parameter.description || parameter.schema?.description || ""),
          label: translatePlainText(parameter.label || parameter.name),
        };
      });
    });

    catalog.pageModels[pageModel.pageModelId] = pageEntry;
    collectTranslatedStrings(pageModel, catalog.strings, translatePlainText);
  });

  structuredGraph.operations.forEach((operation) => {
    collectTranslatedStrings(operation, catalog.strings, translatePlainText);
  });

  return catalog;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function snapshotExistingDocs(localeContext) {
  if (!fs.existsSync(localeContext.docsRoot)) {
    return new Map();
  }

  return new Map(
    walkDocs(localeContext.docsRoot).map((filePath) => [
      path.relative(localeContext.docsRoot, filePath),
      fs.readFileSync(filePath, "utf8"),
    ])
  );
}

function snapshotExistingTranslations(localeContext) {
  return Object.fromEntries(
    TRANSLATION_JSON_PATHS.map((relativePath) => [
      relativePath,
      readJsonIfExists(path.join(localeContext.localeRoot, relativePath)),
    ])
  );
}

function runWriteTranslations(locale) {
  const result = spawnSync("yarn", ["write-translations", "--locale", locale], {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`write-translations failed for locale "${locale}" with exit code ${result.status}`);
  }
}

function patchTranslationJson(localeContext, relativePath, translatePlainText) {
  const filePath = path.join(localeContext.localeRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const scaffold = JSON.parse(fs.readFileSync(filePath, "utf8"));
  Object.entries(scaffold).forEach(([, entry]) => {
    if (typeof entry?.message === "string") {
      entry.message = translatePlainText(entry.message);
    }
  });

  const overrides = localeContext.policy.bootstrap.translationJsonOverrides[relativePath] || {};
  Object.entries(overrides).forEach(([key, message]) => {
    if (scaffold[key]) {
      scaffold[key].message = message;
    }
  });

  return scaffold;
}

function rebuildLocaleDocsTree(localeContext, existingDocs, options, translatePlainText) {
  fs.rmSync(localeContext.docsRoot, { recursive: true, force: true });
  ensureDirectory(localeContext.docsRoot);

  walkDocs(DOCS_ROOT).forEach((filePath) => {
    const relativePath = path.relative(DOCS_ROOT, filePath);
    const targetPath = path.join(localeContext.docsRoot, relativePath);
    ensureDirectory(path.dirname(targetPath));

    if (!options.reseed && existingDocs.has(relativePath)) {
      fs.writeFileSync(targetPath, existingDocs.get(relativePath), "utf8");
      return;
    }

    fs.writeFileSync(
      targetPath,
      buildTranslatedDocFile(fs.readFileSync(filePath, "utf8"), translatePlainText),
      "utf8"
    );
  });
}

function syncTranslationJsonFiles(localeContext, existingTranslations, options, translatePlainText) {
  TRANSLATION_JSON_PATHS.forEach((relativePath) => {
    const filePath = path.join(localeContext.localeRoot, relativePath);
    const scaffold = patchTranslationJson(localeContext, relativePath, translatePlainText);
    if (!scaffold) {
      return;
    }

    const nextValue = options.reseed
      ? scaffold
      : mergeTranslationMessages(scaffold, existingTranslations[relativePath]);

    writeJson(filePath, nextValue);
  });
}

function syncFastnearTranslations(localeContext, existingTranslations, options, translatePlainText) {
  const scaffold = buildFastnearTranslations(localeContext, translatePlainText);
  const nextCatalog =
    options.reseed || !existingTranslations
      ? scaffold
      : mergeScaffoldWithExisting(scaffold, existingTranslations);

  writeJson(localeContext.fastnearTranslationsPath, nextCatalog);
}

function parseOptions(argv) {
  let locale = null;
  let reseed = false;

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--reseed") {
      reseed = true;
      continue;
    }

    if (token === "--locale") {
      locale = argv[index + 1] || null;
      index += 1;
      continue;
    }
  }

  if (!locale) {
    throw new Error("Missing required --locale <code> argument.");
  }

  return { locale, reseed };
}

function main() {
  const options = parseOptions(process.argv);
  assertSupportedLocale(options.locale);

  const localeContext = {
    docsRoot: getLocaleDocsRoot(options.locale),
    fastnearTranslationsPath: getLocaleFastnearTranslationsPath(options.locale),
    glossary: getLocaleGlossary(options.locale),
    locale: options.locale,
    localeRoot: getLocaleRoot(options.locale),
    policy: getLocaleTranslationPolicy(options.locale),
  };
  const translatePlainText = createTranslator(localeContext.glossary);
  const existingDocs = options.reseed ? new Map() : snapshotExistingDocs(localeContext);
  const existingTranslations = options.reseed
    ? {}
    : snapshotExistingTranslations(localeContext);
  const existingFastnearTranslations = options.reseed
    ? null
    : readJsonIfExists(localeContext.fastnearTranslationsPath);

  runWriteTranslations(options.locale);
  syncTranslationJsonFiles(localeContext, existingTranslations, options, translatePlainText);
  rebuildLocaleDocsTree(localeContext, existingDocs, options, translatePlainText);
  syncFastnearTranslations(
    localeContext,
    existingFastnearTranslations,
    options,
    translatePlainText
  );
}

main();

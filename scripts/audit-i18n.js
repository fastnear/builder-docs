#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const {
  ROOT,
  NON_DEFAULT_LOCALES,
  assertSupportedLocale,
  getLocaleDocsRoot,
  getLocaleFastnearTranslationsPath,
  getLocaleGlossary,
  getLocaleRoot,
  getLocaleTranslationPolicy,
} = require("./lib/locale-framework");

const FRONTMATTER_KEYS = new Set(["title", "description", "sidebar_label"]);
const RUNTIME_MESSAGE_IGNORE_PREFIXES = [
  "theme.blog.",
  "theme.tags.",
  "theme.contentVisibility.",
  "theme.blog.author",
  "theme.blog.authorsList",
  "theme.blog.post",
  "theme.blog.paginator",
  "theme.blog.sidebar",
];
const FINDING_LIMIT = 200;

const BASE_ALLOWED_LITERAL_PATTERNS = [
  /\b[a-z][a-z0-9]*_[a-z0-9_]+\b/g,
  /\b[a-z]+(?:[A-Z][a-z0-9]+)+\b/g,
  /\b[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)+\b/g,
  /\b[A-Z0-9]{2,}\b/g,
];

function walkFiles(dirPath) {
  const collected = [];

  if (!fs.existsSync(dirPath)) {
    return collected;
  }

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collected.push(...walkFiles(fullPath));
      continue;
    }

    collected.push(fullPath);
  }

  return collected.sort();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildAllowedLiteralPatterns(glossary) {
  const preservePatterns = [...glossary.preserve]
    .sort((left, right) => right.length - left.length)
    .map((literal) => new RegExp(escapeRegExp(literal), "g"));

  return [
    ...preservePatterns,
    ...BASE_ALLOWED_LITERAL_PATTERNS,
  ];
}

function normalizeForAudit(rawText, allowedLiteralPatterns) {
  let text = String(rawText || "").replace(/\u00a0/g, " ");

  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/https?:\/\/[^\s)]+/g, " ");
  text = text.replace(/`[^`\n]+`/g, " ");
  text = text.replace(/<[^>\n]+>/g, " ");
  text = text.replace(/\{[^}\n]+\}/g, " ");
  text = text.replace(/\b\/[A-Za-z0-9_./:-]+\b/g, " ");
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, " ");
  text = text.replace(/\b[A-Za-z]+:[A-Za-z0-9+/=_-]+\b/g, " ");
  // Hostnames (e.g. `dashboard.fastnear.com`) as link display text.
  text = text.replace(/\b[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+\.[a-z]{2,}\b/gi, " ");

  allowedLiteralPatterns.forEach((pattern) => {
    text = text.replace(pattern, " ");
  });

  return text.replace(/\s+/g, " ").trim();
}

function collectUnexpectedLatinTokens(rawText, allowedLiteralPatterns) {
  const normalized = normalizeForAudit(rawText, allowedLiteralPatterns);
  const matches = normalized.match(/\b[A-Za-z][A-Za-z-]{2,}\b/g) || [];
  return [...new Set(matches)];
}

function pushFinding(findings, finding) {
  if (findings.length >= FINDING_LIMIT) {
    return;
  }

  findings.push(finding);
}

function scanMarkdownFile(filePath, findings, allowedLiteralPatterns) {
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const relativePath = path.relative(ROOT, filePath);
  let inCodeFence = false;
  let inFrontmatter = false;
  let frontmatterComplete = false;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (line.trim().startsWith("```")) {
      inCodeFence = !inCodeFence;
      return;
    }

    if (lineNumber === 1 && line.trim() === "---") {
      inFrontmatter = true;
      return;
    }

    if (inFrontmatter && line.trim() === "---") {
      inFrontmatter = false;
      frontmatterComplete = true;
      return;
    }

    if (inCodeFence) {
      return;
    }

    if (inFrontmatter) {
      const match = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
      if (!match || !FRONTMATTER_KEYS.has(match[1])) {
        return;
      }

      const unexpectedTokens = collectUnexpectedLatinTokens(match[2], allowedLiteralPatterns);
      if (unexpectedTokens.length > 0) {
        pushFinding(findings, {
          file: relativePath,
          line: lineNumber,
          text: line.trim(),
          tokens: unexpectedTokens,
        });
      }
      return;
    }

    if (!frontmatterComplete && line.trim() === "") {
      return;
    }

    if (/^\s*(import|export)\s/.test(line)) {
      return;
    }

    if (/^\s*:::[A-Za-z]/.test(line)) {
      return;
    }

    const unexpectedTokens = collectUnexpectedLatinTokens(line, allowedLiteralPatterns);
    if (unexpectedTokens.length > 0) {
      pushFinding(findings, {
        file: relativePath,
        line: lineNumber,
        text: line.trim(),
        tokens: unexpectedTokens,
      });
    }
  });
}

function scanRuntimeTranslationFile(filePath, findings, allowedLiteralPatterns) {
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const relativePath = path.relative(ROOT, filePath);

  Object.entries(value).forEach(([key, entry]) => {
    if (RUNTIME_MESSAGE_IGNORE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      return;
    }

    const message = entry?.message;
    if (typeof message !== "string") {
      return;
    }

    const unexpectedTokens = collectUnexpectedLatinTokens(message, allowedLiteralPatterns);
    if (unexpectedTokens.length > 0) {
      pushFinding(findings, {
        file: relativePath,
        line: key,
        text: message,
        tokens: unexpectedTokens,
      });
    }
  });
}

function walkOverlayStrings(value, onString, currentPath = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      walkOverlayStrings(entry, onString, [...currentPath, index]);
    });
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      if (key === "locale") {
        return;
      }
      walkOverlayStrings(entry, onString, [...currentPath, key]);
    });
    return;
  }

  if (typeof value === "string") {
    onString(currentPath.join("."), value);
  }
}

function scanFastnearOverlay(filePath, pageModelIds, findings, allowedLiteralPatterns) {
  const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const relativePath = path.relative(ROOT, filePath);

  walkOverlayStrings(value.families || {}, (keyPath, stringValue) => {
    const unexpectedTokens = collectUnexpectedLatinTokens(stringValue, allowedLiteralPatterns);
    if (unexpectedTokens.length > 0) {
      pushFinding(findings, {
        file: relativePath,
        line: `families.${keyPath}`,
        text: stringValue,
        tokens: unexpectedTokens,
      });
    }
  });

  const selectedPageModels =
    pageModelIds === null ? Object.keys(value.pageModels || {}) : [...pageModelIds];

  selectedPageModels.forEach((pageModelId) => {
    const pageModelValue = value.pageModels?.[pageModelId];
    if (!pageModelValue) {
      return;
    }

    walkOverlayStrings(pageModelValue, (keyPath, stringValue) => {
      const unexpectedTokens = collectUnexpectedLatinTokens(stringValue, allowedLiteralPatterns);
      if (unexpectedTokens.length > 0) {
        pushFinding(findings, {
          file: relativePath,
          line: `pageModels.${pageModelId}.${keyPath}`,
          text: stringValue,
          tokens: unexpectedTokens,
        });
      }
    });
  });
}

function getWaveSelection(policy, wave) {
  const hiddenDocPrefixes = new Set(
    policy.hiddenSections.map((entry) => entry.docPathPrefix).filter(Boolean)
  );
  const mergeDocs = (...docLists) =>
    [...new Set(docLists.flat())].filter(
      (relativePath) =>
        ![...hiddenDocPrefixes].some((prefix) => relativePath === prefix || relativePath.startsWith(prefix))
    );
  const mergePageModels = (...pageModelLists) => [...new Set(pageModelLists.flat())];

  if (wave === "all") {
    return {
      docs: null,
      hiddenDocPrefixes: [...hiddenDocPrefixes],
      pageModels: null,
    };
  }

  if (wave === "2") {
    return {
      docs: mergeDocs(policy.waves.wave1.docs, policy.waves.wave2.docs),
      hiddenDocPrefixes: [...hiddenDocPrefixes],
      pageModels: mergePageModels(policy.waves.wave1.pageModels, policy.waves.wave2.pageModels),
    };
  }

  return {
    docs: mergeDocs(policy.waves.wave1.docs),
    hiddenDocPrefixes: [...hiddenDocPrefixes],
    pageModels: mergePageModels(policy.waves.wave1.pageModels),
  };
}

function getMarkdownFilesForWave(localeContext, waveSelection) {
  const allFiles = walkFiles(localeContext.docsRoot).filter((filePath) => /\.(md|mdx)$/.test(filePath));

  if (waveSelection.docs === null) {
    return allFiles.filter((filePath) => {
      const relativePath = path.relative(localeContext.docsRoot, filePath);
      return !waveSelection.hiddenDocPrefixes.some(
        (prefix) => relativePath === prefix || relativePath.startsWith(prefix)
      );
    });
  }

  return waveSelection.docs
    .map((relativePath) => path.join(localeContext.docsRoot, relativePath))
    .filter((filePath) => fs.existsSync(filePath));
}

function getRuntimeTranslationFiles(localeContext) {
  return [
    path.join(localeContext.localeRoot, "code.json"),
    path.join(localeContext.localeRoot, "docusaurus-plugin-content-docs", "current.json"),
    path.join(localeContext.localeRoot, "docusaurus-theme-classic", "navbar.json"),
    path.join(localeContext.localeRoot, "docusaurus-theme-classic", "footer.json"),
  ].filter((filePath) => fs.existsSync(filePath));
}

function auditLocale(locale, wave) {
  assertSupportedLocale(locale);

  const localeContext = {
    docsRoot: getLocaleDocsRoot(locale),
    fastnearTranslationsPath: getLocaleFastnearTranslationsPath(locale),
    glossary: getLocaleGlossary(locale),
    locale,
    localeRoot: getLocaleRoot(locale),
    policy: getLocaleTranslationPolicy(locale),
  };
  const allowedLiteralPatterns = buildAllowedLiteralPatterns(localeContext.glossary);
  const findings = [];
  const waveSelection = getWaveSelection(localeContext.policy, wave);

  getMarkdownFilesForWave(localeContext, waveSelection).forEach((filePath) => {
    scanMarkdownFile(filePath, findings, allowedLiteralPatterns);
  });

  getRuntimeTranslationFiles(localeContext).forEach((filePath) => {
    scanRuntimeTranslationFile(filePath, findings, allowedLiteralPatterns);
  });

  if (fs.existsSync(localeContext.fastnearTranslationsPath)) {
    scanFastnearOverlay(
      localeContext.fastnearTranslationsPath,
      waveSelection.pageModels,
      findings,
      allowedLiteralPatterns
    );
  }

  return findings;
}

function parseOptions(argv) {
  let locale = null;
  let wave = "1";
  let allLocales = false;

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--locale") {
      locale = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (token === "--wave") {
      wave = argv[index + 1] || wave;
      index += 1;
      continue;
    }

    if (token === "--all-locales") {
      allLocales = true;
    }
  }

  if (!["1", "2", "all"].includes(wave)) {
    throw new Error(`Invalid --wave value "${wave}". Expected 1, 2, or all.`);
  }

  if (!allLocales && !locale) {
    throw new Error("Missing required --locale <code> argument.");
  }

  return {
    allLocales,
    locale,
    wave,
  };
}

function printFindings(locale, findings) {
  if (findings.length === 0) {
    console.log(
      `Locale "${locale}" translation audit passed for the selected wave with no suspicious English strings.`
    );
    return;
  }

  console.error(`Locale "${locale}" translation audit found suspicious English text:\n`);
  findings.forEach((finding) => {
    console.error(
      `${finding.file}:${finding.line}\n  tokens: ${finding.tokens.join(", ")}\n  text: ${finding.text}\n`
    );
  });
}

function main() {
  const options = parseOptions(process.argv);
  const locales = options.allLocales ? NON_DEFAULT_LOCALES : [options.locale];
  let hasFailures = false;

  locales.forEach((locale) => {
    const findings = auditLocale(locale, options.wave);
    printFindings(locale, findings);
    if (findings.length > 0) {
      hasFailures = true;
    }
  });

  if (hasFailures) {
    process.exitCode = 1;
  }
}

main();

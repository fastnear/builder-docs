#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PAGE_MODELS_PATH = path.join(ROOT, "src/data/generatedFastnearPageModels.json");
const DOCS_ROOT = path.join(ROOT, "docs");
const I18N_ROOT = path.join(ROOT, "i18n");
const FASTNEAR_TRANSLATIONS_ROOT = path.join(ROOT, "src/data");
const TEXT_REFERENCE_FILE_EXTENSIONS = new Set([".js", ".jsx", ".mdx", ".ts", ".tsx"]);
const PAGE_MODEL_ID_PATTERNS = [
  /pageModelId\s*=\s*"([^"]+)"/g,
  /pageModelId\s*=\s*'([^']+)'/g,
  /pageModelId\s*=\s*\{\s*"([^"]+)"\s*\}/g,
  /pageModelId\s*=\s*\{\s*'([^']+)'\s*\}/g,
];

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function loadPageModelIds() {
  assert(fs.existsSync(PAGE_MODELS_PATH), `Missing vendored page model registry: ${PAGE_MODELS_PATH}`);
  return new Set(
    JSON.parse(fs.readFileSync(PAGE_MODELS_PATH, "utf8")).map((pageModel) => pageModel.pageModelId)
  );
}

function walkFiles(root, predicate, collected = []) {
  if (!fs.existsSync(root)) {
    return collected;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, predicate, collected);
      continue;
    }

    if (predicate(entryPath)) {
      collected.push(entryPath);
    }
  }

  return collected;
}

function collectTextPageModelReferences(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const references = [];

  for (const pattern of PAGE_MODEL_ID_PATTERNS) {
    let match;
    while ((match = pattern.exec(source))) {
      references.push(match[1]);
    }
  }

  return references;
}

function collectLocaleDocsRoots() {
  if (!fs.existsSync(I18N_ROOT)) {
    return [];
  }

  return fs
    .readdirSync(I18N_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) =>
      path.join(I18N_ROOT, entry.name, "docusaurus-plugin-content-docs", "current")
    )
    .filter((localeDocsRoot) => fs.existsSync(localeDocsRoot));
}

function auditTextPageModelReferences(pageModelIds) {
  const roots = [DOCS_ROOT, ...collectLocaleDocsRoots()];
  const findings = [];
  let referenceCount = 0;
  let fileCount = 0;

  for (const root of roots) {
    const files = walkFiles(root, (filePath) =>
      TEXT_REFERENCE_FILE_EXTENSIONS.has(path.extname(filePath))
    );

    for (const filePath of files) {
      const references = collectTextPageModelReferences(filePath);
      if (references.length === 0) {
        continue;
      }

      fileCount += 1;
      referenceCount += references.length;

      for (const pageModelId of references) {
        if (!pageModelIds.has(pageModelId)) {
          findings.push(
            `${path.relative(ROOT, filePath).replace(/\\/g, "/")}: unknown pageModelId "${pageModelId}"`
          );
        }
      }
    }
  }

  return { fileCount, findings, referenceCount };
}

function auditOverlayPageModelReferences(pageModelIds) {
  const files = walkFiles(
    FASTNEAR_TRANSLATIONS_ROOT,
    (filePath) =>
      /^fastnearTranslations\..+\.json$/.test(path.basename(filePath))
  );
  const findings = [];
  let overlayCount = 0;

  for (const filePath of files) {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const referencedIds = Object.keys(value.pageModels || {});
    overlayCount += referencedIds.length;

    for (const pageModelId of referencedIds) {
      if (!pageModelIds.has(pageModelId)) {
        findings.push(
          `${path.relative(ROOT, filePath).replace(/\\/g, "/")}: unknown pageModels.${pageModelId}`
        );
      }
    }
  }

  return { findings, overlayCount };
}

function auditPageModelReferences() {
  const pageModelIds = loadPageModelIds();
  const textAudit = auditTextPageModelReferences(pageModelIds);
  const overlayAudit = auditOverlayPageModelReferences(pageModelIds);
  const findings = [...textAudit.findings, ...overlayAudit.findings];

  if (findings.length > 0) {
    fail(`Page model reference audit failed:\n- ${findings.join("\n- ")}`);
  }

  return {
    fileCount: textAudit.fileCount,
    overlayCount: overlayAudit.overlayCount,
    pageModelIds: pageModelIds.size,
    referenceCount: textAudit.referenceCount,
  };
}

if (require.main === module) {
  try {
    const counts = auditPageModelReferences();
    console.log(
      `Page model reference audit passed for ${counts.referenceCount} text references across ${counts.fileCount} files, ${counts.overlayCount} overlay entries, and ${counts.pageModelIds} generated page models.`
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  auditPageModelReferences,
};

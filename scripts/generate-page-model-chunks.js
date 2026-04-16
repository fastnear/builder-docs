#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const { EXPECTED_FAMILY_COUNTS, auditPageModels, loadPageModels } = require("./audit-generated-page-models");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_ROOT = path.join(ROOT, "src/data/generatedFastnearPageModelChunks");
const MANIFEST_PATH = path.join(ROOT, "src/data/generatedFastnearPageModelChunkManifest.json");

function getPageModelFamilyKey(pageModel) {
  const canonicalPath = String(pageModel?.canonicalPath || "").replace(/\/+$/, "");
  const pathParts = canonicalPath.split("/").filter(Boolean);
  if (pathParts.length < 2) {
    throw new Error(`Unable to derive page-model family from canonicalPath: ${canonicalPath}`);
  }

  return `${pathParts[0]}/${pathParts[1]}`;
}

function getChunkFileName(familyKey) {
  return `${familyKey.replace(/\//g, "-")}.json`;
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const pageModels = loadPageModels();
  auditPageModels(pageModels);

  const groupedPageModels = {};
  const pageModelChunkManifest = {};

  pageModels.forEach((pageModel) => {
    const familyKey = getPageModelFamilyKey(pageModel);
    groupedPageModels[familyKey] ||= [];
    groupedPageModels[familyKey].push(pageModel);
    pageModelChunkManifest[pageModel.pageModelId] = familyKey;
  });

  const expectedFamilies = Object.keys(EXPECTED_FAMILY_COUNTS).sort();
  const actualFamilies = Object.keys(groupedPageModels).sort();
  if (JSON.stringify(actualFamilies) !== JSON.stringify(expectedFamilies)) {
    throw new Error(
      `Unexpected page-model chunk families. Expected ${expectedFamilies.join(", ")}, got ${actualFamilies.join(", ")}`
    );
  }

  fs.rmSync(OUTPUT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_ROOT, { recursive: true });

  expectedFamilies.forEach((familyKey) => {
    writeJsonFile(path.join(OUTPUT_ROOT, getChunkFileName(familyKey)), groupedPageModels[familyKey]);
  });

  writeJsonFile(
    MANIFEST_PATH,
    Object.fromEntries(Object.entries(pageModelChunkManifest).sort(([left], [right]) => left.localeCompare(right)))
  );
}

main();

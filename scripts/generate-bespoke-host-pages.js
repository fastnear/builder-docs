#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PAGE_MODELS_PATH = path.resolve(ROOT, "src/data/generatedFastnearPageModels.json");
const PAGES_ROOT = path.resolve(ROOT, "src/pages");
const GENERATED_ROOTS = [
  path.join(PAGES_ROOT, "apis"),
  path.join(PAGES_ROOT, "reference"),
  path.join(PAGES_ROOT, "rpcs"),
];

function removeGeneratedRoots() {
  for (const root of GENERATED_ROOTS) {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

function writeRouteFile(routePath, pageModelId) {
  const normalizedPath = routePath.replace(/^\/+/, "");
  const outputPath = path.join(PAGES_ROOT, `${normalizedPath}.js`);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    [
      "import React from \"react\";",
      "import FastnearHostedOperationPage from \"@site/src/components/FastnearHostedOperationPage\";",
      "",
      "export default function GeneratedBespokeHostPage() {",
      `  return <FastnearHostedOperationPage pageModelId=\"${pageModelId}\" />;`,
      "}",
      "",
    ].join("\n"),
    "utf8"
  );
}

function main() {
  const pageModels = JSON.parse(fs.readFileSync(PAGE_MODELS_PATH, "utf8"));

  removeGeneratedRoots();

  for (const pageModel of pageModels) {
    writeRouteFile(pageModel.canonicalPath, pageModel.pageModelId);
  }
}

main();

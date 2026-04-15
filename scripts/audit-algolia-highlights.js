#!/usr/bin/env node

const path = require("node:path");
const { pathToFileURL } = require("node:url");

const ROOT = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const highlightModuleUrl = pathToFileURL(
    path.join(ROOT, "src/theme/SearchBar/highlight.mjs")
  ).href;
  const {
    getAlgoliaHighlightPlainText,
    normalizeAlgoliaHighlightHtml,
  } = await import(highlightModuleUrl);

  const expected = '<span class="fastnear-search-hit__highlight">view</span> account';
  assert(
    normalizeAlgoliaHighlightHtml("<mark>view</mark> account") === expected,
    "Expected <mark> highlights to normalize into the FastNear highlight span"
  );
  assert(
    normalizeAlgoliaHighlightHtml(
      '<span class="algolia-docsearch-suggestion--highlight">view</span> account'
    ) === expected,
    "Expected Algolia highlight spans to normalize into the FastNear highlight span"
  );
  assert(
    getAlgoliaHighlightPlainText("<mark>view</mark> account") === "view account",
    "Expected highlight plain text extraction to strip tags"
  );
  assert(
    normalizeAlgoliaHighlightHtml("<em>view</em> account") === null,
    "Expected unsupported HTML to be rejected"
  );

  console.log("Algolia highlight normalization audit passed.");
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

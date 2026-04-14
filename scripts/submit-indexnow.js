#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DOCS_ROOT = path.join(ROOT, "docs");
const STATIC_ROOT = path.join(ROOT, "static");
const SITE_ORIGIN = "https://docs.fastnear.com";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const hideEarlyApiFamilies = /^(1|true|yes|on)$/i.test(
  process.env.HIDE_EARLY_API_FAMILIES || ""
);

const HIDDEN_DOC_PREFIXES = [
  "/transfers",
  "/fastdata",
];

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
    return {};
  }

  const frontmatter = {};
  for (const line of match[1].split("\n")) {
    const fieldMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (!fieldMatch) {
      continue;
    }

    const [, key, value] = fieldMatch;
    frontmatter[key] = value.trim().replace(/^['"]|['"]$/g, "");
  }

  return frontmatter;
}

function normalizeRoute(route) {
  const normalized = String(route || "").trim();
  if (!normalized) {
    return null;
  }

  if (normalized === "/") {
    return "/";
  }

  const prefixed = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return prefixed.replace(/\/+$/, "") || "/";
}

function buildAbsoluteUrl(route) {
  return new URL(String(route || "").replace(/^\//, ""), `${SITE_ORIGIN}/`).toString();
}

function isHiddenDocsRoute(route) {
  return (
    hideEarlyApiFamilies &&
    HIDDEN_DOC_PREFIXES.some(
      (prefix) => route === prefix || route.startsWith(`${prefix}/`)
    )
  );
}

function getCanonicalDocsEntries() {
  return walkDocs(DOCS_ROOT)
    .map((filePath) => {
      const rawContent = fs.readFileSync(filePath, "utf8");
      const frontmatter = parseFrontmatter(rawContent);
      const route = normalizeRoute(frontmatter.slug);
      if (!route || isHiddenDocsRoute(route)) {
        return null;
      }

      return {
        filePath,
        route,
        url: buildAbsoluteUrl(route),
      };
    })
    .filter(Boolean);
}

function findIndexNowKeyFile(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return null;
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .find((entry) => entry.isFile() && /^[a-f0-9]{32}\.txt$/i.test(entry.name));
}

function readIndexNowKey() {
  const keyFile = findIndexNowKeyFile(STATIC_ROOT);
  if (!keyFile) {
    return null;
  }

  const keyPath = path.join(STATIC_ROOT, keyFile.name);
  const key = fs.readFileSync(keyPath, "utf8").trim();
  if (!key || keyFile.name.toLowerCase() !== `${key.toLowerCase()}.txt`) {
    return null;
  }

  return {
    key,
    keyLocation: buildAbsoluteUrl(`/${keyFile.name}`),
  };
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    fromRef: process.env.INDEXNOW_FROM || null,
    toRef: process.env.INDEXNOW_TO || "HEAD",
    urls: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--from") {
      options.fromRef = argv[index + 1] || null;
      index += 1;
      continue;
    }

    if (arg === "--to") {
      options.toRef = argv[index + 1] || options.toRef;
      index += 1;
      continue;
    }

    if (arg === "--url") {
      const url = argv[index + 1];
      if (url) {
        options.urls.push(url);
      }
      index += 1;
    }
  }

  return options;
}

function getChangedFiles(fromRef, toRef) {
  if (!fromRef || !toRef) {
    return null;
  }

  try {
    const output = execFileSync(
      "git",
      ["diff", "--name-only", "--diff-filter=ACMR", fromRef, toRef],
      {
        cwd: ROOT,
        encoding: "utf8",
      }
    );

    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    console.warn(
      `IndexNow: could not diff ${fromRef}..${toRef}; falling back to the full canonical route set.`
    );
    return null;
  }
}

function selectUrls({ entries, explicitUrls, fromRef, toRef }) {
  if (explicitUrls.length) {
    return explicitUrls.map((url) => buildAbsoluteUrl(new URL(url, SITE_ORIGIN).pathname));
  }

  const changedFiles = getChangedFiles(fromRef, toRef);
  if (!changedFiles) {
    return entries.map((entry) => entry.url);
  }

  if (!changedFiles.length) {
    return [];
  }

  if (changedFiles.some((filePath) => !filePath.startsWith("docs/"))) {
    return entries.map((entry) => entry.url);
  }

  const entriesByFilePath = new Map(entries.map((entry) => [entry.filePath, entry]));
  const changedUrls = new Set();

  for (const filePath of changedFiles) {
    const absolutePath = path.join(ROOT, filePath);
    const entry = entriesByFilePath.get(absolutePath);
    if (!entry) {
      return entries.map((candidate) => candidate.url);
    }

    changedUrls.add(entry.url);
  }

  return [...changedUrls];
}

async function submitToIndexNow(payload, dryRun) {
  if (dryRun) {
    console.log("IndexNow dry run payload:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `IndexNow submission failed (${response.status}): ${responseText || "no response body"}`
    );
  }

  console.log(`IndexNow submitted ${payload.urlList.length} URL(s).`);
}

async function main() {
  const keyData = readIndexNowKey();
  if (!keyData) {
    console.log("IndexNow: no root key file found in static/, skipping submission.");
    return;
  }

  const options = parseArgs(process.argv.slice(2));
  const entries = getCanonicalDocsEntries();
  const urlList = [...new Set(selectUrls({
    entries,
    explicitUrls: options.urls,
    fromRef: options.fromRef,
    toRef: options.toRef,
  }))].sort();

  if (!urlList.length) {
    console.log("IndexNow: no canonical docs URLs changed, skipping submission.");
    return;
  }

  await submitToIndexNow(
    {
      host: new URL(SITE_ORIGIN).hostname,
      key: keyData.key,
      keyLocation: keyData.keyLocation,
      urlList,
    },
    options.dryRun
  );
}

main().catch((error) => {
  console.error(`IndexNow: ${error.message}`);
  process.exitCode = 1;
});

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const ALGOLIA_ROOT = path.join(ROOT, "algolia");
const ENV_PATHS = [path.join(ROOT, ".env"), path.join(ROOT, ".env.local")];
const FASTNEAR_OBJECT_ID_PREFIX = "fastnear-";

let envLoaded = false;

function loadDotEnv() {
  if (envLoaded) {
    return;
  }

  ENV_PATHS.forEach((envPath) => {
    if (!fs.existsSync(envPath)) {
      return;
    }

    const raw = fs.readFileSync(envPath, "utf8");
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!key || process.env[key]) {
        return;
      }

      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      process.env[key] = value;
    });
  });

  envLoaded = true;
}

function readJson(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing JSON file: ${relativePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

function resolveCrawlerAuthHeader({ apiKey, userId } = {}) {
  if (!userId || !apiKey) {
    throw new Error(
      "Missing crawler auth env vars: set both ALGOLIA_CRAWLER_USER_ID and ALGOLIA_CRAWLER_API_KEY"
    );
  }

  return `Basic ${Buffer.from(`${userId}:${apiKey}`, "utf8").toString("base64")}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sortObjectKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortObjectKeysDeep(entry));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce((accumulator, key) => {
      accumulator[key] = sortObjectKeysDeep(value[key]);
      return accumulator;
    }, {});
}

function stableStringify(value) {
  return JSON.stringify(sortObjectKeysDeep(value), null, 2);
}

function normalizeFunctionSource(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

function collectDiffs(expected, actual, currentPath = "") {
  if (expected === actual) {
    return [];
  }

  if (Array.isArray(expected) || Array.isArray(actual)) {
    const expectedArray = Array.isArray(expected) ? expected : null;
    const actualArray = Array.isArray(actual) ? actual : null;
    if (!expectedArray || !actualArray) {
      return [
        {
          path: currentPath || "(root)",
          expected,
          actual,
        },
      ];
    }

    if (expectedArray.length !== actualArray.length) {
      return [
        {
          path: currentPath || "(root)",
          expected: expectedArray,
          actual: actualArray,
        },
      ];
    }

    const diffs = [];
    expectedArray.forEach((entry, index) => {
      diffs.push(...collectDiffs(entry, actualArray[index], `${currentPath}[${index}]`));
    });
    return diffs;
  }

  if (isPlainObject(expected) || isPlainObject(actual)) {
    const expectedObject = isPlainObject(expected) ? expected : {};
    const actualObject = isPlainObject(actual) ? actual : {};
    const keys = new Set([...Object.keys(expectedObject), ...Object.keys(actualObject)]);
    const diffs = [];

    [...keys].sort().forEach((key) => {
      const nextPath = currentPath ? `${currentPath}.${key}` : key;
      diffs.push(...collectDiffs(expectedObject[key], actualObject[key], nextPath));
    });

    return diffs;
  }

  return [
    {
      path: currentPath || "(root)",
      expected,
      actual,
    },
  ];
}

function formatDiffValue(value) {
  if (value === undefined) {
    return "(missing)";
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return stableStringify(value);
}

function formatDiffs(diffs, limit = 12) {
  return diffs.slice(0, limit).map((diff) => {
    return `- ${diff.path}: expected ${formatDiffValue(diff.expected)}, got ${formatDiffValue(diff.actual)}`;
  });
}

function logSection(title) {
  console.log(`\n${title}`);
}

module.exports = {
  ALGOLIA_ROOT,
  FASTNEAR_OBJECT_ID_PREFIX,
  ROOT,
  collectDiffs,
  formatDiffs,
  loadDotEnv,
  logSection,
  normalizeFunctionSource,
  readJson,
  requireEnv,
  resolveCrawlerAuthHeader,
  sleep,
  stableStringify,
};

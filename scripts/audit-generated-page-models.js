#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const PAGE_MODELS_PATH = path.join(ROOT, "src/data/generatedFastnearPageModels.json");

const EXPECTED_FAMILY_COUNTS = {
  "rpcs/account": 3,
  "rpcs/block": 3,
  "rpcs/contract": 5,
  "rpcs/protocol": 20,
  "rpcs/transaction": 6,
  "rpcs/validators": 3,
  "apis/fastnear": 14,
  "apis/kv-fastdata": 9,
  "apis/neardata": 9,
  "apis/transactions": 5,
  "apis/transfers": 1,
};

const RPC_CATEGORIES = new Set(["account", "block", "contract", "protocol", "transaction", "validators"]);
const API_SERVICES = new Set(["fastnear", "kv-fastdata", "neardata", "transactions", "transfers"]);

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function loadPageModels() {
  assert(fs.existsSync(PAGE_MODELS_PATH), `Missing vendored page model registry: ${PAGE_MODELS_PATH}`);
  return JSON.parse(fs.readFileSync(PAGE_MODELS_PATH, "utf8"));
}

function normalizeRoute(route) {
  return String(route || "").replace(/\/+$/, "");
}

function inferRpcOperationId(pageModelId) {
  return String(pageModelId || "")
    .replace(/^rpc-/, "")
    .replace(/-/g, "_");
}

function auditPageModels(pageModels) {
  assert(Array.isArray(pageModels), "Vendored page models must be a JSON array");

  const seenPageModelIds = new Map();
  const seenCanonicalPaths = new Map();
  const seenAliases = new Map();
  const familyCounts = new Map();

  pageModels.forEach((pageModel, index) => {
    const label = pageModel?.pageModelId || `entry-${index}`;

    assert(pageModel && typeof pageModel === "object", `Invalid page model at index ${index}`);
    assert(typeof pageModel.pageModelId === "string" && pageModel.pageModelId, `Missing pageModelId at index ${index}`);
    assert(typeof pageModel.canonicalPath === "string" && pageModel.canonicalPath, `Missing canonicalPath for ${label}`);
    assert(Array.isArray(pageModel.routeAliases), `Missing routeAliases array for ${label}`);

    const canonicalPath = normalizeRoute(pageModel.canonicalPath);
    assert(canonicalPath === pageModel.canonicalPath, `Canonical path must not have trailing slash: ${label} -> ${pageModel.canonicalPath}`);
    assert(/^\/(rpcs|apis)\//.test(canonicalPath), `Canonical path must start with /rpcs/ or /apis/: ${label} -> ${canonicalPath}`);
    assert(!/\s/.test(canonicalPath), `Canonical path must not contain spaces: ${label} -> ${canonicalPath}`);

    const existingId = seenPageModelIds.get(pageModel.pageModelId);
    assert(!existingId, `Duplicate pageModelId ${pageModel.pageModelId}`);
    seenPageModelIds.set(pageModel.pageModelId, canonicalPath);

    const existingCanonical = seenCanonicalPaths.get(canonicalPath);
    assert(!existingCanonical, `Duplicate canonicalPath ${canonicalPath} for ${label} and ${existingCanonical}`);
    seenCanonicalPaths.set(canonicalPath, label);

    const pathParts = canonicalPath.split("/").filter(Boolean);
    const familyKey = `${pathParts[0]}/${pathParts[1]}`;
    familyCounts.set(familyKey, (familyCounts.get(familyKey) || 0) + 1);

    if (pathParts[0] === "rpcs") {
      assert(pathParts.length === 3, `RPC canonical path should have 3 segments: ${label} -> ${canonicalPath}`);
      assert(RPC_CATEGORIES.has(pathParts[1]), `Unknown RPC category in ${label}: ${canonicalPath}`);

      const expectedOperationId = inferRpcOperationId(pageModel.pageModelId);
      assert(pageModel.routeAliases.length === 2, `RPC page model should expose exactly 2 aliases: ${label}`);
      assert(
        pageModel.routeAliases.includes(`${canonicalPath}/other/${expectedOperationId}`),
        `RPC page model is missing its /other/ alias: ${label}`
      );
      assert(
        pageModel.routeAliases.includes(`/reference/operation/${expectedOperationId}`),
        `RPC page model is missing its /reference/operation alias: ${label}`
      );
    } else {
      assert(pathParts.length === 4, `API canonical path should have 4 segments: ${label} -> ${canonicalPath}`);
      assert(API_SERVICES.has(pathParts[1]), `Unknown API service in ${label}: ${canonicalPath}`);
      assert(pageModel.routeAliases.length === 1, `API page model should expose exactly 1 alias: ${label}`);
      assert(
        pageModel.routeAliases[0].startsWith(`/apis/${pathParts[1]}/openapi/`),
        `API page model alias should stay under /apis/${pathParts[1]}/openapi/: ${label}`
      );
    }

    pageModel.routeAliases.forEach((alias) => {
      assert(typeof alias === "string" && alias, `Empty route alias in ${label}`);
      assert(alias === normalizeRoute(alias), `Route alias must not have trailing slash: ${label} -> ${alias}`);
      assert(alias !== canonicalPath, `Route alias must differ from canonicalPath: ${label} -> ${alias}`);
      assert(!seenCanonicalPaths.has(alias), `Route alias collides with canonical path ${alias} in ${label}`);

      const existingAlias = seenAliases.get(alias);
      assert(!existingAlias, `Duplicate route alias ${alias} in ${label} and ${existingAlias}`);
      seenAliases.set(alias, label);
    });
  });

  const actualFamilyKeys = [...familyCounts.keys()].sort();
  const expectedFamilyKeys = Object.keys(EXPECTED_FAMILY_COUNTS).sort();
  assert(
    JSON.stringify(actualFamilyKeys) === JSON.stringify(expectedFamilyKeys),
    `Unexpected page model families. Expected ${expectedFamilyKeys.join(", ")}, got ${actualFamilyKeys.join(", ")}`
  );

  for (const [familyKey, expectedCount] of Object.entries(EXPECTED_FAMILY_COUNTS)) {
    const actualCount = familyCounts.get(familyKey) || 0;
    assert(
      actualCount === expectedCount,
      `Unexpected page model count for ${familyKey}: expected ${expectedCount}, got ${actualCount}`
    );
  }

  return {
    aliases: seenAliases.size,
    canonicalPaths: seenCanonicalPaths.size,
    pageModelIds: seenPageModelIds.size,
  };
}

if (require.main === module) {
  try {
    const counts = auditPageModels(loadPageModels());
    console.log(
      `Vendored page model audit passed for ${counts.pageModelIds} page models, ${counts.canonicalPaths} canonical paths, and ${counts.aliases} aliases.`
    );
  } catch (error) {
    console.error(`Vendored page model audit failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  EXPECTED_FAMILY_COUNTS,
  auditPageModels,
  loadPageModels,
};

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isCollectionRoute,
  isDiscoverableDocsRoute,
  isHiddenCanonicalRoute,
  isHiddenDocsRoute,
  isPublicDocsSurfaceRoute,
  matchesRoutePattern,
  matchesRoutePrefix,
  normalizeDiscoveryRoute,
} = require("../../scripts/lib/discovery-surface");

test("normalizeDiscoveryRoute trims trailing slashes and can strip locale prefixes", () => {
  assert.equal(normalizeDiscoveryRoute("/rpc/account/"), "/rpc/account");
  assert.equal(
    normalizeDiscoveryRoute("/ru/rpc/account/", { stripLocale: true }),
    "/rpc/account"
  );
  assert.equal(normalizeDiscoveryRoute("", { fallbackRoot: true }), "/");
});

test("matchesRoutePrefix and matchesRoutePattern handle docs globs and markdown mirrors", () => {
  assert.equal(matchesRoutePrefix("/rpc/account/view-account", "/rpc"), true);
  assert.equal(matchesRoutePrefix("/rpc-api", "/rpc"), false);
  assert.equal(matchesRoutePattern("/rpc/account/view-account", "/rpc/**"), true);
  assert.equal(matchesRoutePattern("/rpc/account/view-account", "/api/**"), false);
  assert.equal(matchesRoutePattern("/ru/rpc/account/view-account", "/rpc/**", { stripLocale: true }), true);
  assert.equal(matchesRoutePattern("/rpc/account/view-account.md", "/**/*.md"), true);
});

test("isPublicDocsSurfaceRoute includes the intended public docs wrappers and excludes hidden surfaces", () => {
  assert.equal(isPublicDocsSurfaceRoute("/rpc/account/view-account"), true);
  assert.equal(isPublicDocsSurfaceRoute("/ru/auth"), true);
  assert.equal(isPublicDocsSurfaceRoute("/rpcs/account/view_account"), false);
  assert.equal(isPublicDocsSurfaceRoute("/structured-data/site-graph.json"), false);
  assert.equal(isPublicDocsSurfaceRoute("/transaction-flow/finality"), false);
});

test("hidden route helpers respect always-hidden and environment-hidden families", () => {
  assert.equal(isHiddenDocsRoute("/transaction-flow/finality"), true);
  assert.equal(isHiddenDocsRoute("/transfers/by-account"), false);
  assert.equal(
    isHiddenDocsRoute("/ru/transfers/by-account", { hideEarlyApiFamilies: true }),
    true
  );
  assert.equal(
    isHiddenDocsRoute("/fastdata/kv/all-by-predecessor", { hideEarlyApiFamilies: true }),
    true
  );
  assert.equal(isHiddenCanonicalRoute("/apis/transfers/v0/account"), false);
  assert.equal(
    isHiddenCanonicalRoute("/apis/transfers/v0/account", { hideEarlyApiFamilies: true }),
    true
  );
});

test("isCollectionRoute and isDiscoverableDocsRoute classify wrapper pages and leaves correctly", () => {
  assert.equal(isCollectionRoute("/"), true);
  assert.equal(isCollectionRoute("/ru/rpc"), true);
  assert.equal(isCollectionRoute("/rpc/account/view-account"), false);

  assert.equal(isDiscoverableDocsRoute("/ru/neardata/block"), true);
  assert.equal(isDiscoverableDocsRoute("/transaction-flow/finality"), false);
  assert.equal(
    isDiscoverableDocsRoute("/transfers/by-account", { hideEarlyApiFamilies: true }),
    false
  );
});

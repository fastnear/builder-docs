const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getDocsearchAudience,
  getDocsearchCategory,
  getDocsearchFamily,
  getDocsearchMethodType,
  getDocsearchPageType,
  getDocsearchSemanticMeta,
  getDocsearchSurface,
  getOperationSemanticMeta,
  isPublicDocsPermalink,
  normalizeDocsearchRoute,
} = require("../../src/utils/docsearchClassification");

test("normalizeDocsearchRoute strips origins and locale prefixes", () => {
  assert.equal(
    normalizeDocsearchRoute("https://docs.fastnear.com/ru/rpc/account/view-account?x=1"),
    "/rpc/account/view-account?x=1"
  );
  assert.equal(normalizeDocsearchRoute("/ru"), "/");
});

test("RPC leaf pages receive consistent docsearch metadata", () => {
  const semanticMeta = getDocsearchSemanticMeta("/ru/rpc/transaction/send-tx");
  assert.deepEqual(semanticMeta, {
    audience: "builder",
    category: "rpc-reference",
    family: "transaction",
    methodType: "transaction",
    pageType: "reference",
    surface: "rpc",
  });
});

test("guide and collection pages keep their intended classifications", () => {
  assert.equal(getDocsearchPageType("/rpc"), "collection");
  assert.equal(getDocsearchCategory("/agents/choosing-surfaces"), "guide");
  assert.equal(getDocsearchAudience("/agents/choosing-surfaces"), "agent");
  assert.equal(getDocsearchSurface("/snapshots/mainnet"), "snapshots");
  assert.equal(getDocsearchPageType("/api/reference"), "guide");
});

test("API families resolve to the expected family and method type values", () => {
  assert.equal(getDocsearchCategory("/tx/receipt"), "api-reference");
  assert.equal(getDocsearchMethodType("/tx/receipt"), "transactions");
  assert.equal(getDocsearchFamily("/ru/fastdata/kv/all-by-predecessor"), "kv-fastdata");
});

test("operation canonical paths map to the same semantics as public docs leaves", () => {
  assert.deepEqual(
    getOperationSemanticMeta({ canonicalPath: "/rpcs/transaction/send_tx" }),
    {
      audience: "builder",
      category: "rpc-reference",
      family: "transaction",
      methodType: "transaction",
      pageType: "reference",
      surface: "rpc",
    }
  );

  assert.deepEqual(
    getOperationSemanticMeta({ canonicalPath: "/apis/neardata/v0/block" }),
    {
      audience: "builder",
      category: "api-reference",
      family: "neardata",
      methodType: "neardata",
      pageType: "reference",
      surface: "neardata",
    }
  );
});

test("public docs permalink checks exclude hosted canonicals and hidden guide families", () => {
  assert.equal(isPublicDocsPermalink("/rpc/account/view-account"), true);
  assert.equal(isPublicDocsPermalink("/rpcs/account/view_account"), false);
  assert.equal(isPublicDocsPermalink("/apis/fastnear/v1/account/full"), false);
  assert.equal(isPublicDocsPermalink("/transaction-flow/finality"), false);
});

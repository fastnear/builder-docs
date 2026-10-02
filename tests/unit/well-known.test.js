const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AGENT_SKILLS_SCHEMA,
  API_CATALOG_ROUTE,
  STATUS_PAGE_URL,
  applyDocsVersionStamp,
  buildAgentSkillsIndex,
  buildApiCatalog,
  buildDocsVersionManifest,
  computeDocsVersion,
  listDocsVersionInputRoutes,
  parseSkillFrontmatter,
  sha256Hex,
  stripDocsVersionStamp,
} = require("../../scripts/lib/well-known");

const SKILL = [
  "---",
  "name: fastnear",
  'description: "Read NEAR chain data through FastNear."',
  "---",
  "",
  "# FastNear",
  "",
  "Body paragraph.",
  "",
].join("\n");

const OPENAPI_INDEX = {
  specs: [
    {
      id: "fastnear",
      kind: "rest",
      title: "FastNEAR API",
      openapi: "3.1.0",
      docsPath: "/api",
      json: "/openapi/fastnear.json",
      yaml: "/openapi/fastnear.yaml",
      servers: [
        { description: "Mainnet", url: "https://api.fastnear.com" },
        { description: "Testnet", url: "https://test.api.fastnear.com" },
      ],
      operations: [
        { method: "GET", path: "/health" },
        { method: "GET", path: "/v1/account/{account_id}/full" },
      ],
    },
    {
      id: "rpc",
      kind: "json-rpc",
      title: "FastNEAR RPC",
      openapi: "3.1.0",
      docsPath: "/rpc",
      json: "/openapi/rpc.json",
      yaml: "/openapi/rpc.yaml",
      servers: [{ description: "Mainnet", url: "https://rpc.mainnet.fastnear.com" }],
      operations: [{ method: "POST", path: "/health" }],
    },
    {
      id: "transfers",
      kind: "rest",
      title: "Transfers API",
      openapi: "3.1.0",
      docsPath: "/transfers",
      json: "/openapi/transfers.json",
      yaml: "/openapi/transfers.yaml",
      servers: [{ description: "Mainnet", url: "https://transfers.main.fastnear.com" }],
      operations: [],
    },
  ],
};

test("docs-version stamp sits under the H1, replaces itself, and strips cleanly", () => {
  const stamped = applyDocsVersionStamp(SKILL, "abc123def456");
  assert.match(stamped, /^# FastNear\n\n<!-- FASTNEAR-DOCS-VERSION:START/m);
  assert.match(stamped, /_Docs version `abc123def456`\./);
  assert.equal(stripDocsVersionStamp(stamped), SKILL);

  const restamped = applyDocsVersionStamp(stamped, "fedcba987654");
  assert.equal(restamped, applyDocsVersionStamp(SKILL, "fedcba987654"));
  assert.equal((restamped.match(/FASTNEAR-DOCS-VERSION:START/g) || []).length, 1);
});

test("stamping refuses a document without an H1", () => {
  assert.throws(() => applyDocsVersionStamp("no heading here", "abc123def456"), /H1/);
});

test("computeDocsVersion is 12 hex chars, order-independent, and content-sensitive", () => {
  const records = [
    { route: "/llms.txt", contentSha256: sha256Hex("a") },
    { route: "/SKILL.md", contentSha256: sha256Hex("b") },
  ];
  const version = computeDocsVersion(records);
  assert.match(version, /^[0-9a-f]{12}$/);
  assert.equal(computeDocsVersion([...records].reverse()), version);
  assert.notEqual(
    computeDocsVersion([records[0], { route: "/SKILL.md", contentSha256: sha256Hex("c") }]),
    version
  );
});

test("listDocsVersionInputRoutes includes the skill and every published OpenAPI document", () => {
  const routes = listDocsVersionInputRoutes(OPENAPI_INDEX);
  assert.ok(routes.includes("/SKILL.md"));
  assert.ok(routes.includes("/llms.txt"));
  assert.ok(routes.includes("/openapi/fastnear.json"));
  assert.ok(routes.includes("/openapi/rpc.json"));
  assert.ok(!routes.includes("/.well-known/agent-skills/index.json"));
  assert.equal(new Set(routes).size, routes.length);
});

test("buildDocsVersionManifest records served and content hashes per route", () => {
  const manifest = buildDocsVersionManifest({
    docsVersion: "abc123def456",
    files: [{ route: "/SKILL.md", sha256: sha256Hex("served"), contentSha256: sha256Hex("content") }],
  });
  assert.equal(manifest.docs_version, "abc123def456");
  assert.equal(manifest.algorithm, "sha256");
  assert.equal(manifest.beacon_url, "https://docs.fastnear.com/.well-known/docs-version.json");
  assert.equal(manifest.files["/SKILL.md"].url, "https://docs.fastnear.com/SKILL.md");
  assert.equal(manifest.files["/SKILL.md"].sha256, sha256Hex("served"));
  assert.equal(manifest.files["/SKILL.md"].content_sha256, sha256Hex("content"));
  assert.equal(manifest.discovery.api_catalog, "https://docs.fastnear.com/.well-known/api-catalog");
});

test("buildApiCatalog emits one linkset context per server with spec, docs, and status links", () => {
  const catalog = buildApiCatalog({ openapiIndex: OPENAPI_INDEX });
  const [root, ...contexts] = catalog.linkset;

  assert.equal(root.anchor, `https://docs.fastnear.com${API_CATALOG_ROUTE}`);
  assert.deepEqual(
    root.item.map((item) => item.href),
    ["https://api.fastnear.com", "https://test.api.fastnear.com", "https://rpc.mainnet.fastnear.com", "https://transfers.main.fastnear.com"]
  );
  assert.ok(root["service-doc"].some((link) => link.href === "https://docs.fastnear.com/SKILL.md"));

  const mainnetApi = contexts.find((context) => context.anchor === "https://api.fastnear.com");
  assert.equal(mainnetApi["service-desc"][0].href, "https://docs.fastnear.com/openapi/fastnear.json");
  assert.equal(mainnetApi["service-desc"][1].type, "application/yaml");
  assert.deepEqual(
    mainnetApi["service-doc"].map((link) => link.href),
    ["https://docs.fastnear.com/api", "https://docs.fastnear.com/api.md"]
  );
  assert.deepEqual(
    mainnetApi.status.map((link) => link.href),
    [STATUS_PAGE_URL, "https://api.fastnear.com/health"]
  );

  // JSON-RPC health is a POST method, not a GET path, so only the status page is cited.
  const rpc = contexts.find((context) => context.anchor === "https://rpc.mainnet.fastnear.com");
  assert.deepEqual(rpc.status.map((link) => link.href), [STATUS_PAGE_URL]);
});

test("buildApiCatalog drops hidden families", () => {
  const catalog = buildApiCatalog({
    openapiIndex: OPENAPI_INDEX,
    isHidden: (docsPath) => docsPath === "/transfers",
  });
  assert.ok(!catalog.linkset.some((context) => context.anchor === "https://transfers.main.fastnear.com"));
  assert.ok(!catalog.linkset[0].item.some((item) => item.href === "https://transfers.main.fastnear.com"));
});

test("buildAgentSkillsIndex digests the served bytes and validates the entry", () => {
  const bytes = Buffer.from(applyDocsVersionStamp(SKILL, "abc123def456"));
  const index = buildAgentSkillsIndex({
    skills: [{ name: "fastnear", description: "Read NEAR chain data.", url: "https://docs.fastnear.com/SKILL.md", bytes }],
  });
  assert.equal(index.$schema, AGENT_SKILLS_SCHEMA);
  assert.equal(index.skills.length, 1);
  assert.equal(index.skills[0].type, "skill-md");
  assert.equal(index.skills[0].digest, `sha256:${sha256Hex(bytes)}`);

  assert.throws(
    () => buildAgentSkillsIndex({ skills: [{ name: "Fast--Near", description: "x", url: "u", bytes }] }),
    /Invalid skill name/
  );
  assert.throws(
    () => buildAgentSkillsIndex({ skills: [{ name: "fastnear", description: "x".repeat(1025), url: "u", bytes }] }),
    /description/
  );
});

test("parseSkillFrontmatter reads the name and unquotes the description", () => {
  const fields = parseSkillFrontmatter(SKILL);
  assert.equal(fields.name, "fastnear");
  assert.equal(fields.description, "Read NEAR chain data through FastNear.");
  assert.throws(() => parseSkillFrontmatter("# No frontmatter"), /frontmatter/);
});

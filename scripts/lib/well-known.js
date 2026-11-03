const crypto = require("node:crypto");

// Agent discovery surfaces served from the docs host root. Everything here is
// pure so the unit tests can exercise it without touching static/ or build/.
const SITE_ORIGIN = "https://docs.fastnear.com";
const STATUS_PAGE_URL = "https://status.fastnear.com";
const SKILL_ROUTE = "/SKILL.md";
const SKILL_SOURCE_PATH = "skills/fastnear/SKILL.md";
const API_CATALOG_ROUTE = "/.well-known/api-catalog";
const API_CATALOG_CONTENT_TYPE = "application/linkset+json";
const AGENT_SKILLS_INDEX_ROUTE = "/.well-known/agent-skills/index.json";
const AGENT_SKILLS_SCHEMA = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
const DOCS_VERSION_ROUTE = "/.well-known/docs-version.json";
const DOCS_VERSION_LENGTH = 12;
const LLMS_INDEX_ROUTE = "/llms.txt";
const OPENAPI_INDEX_ROUTE = "/openapi/index.json";

// Agent-facing docs whose bytes define docs_version. The OpenAPI family
// documents are appended from the vendored index so the list cannot drift from
// what is published. Discovery files (the catalog, the skills index, the
// beacon itself) are derived from these and are deliberately not inputs: the
// skills index carries the digest of the stamped SKILL.md, and the stamp is the
// version, so hashing it back in would be circular.
const DOCS_VERSION_BASE_ROUTES = [
  SKILL_ROUTE,
  LLMS_INDEX_ROUTE,
  "/llms-full.txt",
  "/guides/llms.txt",
  "/rpcs/llms.txt",
  "/apis/llms.txt",
  OPENAPI_INDEX_ROUTE,
  "/agents.md",
  "/agents/auth.md",
  "/agents/choosing-surfaces.md",
  "/agents/playbooks.md",
  "/structured-data/site-graph.json",
];

const STAMP_START = "<!-- FASTNEAR-DOCS-VERSION:START";
const STAMP_END = "<!-- FASTNEAR-DOCS-VERSION:END -->";
// Matches the stamp plus the blank lines around it, so stripping collapses the
// run back to the single blank line that separates the H1 from the body.
const STAMP_PATTERN = /\n*<!-- FASTNEAR-DOCS-VERSION:START[\s\S]*?<!-- FASTNEAR-DOCS-VERSION:END -->\n*/g;

// Mirrors the skills CLI's isValidSkillName check so a bad name fails here, not
// at install time.
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SKILL_NAME_LENGTH = 64;
const MAX_SKILL_DESCRIPTION_LENGTH = 1024;

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function buildAbsoluteUrl(route, siteOrigin = SITE_ORIGIN) {
  return new URL(route, `${siteOrigin}/`).toString();
}

function markdownMirrorRoute(docsPath) {
  return docsPath === "/" ? "/index.md" : `${String(docsPath).replace(/\/+$/, "")}.md`;
}

function stripDocsVersionStamp(text) {
  return String(text).replace(STAMP_PATTERN, "\n\n");
}

function renderDocsVersionStamp(docsVersion, siteOrigin = SITE_ORIGIN) {
  const beaconUrl = buildAbsoluteUrl(DOCS_VERSION_ROUTE, siteOrigin);
  return [
    `${STAMP_START} (written by scripts/generate-well-known.js; do not edit) -->`,
    `_Docs version \`${docsVersion}\`. This is a content hash of the FastNear agent-facing docs. If it differs from \`docs_version\` at ${beaconUrl}, this copy is stale: refetch it and any reference you rely on._`,
    STAMP_END,
  ].join("\n");
}

// Places the stamp directly under the first H1 so it is the first thing an
// agent reads after the title. Idempotent: an existing stamp is replaced.
function applyDocsVersionStamp(text, docsVersion, siteOrigin = SITE_ORIGIN) {
  const content = stripDocsVersionStamp(text);
  const headingMatch = content.match(/^# .*$/m);
  if (!headingMatch) {
    throw new Error("Cannot stamp a document without an H1 heading");
  }

  // The body already starts with the blank line that followed the H1, so only
  // the blank line before the stamp is added here.
  const insertAt = headingMatch.index + headingMatch[0].length;
  const stamp = renderDocsVersionStamp(docsVersion, siteOrigin);
  return `${content.slice(0, insertAt)}\n\n${stamp}${content.slice(insertAt)}`;
}

function listDocsVersionInputRoutes(openapiIndex) {
  const specRoutes = (openapiIndex?.specs || []).map((spec) => spec.json).filter(Boolean);
  return [...new Set([...DOCS_VERSION_BASE_ROUTES, ...specRoutes])];
}

// Order-independent: records are sorted by route before hashing.
function computeDocsVersion(records) {
  const lines = [...records]
    .sort((left, right) => left.route.localeCompare(right.route))
    .map((record) => `${record.route}\n${record.contentSha256}\n`);
  return sha256Hex(lines.join("")).slice(0, DOCS_VERSION_LENGTH);
}

function buildDocsVersionManifest({ docsVersion, files, siteOrigin = SITE_ORIGIN }) {
  const manifestFiles = {};
  [...files]
    .sort((left, right) => left.route.localeCompare(right.route))
    .forEach((file) => {
      manifestFiles[file.route] = {
        url: buildAbsoluteUrl(file.route, siteOrigin),
        sha256: file.sha256,
        content_sha256: file.contentSha256,
      };
    });

  return {
    docs_version: docsVersion,
    algorithm: "sha256",
    beacon_url: buildAbsoluteUrl(DOCS_VERSION_ROUTE, siteOrigin),
    description:
      "Content-hash version of the FastNear agent-facing docs. If your cached docs_version differs from this value, your copy is stale: refetch. Per file, sha256 is the hash of the bytes served at url, and content_sha256 excludes the injected docs-version stamp, so it changes only when that file's own content changes.",
    files: manifestFiles,
    discovery: {
      skill: buildAbsoluteUrl(SKILL_ROUTE, siteOrigin),
      llms_index: buildAbsoluteUrl(LLMS_INDEX_ROUTE, siteOrigin),
      openapi_index: buildAbsoluteUrl(OPENAPI_INDEX_ROUTE, siteOrigin),
      api_catalog: buildAbsoluteUrl(API_CATALOG_ROUTE, siteOrigin),
      agent_skills_index: buildAbsoluteUrl(AGENT_SKILLS_INDEX_ROUTE, siteOrigin),
    },
  };
}

function listStatusLinks(spec, server) {
  const links = [{ href: STATUS_PAGE_URL, type: "text/html", title: "FastNear status page" }];
  if (spec.kind !== "rest") {
    return links;
  }

  (spec.operations || [])
    .filter((operation) => operation.method === "GET" && /^\/(health|status)$/.test(operation.path))
    .forEach((operation) => {
      links.push({
        href: `${server.url}${operation.path}`,
        type: "application/json",
        title: `${spec.title} ${operation.path.slice(1)} (${server.description})`,
      });
    });

  return links;
}

// RFC 9727 API catalog as an RFC 9264 linkset. One context per deployed server
// (mainnet, testnet, archival), since each base URL is a distinct API endpoint,
// plus a leading context that lists them all under the catalog's own anchor.
function buildApiCatalog({ openapiIndex, siteOrigin = SITE_ORIGIN, isHidden = () => false }) {
  const catalogUrl = buildAbsoluteUrl(API_CATALOG_ROUTE, siteOrigin);
  const specs = (openapiIndex?.specs || []).filter((spec) => !isHidden(spec.docsPath));
  const contexts = [];
  const items = [];

  specs.forEach((spec) => {
    (spec.servers || []).forEach((server) => {
      const title = `${spec.title} (${server.description})`;
      items.push({ href: server.url, title });
      contexts.push({
        anchor: server.url,
        "service-desc": [
          {
            href: buildAbsoluteUrl(spec.json, siteOrigin),
            type: "application/json",
            title: `${spec.title} OpenAPI ${spec.openapi} (JSON)`,
          },
          ...(spec.yaml
            ? [
                {
                  href: buildAbsoluteUrl(spec.yaml, siteOrigin),
                  type: "application/yaml",
                  title: `${spec.title} OpenAPI ${spec.openapi} (YAML)`,
                },
              ]
            : []),
        ],
        "service-doc": [
          {
            href: buildAbsoluteUrl(spec.docsPath, siteOrigin),
            type: "text/html",
            title: `${spec.title} reference`,
          },
          {
            href: buildAbsoluteUrl(markdownMirrorRoute(spec.docsPath), siteOrigin),
            type: "text/markdown",
            title: `${spec.title} reference (Markdown mirror)`,
          },
        ],
        "service-meta": [
          {
            href: buildAbsoluteUrl(OPENAPI_INDEX_ROUTE, siteOrigin),
            type: "application/json",
            title: "Index of every published FastNear OpenAPI document and operation",
          },
          {
            href: buildAbsoluteUrl(DOCS_VERSION_ROUTE, siteOrigin),
            type: "application/json",
            title: "Docs version beacon",
          },
        ],
        status: listStatusLinks(spec, server),
      });
    });
  });

  return {
    linkset: [
      {
        anchor: catalogUrl,
        item: items,
        "service-doc": [
          {
            href: buildAbsoluteUrl("/agents", siteOrigin),
            type: "text/html",
            title: "Agents on FastNear",
          },
          {
            href: buildAbsoluteUrl(SKILL_ROUTE, siteOrigin),
            type: "text/markdown",
            title: "FastNear agent skill",
          },
          {
            href: buildAbsoluteUrl(LLMS_INDEX_ROUTE, siteOrigin),
            type: "text/plain",
            title: "llms.txt index",
          },
        ],
        "service-meta": [
          {
            href: buildAbsoluteUrl(AGENT_SKILLS_INDEX_ROUTE, siteOrigin),
            type: "application/json",
            title: "Agent Skills discovery index",
          },
        ],
      },
      ...contexts,
    ],
  };
}

function parseSkillFrontmatter(text) {
  const match = String(text).match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    throw new Error("SKILL.md is missing YAML frontmatter");
  }

  const fields = {};
  for (const line of match[1].split("\n")) {
    const fieldMatch = line.match(/^([a-z-]+):\s*(.+)$/);
    if (fieldMatch) {
      fields[fieldMatch[1]] = fieldMatch[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  }

  return fields;
}

function assertValidSkillName(name) {
  if (
    typeof name !== "string" ||
    name.length < 1 ||
    name.length > MAX_SKILL_NAME_LENGTH ||
    !SKILL_NAME_PATTERN.test(name)
  ) {
    throw new Error(
      `Invalid skill name "${name}": use 1-${MAX_SKILL_NAME_LENGTH} lowercase letters, digits, and single hyphens`
    );
  }
}

// Agent Skills discovery index (v0.2.0 single-artifact model). The digest is
// the sha256 of the served SKILL.md bytes; the skills CLI refuses the file if
// it does not match.
function buildAgentSkillsIndex({ skills }) {
  return {
    $schema: AGENT_SKILLS_SCHEMA,
    skills: skills.map((skill) => {
      assertValidSkillName(skill.name);
      if (
        typeof skill.description !== "string" ||
        !skill.description ||
        skill.description.length > MAX_SKILL_DESCRIPTION_LENGTH
      ) {
        throw new Error(`Skill "${skill.name}" needs a description of 1-${MAX_SKILL_DESCRIPTION_LENGTH} characters`);
      }

      return {
        name: skill.name,
        type: "skill-md",
        description: skill.description,
        url: skill.url,
        digest: `sha256:${sha256Hex(skill.bytes)}`,
      };
    }),
  };
}

module.exports = {
  AGENT_SKILLS_INDEX_ROUTE,
  AGENT_SKILLS_SCHEMA,
  API_CATALOG_CONTENT_TYPE,
  API_CATALOG_ROUTE,
  DOCS_VERSION_BASE_ROUTES,
  DOCS_VERSION_LENGTH,
  DOCS_VERSION_ROUTE,
  LLMS_INDEX_ROUTE,
  OPENAPI_INDEX_ROUTE,
  SITE_ORIGIN,
  SKILL_ROUTE,
  SKILL_SOURCE_PATH,
  STATUS_PAGE_URL,
  applyDocsVersionStamp,
  buildAbsoluteUrl,
  buildAgentSkillsIndex,
  buildApiCatalog,
  buildDocsVersionManifest,
  computeDocsVersion,
  listDocsVersionInputRoutes,
  markdownMirrorRoute,
  parseSkillFrontmatter,
  sha256Hex,
  stripDocsVersionStamp,
};

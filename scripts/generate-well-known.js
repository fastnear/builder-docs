#!/usr/bin/env node

// Generates the agent discovery surfaces served from the docs host root:
//
//   /SKILL.md                              stamped copy of skills/fastnear/SKILL.md
//   /.well-known/api-catalog               RFC 9727 catalog of every API family
//   /.well-known/agent-skills/index.json   Agent Skills discovery index
//   /.well-known/docs-version.json         content-hash version beacon
//
// Run after generate-ai-surfaces.js: the beacon hashes llms.txt, the Markdown
// mirrors, and the site graph, so they must already exist under static/.
// The docs-version stamp is also written back into skills/fastnear/SKILL.md so
// the committed skill (what `npx skills add fastnear/builder-docs` installs)
// carries the same version as the served copy. Commit that change with the build.

const fs = require("node:fs");
const path = require("node:path");
const { isHiddenDocsRoute } = require("./lib/discovery-surface");
const wellKnown = require("./lib/well-known");

const ROOT = path.resolve(__dirname, "..");
const STATIC_ROOT = path.join(ROOT, "static");
const SKILL_SOURCE_PATH = path.join(ROOT, wellKnown.SKILL_SOURCE_PATH);

const hideEarlyApiFamilies = /^(1|true|yes|on)$/i.test(
  process.env.HIDE_EARLY_API_FAMILIES || ""
);

function staticPath(route) {
  return path.join(STATIC_ROOT, String(route).replace(/^\//, ""));
}

function readStatic(route) {
  const filePath = staticPath(route);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing ${route} under static/. Run \`yarn generate:ai-surfaces\` before \`yarn generate:well-known\`.`
    );
  }
  return fs.readFileSync(filePath);
}

function writeStatic(route, content) {
  const filePath = staticPath(route);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeJson(route, value) {
  writeStatic(route, `${JSON.stringify(value, null, 2)}\n`);
}

function removeGeneratedOutputs() {
  fs.rmSync(staticPath("/.well-known"), { force: true, recursive: true });
  fs.rmSync(staticPath(wellKnown.SKILL_ROUTE), { force: true });
}

function main() {
  removeGeneratedOutputs();

  const openapiIndex = JSON.parse(readStatic(wellKnown.OPENAPI_INDEX_ROUTE).toString("utf8"));
  const skillSource = fs.readFileSync(SKILL_SOURCE_PATH, "utf8");
  const skillContent = wellKnown.stripDocsVersionStamp(skillSource);
  const frontmatter = wellKnown.parseSkillFrontmatter(skillContent);

  // Content hashes exclude the stamp, so the version depends only on what the
  // docs say, never on the version they were last stamped with.
  const inputs = wellKnown.listDocsVersionInputRoutes(openapiIndex).map((route) => {
    const content = route === wellKnown.SKILL_ROUTE ? Buffer.from(skillContent, "utf8") : readStatic(route);
    return { route, contentSha256: wellKnown.sha256Hex(content) };
  });
  const docsVersion = wellKnown.computeDocsVersion(inputs);

  const stampedSkill = wellKnown.applyDocsVersionStamp(skillContent, docsVersion);
  if (stampedSkill !== skillSource) {
    fs.writeFileSync(SKILL_SOURCE_PATH, stampedSkill, "utf8");
  }
  writeStatic(wellKnown.SKILL_ROUTE, stampedSkill);
  const stampedSkillBytes = Buffer.from(stampedSkill, "utf8");

  writeJson(
    wellKnown.API_CATALOG_ROUTE,
    wellKnown.buildApiCatalog({
      openapiIndex,
      isHidden: (docsPath) => isHiddenDocsRoute(docsPath, { hideEarlyApiFamilies }),
    })
  );

  writeJson(
    wellKnown.AGENT_SKILLS_INDEX_ROUTE,
    wellKnown.buildAgentSkillsIndex({
      skills: [
        {
          name: frontmatter.name,
          description: frontmatter.description,
          url: wellKnown.buildAbsoluteUrl(wellKnown.SKILL_ROUTE),
          bytes: stampedSkillBytes,
        },
      ],
    })
  );

  writeJson(
    wellKnown.DOCS_VERSION_ROUTE,
    wellKnown.buildDocsVersionManifest({
      docsVersion,
      files: inputs.map((input) => ({
        route: input.route,
        contentSha256: input.contentSha256,
        sha256:
          input.route === wellKnown.SKILL_ROUTE
            ? wellKnown.sha256Hex(stampedSkillBytes)
            : input.contentSha256,
      })),
    })
  );

  console.log(
    `Generated agent discovery surfaces: docs_version ${docsVersion} over ${inputs.length} files; skill "${frontmatter.name}" stamped.`
  );
}

main();

#!/usr/bin/env node

const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://docs.fastnear.com").replace(/\/+$/, "");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchText(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  return { response, text };
}

async function assertHeadDiscoveryHeaders(pathname, expectedServiceDocPath) {
  const response = await fetch(`${SITE_ORIGIN}${pathname}`, { method: "HEAD" });
  assert(response.ok, `HEAD ${pathname} failed with ${response.status}`);

  const link = response.headers.get("link") || "";
  [
    'rel="api-catalog"',
    'rel="service-doc"',
    'rel="service-meta"',
  ].forEach((fragment) => {
    assert(link.includes(fragment), `HEAD ${pathname} is missing ${fragment} in Link headers`);
  });
  assert(
    link.includes(`<${expectedServiceDocPath}>`) || link.includes(`</${expectedServiceDocPath.replace(/^\//, "")}>`),
    `HEAD ${pathname} should advertise ${expectedServiceDocPath} as service-doc`
  );
}

async function main() {
  await assertHeadDiscoveryHeaders("/", "/agents");
  await assertHeadDiscoveryHeaders("/ru", "/ru/agents");

  const apiCatalog = await fetch(`${SITE_ORIGIN}/.well-known/api-catalog`);
  assert(apiCatalog.ok, `GET /.well-known/api-catalog failed with ${apiCatalog.status}`);
  const apiCatalogType = apiCatalog.headers.get("content-type") || "";
  assert(
    apiCatalogType.includes("application/linkset+json"),
    "API catalog must return application/linkset+json"
  );
  const apiCatalogJson = await apiCatalog.json();
  assert(Array.isArray(apiCatalogJson.linkset), "API catalog must expose a linkset array");

  const indexResponse = await fetch(`${SITE_ORIGIN}/.well-known/agent-skills/index.json`);
  assert(
    indexResponse.ok,
    `GET /.well-known/agent-skills/index.json failed with ${indexResponse.status}`
  );
  const indexType = indexResponse.headers.get("content-type") || "";
  assert(indexType.includes("application/json"), "Agent Skills index must return JSON");
  const indexJson = await indexResponse.json();
  assert(Array.isArray(indexJson.skills), "Agent Skills index must expose a skills array");

  for (const skill of indexJson.skills) {
    const skillResponse = await fetch(new URL(skill.url, `${SITE_ORIGIN}/`));
    assert(skillResponse.ok, `GET ${skill.url} failed with ${skillResponse.status}`);
    const skillType = skillResponse.headers.get("content-type") || "";
    assert(
      skillType.includes("text/markdown"),
      `Skill ${skill.name} must return text/markdown`
    );
  }

  const { response: markdownResponse, text: markdownText } = await fetchText(`${SITE_ORIGIN}/`, {
    headers: {
      Accept: "text/markdown",
    },
  });
  assert(markdownResponse.ok, `GET / as markdown failed with ${markdownResponse.status}`);
  const markdownType = markdownResponse.headers.get("content-type") || "";
  assert(markdownType.includes("text/markdown"), "GET / with Accept: text/markdown must return markdown");
  assert(
    !/<html/i.test(markdownText),
    "GET / with Accept: text/markdown should not return HTML"
  );

  const htmlResponse = await fetch(`${SITE_ORIGIN}/`);
  assert(htmlResponse.ok, `GET / failed with ${htmlResponse.status}`);
  const htmlType = htmlResponse.headers.get("content-type") || "";
  assert(htmlType.includes("text/html"), "Normal browser GET / must still return HTML");

  console.log(`Live agent-readiness smoke checks passed for ${SITE_ORIGIN}.`);
}

main().catch((error) => {
  console.error(`Live agent-readiness smoke checks failed: ${error.message}`);
  process.exitCode = 1;
});

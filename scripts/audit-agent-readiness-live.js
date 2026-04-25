#!/usr/bin/env node

// Live smoke test for HTTP `Link` headers and content-negotiated `.md` serving advertised via
// `static/_headers` and `static/_worker.js`. These directives only execute on Cloudflare Pages
// with Workers/Pages Functions enabled, so this script is meaningful only against a Cloudflare
// Pages origin (production once migrated, or local `wrangler pages dev`). Against GitHub Pages
// it will fail by design — that is not a regression. Override the target with SITE_ORIGIN.

const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://docs.fastnear.com").replace(/\/+$/, "");

const API_CATALOG_FRAGMENT = 'rel="api-catalog"';
const AGENT_SKILLS_FRAGMENT = '<' + '/.well-known/agent-skills/index.json' + '>';
const ROOT_SITE_GRAPH_FRAGMENT = '</structured-data/site-graph.json>';
const RU_SITE_GRAPH_FRAGMENT = '</ru/structured-data/site-graph.json>';
const RPC_SERVICE_DESC_FRAGMENT = '<https://rpc.mainnet.fastnear.com/openapi.json>';
const FASTNEAR_SERVICE_DESC_FRAGMENT = '</openapi/fastnear.json>';
const NEARDATA_SERVICE_DESC_FRAGMENT = '</openapi/neardata.json>';
const MARKDOWN_ALTERNATE_FRAGMENT =
  '</rpc/account/view-account.md>; rel="alternate"; type="text/markdown"';

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

async function assertHeadDiscoveryHeaders(pathname, expectedFragments) {
  const response = await fetch(`${SITE_ORIGIN}${pathname}`, { method: "HEAD" });
  assert(response.ok, `HEAD ${pathname} failed with ${response.status}`);

  const link = response.headers.get("link") || "";
  expectedFragments.forEach((fragment) => {
    assert(link.includes(fragment), `HEAD ${pathname} is missing ${fragment}`);
  });
}

async function main() {
  const discoveryChecks = [
    {
      pathname: "/",
      expectedFragments: [API_CATALOG_FRAGMENT, 'rel="service-doc"', AGENT_SKILLS_FRAGMENT, ROOT_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/ru",
      expectedFragments: [API_CATALOG_FRAGMENT, 'rel="service-doc"', AGENT_SKILLS_FRAGMENT, RU_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/rpc",
      expectedFragments: [API_CATALOG_FRAGMENT, 'rel="service-desc"', RPC_SERVICE_DESC_FRAGMENT, ROOT_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/ru/rpc",
      expectedFragments: [API_CATALOG_FRAGMENT, 'rel="service-desc"', RPC_SERVICE_DESC_FRAGMENT, RU_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/api",
      expectedFragments: [API_CATALOG_FRAGMENT, 'rel="service-desc"', FASTNEAR_SERVICE_DESC_FRAGMENT, ROOT_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/ru/api",
      expectedFragments: [API_CATALOG_FRAGMENT, 'rel="service-desc"', FASTNEAR_SERVICE_DESC_FRAGMENT, RU_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/neardata",
      expectedFragments: [API_CATALOG_FRAGMENT, 'rel="service-desc"', NEARDATA_SERVICE_DESC_FRAGMENT, ROOT_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/ru/neardata",
      expectedFragments: [API_CATALOG_FRAGMENT, 'rel="service-desc"', NEARDATA_SERVICE_DESC_FRAGMENT, RU_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/agents",
      expectedFragments: [API_CATALOG_FRAGMENT, AGENT_SKILLS_FRAGMENT, ROOT_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/ru/agents",
      expectedFragments: [API_CATALOG_FRAGMENT, AGENT_SKILLS_FRAGMENT, RU_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/auth",
      expectedFragments: [API_CATALOG_FRAGMENT, ROOT_SITE_GRAPH_FRAGMENT],
    },
    {
      pathname: "/ru/auth",
      expectedFragments: [API_CATALOG_FRAGMENT, RU_SITE_GRAPH_FRAGMENT],
    },
  ];

  for (const { pathname, expectedFragments } of discoveryChecks) {
    await assertHeadDiscoveryHeaders(pathname, expectedFragments);
  }

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

  const { response: markdownResponse, text: markdownText } = await fetchText(
    `${SITE_ORIGIN}/rpc/account/view-account`,
    {
      headers: {
        Accept: "text/markdown",
      },
    }
  );
  assert(
    markdownResponse.ok,
    `GET /rpc/account/view-account as markdown failed with ${markdownResponse.status}`
  );
  const markdownType = markdownResponse.headers.get("content-type") || "";
  assert(
    markdownType.includes("text/markdown"),
    "GET /rpc/account/view-account with Accept: text/markdown must return markdown"
  );
  assert(
    !/<html/i.test(markdownText),
    "GET /rpc/account/view-account with Accept: text/markdown should not return HTML"
  );

  const htmlResponse = await fetch(`${SITE_ORIGIN}/rpc/account/view-account`);
  assert(htmlResponse.ok, `GET /rpc/account/view-account failed with ${htmlResponse.status}`);
  const htmlType = htmlResponse.headers.get("content-type") || "";
  assert(htmlType.includes("text/html"), "Normal browser GET /rpc/account/view-account must still return HTML");
  assert(
    (htmlResponse.headers.get("link") || "").includes(MARKDOWN_ALTERNATE_FRAGMENT),
    "HTML docs responses should advertise the markdown alternate"
  );

  console.log(`Live agent-discoverability smoke checks passed for ${SITE_ORIGIN}.`);
}

main().catch((error) => {
  console.error(`Live agent-discoverability smoke checks failed: ${error.message}`);
  process.exitCode = 1;
});

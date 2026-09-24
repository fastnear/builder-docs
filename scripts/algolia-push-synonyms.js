#!/usr/bin/env node
/*
  Push the repo-owned synonyms (algolia/synonyms.json) to the live index.

  This Algolia application is DocSearch-provisioned: it exposes no admin key
  and its Rules quota is zero, so promote Rules cannot be used at all. Synonyms
  can. The write credential is the index key carried by the crawler's own
  configuration, fetched here through the Crawler API with the crawler
  credentials already in .env and never stored anywhere.

  Usage:
    yarn algolia:synonyms:push            # report what would change, no writes
    yarn algolia:synonyms:push --apply    # write every fastnear-* synonym
*/
const fs = require("node:fs");
const path = require("node:path");
const { loadDotEnv, requireEnv, resolveCrawlerAuthHeader } = require("./lib/algolia-common");

const ROOT = path.resolve(__dirname, "..");
const SYNONYMS_PATH = path.join(ROOT, "algolia/synonyms.json");
const CRAWLER_API_ROOT = "https://crawler.algolia.com/api/1";

async function resolveCrawlerIndexKey(env) {
  const list = await fetch(`${CRAWLER_API_ROOT}/crawlers?name=${encodeURIComponent(env.crawlerName)}`, {
    headers: { Authorization: env.basicAuth },
  });
  if (!list.ok) throw new Error(`Crawler list failed: HTTP ${list.status}`);
  const crawlerId = (await list.json()).items?.[0]?.id;
  if (!crawlerId) throw new Error(`No crawler named ${env.crawlerName}`);
  const detail = await fetch(`${CRAWLER_API_ROOT}/crawlers/${crawlerId}?withConfig=true`, {
    headers: { Authorization: env.basicAuth },
  });
  if (!detail.ok) throw new Error(`Crawler config fetch failed: HTTP ${detail.status}`);
  const apiKey = (await detail.json()).config?.apiKey;
  if (!apiKey) throw new Error("Crawler config carries no index API key");
  return apiKey;
}

async function run() {
  loadDotEnv();
  const apply = process.argv.includes("--apply");
  const env = {
    appId: requireEnv("DOCSEARCH_APP_ID"),
    basicAuth: resolveCrawlerAuthHeader({
      apiKey: process.env.ALGOLIA_CRAWLER_API_KEY,
      userId: process.env.ALGOLIA_CRAWLER_USER_ID,
    }),
    crawlerName: requireEnv("ALGOLIA_CRAWLER_NAME"),
    indexName: requireEnv("DOCSEARCH_INDEX_NAME"),
  };
  const synonyms = JSON.parse(fs.readFileSync(SYNONYMS_PATH, "utf8"));
  const foreign = synonyms.filter((entry) => !String(entry.objectID || "").startsWith("fastnear-"));
  if (foreign.length) throw new Error(`Refusing to push non fastnear-* synonyms: ${foreign.map((e) => e.objectID).join(", ")}`);

  const { algoliasearch } = require("algoliasearch");
  const client = algoliasearch(env.appId, await resolveCrawlerIndexKey(env));
  const live = await client.searchSynonyms({ indexName: env.indexName, searchSynonymsParams: { query: "", hitsPerPage: 1000 } });
  const liveById = new Map((live.hits || []).map((hit) => [hit.objectID, hit]));
  const changed = synonyms.filter((entry) => JSON.stringify(liveById.get(entry.objectID)?.synonyms || null) !== JSON.stringify(entry.synonyms));

  console.log(`Algolia synonyms (${env.indexName})`);
  console.log(`- repo: ${synonyms.length}, live: ${liveById.size}, to create or update: ${changed.length}`);
  if (!apply) {
    console.log("- dry run; pass --apply to write");
    return;
  }
  const task = await client.saveSynonyms({ indexName: env.indexName, synonymHit: synonyms, replaceExistingSynonyms: false });
  await client.waitForTask({ indexName: env.indexName, taskID: task.taskID });
  const after = await client.searchSynonyms({ indexName: env.indexName, searchSynonymsParams: { query: "", hitsPerPage: 1 } });
  console.log(`- saved; live synonyms now: ${after.nbHits}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

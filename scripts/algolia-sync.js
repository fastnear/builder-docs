#!/usr/bin/env node

const {
  getCrawlerState,
  printCrawlerState,
  printCrawlerSync,
  syncCrawlerConfig,
} = require("./lib/algolia-crawler-control");
const {
  getSearchStatus,
  printSearchStatus,
  printSearchSync,
  syncSearchArtifacts,
} = require("./lib/algolia-search-control");

async function run() {
  const searchSync = await syncSearchArtifacts();
  printSearchSync(searchSync);

  const crawlerSync = await syncCrawlerConfig();
  printCrawlerSync(crawlerSync);

  const searchStatus = await getSearchStatus();
  printSearchStatus(searchStatus);

  const crawlerState = await getCrawlerState();
  printCrawlerState(crawlerState);

  if (searchStatus.hasDrift || crawlerState.hasDrift || crawlerState.details.blocked) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

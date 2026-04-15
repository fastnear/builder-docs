#!/usr/bin/env node

const {
  getCrawlerState,
  printCrawlerState,
} = require("./lib/algolia-crawler-control");
const {
  getSearchStatus,
  printSearchStatus,
} = require("./lib/algolia-search-control");

async function run() {
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

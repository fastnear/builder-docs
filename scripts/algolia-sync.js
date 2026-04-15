#!/usr/bin/env node

const {
  getCrawlerState,
  printCrawlerState,
  printCrawlerSync,
  syncCrawlerConfig,
} = require("./lib/algolia-crawler-control");

async function run() {
  const crawlerSync = await syncCrawlerConfig();
  printCrawlerSync(crawlerSync);

  const crawlerState = await getCrawlerState();
  printCrawlerState(crawlerState);

  if (crawlerState.hasDrift || crawlerState.details.blocked) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

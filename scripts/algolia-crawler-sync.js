#!/usr/bin/env node

const {
  getCrawlerState,
  printCrawlerState,
  printCrawlerSync,
  syncCrawlerConfig,
} = require("./lib/algolia-crawler-control");

async function run() {
  const syncResult = await syncCrawlerConfig();
  printCrawlerSync(syncResult);

  const state = await getCrawlerState();
  printCrawlerState(state);

  if (state.hasDrift || state.details.blocked) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

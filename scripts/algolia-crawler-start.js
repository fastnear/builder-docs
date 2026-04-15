#!/usr/bin/env node

const {
  printCrawlerStart,
  startCrawler,
} = require("./lib/algolia-crawler-control");

async function run() {
  const startResult = await startCrawler();
  printCrawlerStart(startResult);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

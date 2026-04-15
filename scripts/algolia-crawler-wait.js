#!/usr/bin/env node

const {
  printCrawlerWait,
  waitForCrawlerTaskByArgs,
} = require("./lib/algolia-crawler-control");

function parseTaskId(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--task") {
      return argv[index + 1] || "";
    }
  }

  return "";
}

async function run() {
  const taskId = parseTaskId(process.argv.slice(2));
  if (!taskId) {
    throw new Error("Missing required argument: --task <taskId>");
  }

  const waitResult = await waitForCrawlerTaskByArgs(taskId);
  printCrawlerWait(waitResult);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

const {
  collectDiffs,
  formatDiffs,
  loadDotEnv,
  logSection,
  normalizeFunctionSource,
  requireEnv,
  resolveCrawlerAuthHeader,
  sleep,
  stableStringify,
} = require("./algolia-common");
const {
  createCrawlerConfig,
} = require("../../algolia/crawler/shared");

const CRAWLER_API_ROOT = "https://crawler.algolia.com/api/1";

function getCrawlerEnv() {
  loadDotEnv();
  const crawlerName = requireEnv("ALGOLIA_CRAWLER_NAME");

  return {
    appId: requireEnv("DOCSEARCH_APP_ID"),
    basicAuth: resolveCrawlerAuthHeader({
      apiKey: process.env.ALGOLIA_CRAWLER_API_KEY,
      userId: process.env.ALGOLIA_CRAWLER_USER_ID,
    }),
    crawlerName,
    indexName: requireEnv("DOCSEARCH_INDEX_NAME"),
  };
}

async function crawlerApiRequest(env, pathname, { body, method = "GET", query = {} } = {}) {
  const url = new URL(`${CRAWLER_API_ROOT}${pathname}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      Accept: "application/json",
      Authorization: env.basicAuth,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    method,
  });

  const responseText = await response.text();
  let parsed;
  try {
    parsed = responseText ? JSON.parse(responseText) : {};
  } catch {
    parsed = responseText;
  }

  if (!response.ok) {
    throw new Error(`Crawler API ${method} ${pathname} failed (${response.status}): ${typeof parsed === "string" ? parsed : stableStringify(parsed)}`);
  }

  return parsed;
}

async function resolveCrawlerId(env) {
  const response = await crawlerApiRequest(env, "/crawlers", {
    query: {
      itemsPerPage: 100,
      name: env.crawlerName,
      page: 1,
    },
  });
  const items = Array.isArray(response.items) ? response.items : [];
  const match = items.find((crawler) => crawler.name === env.crawlerName);

  if (!match?.id) {
    throw new Error(`Could not resolve crawler ID for crawler name ${JSON.stringify(env.crawlerName)}`);
  }

  return match.id;
}

function normalizeCrawlerFunction(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return {
      __type: "function",
      source: normalizeFunctionSource(value),
    };
  }

  if (value.__type === "function") {
    return {
      __type: "function",
      source: normalizeFunctionSource(value.source),
    };
  }

  return value;
}

function extractCrawlerConfig(details) {
  if (details?.config && typeof details.config === "object") {
    return details.config;
  }

  const topLevelKeys = [
    "actions",
    "appId",
    "discoveryPatterns",
    "ignoreCanonicalTo",
    "initialIndexSettings",
    "maxDepth",
    "rateLimit",
    "renderJavaScript",
    "sitemaps",
    "startUrls",
  ];
  const extracted = {};

  topLevelKeys.forEach((key) => {
    if (details && Object.prototype.hasOwnProperty.call(details, key)) {
      extracted[key] = details[key];
    }
  });

  return Object.keys(extracted).length ? extracted : null;
}

function normalizeCrawlerConfig(config, env) {
  const safeConfig = config || {};
  return JSON.parse(
    stableStringify({
      actions: (safeConfig.actions || []).map((action) => ({
        indexName: action.indexName,
        pathsToMatch: action.pathsToMatch || [],
        recordExtractor: normalizeCrawlerFunction(action.recordExtractor),
      })),
      appId: safeConfig.appId,
      discoveryPatterns: safeConfig.discoveryPatterns || [],
      ignoreCanonicalTo: safeConfig.ignoreCanonicalTo,
      initialIndexSettings: safeConfig.initialIndexSettings
        ? {
            [env.indexName]: safeConfig.initialIndexSettings[env.indexName],
          }
        : {},
      maxDepth: safeConfig.maxDepth,
      rateLimit: safeConfig.rateLimit,
      renderJavaScript: safeConfig.renderJavaScript,
      sitemaps: safeConfig.sitemaps || [],
      startUrls: safeConfig.startUrls || [],
    })
  );
}

async function getCrawlerState() {
  const env = getCrawlerEnv();
  const crawlerId = await resolveCrawlerId(env);
  const details = await crawlerApiRequest(env, `/crawlers/${crawlerId}`, {
    query: {
      withConfig: true,
    },
  });
  const versionsResponse = await crawlerApiRequest(env, `/crawlers/${crawlerId}/config/versions`, {
    query: {
      itemsPerPage: 20,
      page: 1,
    },
  });
  const runsResponse = await crawlerApiRequest(env, `/crawlers/${crawlerId}/crawl_runs`, {
    query: {
      limit: 20,
      order: "DESC",
    },
  });

  const latestVersion = [...(versionsResponse.items || [])]
    .sort((left, right) => (right.version || 0) - (left.version || 0))[0] || null;
  const latestRun = [...(runsResponse.logs || [])]
    .sort((left, right) => {
      return new Date(right.crawlStartedAt || 0).getTime() - new Date(left.crawlStartedAt || 0).getTime();
    })[0] || null;
  const expectedConfig = normalizeCrawlerConfig(createCrawlerConfig({
    appId: env.appId,
    indexName: env.indexName,
  }), env);
  const liveConfig = normalizeCrawlerConfig(extractCrawlerConfig(details), env);
  const diffs = collectDiffs(expectedConfig, liveConfig);

  return {
    crawlerId,
    details,
    diffs,
    env,
    expectedConfig,
    hasDrift: Boolean(diffs.length),
    latestRun,
    latestVersion,
  };
}

function printCrawlerState(state) {
  logSection("Algolia Crawler");
  console.log(`- Crawler ID: ${state.crawlerId}`);
  console.log(`- Name: ${state.details.name}`);
  console.log(`- Running: ${state.details.running ? "yes" : "no"}`);
  console.log(`- Reindexing: ${state.details.reindexing ? "yes" : "no"}`);
  console.log(`- Blocked: ${state.details.blocked ? "yes" : "no"}`);

  if (state.latestVersion) {
    console.log(`- Latest config version: ${state.latestVersion.version}`);
  }

  if (state.latestRun) {
    console.log(
      `- Latest crawl run: ${state.latestRun.status || "unknown"} (${state.latestRun.urlsDone || 0} done, ${state.latestRun.urlsSkipped || 0} skipped, ${state.latestRun.urlsFailed || 0} failed)`
    );
  }

  if (state.details.blockingError) {
    console.log(`- Blocking error: ${state.details.blockingError.trim()}`);
  }

  if (!state.hasDrift) {
    console.log("- Drift: none");
    return;
  }

  console.log("- Drift:");
  formatDiffs(state.diffs).forEach((line) => console.log(`  ${line}`));
}

async function waitForCrawlerTask(env, crawlerId, taskId, { intervalMs = 2000, timeoutMs = 10 * 60 * 1000 } = {}) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const status = await crawlerApiRequest(env, `/crawlers/${crawlerId}/tasks/${taskId}`);
    if (!status.pending) {
      return status;
    }

    await sleep(intervalMs);
  }

  throw new Error(`Crawler task ${taskId} did not finish before timeout`);
}

function isCrawlerRunPending(run) {
  const status = String(run?.status || "").toLowerCase();
  return ["pending", "running", "started", "created"].includes(status);
}

async function waitForCrawlerReindexCompletion(env, crawlerId, { startedAfterMs, intervalMs = 5000, timeoutMs = 45 * 60 * 1000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let sawMatchingRun = false;

  while (Date.now() < deadline) {
    const state = await getCrawlerState();
    const latestRunStartedAt = state.latestRun?.crawlStartedAt
      ? new Date(state.latestRun.crawlStartedAt).getTime()
      : 0;
    const latestRunMatches = latestRunStartedAt >= (startedAfterMs || 0);

    if (latestRunMatches) {
      sawMatchingRun = true;
    }

    if (
      sawMatchingRun &&
      !state.details.reindexing &&
      !isCrawlerRunPending(state.latestRun)
    ) {
      return {
        crawlerId,
        latestRun: state.latestRun,
      };
    }

    await sleep(intervalMs);
  }

  throw new Error(`Crawler ${crawlerId} did not finish reindexing before timeout`);
}

async function syncCrawlerConfig() {
  const state = await getCrawlerState();
  const desiredConfig = createCrawlerConfig({
    appId: state.env.appId,
    indexName: state.env.indexName,
  });
  const response = await crawlerApiRequest(state.env, `/crawlers/${state.crawlerId}/config`, {
    body: desiredConfig,
    method: "PATCH",
  });
  const taskId = response.taskId;
  if (!taskId) {
    throw new Error("Crawler config sync did not return a taskId");
  }

  await waitForCrawlerTask(state.env, state.crawlerId, taskId);
  const nextState = await getCrawlerState();

  return {
    crawlerId: state.crawlerId,
    latestVersion: nextState.latestVersion,
    taskId,
  };
}

function printCrawlerSync(syncResult) {
  logSection("Synced Algolia Crawler");
  console.log(`- Crawler ID: ${syncResult.crawlerId}`);
  console.log(`- Task ID: ${syncResult.taskId}`);
  if (syncResult.latestVersion) {
    console.log(`- Latest config version: ${syncResult.latestVersion.version}`);
  }
}

async function startCrawler() {
  const state = await getCrawlerState();
  if (state.details.blocked) {
    throw new Error(`Crawler ${state.crawlerId} is blocked and cannot start a crawl`);
  }
  if (state.details.reindexing) {
    throw new Error(`Crawler ${state.crawlerId} is already reindexing`);
  }

  const response = await crawlerApiRequest(state.env, `/crawlers/${state.crawlerId}/reindex`, {
    method: "POST",
  });
  const taskId = response.taskId;
  if (!taskId) {
    throw new Error("Crawler start did not return a taskId");
  }

  return {
    crawlerId: state.crawlerId,
    taskId,
  };
}

async function waitForCrawlerTaskByArgs(taskId) {
  const env = getCrawlerEnv();
  const crawlerId = await resolveCrawlerId(env);
  const startedAfterMs = Date.now();
  await waitForCrawlerTask(env, crawlerId, taskId);
  const completedRun = await waitForCrawlerReindexCompletion(env, crawlerId, {
    startedAfterMs,
  });

  return {
    crawlerId,
    latestRun: completedRun.latestRun,
    taskId,
  };
}

function printCrawlerStart(startResult) {
  logSection("Started Algolia Crawl");
  console.log(`- Crawler ID: ${startResult.crawlerId}`);
  console.log(`- Task ID: ${startResult.taskId}`);
}

function printCrawlerWait(waitResult) {
  logSection("Completed Algolia Crawl");
  console.log(`- Crawler ID: ${waitResult.crawlerId}`);
  console.log(`- Task ID: ${waitResult.taskId}`);
  if (waitResult.latestRun) {
    console.log(
      `- Latest crawl run: ${waitResult.latestRun.status || "unknown"} (${waitResult.latestRun.urlsDone || 0} done, ${waitResult.latestRun.urlsSkipped || 0} skipped, ${waitResult.latestRun.urlsFailed || 0} failed)`
    );
  }
}

module.exports = {
  getCrawlerState,
  printCrawlerStart,
  printCrawlerState,
  printCrawlerSync,
  printCrawlerWait,
  startCrawler,
  syncCrawlerConfig,
  waitForCrawlerTaskByArgs,
};

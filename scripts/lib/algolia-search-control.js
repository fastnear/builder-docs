const { algoliasearch } = require("algoliasearch");

const {
  FASTNEAR_OBJECT_ID_PREFIX,
  collectDiffs,
  formatDiffs,
  loadDotEnv,
  logSection,
  readJson,
  requireEnv,
  stableStringify,
} = require("./algolia-common");

function getSearchEnv() {
  loadDotEnv();

  return {
    adminApiKey: requireEnv("ALGOLIA_ADMIN_API_KEY"),
    appId: requireEnv("DOCSEARCH_APP_ID"),
    indexName: requireEnv("DOCSEARCH_INDEX_NAME"),
  };
}

function createSearchClient({ appId, adminApiKey }) {
  return algoliasearch(appId, adminApiKey);
}

function readRepoIndexSettings() {
  return readJson("algolia/index-settings.json");
}

function readRepoRules() {
  return readJson("algolia/rules.json")
    .map((rule) => normalizeRule(rule))
    .sort((left, right) => left.objectID.localeCompare(right.objectID));
}

function readRepoSynonyms() {
  return readJson("algolia/synonyms.json")
    .map((synonym) => normalizeSynonym(synonym))
    .sort((left, right) => left.objectID.localeCompare(right.objectID));
}

function normalizeDistinct(value) {
  if (value === 1) {
    return true;
  }

  if (value === 0) {
    return false;
  }

  return value;
}

function normalizeSettingsValue(key, value) {
  if (key === "distinct") {
    return normalizeDistinct(value);
  }

  return value;
}

function normalizeSearchSettings(settings, template = readRepoIndexSettings()) {
  const normalized = {};
  Object.keys(template).forEach((key) => {
    normalized[key] = normalizeSettingsValue(key, settings[key]);
  });
  return normalized;
}

function normalizeRule(rule) {
  const nextRule = JSON.parse(JSON.stringify(rule || {}));
  if (nextRule.condition && !nextRule.conditions) {
    nextRule.conditions = [nextRule.condition];
    delete nextRule.condition;
  }

  if (Array.isArray(nextRule.conditions)) {
    nextRule.conditions = nextRule.conditions
      .map((condition) => ({
        ...condition,
        alternatives: Boolean(condition.alternatives),
      }))
      .sort((left, right) => {
        return `${left.pattern || ""}:${left.anchoring || ""}`.localeCompare(
          `${right.pattern || ""}:${right.anchoring || ""}`
        );
      });
  }

  if (Array.isArray(nextRule.consequence?.promote)) {
    nextRule.consequence.promote = nextRule.consequence.promote
      .map((entry) => {
        const objectIDs = Array.isArray(entry.objectIDs)
          ? entry.objectIDs
          : entry.objectID
            ? [entry.objectID]
            : [];
        return {
          ...entry,
          objectIDs: [...objectIDs].sort(),
        };
      })
      .map((entry) => {
        delete entry.objectID;
        return entry;
      })
      .sort((left, right) => {
        return (left.position || 0) - (right.position || 0);
      });
  }

  return JSON.parse(stableStringify(nextRule));
}

function normalizeSynonym(synonym) {
  const nextSynonym = JSON.parse(JSON.stringify(synonym || {}));
  if (Array.isArray(nextSynonym.synonyms)) {
    nextSynonym.synonyms = [...nextSynonym.synonyms].sort();
  }
  return JSON.parse(stableStringify(nextSynonym));
}

async function browseRepoOwnedRules(client, indexName) {
  const hits = [];
  await client.browseRules({
    indexName,
    aggregator: (response) => {
      hits.push(...(response.hits || []));
    },
    searchRulesParams: {
      query: "",
    },
  });

  return hits
    .filter((rule) => String(rule.objectID || "").startsWith(FASTNEAR_OBJECT_ID_PREFIX))
    .map((rule) => normalizeRule(rule))
    .sort((left, right) => left.objectID.localeCompare(right.objectID));
}

async function browseRepoOwnedSynonyms(client, indexName) {
  const hits = [];
  await client.browseSynonyms({
    indexName,
    aggregator: (response) => {
      hits.push(...(response.hits || []));
    },
    searchSynonymsParams: {
      query: "",
    },
  });

  return hits
    .filter((synonym) => String(synonym.objectID || "").startsWith(FASTNEAR_OBJECT_ID_PREFIX))
    .map((synonym) => normalizeSynonym(synonym))
    .sort((left, right) => left.objectID.localeCompare(right.objectID));
}

function diffRepoOwnedEntries(expectedEntries, actualEntries) {
  const expectedById = new Map(expectedEntries.map((entry) => [entry.objectID, entry]));
  const actualById = new Map(actualEntries.map((entry) => [entry.objectID, entry]));
  const changed = [];
  const deleted = [];

  expectedById.forEach((expectedEntry, objectID) => {
    const actualEntry = actualById.get(objectID);
    if (!actualEntry || stableStringify(expectedEntry) !== stableStringify(actualEntry)) {
      changed.push(expectedEntry);
    }
  });

  actualById.forEach((_actualEntry, objectID) => {
    if (!expectedById.has(objectID)) {
      deleted.push(objectID);
    }
  });

  return { changed, deleted };
}

async function getSearchStatus() {
  const env = getSearchEnv();
  const client = createSearchClient(env);
  const repoSettings = readRepoIndexSettings();
  const repoRules = readRepoRules();
  const repoSynonyms = readRepoSynonyms();

  const liveSettings = normalizeSearchSettings(
    await client.getSettings({ indexName: env.indexName }),
    repoSettings
  );
  const liveRules = await browseRepoOwnedRules(client, env.indexName);
  const liveSynonyms = await browseRepoOwnedSynonyms(client, env.indexName);

  const settingsDiffs = collectDiffs(repoSettings, liveSettings);
  const rulesDiffs = collectDiffs(repoRules, liveRules);
  const synonymsDiffs = collectDiffs(repoSynonyms, liveSynonyms);

  return {
    env,
    hasDrift: Boolean(settingsDiffs.length || rulesDiffs.length || synonymsDiffs.length),
    repoRulesCount: repoRules.length,
    repoSynonymsCount: repoSynonyms.length,
    rulesDiffs,
    settingsDiffs,
    synonymsDiffs,
  };
}

function printSearchStatus(status) {
  logSection("Algolia Search Index");
  console.log(`- App ID: ${status.env.appId}`);
  console.log(`- Index: ${status.env.indexName}`);
  console.log(`- Repo-owned Rules: ${status.repoRulesCount}`);
  console.log(`- Repo-owned Synonyms: ${status.repoSynonymsCount}`);

  if (!status.hasDrift) {
    console.log("- Drift: none");
    return;
  }

  if (status.settingsDiffs.length) {
    console.log("- Settings drift:");
    formatDiffs(status.settingsDiffs).forEach((line) => console.log(`  ${line}`));
  }

  if (status.rulesDiffs.length) {
    console.log("- Rules drift:");
    formatDiffs(status.rulesDiffs).forEach((line) => console.log(`  ${line}`));
  }

  if (status.synonymsDiffs.length) {
    console.log("- Synonyms drift:");
    formatDiffs(status.synonymsDiffs).forEach((line) => console.log(`  ${line}`));
  }
}

async function waitForSearchTask(client, indexName, taskResponse) {
  const taskID = taskResponse?.taskID;
  if (!taskID) {
    return;
  }

  await client.waitForTask({ indexName, taskID });
}

async function syncSearchArtifacts() {
  const env = getSearchEnv();
  const client = createSearchClient(env);
  const repoSettings = readRepoIndexSettings();
  const repoRules = readRepoRules();
  const repoSynonyms = readRepoSynonyms();
  const liveRules = await browseRepoOwnedRules(client, env.indexName);
  const liveSynonyms = await browseRepoOwnedSynonyms(client, env.indexName);
  const ruleDiff = diffRepoOwnedEntries(repoRules, liveRules);
  const synonymDiff = diffRepoOwnedEntries(repoSynonyms, liveSynonyms);

  const operations = {
    deletedRules: [],
    deletedSynonyms: [],
    savedRules: [],
    savedSynonyms: [],
    settingsUpdated: false,
  };

  const settingsResponse = await client.setSettings({
    indexName: env.indexName,
    indexSettings: repoSettings,
  });
  await waitForSearchTask(client, env.indexName, settingsResponse);
  operations.settingsUpdated = true;

  for (const rule of ruleDiff.changed) {
    const response = await client.saveRule({
      indexName: env.indexName,
      objectID: rule.objectID,
      rule,
    });
    await waitForSearchTask(client, env.indexName, response);
    operations.savedRules.push(rule.objectID);
  }

  for (const objectID of ruleDiff.deleted) {
    const response = await client.deleteRule({
      indexName: env.indexName,
      objectID,
    });
    await waitForSearchTask(client, env.indexName, response);
    operations.deletedRules.push(objectID);
  }

  for (const synonym of synonymDiff.changed) {
    const response = await client.saveSynonym({
      indexName: env.indexName,
      objectID: synonym.objectID,
      synonymHit: synonym,
    });
    await waitForSearchTask(client, env.indexName, response);
    operations.savedSynonyms.push(synonym.objectID);
  }

  for (const objectID of synonymDiff.deleted) {
    const response = await client.deleteSynonym({
      indexName: env.indexName,
      objectID,
    });
    await waitForSearchTask(client, env.indexName, response);
    operations.deletedSynonyms.push(objectID);
  }

  return {
    env,
    operations,
  };
}

function printSearchSync(syncResult) {
  logSection("Synced Algolia Search Index");
  console.log(`- Index: ${syncResult.env.indexName}`);
  console.log(`- Settings updated: ${syncResult.operations.settingsUpdated ? "yes" : "no"}`);
  console.log(`- Rules upserted: ${syncResult.operations.savedRules.length}`);
  console.log(`- Rules deleted: ${syncResult.operations.deletedRules.length}`);
  console.log(`- Synonyms upserted: ${syncResult.operations.savedSynonyms.length}`);
  console.log(`- Synonyms deleted: ${syncResult.operations.deletedSynonyms.length}`);
}

module.exports = {
  getSearchStatus,
  printSearchStatus,
  printSearchSync,
  syncSearchArtifacts,
};

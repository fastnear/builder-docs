import { use } from "react";

import pageModelChunkManifest from "@site/src/data/generatedFastnearPageModelChunkManifest.json";
import { localizePageModel } from "@site/src/utils/fastnearLocalization";

const SUPPORTED_LOCALES = ["en", "ru"];

const PAGE_MODEL_CHUNK_LOADERS = {
  "rpcs/account": () =>
    import(
      /* webpackChunkName: "page-models-rpcs-account" */
      "@site/src/data/generatedFastnearPageModelChunks/rpcs-account.json"
    ),
  "rpcs/block": () =>
    import(
      /* webpackChunkName: "page-models-rpcs-block" */
      "@site/src/data/generatedFastnearPageModelChunks/rpcs-block.json"
    ),
  "rpcs/contract": () =>
    import(
      /* webpackChunkName: "page-models-rpcs-contract" */
      "@site/src/data/generatedFastnearPageModelChunks/rpcs-contract.json"
    ),
  "rpcs/protocol": () =>
    import(
      /* webpackChunkName: "page-models-rpcs-protocol" */
      "@site/src/data/generatedFastnearPageModelChunks/rpcs-protocol.json"
    ),
  "rpcs/transaction": () =>
    import(
      /* webpackChunkName: "page-models-rpcs-transaction" */
      "@site/src/data/generatedFastnearPageModelChunks/rpcs-transaction.json"
    ),
  "rpcs/validators": () =>
    import(
      /* webpackChunkName: "page-models-rpcs-validators" */
      "@site/src/data/generatedFastnearPageModelChunks/rpcs-validators.json"
    ),
  "apis/fastnear": () =>
    import(
      /* webpackChunkName: "page-models-apis-fastnear" */
      "@site/src/data/generatedFastnearPageModelChunks/apis-fastnear.json"
    ),
  "apis/kv-fastdata": () =>
    import(
      /* webpackChunkName: "page-models-apis-kv-fastdata" */
      "@site/src/data/generatedFastnearPageModelChunks/apis-kv-fastdata.json"
    ),
  "apis/neardata": () =>
    import(
      /* webpackChunkName: "page-models-apis-neardata" */
      "@site/src/data/generatedFastnearPageModelChunks/apis-neardata.json"
    ),
  "apis/transactions": () =>
    import(
      /* webpackChunkName: "page-models-apis-transactions" */
      "@site/src/data/generatedFastnearPageModelChunks/apis-transactions.json"
    ),
  "apis/transfers": () =>
    import(
      /* webpackChunkName: "page-models-apis-transfers" */
      "@site/src/data/generatedFastnearPageModelChunks/apis-transfers.json"
    ),
};

const rawPageModelCache = new Map();
const localizedPageModelCache = new Map();
const localizedPageModelPromiseCache = new Map();
const pageModelChunkPromiseCache = new Map();

function getPageModelCacheKey(pageModelId, locale) {
  return `${locale}:${pageModelId}`;
}

function getPageModelChunkKey(pageModelId) {
  return pageModelChunkManifest[pageModelId] || null;
}

function getPageModelChunkFileName(chunkKey) {
  return `${chunkKey.replace(/\//g, "-")}.json`;
}

function normalizeJsonModule(moduleValue) {
  return moduleValue?.default || moduleValue || null;
}

function cacheChunkPageModels(pageModels) {
  if (!Array.isArray(pageModels)) {
    return;
  }

  pageModels.forEach((pageModel) => {
    if (pageModel?.pageModelId) {
      rawPageModelCache.set(pageModel.pageModelId, pageModel);
    }
  });
}

function getLocalizedPageModel(pageModelId, locale = "en") {
  const cacheKey = getPageModelCacheKey(pageModelId, locale);
  if (localizedPageModelCache.has(cacheKey)) {
    return localizedPageModelCache.get(cacheKey);
  }

  const rawPageModel = rawPageModelCache.get(pageModelId);
  if (!rawPageModel) {
    localizedPageModelCache.set(cacheKey, null);
    return null;
  }

  const localizedPageModel = localizePageModel(rawPageModel, locale);
  localizedPageModelCache.set(cacheKey, localizedPageModel);
  return localizedPageModel;
}

function loadServerPageModelChunkSync(chunkKey) {
  if (typeof window !== "undefined" || !chunkKey) {
    return;
  }

  try {
    const dynamicRequire = Function("return require")();
    const fs = dynamicRequire("node:fs");
    const path = dynamicRequire("node:path");
    const chunkPath = path.join(
      process.cwd(),
      "src",
      "data",
      "generatedFastnearPageModelChunks",
      getPageModelChunkFileName(chunkKey)
    );

    if (!fs.existsSync(chunkPath)) {
      return;
    }

    cacheChunkPageModels(JSON.parse(fs.readFileSync(chunkPath, "utf8")));
  } catch (error) {
    console.error(`Unable to read page-model chunk ${chunkKey}:`, error);
  }
}

function readFastnearPageModelById(pageModelId, locale = "en") {
  const cacheKey = getPageModelCacheKey(pageModelId, locale);
  if (localizedPageModelCache.has(cacheKey)) {
    return localizedPageModelCache.get(cacheKey);
  }

  const chunkKey = getPageModelChunkKey(pageModelId);
  if (!chunkKey) {
    localizedPageModelCache.set(cacheKey, null);
    return null;
  }

  if (!rawPageModelCache.has(pageModelId)) {
    loadServerPageModelChunkSync(chunkKey);
  }

  return getLocalizedPageModel(pageModelId, locale);
}

function loadPageModelChunk(chunkKey) {
  if (!chunkKey) {
    return Promise.resolve(null);
  }

  if (pageModelChunkPromiseCache.has(chunkKey)) {
    return pageModelChunkPromiseCache.get(chunkKey);
  }

  const loader = PAGE_MODEL_CHUNK_LOADERS[chunkKey];
  if (!loader) {
    return Promise.resolve(null);
  }

  const chunkPromise = loader()
    .then((moduleValue) => {
      const pageModels = normalizeJsonModule(moduleValue);
      cacheChunkPageModels(pageModels);
      return pageModels;
    })
    .catch((error) => {
      console.error(`Unable to load page-model chunk ${chunkKey}:`, error);
      return null;
    });

  pageModelChunkPromiseCache.set(chunkKey, chunkPromise);
  return chunkPromise;
}

export function loadFastnearPageModelById(pageModelId, locale = "en") {
  const cacheKey = getPageModelCacheKey(pageModelId, locale);
  if (localizedPageModelCache.has(cacheKey)) {
    return Promise.resolve(localizedPageModelCache.get(cacheKey));
  }

  if (localizedPageModelPromiseCache.has(cacheKey)) {
    return localizedPageModelPromiseCache.get(cacheKey);
  }

  if (typeof window === "undefined") {
    return Promise.resolve(readFastnearPageModelById(pageModelId, locale));
  }

  const chunkKey = getPageModelChunkKey(pageModelId);
  const pageModelPromise = loadPageModelChunk(chunkKey).then(() =>
    getLocalizedPageModel(pageModelId, locale)
  );

  localizedPageModelPromiseCache.set(cacheKey, pageModelPromise);
  return pageModelPromise;
}

export function useFastnearPageModelById(pageModelId, locale = "en") {
  if (typeof window === "undefined") {
    return readFastnearPageModelById(pageModelId, locale);
  }

  return use(loadFastnearPageModelById(pageModelId, locale));
}

export function invalidateFastnearPageModelCache(pageModelId) {
  if (!pageModelId) {
    return;
  }

  SUPPORTED_LOCALES.forEach((locale) => {
    const cacheKey = getPageModelCacheKey(pageModelId, locale);
    localizedPageModelCache.delete(cacheKey);
    localizedPageModelPromiseCache.delete(cacheKey);
  });

  rawPageModelCache.delete(pageModelId);

  const chunkKey = getPageModelChunkKey(pageModelId);
  if (chunkKey) {
    pageModelChunkPromiseCache.delete(chunkKey);
  }
}

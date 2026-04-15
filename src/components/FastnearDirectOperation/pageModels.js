import generatedPageModels from "@site/src/data/generatedFastnearPageModels.json";

import { localizePageModel } from '@site/src/utils/fastnearLocalization';

const pageModelsById = Object.fromEntries(
  generatedPageModels.map((pageModel) => [pageModel.pageModelId, pageModel])
);

const localizedPageModelCache = new Map();

export function getFastnearPageModelById(pageModelId, locale = 'en') {
  const cacheKey = `${locale}:${pageModelId}`;
  if (!localizedPageModelCache.has(cacheKey)) {
    localizedPageModelCache.set(
      cacheKey,
      localizePageModel(pageModelsById[pageModelId], locale)
    );
  }

  return localizedPageModelCache.get(cacheKey);
}

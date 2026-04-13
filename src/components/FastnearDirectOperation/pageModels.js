import generatedPageModels from "@site/src/data/generatedFastnearPageModels.json";

const pageModelsById = Object.fromEntries(
  generatedPageModels.map((pageModel) => [pageModel.pageModelId, pageModel])
);

export function getFastnearPageModelById(pageModelId) {
  return pageModelsById[pageModelId];
}

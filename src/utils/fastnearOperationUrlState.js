const OPERATION_QUERY_PARAMS = Object.freeze({
  apiKey: "apiKey",
  colorSchema: "colorSchema",
  network: "network",
  requestExample: "requestExample",
  requestFinality: "requestFinality",
  token: "token",
});

const SECRET_QUERY_PARAM_PATTERNS = Object.freeze([
  /^apiKey$/i,
  /^token$/i,
  /^header\./i,
]);

const SHAREABLE_COLOR_SCHEMA_VALUES = new Set(["dark", "light"]);

function isSecretQueryParam(key) {
  return SECRET_QUERY_PARAM_PATTERNS.some((pattern) => pattern.test(key));
}

function getOperationRequestedNetworkKey(searchParams) {
  return searchParams.get(OPERATION_QUERY_PARAMS.network);
}

function getOperationRequestedExampleId(searchParams) {
  return searchParams.get(OPERATION_QUERY_PARAMS.requestExample);
}

function getOperationRequestedFinality(searchParams) {
  return searchParams.get(OPERATION_QUERY_PARAMS.requestFinality);
}

function collectOperationFieldPrefills(pageModel, searchParams) {
  return Object.fromEntries(
    (pageModel?.interaction?.fields || []).flatMap((field) => {
      const value = searchParams.get(field.name);
      return value === null ? [] : [[field.name, value]];
    })
  );
}

function getShareableOperationWrapperQueryEntries(searchParams) {
  const colorSchema = searchParams.get(OPERATION_QUERY_PARAMS.colorSchema);
  if (!SHAREABLE_COLOR_SCHEMA_VALUES.has(colorSchema)) {
    return [];
  }

  return [[OPERATION_QUERY_PARAMS.colorSchema, colorSchema]];
}

module.exports = {
  OPERATION_QUERY_PARAMS,
  SECRET_QUERY_PARAM_PATTERNS,
  collectOperationFieldPrefills,
  getOperationRequestedExampleId,
  getOperationRequestedFinality,
  getOperationRequestedNetworkKey,
  getShareableOperationWrapperQueryEntries,
  isSecretQueryParam,
};

const OPERATION_QUERY_PARAMS = Object.freeze({
  apiKey: "apiKey",
  colorSchema: "colorSchema",
  network: "network",
  responseFind: "responseFind",
  responseView: "responseView",
  requestExample: "requestExample",
  requestFinality: "requestFinality",
  token: "token",
});

const PRIVILEGED_OPERATION_QUERY_PARAMS = Object.freeze({
  // Reserved for future account-linked docs capabilities. Intentionally inactive
  // until docs auth can validate linked-account entitlements.
  useArchival: "useArchival",
});

const EXPANDED_RESPONSE_VIEW = "expanded";
const RESERVED_OPERATION_QUERY_PARAM_KEYS = new Set([
  ...Object.values(OPERATION_QUERY_PARAMS),
  ...Object.values(PRIVILEGED_OPERATION_QUERY_PARAMS),
]);
const PRIVILEGED_OPERATION_QUERY_PARAM_KEYS = new Set(
  Object.values(PRIVILEGED_OPERATION_QUERY_PARAMS)
);

const SECRET_QUERY_PARAM_PATTERNS = Object.freeze([
  /^apiKey$/i,
  /^token$/i,
  /^header\./i,
]);

const SHAREABLE_COLOR_SCHEMA_VALUES = new Set(["dark", "light"]);

function isSecretQueryParam(key) {
  return SECRET_QUERY_PARAM_PATTERNS.some((pattern) => pattern.test(key));
}

function isPrivilegedOperationQueryParam(key) {
  return PRIVILEGED_OPERATION_QUERY_PARAM_KEYS.has(key);
}

function isReservedOperationQueryParam(key) {
  return RESERVED_OPERATION_QUERY_PARAM_KEYS.has(key);
}

function isNonShareableOperationQueryParam(key) {
  return isSecretQueryParam(key) || isPrivilegedOperationQueryParam(key);
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

function getOperationRequestedResponseView(searchParams) {
  const value = searchParams.get(OPERATION_QUERY_PARAMS.responseView)?.trim().toLowerCase();
  return value === EXPANDED_RESPONSE_VIEW ? EXPANDED_RESPONSE_VIEW : "";
}

function getOperationRequestedResponseFind(searchParams) {
  return searchParams.get(OPERATION_QUERY_PARAMS.responseFind)?.trim() || "";
}

function setOperationRequestedResponseState(searchParams, { isExpanded = false, responseFind = "" }) {
  const trimmedFind = responseFind.trim();
  if (isExpanded || trimmedFind) {
    searchParams.set(OPERATION_QUERY_PARAMS.responseView, EXPANDED_RESPONSE_VIEW);
  } else {
    searchParams.delete(OPERATION_QUERY_PARAMS.responseView);
  }

  if (trimmedFind) {
    searchParams.set(OPERATION_QUERY_PARAMS.responseFind, trimmedFind);
    return;
  }

  searchParams.delete(OPERATION_QUERY_PARAMS.responseFind);
}

function collectOperationFieldPrefills(pageModel, searchParams) {
  return Object.fromEntries(
    (pageModel?.interaction?.fields || []).flatMap((field) => {
      if (isReservedOperationQueryParam(field.name)) {
        return [];
      }

      const value = searchParams.get(field.name);
      return value === null ? [] : [[field.name, value]];
    })
  );
}

function hasRecognizedOperationQueryState(pageModel, searchParams) {
  if (
    searchParams.has(OPERATION_QUERY_PARAMS.network) ||
    searchParams.has(OPERATION_QUERY_PARAMS.requestExample) ||
    searchParams.has(OPERATION_QUERY_PARAMS.requestFinality) ||
    getOperationRequestedResponseView(searchParams) ||
    getOperationRequestedResponseFind(searchParams)
  ) {
    return true;
  }

  return Object.keys(collectOperationFieldPrefills(pageModel, searchParams)).length > 0;
}

function operationAllowsAutorun(pageModel) {
  return pageModel?.interaction?.autoruns !== false;
}

function shouldAutorunOperationOnLoad(pageModel, searchParams) {
  if (!operationAllowsAutorun(pageModel)) {
    return false;
  }

  return hasRecognizedOperationQueryState(pageModel, searchParams);
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
  PRIVILEGED_OPERATION_QUERY_PARAMS,
  SECRET_QUERY_PARAM_PATTERNS,
  collectOperationFieldPrefills,
  getOperationRequestedExampleId,
  getOperationRequestedFinality,
  getOperationRequestedNetworkKey,
  getOperationRequestedResponseFind,
  getOperationRequestedResponseView,
  getShareableOperationWrapperQueryEntries,
  hasRecognizedOperationQueryState,
  isNonShareableOperationQueryParam,
  isPrivilegedOperationQueryParam,
  isReservedOperationQueryParam,
  isSecretQueryParam,
  setOperationRequestedResponseState,
  shouldAutorunOperationOnLoad,
};

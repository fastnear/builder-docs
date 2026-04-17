import React, {
  Suspense,
  lazy,
  startTransition,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import Head from "@docusaurus/Head";
import { translate } from "@docusaurus/Translate";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";

import PageActions from "@site/src/components/PageActions";
import { copyTextToClipboard } from "@site/src/utils/clipboard";
import {
  fieldSupportsType,
  isBooleanField,
  isMultilineField,
  parseFieldValue,
} from "@site/src/utils/fastnearFieldValueCodec";
import {
  OPERATION_QUERY_PARAMS,
  collectOperationFieldPrefills,
  getOperationRequestedExampleId,
  getOperationRequestedFinality,
  getOperationRequestedNetworkKey,
  getOperationRequestedResponseFind,
  getOperationRequestedResponseView,
  getShareableOperationWrapperQueryEntries,
  setOperationRequestedResponseState,
  shouldAutorunOperationOnLoad,
} from "@site/src/utils/fastnearOperationUrlState";
import {
  buildOperationSelectionState,
  getDefaultFieldValue,
  pickInitialExample,
} from "@site/src/utils/fastnearOperationSelection";
import {
  buildOperationMarkdown,
  sanitizePublicUrl,
} from "@site/src/utils/markdownExport";
import { buildOperationKeywords, getOperationSemanticMeta } from "@site/src/utils/seo";
import { FINALITY_OPTIONS } from "./finalityOptions";
import { useFastnearPageModelById } from "./pageModels";
import {
  clearPortalApiKey,
  setPortalApiKey,
  usePortalAuth,
} from "./portalAuth";
import {
  getFastnearApiKeyStatusText,
  getFastnearAuthSummaryText,
  getFastnearFieldLocationLabel,
  getFastnearMissingFieldError,
  getFastnearOperationUiText,
  getFastnearRequestSummary,
  getFastnearSchemaOptionLabel,
  getFastnearSchemaShapeLabel,
} from "./uiText";

const FastnearJsonResponseText = lazy(() => import("./FastnearJsonResponseText"));

function CopyGlyph(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2m-6 12h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"
      />
    </svg>
  );
}

function CheckGlyph(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function ExpandGlyph(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 4H4v4m0-4 6 6m10-6h-4m4 0v4m0-4-6 6M4 16v4h4m-4 0 6-6m10 6h-4m4 0v-4m0 4-6-6"
      />
    </svg>
  );
}

function CloseGlyph(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 6l12 12M18 6 6 18"
      />
    </svg>
  );
}

function ExternalLinkGlyph(props) {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 5h5m0 0v5m0-5L10 14"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 7H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"
      />
    </svg>
  );
}

function escapeShellSingleQuotes(value) {
  return value.replace(/'/g, `'\"'\"'`);
}

function stringifyCurlHeader(name, value) {
  return `-H '${escapeShellSingleQuotes(`${name}: ${value}`)}'`;
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}

function renderInlineCodeText(text) {
  if (!text) {
    return null;
  }

  return text.split(/(`[^`]+`)/g).map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`") && segment.length >= 2) {
      return <code key={`code-${index}`}>{segment.slice(1, -1)}</code>;
    }

    return <React.Fragment key={`text-${index}`}>{segment}</React.Fragment>;
  });
}

function cloneJsonValue(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function getResolvedSearchParams(search) {
  if (search instanceof URLSearchParams) {
    return search;
  }

  if (typeof search === "string") {
    return new URLSearchParams(search);
  }

  if (typeof window !== "undefined") {
    return new URLSearchParams(window.location.search);
  }

  return new URLSearchParams();
}

function getInitialNetwork(pageModel, search) {
  const resolvedSearch = getResolvedSearchParams(search);
  const requestedNetwork = getOperationRequestedNetworkKey(resolvedSearch);
  const matched = pageModel.interaction.networks.find((network) => network.key === requestedNetwork);
  return matched?.key || pageModel.interaction.networks[0]?.key || "mainnet";
}

function getRequestedExample(pageModel, search) {
  const resolvedSearch = getResolvedSearchParams(search);
  const requestedExampleId = getOperationRequestedExampleId(resolvedSearch);
  if (!requestedExampleId) {
    return null;
  }

  return pageModel.request.examples.find((example) => example.id === requestedExampleId) || null;
}

function getInitialFinality(pageModel, search) {
  if (!pageModel.interaction.supportsFinality) {
    return "final";
  }

  const resolvedSearch = getResolvedSearchParams(search);
  const requestedFinality = getOperationRequestedFinality(resolvedSearch);
  const matchedFinality = FINALITY_OPTIONS.find((option) => option.value === requestedFinality);
  return matchedFinality?.value || "final";
}

function getUrlFieldPrefills(pageModel, search) {
  return collectOperationFieldPrefills(pageModel, getResolvedSearchParams(search));
}

function buildInitialOperationState(pageModel, search) {
  const resolvedSearch = getResolvedSearchParams(search);
  const requestedExample = getRequestedExample(pageModel, resolvedSearch);
  const selectedNetwork = requestedExample?.network || getInitialNetwork(pageModel, resolvedSearch);
  const selectedExample = requestedExample || pickInitialExample(pageModel, selectedNetwork);
  const urlFieldPrefills = getUrlFieldPrefills(pageModel, resolvedSearch);
  const requestedResponseState = getRequestedResponseState(resolvedSearch);
  const selectionState = buildOperationSelectionState(
    pageModel,
    selectedNetwork,
    selectedExample,
    urlFieldPrefills
  );

  return {
    ...selectionState,
    protectedFieldNames: new Set(Object.keys(urlFieldPrefills)),
    responseFind: requestedResponseState.responseFind,
    shouldOpenResponseModal: requestedResponseState.isExpanded,
    shouldAutorun: shouldAutorunOperationOnLoad(pageModel, resolvedSearch),
    selectedFinality: getInitialFinality(pageModel, resolvedSearch),
    selectedNetwork,
  };
}

const RUNTIME_FIELD_BINDINGS = {
  "rpc-block-by-height":               [{ field: "block_id", source: "latest_block_height" }],
  "rpc-block-by-id":                   [{ field: "block_id", source: "latest_block_hash" }],
  "rpc-block-effects":                 [{ field: "block_id", source: "latest_block_height" }],
  "rpc-EXPERIMENTAL-congestion-level": [{ field: "block_id", source: "latest_block_height" }],
  "rpc-chunk-by-block-shard":          [{ field: "block_id", source: "latest_block_height" }],
  "rpc-chunk-by-hash":                 [{ field: "chunk_id", source: "latest_chunk_hash" }],
  "rpc-tx-status": [
    { field: "tx_hash", source: "latest_tx_hash" },
    { field: "sender_account_id", source: "latest_tx_signer_id" },
  ],
  "rpc-EXPERIMENTAL-tx-status": [
    { field: "tx_hash", source: "latest_tx_hash" },
    { field: "sender_account_id", source: "latest_tx_signer_id" },
  ],
  "rpc-EXPERIMENTAL-receipt": [{ field: "receipt_id", source: "latest_receipt_id" }],
  "rpc-light-client-proof": [
    { field: "transaction_hash", source: "latest_tx_hash" },
    { field: "sender_id", source: "latest_tx_signer_id" },
    { field: "light_client_head", source: "latest_block_hash" },
  ],
  "rpc-EXPERIMENTAL-light-client-proof": [
    { field: "transaction_hash", source: "latest_tx_hash" },
    { field: "sender_id", source: "latest_tx_signer_id" },
    { field: "light_client_head", source: "latest_block_hash" },
  ],
};

async function jsonRpcCall(baseUrl, method, params, signal) {
  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: "fastnear-docs", method, params }),
      signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.result ?? null;
  } catch {
    return null;
  }
}

async function fetchStatusSummary(baseUrl, signal) {
  const normalizedUrl = baseUrl.replace(/\/+$/, "");
  try {
    const response = await fetch(`${normalizedUrl}/status`, {
      headers: { Accept: "application/json" },
      signal,
    });
    if (response.ok) {
      const payload = await response.json();
      const height = Number(payload?.sync_info?.latest_block_height ?? payload?.latest_block_height);
      const hash = payload?.sync_info?.latest_block_hash ?? payload?.latest_block_hash;
      if (Number.isFinite(height)) return { latest_block_height: height, latest_block_hash: hash };
    }
  } catch {}

  const rpcStatus = await jsonRpcCall(normalizedUrl, "status", [], signal);
  const height = Number(rpcStatus?.sync_info?.latest_block_height);
  if (Number.isFinite(height)) {
    return {
      latest_block_height: height,
      latest_block_hash: rpcStatus?.sync_info?.latest_block_hash,
    };
  }
  return null;
}

async function fetchRuntimeExampleValues(baseUrl, signal) {
  const normalizedUrl = baseUrl.replace(/\/+$/, "");
  const values = {};
  const status = await fetchStatusSummary(normalizedUrl, signal);
  if (!status) return values;
  values.latest_block_height = status.latest_block_height;
  if (status.latest_block_hash) values.latest_block_hash = status.latest_block_hash;

  const block = await jsonRpcCall(
    normalizedUrl,
    "block",
    { block_id: status.latest_block_height },
    signal
  );
  const interestingChunk = block?.chunks?.find(
    (c) => c.tx_root && c.tx_root !== "11111111111111111111111111111111"
  );
  if (interestingChunk?.chunk_hash) {
    values.latest_chunk_hash = interestingChunk.chunk_hash;
    const chunk = await jsonRpcCall(
      normalizedUrl,
      "chunk",
      { chunk_id: interestingChunk.chunk_hash },
      signal
    );
    const tx = chunk?.transactions?.[0];
    if (tx?.hash) {
      values.latest_tx_hash = tx.hash;
      if (tx.signer_id) values.latest_tx_signer_id = tx.signer_id;
    }
    const receipt = chunk?.receipts?.[0];
    if (receipt?.receipt_id) values.latest_receipt_id = receipt.receipt_id;
  }
  return values;
}

function waitForNextPaint() {
  if (typeof window === "undefined" || typeof window.requestAnimationFrame !== "function") {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function getFieldLocationLabel(field) {
  return getFastnearFieldLocationLabel(field);
}

function getEnumOptions(field) {
  const enumValues = Array.isArray(field.schema?.enum) ? field.schema.enum : [];
  return enumValues.map((value) => String(value));
}

function formatChoiceLabel(value) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildRpcPayload(pageModel, fieldValues, finality, requestTemplate) {
  const parsedFieldValues = Object.fromEntries(
    pageModel.interaction.fields
      .map((field) => {
        const rawValue = fieldValues[field.name] || "";
        if (!rawValue.trim()) {
          return undefined;
        }

        return [field.name, parseFieldValue(field, rawValue)];
      })
      .filter(Boolean)
  );

  const template =
    requestTemplate && typeof requestTemplate === "object" && !Array.isArray(requestTemplate)
      ? cloneJsonValue(requestTemplate)
      : {};
  const templateParams = template.params;

  if (Array.isArray(templateParams)) {
    return {
      ...template,
      jsonrpc: typeof template.jsonrpc === "string" ? template.jsonrpc : "2.0",
      id: template.id !== undefined ? template.id : pageModel.interaction.defaultId || "fastnear",
      method:
        typeof template.method === "string"
          ? template.method
          : pageModel.interaction.requestMethod || pageModel.info.operationId,
      params: cloneJsonValue(templateParams),
    };
  }

  const baseParams =
    templateParams && typeof templateParams === "object"
      ? cloneJsonValue(templateParams)
      : {};

  return {
    ...template,
    jsonrpc: typeof template.jsonrpc === "string" ? template.jsonrpc : "2.0",
    id: template.id !== undefined ? template.id : pageModel.interaction.defaultId || "fastnear",
    method:
      typeof template.method === "string"
        ? template.method
        : pageModel.interaction.requestMethod || pageModel.info.operationId,
    params: {
      ...baseParams,
      ...(pageModel.interaction.supportsFinality ? { finality } : {}),
      ...(pageModel.interaction.requestType ? { request_type: pageModel.interaction.requestType } : {}),
      ...parsedFieldValues,
    },
  };
}

function buildHttpRequestUrl(pageModel, network, fieldValues, auth) {
  const baseUrl = network?.url || "";
  const resolvedPath = Object.entries(fieldValues).reduce((currentPath, [fieldName, value]) => {
    const field = pageModel.interaction.fields.find((candidate) => candidate.name === fieldName);
    if (field?.location !== "path") {
      return currentPath;
    }

    return currentPath.replace(`{${fieldName}}`, encodeURIComponent(value.trim()));
  }, pageModel.route.path);

  const requestUrl = new URL(resolvedPath, baseUrl);
  for (const field of pageModel.interaction.fields) {
    if (field.location !== "query") {
      continue;
    }

    const value = fieldValues[field.name]?.trim();
    if (value) {
      requestUrl.searchParams.set(field.name, value);
    }
  }

  if (pageModel.interaction.authTransport === "query" && auth.apiKey) {
    requestUrl.searchParams.set("apiKey", auth.apiKey);
  }

  return requestUrl;
}

function buildHttpRequestBody(pageModel, fieldValues) {
  const bodyEntries = pageModel.interaction.fields
    .filter((field) => field.location === "body")
    .map((field) => {
      const rawValue = fieldValues[field.name] || "";
      const trimmedValue = rawValue.trim();
      if (!trimmedValue) {
        return undefined;
      }

      return [field.name, parseFieldValue(field, rawValue)];
    })
    .filter(Boolean);

  if (bodyEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(bodyEntries);
}

function getApiKeyStatus(auth) {
  return getFastnearApiKeyStatusText(auth);
}

function getAuthSummary(pageModel, auth) {
  return getFastnearAuthSummaryText(pageModel, auth);
}

function getSchemaTypeLabel(schema, uiText = getFastnearOperationUiText()) {
  if (!schema) {
    return uiText.unknown;
  }

  if (schema.oneOf?.length) {
    return uiText.oneOf;
  }

  if (schema.anyOf?.length) {
    return uiText.anyOf;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.join(" | ");
  }

  if (schema.type) {
    return schema.type;
  }

  if (schema.properties?.length) {
    return uiText.object;
  }

  if (schema.items) {
    return uiText.array;
  }

  return uiText.value;
}

function buildExamplePath(pathTemplate, pathValues) {
  return Object.entries(pathValues || {}).reduce((currentPath, [key, value]) => {
    return currentPath.replace(`{${key}}`, encodeURIComponent(String(value)));
  }, pathTemplate);
}

function buildExampleSearch(queryValues) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(queryValues || {})) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    params.set(key, String(value));
  }

  const rendered = params.toString();
  return rendered ? `?${rendered}` : "";
}

function buildHttpExample(pageModel, example) {
  const request = example?.request || {};
  const pathValues = request.path || {};
  const queryValues = request.query || {};
  const renderedPath = buildExamplePath(pageModel.route.path, pathValues);
  const renderedSearch = buildExampleSearch(queryValues);
  return `${pageModel.route.method} ${renderedPath}${renderedSearch}`;
}

function buildOperationExampleUrl(
  pageModel,
  currentHref,
  selectedNetwork,
  selectedExampleId,
  selectedFinality,
  fieldValues,
  options = {}
) {
  if (!currentHref) {
    return "";
  }

  let currentUrl;
  try {
    currentUrl = new URL(
      currentHref,
      typeof window !== "undefined" ? window.location.origin : "https://docs.fastnear.com"
    );
  } catch (_error) {
    return "";
  }

  const nextUrl = new URL(currentUrl.pathname, currentUrl.origin);
  const currentSearch = new URLSearchParams(currentUrl.search);
  for (const [key, value] of getShareableOperationWrapperQueryEntries(currentSearch)) {
    nextUrl.searchParams.set(key, value);
  }

  if (selectedNetwork) {
    nextUrl.searchParams.set(OPERATION_QUERY_PARAMS.network, selectedNetwork);
  }

  setOperationRequestedResponseState(nextUrl.searchParams, {
    isExpanded: Boolean(options.isResponseExpanded),
    responseFind: options.responseFind || "",
  });

  const defaultExampleId = pickInitialExample(pageModel, selectedNetwork)?.id || "";
  if (selectedExampleId && selectedExampleId !== defaultExampleId) {
    nextUrl.searchParams.set(OPERATION_QUERY_PARAMS.requestExample, selectedExampleId);
  }

  if (pageModel.interaction.supportsFinality && selectedFinality) {
    nextUrl.searchParams.set(OPERATION_QUERY_PARAMS.requestFinality, selectedFinality);
  }

  for (const field of pageModel.interaction.fields) {
    const value = fieldValues[field.name]?.trim();
    if (!value) {
      continue;
    }

    nextUrl.searchParams.set(field.name, value);
  }

  return sanitizePublicUrl(nextUrl.toString());
}

function hasHttpRequestBody(pageModel) {
  return pageModel.route.transport === "http" && Boolean(pageModel.request.bodySchema);
}

function formatNetworkTabLabel(network) {
  return network.charAt(0).toUpperCase() + network.slice(1);
}

function shouldUseNetworkTabLabels(requestExamples) {
  const networkExamples = requestExamples.filter((example) => example.network);
  return (
    requestExamples.length > 0 &&
    networkExamples.length === requestExamples.length &&
    new Set(networkExamples.map((example) => example.network)).size === requestExamples.length
  );
}

function getExampleTabLabel(requestExamples, example) {
  if (example.network && shouldUseNetworkTabLabels(requestExamples)) {
    return formatNetworkTabLabel(example.network);
  }

  return example.label;
}

function getOperationCanonicalTarget(pageModel) {
  if (!pageModel) {
    return "";
  }

  const operationId = pageModel.info?.operationId || "";
  if (pageModel.route?.transport === "json-rpc") {
    const requestMethod = pageModel.interaction?.requestMethod || "";
    const requestType = pageModel.interaction?.requestType || "";
    if (requestMethod && requestType) {
      return `${requestMethod} · request_type=${requestType}`;
    }

    return operationId;
  }

  const routeMethod = pageModel.route?.method || "";
  const routePath = pageModel.route?.path || "";
  if (routeMethod && routePath) {
    return `${routeMethod} ${routePath}`;
  }

  return operationId;
}

function getOperationDocsearchMeta(pageModel) {
  if (!pageModel) {
    return {
      canonicalTarget: "",
      operationId: "",
      transport: "",
    };
  }

  return {
    canonicalTarget: getOperationCanonicalTarget(pageModel),
    operationId: pageModel.info?.operationId || "",
    transport: pageModel.route?.transport || "",
  };
}

function getRunResultText(runResult) {
  if (!runResult) {
    return "";
  }

  return runResult.kind === "json" ? formatJson(runResult.value) : runResult.value;
}

function getRequestedResponseState(search) {
  const resolvedSearch = getResolvedSearchParams(search);
  const responseFind = getOperationRequestedResponseFind(resolvedSearch);
  return {
    isExpanded: Boolean(getOperationRequestedResponseView(resolvedSearch) || responseFind),
    responseFind,
  };
}

const LARGE_RESPONSE_HIGHLIGHT_TEXT_THRESHOLD = 120000;
const LARGE_RESPONSE_HIGHLIGHT_MATCH_THRESHOLD = 200;

function findResponseMatches(normalizedText, searchTerm) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  if (!normalizedText || !normalizedSearchTerm) {
    return [];
  }

  const matches = [];
  let cursor = 0;

  while (cursor < normalizedText.length) {
    const start = normalizedText.indexOf(normalizedSearchTerm, cursor);
    if (start === -1) {
      break;
    }

    matches.push({
      start,
      end: start + normalizedSearchTerm.length,
    });
    cursor = start + normalizedSearchTerm.length;
  }

  return matches;
}

function shouldUseActiveOnlyResponseHighlight(text, matches) {
  return (
    text.length > LARGE_RESPONSE_HIGHLIGHT_TEXT_THRESHOLD ||
    matches.length > LARGE_RESPONSE_HIGHLIGHT_MATCH_THRESHOLD
  );
}

function getResponseFindResultsLabel(uiText, searchTerm, matches, activeMatchIndex) {
  if (!searchTerm.trim()) {
    return "";
  }

  if (!matches.length) {
    return uiText.responseFindNoResults;
  }

  const normalizedIndex =
    activeMatchIndex >= 0 && activeMatchIndex < matches.length ? activeMatchIndex : 0;

  return uiText.responseFindResults({
    active: normalizedIndex + 1,
    total: matches.length,
  });
}

function scrollResponseMatchIntoView(activeMatchElement) {
  if (!activeMatchElement) {
    return;
  }

  const scrollContainer = activeMatchElement.closest("[data-fastnear-response-scroll-container]");
  if (!scrollContainer) {
    activeMatchElement.scrollIntoView({
      block: "center",
      inline: "nearest",
    });
    return;
  }

  const containerRect = scrollContainer.getBoundingClientRect();
  const matchRect = activeMatchElement.getBoundingClientRect();
  const nextTop =
    scrollContainer.scrollTop +
    (matchRect.top - containerRect.top) -
    scrollContainer.clientHeight / 2 +
    matchRect.height / 2;

  scrollContainer.scrollTo({
    top: Math.max(0, nextTop),
    behavior: "auto",
  });
}

function FastnearOperationResponseText({
  text,
  matches = [],
  activeMatchIndex = -1,
  activeMatchOnly = false,
  className = "",
}) {
  const activeMatchRefs = useRef([]);
  const renderedMatches = useMemo(() => {
    if (!matches.length) {
      return [];
    }

    if (activeMatchOnly) {
      if (activeMatchIndex < 0 || activeMatchIndex >= matches.length) {
        return [];
      }

      return [{ ...matches[activeMatchIndex], matchIndex: activeMatchIndex }];
    }

    return matches.map((match, index) => ({
      ...match,
      matchIndex: index,
    }));
  }, [activeMatchIndex, activeMatchOnly, matches]);

  useEffect(() => {
    if (activeMatchIndex < 0 || activeMatchIndex >= matches.length) {
      return;
    }

    scrollResponseMatchIntoView(activeMatchRefs.current[activeMatchIndex]);
  }, [activeMatchIndex, matches.length]);

  if (!renderedMatches.length) {
    return <pre className={className}>{text}</pre>;
  }

  const children = [];
  let cursor = 0;

  renderedMatches.forEach((match) => {
    if (match.start > cursor) {
      children.push(
        <React.Fragment key={`response-text-${cursor}`}>
          {text.slice(cursor, match.start)}
        </React.Fragment>
      );
    }

    const isActive = match.matchIndex === activeMatchIndex;
    children.push(
      <mark
        key={`response-match-${match.start}-${match.end}`}
        ref={(element) => {
          activeMatchRefs.current[match.matchIndex] = element;
        }}
        className={`fastnear-interaction__response-match ${
          isActive ? "is-active" : ""
        }`}
        data-fastnear-response-match-index={match.matchIndex}
        data-fastnear-response-match-active={isActive ? "true" : "false"}
      >
        {text.slice(match.start, match.end)}
      </mark>
    );
    cursor = match.end;
  });

  if (cursor < text.length) {
    children.push(
      <React.Fragment key={`response-text-${cursor}`}>
        {text.slice(cursor)}
      </React.Fragment>
    );
  }

  return <pre className={className}>{children}</pre>;
}

function isInlineSchemaVariant(schema) {
  if (!schema) {
    return false;
  }

  return !schema.properties?.length &&
    !schema.items &&
    !schema.additionalProperties &&
    !schema.oneOf?.length &&
    !schema.anyOf?.length &&
    !schema.description &&
    schema.default === undefined &&
    schema.example === undefined;
}

function getSchemaVariantLabel(schema, fallbackLabel, uiText = getFastnearOperationUiText()) {
  if (!schema) {
    return fallbackLabel;
  }

  if (schema.refName) {
    return schema.refName;
  }

  if (Array.isArray(schema.enum) && schema.enum.length === 1) {
    return String(schema.enum[0]);
  }

  const typeLabel = getSchemaTypeLabel(schema, uiText);
  if (schema.nullable && typeLabel && !String(typeLabel).includes("null")) {
    return `${typeLabel} | null`;
  }

  return typeLabel || fallbackLabel;
}

function shouldInlineSchemaVariants(variants) {
  return Array.isArray(variants) && variants.length > 0 && variants.every(isInlineSchemaVariant);
}

function SchemaNode({ schema, name, depth = 0 }) {
  if (!schema) {
    return null;
  }

  const uiText = getFastnearOperationUiText();
  const typeLabel = getSchemaTypeLabel(schema, uiText);
  const enumValues = Array.isArray(schema.enum) ? schema.enum : [];
  const inlineOneOf = shouldInlineSchemaVariants(schema.oneOf);
  const inlineAnyOf = shouldInlineSchemaVariants(schema.anyOf);

  return (
    <div className="fastnear-reference-schema__node" data-depth={depth}>
      <div className="fastnear-reference-schema__header">
        <div className="fastnear-reference-schema__headline">
          {name ? <code className="fastnear-reference-schema__name">{name}</code> : null}
          <span className="fastnear-reference-schema__type">{typeLabel}</span>
          {schema.nullable ? (
            <span className="fastnear-reference-schema__flag">
              {uiText.nullable}
            </span>
          ) : null}
          {schema.refName ? (
            <span className="fastnear-reference-schema__flag">{schema.refName}</span>
          ) : null}
        </div>
        {schema.required?.length ? (
          <span className="fastnear-reference-schema__hint">
            {uiText.fieldRequirements} {schema.required.join(", ")}
          </span>
        ) : null}
      </div>

      {schema.description ? (
        <p className="fastnear-reference-schema__description" data-fastnear-content="schema-description">
          {renderInlineCodeText(schema.description)}
        </p>
      ) : null}

      {enumValues.length > 0 ? (
        <div className="fastnear-reference-schema__enum-list">
          {enumValues.map((value) => (
            <code key={String(value)}>{String(value)}</code>
          ))}
        </div>
      ) : null}

      {schema.default !== undefined ? (
        <p className="fastnear-reference-schema__meta">
          {uiText.default}: <code>{String(schema.default)}</code>
        </p>
      ) : null}

      {schema.example !== undefined ? (
        <p className="fastnear-reference-schema__meta">
          {uiText.example}: <code>{String(schema.example)}</code>
        </p>
      ) : null}

      {inlineOneOf ? (
        <div className="fastnear-reference-schema__inline-variants">
          {schema.oneOf.map((variant, index) => (
            <span
              className="fastnear-reference-schema__inline-variant"
              key={`${name || "variant"}-oneof-inline-${index}`}
            >
              {getSchemaVariantLabel(variant, getFastnearSchemaOptionLabel(index + 1), uiText)}
            </span>
          ))}
        </div>
      ) : null}

      {!inlineOneOf && schema.oneOf?.length ? (
        <div className="fastnear-reference-schema__variants">
          {schema.oneOf.map((variant, index) => (
            <div
              className="fastnear-reference-schema__variant"
              key={`${name || "variant"}-oneof-${index}`}
            >
              <span className="fastnear-reference-schema__variant-label">
                {getSchemaVariantLabel(variant, getFastnearSchemaOptionLabel(index + 1), uiText)}
              </span>
              <SchemaNode schema={variant} depth={depth + 1} />
            </div>
          ))}
        </div>
      ) : null}

      {inlineAnyOf ? (
        <div className="fastnear-reference-schema__inline-variants">
          {schema.anyOf.map((variant, index) => (
            <span
              className="fastnear-reference-schema__inline-variant"
              key={`${name || "variant"}-anyof-inline-${index}`}
            >
              {getSchemaVariantLabel(variant, getFastnearSchemaShapeLabel(index + 1), uiText)}
            </span>
          ))}
        </div>
      ) : null}

      {!inlineAnyOf && schema.anyOf?.length ? (
        <div className="fastnear-reference-schema__variants">
          {schema.anyOf.map((variant, index) => (
            <div
              className="fastnear-reference-schema__variant"
              key={`${name || "variant"}-anyof-${index}`}
            >
              <span className="fastnear-reference-schema__variant-label">
                {getSchemaVariantLabel(variant, getFastnearSchemaShapeLabel(index + 1), uiText)}
              </span>
              <SchemaNode schema={variant} depth={depth + 1} />
            </div>
          ))}
        </div>
      ) : null}

      {schema.items ? (
        <div className="fastnear-reference-schema__children">
          <SchemaNode schema={schema.items} name="items" depth={depth + 1} />
        </div>
      ) : null}

      {schema.properties?.length ? (
        <div className="fastnear-reference-schema__children">
          {schema.properties.map((property) => (
            <SchemaNode
              key={`${name || "root"}-${property.name}`}
              name={`${property.name}${property.required ? " *" : ""}`}
              schema={property.schema}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}

      {schema.additionalProperties && typeof schema.additionalProperties === "object" ? (
        <div className="fastnear-reference-schema__children">
          <SchemaNode
            name="additionalProperties"
            schema={schema.additionalProperties}
            depth={depth + 1}
          />
        </div>
      ) : null}
    </div>
  );
}

function ParameterGroup({ parameters, title }) {
  if (!parameters.length) {
    return null;
  }

  return (
    <div className="fastnear-reference__parameter-group">
      <h3>{title}</h3>
      <div className="fastnear-reference__schema-block fastnear-reference__schema-block--parameters">
        {parameters.map((parameter) => (
          <SchemaNode
            key={`${parameter.location}-${parameter.name}`}
            name={`${parameter.name}${parameter.required ? " *" : ""}`}
            schema={parameter.schema}
          />
        ))}
      </div>
    </div>
  );
}

function FastnearOperationReference({
  headingLevel = "h2",
  onExampleSelect,
  pageModel,
  selectedExampleId,
}) {
  const uiText = getFastnearOperationUiText();
  const requestExamples = pageModel.request.examples;
  const response = pageModel.responses[0];
  const firstExampleId = requestExamples[0]?.id || "";
  const [uncontrolledExampleId, setUncontrolledExampleId] = useState(firstExampleId);
  const activeExampleId = selectedExampleId ?? uncontrolledExampleId;
  const activeExample =
    requestExamples.find((example) => example.id === activeExampleId) || requestExamples[0];
  const HeadingTag = headingLevel;
  const headingId = useId();
  const httpHasBody = hasHttpRequestBody(pageModel);
  const usesNetworkTabLabels = shouldUseNetworkTabLabels(requestExamples);
  const requestSummary = useMemo(() => {
    return getFastnearRequestSummary(pageModel, httpHasBody);
  }, [httpHasBody, pageModel]);

  const handleExampleSelect = (exampleId) => {
    if (selectedExampleId === undefined) {
      setUncontrolledExampleId(exampleId);
    }

    onExampleSelect?.(exampleId);
  };

  return (
    <section
      className="fastnear-reference"
      aria-labelledby={headingId}
      data-fastnear-reference-root
    >
      <div className="fastnear-reference__grid">
        <div className="fastnear-reference__panel">
          <div className="fastnear-reference__heading-row">
            <HeadingTag id={headingId}>{uiText.requestReference}</HeadingTag>
            <span className="fastnear-reference__badge">
              {pageModel.request.mediaType || pageModel.route.method}
            </span>
          </div>

          {requestExamples.length > 0 ? (
            <div
              className={[
                "fastnear-reference__tabs",
                usesNetworkTabLabels ? "fastnear-reference__tabs--network" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-fastnear-crawler-skip
              role="tablist"
              aria-label={uiText.requestExamplesAriaLabel}
            >
              {requestExamples.map((example) => (
                <button
                  type="button"
                  key={example.id}
                  className={example.id === activeExample?.id ? "is-active" : ""}
                  onClick={() => handleExampleSelect(example.id)}
                >
                  {getExampleTabLabel(requestExamples, example)}
                </button>
              ))}
            </div>
          ) : null}

          <div
            className="fastnear-reference__summary"
            data-fastnear-content="request-summary"
            data-fastnear-crawler-skip
          >
            <p>{requestSummary}</p>
            <p>
              {uiText.requiredRequestInputs}{' '}
              <strong>{pageModel.request.required ? uiText.yes : uiText.no}</strong>
            </p>
          </div>

          {pageModel.route.transport === "json-rpc" ? (
            <>
              <pre className="fastnear-reference__code fastnear-reference__code--example">
                {formatJson(activeExample?.request?.body)}
              </pre>

              <div className="fastnear-reference__schema-block">
                <h3>{uiText.requestSchema}</h3>
                <SchemaNode schema={pageModel.request.bodySchema} />
              </div>
            </>
          ) : (
            <>
              <pre className="fastnear-reference__code fastnear-reference__code--request-line">
                {buildHttpExample(pageModel, activeExample)}
              </pre>

              {httpHasBody ? (
                <>
                  <pre className="fastnear-reference__code fastnear-reference__code--example">
                    {formatJson(activeExample?.request?.body || {})}
                  </pre>

                  <div className="fastnear-reference__schema-block">
                    <h3>{uiText.requestBodySchema}</h3>
                    <SchemaNode schema={pageModel.request.bodySchema} />
                  </div>
                </>
              ) : null}

              <ParameterGroup
                parameters={pageModel.request.parameters.path}
                title={uiText.pathParameters}
              />
              <ParameterGroup
                parameters={pageModel.request.parameters.query}
                title={uiText.queryParameters}
              />
              <ParameterGroup
                parameters={pageModel.request.parameters.header}
                title={uiText.headerParameters}
              />
            </>
          )}
        </div>

        <div className="fastnear-reference__panel">
          <div className="fastnear-reference__heading-row">
            <HeadingTag>{uiText.responseReference}</HeadingTag>
            <span className="fastnear-reference__badge">
              {response?.status} {response?.mediaType}
            </span>
          </div>

          <p
            className="fastnear-reference__response-description"
            data-fastnear-content="response-summary"
          >
            {renderInlineCodeText(response?.description)}
          </p>

          <div className="fastnear-reference__schema-block">
            <h3>{uiText.responseSchema}</h3>
            <SchemaNode schema={response?.schema} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FastnearOperationPage({ pageModel }) {
  const { i18n } = useDocusaurusContext();
  const currentLocale = i18n.currentLocale || "en";
  const uiText = getFastnearOperationUiText();
  const auth = usePortalAuth();
  const initialOperationState = useMemo(() => buildInitialOperationState(pageModel), [pageModel]);
  // URL-seeded fields are protected from one-time runtime hydration on first paint so a
  // shared link's explicit inputs do not get replaced by "helpful" live defaults.
  const protectedHydrationFieldsRef = useRef(initialOperationState.protectedFieldNames);
  const [selectedNetwork, setSelectedNetwork] = useState(initialOperationState.selectedNetwork);
  const [selectedExampleId, setSelectedExampleId] = useState(initialOperationState.selectedExampleId);
  const [selectedFinality, setSelectedFinality] = useState(initialOperationState.selectedFinality);
  const [fieldValues, setFieldValues] = useState(initialOperationState.fieldValues);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedExampleUrl, setCopiedExampleUrl] = useState(false);
  const [copiedViewUrl, setCopiedViewUrl] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [isExampleUrlHelpOpen, setIsExampleUrlHelpOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(
    initialOperationState.shouldOpenResponseModal
  );
  const [responseFindDraft, setResponseFindDraft] = useState(initialOperationState.responseFind);
  const [activeResponseFindIndex, setActiveResponseFindIndex] = useState(
    initialOperationState.responseFind ? 0 : -1
  );
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const autorunKeyRef = useRef(null);
  const exampleUrlHelpId = useId();
  const expandedResponseTitleId = useId();
  const responseFindInputRef = useRef(null);
  const inlineExpandResponseButtonRef = useRef(null);
  const selectedFinalityDetails =
    FINALITY_OPTIONS.find((option) => option.value === selectedFinality) || FINALITY_OPTIONS[2];
  const selectedNetworkDetails =
    pageModel.interaction.networks.find((network) => network.key === selectedNetwork) ||
    pageModel.interaction.networks[0];
  const selectedExample =
    pageModel.request.examples.find((example) => example.id === selectedExampleId) ||
    pageModel.request.examples.find((example) => example.network === selectedNetwork) ||
    pageModel.request.examples[0];

  useEffect(() => {
    setApiKeyDraft(auth.storedApiKey || "");
  }, [auth.storedApiKey]);

  useEffect(() => {
    protectedHydrationFieldsRef.current = initialOperationState.protectedFieldNames;
    autorunKeyRef.current = null;
    setSelectedNetwork(initialOperationState.selectedNetwork);
    setSelectedExampleId(initialOperationState.selectedExampleId);
    setSelectedFinality(initialOperationState.selectedFinality);
    setFieldValues(initialOperationState.fieldValues);
    setIsResponseModalOpen(initialOperationState.shouldOpenResponseModal);
    setResponseFindDraft(initialOperationState.responseFind);
    setActiveResponseFindIndex(initialOperationState.responseFind ? 0 : -1);
    setRunError(null);
    setRunResult(null);
    setCopiedExampleUrl(false);
    setCopiedViewUrl(false);
    setCopiedResponse(false);
    setIsExampleUrlHelpOpen(false);
  }, [initialOperationState]);

  useEffect(() => {
    const bindings = RUNTIME_FIELD_BINDINGS[pageModel.pageModelId];
    if (!bindings || !selectedNetworkDetails?.url) {
      return undefined;
    }

    const resolvedBindings = bindings
      .map((binding) => {
        const field = pageModel.interaction.fields.find((f) => f.name === binding.field);
        if (!field) return null;
        const expectedDefault = getDefaultFieldValue(pageModel, field, selectedNetwork).trim();
        return { ...binding, expectedDefault };
      })
      .filter(Boolean);
    if (resolvedBindings.length === 0) {
      return undefined;
    }

    const controller = new AbortController();
    void (async () => {
      const live = await fetchRuntimeExampleValues(selectedNetworkDetails.url, controller.signal);
      setFieldValues((currentValues) => {
        let next = currentValues;
        const protectedHydrationFields = protectedHydrationFieldsRef.current;
        for (const binding of resolvedBindings) {
          if (protectedHydrationFields.has(binding.field)) continue;
          const liveValue = live[binding.source];
          if (liveValue === undefined || liveValue === null || liveValue === "") continue;
          const currentValue = (currentValues[binding.field] || "").trim();
          if (currentValue && currentValue !== binding.expectedDefault) continue;
          if (next === currentValues) next = { ...currentValues };
          next[binding.field] = String(liveValue);
        }
        return next;
      });
    })();

    return () => controller.abort();
  }, [pageModel, selectedNetwork, selectedNetworkDetails]);

  useEffect(() => {
    if (!copiedCurl || typeof window === "undefined") {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopiedCurl(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copiedCurl]);

  useEffect(() => {
    if (!copiedExampleUrl || typeof window === "undefined") {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopiedExampleUrl(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copiedExampleUrl]);

  useEffect(() => {
    if (!copiedViewUrl || typeof window === "undefined") {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopiedViewUrl(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copiedViewUrl]);

  useEffect(() => {
    if (!copiedResponse || typeof window === "undefined") {
      return undefined;
    }

    const timeout = window.setTimeout(() => setCopiedResponse(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copiedResponse]);

  const trimmedFieldValues = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(fieldValues).map(([key, value]) => [key, value.trim()])
      ),
    [fieldValues]
  );
  const requestUrl =
    pageModel.route.transport === "http"
      ? buildHttpRequestUrl(pageModel, selectedNetworkDetails, trimmedFieldValues, auth)
      : undefined;
  const httpRequestBody =
    pageModel.route.transport === "http"
      ? buildHttpRequestBody(pageModel, fieldValues)
      : undefined;
  const rpcPayload =
    pageModel.route.transport === "json-rpc"
      ? buildRpcPayload(pageModel, trimmedFieldValues, selectedFinality, selectedExample?.request?.body)
      : undefined;
  const missingField = pageModel.interaction.fields.find(
    (field) => field.required && !trimmedFieldValues[field.name]
  );
  const canAutorun = initialOperationState.shouldAutorun && !missingField;
  const curlCommand = useMemo(() => {
    const lines = [];

    if (pageModel.route.transport === "json-rpc") {
      if (!selectedNetworkDetails?.url || !rpcPayload) {
        return "";
      }

      lines.push(`curl -s '${escapeShellSingleQuotes(selectedNetworkDetails.url)}'`);
      lines.push("  -X POST");
      lines.push(`  ${stringifyCurlHeader("Accept", "application/json")}`);
      lines.push(`  ${stringifyCurlHeader("Content-Type", "application/json")}`);
      if (pageModel.interaction.authTransport === "bearer" && auth.apiKey) {
        lines.push(`  ${stringifyCurlHeader("Authorization", `Bearer ${auth.apiKey}`)}`);
      }
      lines.push(`  --data-raw '${escapeShellSingleQuotes(JSON.stringify(rpcPayload))}'`);
      lines.push("  | jq");
      return lines.join(" \\\n");
    }

    if (!requestUrl) {
      return "";
    }

    lines.push(`curl -s '${escapeShellSingleQuotes(requestUrl.toString())}'`);
    lines.push(`  -X ${pageModel.route.method}`);
    lines.push(`  ${stringifyCurlHeader("Accept", "application/json")}`);
    if (httpRequestBody) {
      lines.push(`  ${stringifyCurlHeader("Content-Type", pageModel.request.mediaType || "application/json")}`);
    }
    if (pageModel.interaction.authTransport === "bearer" && auth.apiKey) {
      lines.push(`  ${stringifyCurlHeader("Authorization", `Bearer ${auth.apiKey}`)}`);
    }
    if (httpRequestBody) {
      lines.push(`  --data-raw '${escapeShellSingleQuotes(JSON.stringify(httpRequestBody))}'`);
    }
    lines.push("  | jq");
    return lines.join(" \\\n");
  }, [auth.apiKey, httpRequestBody, pageModel, requestUrl, rpcPayload, selectedNetworkDetails?.url, selectedFinality]);

  const apiKeyStatus = getApiKeyStatus(auth);
  const isUrlApiKeyOverride = auth.apiKeySource === "url";
  const effectiveAuthSummary = getAuthSummary(pageModel, auth);
  const apiKeyInputValue = isUrlApiKeyOverride ? auth.urlApiKey || "" : apiKeyDraft;
  const canSaveApiKey =
    !isUrlApiKeyOverride &&
    !!apiKeyDraft.trim() &&
    apiKeyDraft.trim() !== (auth.storedApiKey || "");
  const canClearStoredApiKey = !isUrlApiKeyOverride && !!auth.storedApiKey;
  const hasRpcError = runResult?.kind === "json" && !!runResult.value?.error;
  const deferredRunResult = useDeferredValue(runResult);
  const isRunResultTextPending = Boolean(runResult && deferredRunResult !== runResult);
  const runResultText = useMemo(() => getRunResultText(deferredRunResult), [deferredRunResult]);
  const normalizedRunResultText = useMemo(
    () => (runResultText ? runResultText.toLowerCase() : ""),
    [runResultText]
  );
  const deferredResponseFindDraft = useDeferredValue(responseFindDraft);
  const immediateResponseFind = responseFindDraft.trim();
  const normalizedResponseFind = deferredResponseFindDraft.trim();
  const responseMatches = useMemo(
    () => findResponseMatches(normalizedRunResultText, normalizedResponseFind),
    [normalizedResponseFind, normalizedRunResultText]
  );
  const useActiveOnlyResponseHighlight = useMemo(
    () => shouldUseActiveOnlyResponseHighlight(runResultText, responseMatches),
    [responseMatches, runResultText]
  );
  const responseFindResultsLabel = getResponseFindResultsLabel(
    uiText,
    normalizedResponseFind,
    responseMatches,
    activeResponseFindIndex
  );
  const canCopyResponse = Boolean(runResultText) && !isRunResultTextPending;
  const currentUrl =
    typeof window !== "undefined" ? sanitizePublicUrl(window.location.href) : pageModel.canonicalPath;
  const exampleUrl = useMemo(
    () =>
      buildOperationExampleUrl(
        pageModel,
        currentUrl,
        selectedNetwork,
        selectedExample?.id || "",
        selectedFinality,
        trimmedFieldValues,
        {
          isResponseExpanded: isResponseModalOpen,
          responseFind: immediateResponseFind,
        }
      ),
    [
      currentUrl,
      immediateResponseFind,
      isResponseModalOpen,
      pageModel,
      selectedExample?.id,
      selectedFinality,
      selectedNetwork,
      trimmedFieldValues,
    ]
  );
  const operationMarkdown = useMemo(
    () =>
      buildOperationMarkdown({
        currentUrl,
        httpRequestBody,
        locale: currentLocale,
        pageModel,
        requestUrl,
        rpcPayload,
        selectedExample,
        selectedFinality,
        selectedNetworkDetails,
      }),
    [
      currentLocale,
      currentUrl,
      httpRequestBody,
      pageModel,
      requestUrl,
      rpcPayload,
      selectedExample,
      selectedFinality,
      selectedNetworkDetails,
    ]
  );
  const pageActions = useMemo(
    () => [
      {
        id: "copy-markdown",
        label: uiText.copyMarkdown,
        pendingLabel: uiText.copyingMarkdown,
        completedLabel: uiText.copiedMarkdown,
        onSelect: async () => {
          await copyTextToClipboard(operationMarkdown);
        },
      },
    ],
    [operationMarkdown, uiText.copiedMarkdown, uiText.copyMarkdown, uiText.copyingMarkdown]
  );
  const autorunRequestKey = useMemo(() => {
    if (!canAutorun) {
      return "";
    }

    if (pageModel.route.transport === "json-rpc") {
      if (!selectedNetworkDetails?.url || !rpcPayload) {
        return "";
      }

      return JSON.stringify({
        payload: rpcPayload,
        transport: "json-rpc",
        url: selectedNetworkDetails.url,
      });
    }

    if (!requestUrl) {
      return "";
    }

    return JSON.stringify({
      body: httpRequestBody || null,
      method: pageModel.route.method,
      transport: "http",
      url: requestUrl.toString(),
    });
  }, [
    canAutorun,
    httpRequestBody,
    pageModel.route.method,
    pageModel.route.transport,
    requestUrl,
    rpcPayload,
    selectedNetworkDetails?.url,
  ]);
  const handleCopyCurl = async () => {
    if (!curlCommand) {
      return;
    }

    await copyTextToClipboard(curlCommand);
    setCopiedCurl(true);
    setCopiedExampleUrl(false);
    setCopiedViewUrl(false);
  };
  const handleCopyExampleUrl = async () => {
    if (!exampleUrl) {
      return;
    }

    await copyTextToClipboard(exampleUrl);
    setCopiedExampleUrl(true);
    setCopiedViewUrl(false);
  };
  const handleCopyViewUrl = async () => {
    if (!exampleUrl) {
      return;
    }

    await copyTextToClipboard(exampleUrl);
    setCopiedViewUrl(true);
    setCopiedExampleUrl(false);
  };
  const handleCopyResponse = async () => {
    if (!canCopyResponse) {
      return;
    }

    await copyTextToClipboard(runResultText);
    setCopiedResponse(true);
  };
  const openResponseModal = (searchTerm = "") => {
    const nextSearchTerm = searchTerm.trim();
    setIsResponseModalOpen(true);
    setResponseFindDraft(nextSearchTerm);
    setActiveResponseFindIndex(nextSearchTerm ? 0 : -1);
    setCopiedViewUrl(false);
  };
  const closeResponseModal = () => {
    setIsResponseModalOpen(false);
    setResponseFindDraft("");
    setActiveResponseFindIndex(-1);
    setCopiedViewUrl(false);

    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        inlineExpandResponseButtonRef.current?.focus();
      }, 0);
    }
  };
  const handlePreviousResponseMatch = () => {
    if (!responseMatches.length) {
      return;
    }

    setActiveResponseFindIndex((currentIndex) =>
      currentIndex <= 0 ? responseMatches.length - 1 : currentIndex - 1
    );
  };
  const handleNextResponseMatch = () => {
    if (!responseMatches.length) {
      return;
    }

    setActiveResponseFindIndex((currentIndex) =>
      currentIndex < 0 || currentIndex >= responseMatches.length - 1 ? 0 : currentIndex + 1
    );
  };

  useEffect(() => {
    if (!normalizedResponseFind) {
      setActiveResponseFindIndex(-1);
      return;
    }

    setActiveResponseFindIndex(responseMatches.length ? 0 : -1);
  }, [normalizedResponseFind, runResultText, responseMatches.length]);

  useEffect(() => {
    if (!isResponseModalOpen || typeof document === "undefined") {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusHandle =
      typeof window !== "undefined"
        ? window.setTimeout(() => {
            responseFindInputRef.current?.focus();
          }, 0)
        : null;

    const handleDocumentKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeResponseModal();
      }
    };

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
      document.body.style.overflow = previousOverflow;
      if (focusHandle !== null && typeof window !== "undefined") {
        window.clearTimeout(focusHandle);
      }
    };
  }, [isResponseModalOpen]);

  const handleNetworkChange = (networkKey) => {
    const matchingExample = pickInitialExample(pageModel, networkKey);
    const nextSelectionState = buildOperationSelectionState(pageModel, networkKey, matchingExample);
    protectedHydrationFieldsRef.current = new Set();
    setSelectedNetwork(networkKey);
    setSelectedExampleId(nextSelectionState.selectedExampleId);
    setFieldValues(nextSelectionState.fieldValues);
    setCopiedExampleUrl(false);
    setCopiedViewUrl(false);
    setRunError(null);
    setRunResult(null);
    setCopiedResponse(false);
  };

  const handleFinalityChange = (finality) => {
    setSelectedFinality(finality);
    setCopiedExampleUrl(false);
    setCopiedViewUrl(false);
    setRunError(null);
    setRunResult(null);
    setCopiedResponse(false);
  };

  const handleFieldChange = (fieldName, value) => {
    protectedHydrationFieldsRef.current.delete(fieldName);
    setFieldValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
    setCopiedExampleUrl(false);
    setCopiedViewUrl(false);
    setRunError(null);
    setRunResult(null);
    setCopiedResponse(false);
  };

  const handleExampleSelect = (exampleId) => {
    const example = pageModel.request.examples.find((candidate) => candidate.id === exampleId);
    if (!example) {
      return;
    }

    const nextNetwork = example.network || selectedNetwork;
    const nextSelectionState = buildOperationSelectionState(pageModel, nextNetwork, example);
    protectedHydrationFieldsRef.current = new Set();
    setSelectedExampleId(nextSelectionState.selectedExampleId);
    setSelectedNetwork(nextNetwork);
    setFieldValues(nextSelectionState.fieldValues);
    setCopiedExampleUrl(false);
    setCopiedViewUrl(false);
  };

  const handleRun = async () => {
    if (missingField) {
      setRunError(getFastnearMissingFieldError(missingField.label));
      return;
    }

    try {
      setIsRunning(true);
      setRunError(null);
      setRunResult(null);
      setCopiedResponse(false);
      await waitForNextPaint();

      if (pageModel.route.transport === "json-rpc") {
        if (!selectedNetworkDetails?.url || !rpcPayload) {
          throw new Error(uiText.noRpcServer);
        }

        const headers = {
          Accept: "application/json",
          "Content-Type": "application/json",
        };
        if (pageModel.interaction.authTransport === "bearer" && auth.apiKey) {
          headers.Authorization = `Bearer ${auth.apiKey}`;
        }

        const response = await fetch(selectedNetworkDetails.url, {
          body: JSON.stringify(rpcPayload),
          headers,
          method: "POST",
        });
        const responseText = await response.text();
        let nextRunResult;
        try {
          nextRunResult = {
            kind: "json",
            ok: response.ok,
            status: response.status,
            url: selectedNetworkDetails.url,
            value: JSON.parse(responseText),
          };
        } catch (_error) {
          nextRunResult = {
            kind: "text",
            ok: response.ok,
            status: response.status,
            url: selectedNetworkDetails.url,
            value: responseText,
          };
        }
        startTransition(() => {
          setRunResult(nextRunResult);
        });
        return;
      }

      if (!requestUrl) {
        throw new Error(uiText.noApiServer);
      }

      const headers = {
        Accept: "application/json",
      };
      if (httpRequestBody) {
        headers["Content-Type"] = pageModel.request.mediaType || "application/json";
      }
      if (pageModel.interaction.authTransport === "bearer" && auth.apiKey) {
        headers.Authorization = `Bearer ${auth.apiKey}`;
      }

      const response = await fetch(requestUrl.toString(), {
        body: httpRequestBody ? JSON.stringify(httpRequestBody) : undefined,
        headers,
        method: pageModel.route.method,
      });
      const responseText = await response.text();
      let nextRunResult;
      try {
        nextRunResult = {
          kind: "json",
          ok: response.ok,
          status: response.status,
          url: requestUrl.toString(),
          value: JSON.parse(responseText),
        };
      } catch (_error) {
        nextRunResult = {
          kind: "text",
          ok: response.ok,
          status: response.status,
          url: requestUrl.toString(),
          value: responseText,
        };
      }
      startTransition(() => {
        setRunResult(nextRunResult);
      });
    } catch (error) {
      setRunError(error instanceof Error ? error.message : uiText.requestFailed);
      setRunResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (!autorunRequestKey || autorunKeyRef.current === autorunRequestKey) {
      return;
    }

    autorunKeyRef.current = autorunRequestKey;
    void handleRun();
  }, [autorunRequestKey]);

  return (
    <div className="fastnear-operation-page" data-fastnear-operation-root data-fastnear-page-model-id={pageModel.pageModelId}>
      <div className="fastnear-operation-page__toolbar" data-fastnear-crawler-skip>
        <PageActions actions={pageActions} />
      </div>

      <div className="fastnear-interaction" data-fastnear-crawler-skip>
        <div className="fastnear-interaction__layout">
          <div className="fastnear-interaction__sidebar">
            <div className="fastnear-interaction__controls">
              <div className="fastnear-interaction__field fastnear-interaction__field--network">
                <span className="fastnear-interaction__label">{uiText.network}</span>
                <div
                  className="fastnear-segmented fastnear-segmented--network"
                  role="tablist"
                  aria-label={uiText.selectNetworkAriaLabel}
                >
                  {pageModel.interaction.networks.map((network) => (
                    <button
                      key={network.key || network.label}
                      type="button"
                      className={network.key === selectedNetwork ? "is-active" : ""}
                      onClick={() => handleNetworkChange(network.key || selectedNetwork)}
                      aria-pressed={network.key === selectedNetwork}
                    >
                      {network.label}
                    </button>
                  ))}
                </div>
              </div>

              {pageModel.interaction.fields.map((field) => {
                const enumOptions = getEnumOptions(field);
                const isBoolean = isBooleanField(field);
                const isMultiline = isMultilineField(field);
                const value = fieldValues[field.name] || "";
                const placeholder = getDefaultFieldValue(pageModel, field, selectedNetwork);

                if (isBoolean) {
                  const options = field.required
                    ? [
                        { label: uiText.true, value: "true" },
                        { label: uiText.false, value: "false" },
                      ]
                    : [
                        { label: uiText.unset, value: "" },
                        { label: uiText.true, value: "true" },
                        { label: uiText.false, value: "false" },
                      ];

                  return (
                    <div
                      key={field.name}
                      className={`fastnear-interaction__field fastnear-interaction__field--${field.name}`}
                    >
                      <span className="fastnear-interaction__label">{field.label}</span>
                      {getFieldLocationLabel(field) ? (
                        <span className="fastnear-interaction__field-hint">
                          {getFieldLocationLabel(field)}
                        </span>
                      ) : null}
                      <div
                        className="fastnear-segmented fastnear-segmented--boolean"
                        role="tablist"
                        aria-label={translate(
                          {
                            id: "fastnear.operationUi.selectFieldLabel",
                            message: "Select {fieldLabel}",
                          },
                          { fieldLabel: field.label }
                        )}
                      >
                        {options.map((option) => (
                          <button
                            key={`${field.name}-${option.value || "unset"}`}
                            type="button"
                            className={option.value === value ? "is-active" : ""}
                            onClick={() => handleFieldChange(field.name, option.value)}
                            aria-pressed={option.value === value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (enumOptions.length > 0 && enumOptions.length <= 3) {
                  const options = field.required
                    ? enumOptions.map((option) => ({
                        label: formatChoiceLabel(option),
                        value: option,
                      }))
                    : [{ label: uiText.any, value: "" }].concat(
                        enumOptions.map((option) => ({
                          label: formatChoiceLabel(option),
                          value: option,
                        }))
                      );

                  return (
                    <div
                      key={field.name}
                      className={`fastnear-interaction__field fastnear-interaction__field--${field.name}`}
                    >
                      <span className="fastnear-interaction__label">{field.label}</span>
                      {getFieldLocationLabel(field) ? (
                        <span className="fastnear-interaction__field-hint">
                          {getFieldLocationLabel(field)}
                        </span>
                      ) : null}
                      <div
                        className="fastnear-segmented"
                        role="tablist"
                        aria-label={translate(
                          {
                            id: "fastnear.operationUi.selectFieldEnumLabel",
                            message: "Select {fieldLabel}",
                          },
                          { fieldLabel: field.label }
                        )}
                      >
                        {options.map((option) => (
                          <button
                            key={`${field.name}-${option.value || "any"}`}
                            type="button"
                            className={option.value === value ? "is-active" : ""}
                            onClick={() => handleFieldChange(field.name, option.value)}
                            aria-pressed={option.value === value}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (isMultiline) {
                  return (
                    <label
                      key={field.name}
                      className={`fastnear-interaction__field fastnear-interaction__field--${field.name}`}
                    >
                      <span className="fastnear-interaction__label">{field.label}</span>
                      {getFieldLocationLabel(field) ? (
                        <span className="fastnear-interaction__field-hint">
                          {getFieldLocationLabel(field)}
                        </span>
                      ) : null}
                      <textarea
                        className="fastnear-interaction__input fastnear-interaction__input--code fastnear-interaction__input--multiline"
                        value={value}
                        onChange={(event) => handleFieldChange(field.name, event.target.value)}
                        placeholder={placeholder}
                        rows={Math.max(3, Math.min(6, placeholder ? placeholder.split("\n").length : 4))}
                        spellCheck={false}
                      />
                    </label>
                  );
                }

                return (
                  <label
                    key={field.name}
                    className={`fastnear-interaction__field fastnear-interaction__field--${field.name}`}
                  >
                    <span className="fastnear-interaction__label">{field.label}</span>
                    {getFieldLocationLabel(field) ? (
                      <span className="fastnear-interaction__field-hint">
                        {getFieldLocationLabel(field)}
                      </span>
                    ) : null}
                    <input
                      className="fastnear-interaction__input fastnear-interaction__input--code"
                      value={value}
                      onChange={(event) => handleFieldChange(field.name, event.target.value)}
                      placeholder={placeholder}
                      autoComplete="off"
                      spellCheck={false}
                      inputMode={
                        fieldSupportsType(field, "integer") || fieldSupportsType(field, "number")
                          ? "numeric"
                          : undefined
                      }
                    />
                  </label>
                );
              })}
            </div>

            <div className="fastnear-interaction__auth">
              <div className="fastnear-interaction__auth-heading">
                <span className="fastnear-interaction__label">{uiText.fastnearApiKey}</span>
                <span
                  className={`fastnear-interaction__auth-status ${
                    isUrlApiKeyOverride
                      ? "fastnear-interaction__auth-status--url"
                      : auth.storedApiKey
                        ? "fastnear-interaction__auth-status--saved"
                        : "fastnear-interaction__auth-status--empty"
                  }`}
                >
                  {apiKeyStatus}
                </span>
              </div>

              <input
                className="fastnear-interaction__input fastnear-interaction__input--code"
                value={apiKeyInputValue}
                onChange={(event) => setApiKeyDraft(event.target.value)}
                placeholder={uiText.pasteFastnearApiKey}
                autoComplete="off"
                spellCheck={false}
                readOnly={isUrlApiKeyOverride}
                aria-readonly={isUrlApiKeyOverride}
              />

              <a
                className="fastnear-interaction__helper-link"
                href="https://dashboard.fastnear.com"
                target="_blank"
                rel="noreferrer"
              >
                <span>{uiText.getApiKey}</span>
                <ExternalLinkGlyph className="fastnear-interaction__helper-link-icon" />
              </a>

              {canSaveApiKey || canClearStoredApiKey ? (
                <div className="fastnear-interaction__auth-actions">
                  {canSaveApiKey ? (
                    <button
                      type="button"
                      className="fastnear-button fastnear-button--secondary"
                      onClick={() => setPortalApiKey(apiKeyDraft)}
                    >
                      {uiText.saveApiKey}
                    </button>
                  ) : null}
                  {canClearStoredApiKey ? (
                    <button
                      type="button"
                      className="fastnear-button fastnear-button--ghost"
                      onClick={() => {
                        clearPortalApiKey();
                        setApiKeyDraft("");
                      }}
                    >
                      {uiText.removeSavedKey}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="fastnear-interaction__actions">
              <div className="fastnear-interaction__primary-actions">
                <button
                  type="button"
                  className="fastnear-button fastnear-button--primary"
                  onClick={handleRun}
                  disabled={isRunning || !!missingField}
                >
                  {isRunning ? uiText.sending : uiText.sendRequest}
                </button>
              </div>

              <div className="fastnear-interaction__copy-row">
                <div className="fastnear-interaction__copy-heading">
                  <span className="fastnear-interaction__copy-label">{uiText.copyGroupLabel}</span>
                  <div
                    className="fastnear-interaction__action-group fastnear-interaction__action-group--help"
                    onMouseEnter={() => setIsExampleUrlHelpOpen(true)}
                    onMouseLeave={() => setIsExampleUrlHelpOpen(false)}
                  >
                    <button
                      type="button"
                      className="fastnear-interaction__action-help-button"
                      aria-label={uiText.copyExampleUrlHelpAriaLabel}
                      aria-expanded={isExampleUrlHelpOpen}
                      aria-controls={exampleUrlHelpId}
                      onClick={() => setIsExampleUrlHelpOpen(true)}
                      onFocus={() => setIsExampleUrlHelpOpen(true)}
                      onBlur={() => setIsExampleUrlHelpOpen(false)}
                    >
                      ?
                    </button>
                    {isExampleUrlHelpOpen ? (
                      <div
                        id={exampleUrlHelpId}
                        role="tooltip"
                        className="fastnear-interaction__action-tooltip"
                      >
                        {uiText.copyExampleUrlHelpBody}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="fastnear-interaction__copy-buttons">
                  <button
                    type="button"
                    className="fastnear-button fastnear-button--secondary"
                    aria-label={copiedCurl ? uiText.copiedCurlCommand : uiText.copyCurlCommand}
                    title={copiedCurl ? uiText.copiedCurlCommand : uiText.copyCurlCommand}
                    onClick={() => {
                      void handleCopyCurl();
                    }}
                    disabled={!curlCommand}
                  >
                    {copiedCurl ? (
                      <CheckGlyph className="fastnear-button__icon" />
                    ) : (
                      <CopyGlyph className="fastnear-button__icon" />
                    )}
                    <span>{uiText.copyCurlCommandButtonLabel}</span>
                  </button>
                  <button
                    type="button"
                    className="fastnear-button fastnear-button--secondary"
                    aria-label={copiedExampleUrl ? uiText.copiedExampleUrl : uiText.copyExampleUrl}
                    title={copiedExampleUrl ? uiText.copiedExampleUrl : uiText.copyExampleUrl}
                    onClick={() => {
                      void handleCopyExampleUrl();
                    }}
                    disabled={!exampleUrl}
                  >
                    {copiedExampleUrl ? (
                      <CheckGlyph className="fastnear-button__icon" />
                    ) : (
                      <CopyGlyph className="fastnear-button__icon" />
                    )}
                    <span>{uiText.copyExampleUrlButtonLabel}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="fastnear-interaction__meta">
              <div className="fastnear-interaction__meta-item">
                <span className="fastnear-interaction__meta-label">{uiText.endpoint}</span>
                <code>
                  {pageModel.route.transport === "json-rpc"
                    ? selectedNetworkDetails?.url
                    : requestUrl?.origin || selectedNetworkDetails?.url}
                </code>
              </div>
              {pageModel.interaction.supportsFinality ? (
                <div className="fastnear-interaction__meta-item fastnear-interaction__meta-item--finality">
                  <span className="fastnear-interaction__meta-label">{uiText.finality}</span>
                  <div
                    className="fastnear-segmented fastnear-segmented--finality"
                    role="tablist"
                    aria-label={uiText.selectFinalityAriaLabel}
                  >
                    {FINALITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={option.value === selectedFinality ? "is-active" : ""}
                        onClick={() => handleFinalityChange(option.value)}
                        aria-pressed={option.value === selectedFinality}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="fastnear-interaction__meta-help">
                    {selectedFinalityDetails.description}
                  </p>
                </div>
              ) : null}
              <div className="fastnear-interaction__meta-item">
                <span className="fastnear-interaction__meta-label">{uiText.auth}</span>
                <span className="fastnear-interaction__meta-value">{effectiveAuthSummary}</span>
              </div>
            </div>
          </div>

          <div className="fastnear-interaction__response">
            <div className="fastnear-interaction__response-header">
              <div className="fastnear-interaction__response-heading">
                <span className="fastnear-interaction__label">{uiText.liveResponse}</span>
                <p className="fastnear-interaction__response-copy">
                  {uiText.liveResponseIntro}
                </p>
              </div>
            </div>

            <div className="fastnear-interaction__response-body">
              {runError ? <p className="fastnear-interaction__error">{runError}</p> : null}

              {runResult ? (
                <>
                  <div className="fastnear-interaction__result-meta">
                    <span
                      className={`fastnear-interaction__status ${
                        runResult.ok && !hasRpcError
                          ? "fastnear-interaction__status--success"
                          : "fastnear-interaction__status--error"
                      }`}
                    >
                      {runResult.ok && !hasRpcError ? uiText.success : uiText.error}
                    </span>
                    <span>{uiText.httpStatus} {runResult.status}</span>
                    <code className="fastnear-interaction__result-url">{runResult.url}</code>
                  </div>

                  <div
                    className="fastnear-interaction__result-shell"
                    data-fastnear-response-scroll-container
                    aria-busy={isRunResultTextPending ? "true" : "false"}
                  >
                    <div className="fastnear-interaction__result-action-rail">
                      <div className="fastnear-interaction__result-actions">
                        <button
                          type="button"
                          className={`fastnear-interaction__copy-button ${
                            copiedResponse ? "is-copied" : ""
                          }`}
                          onClick={() => {
                            void handleCopyResponse();
                          }}
                          disabled={!canCopyResponse}
                          aria-label={copiedResponse ? uiText.responseCopied : uiText.copyResponse}
                          title={copiedResponse ? uiText.responseCopied : uiText.copyResponse}
                        >
                          {copiedResponse ? (
                            <CheckGlyph className="fastnear-interaction__copy-icon" />
                          ) : (
                            <CopyGlyph className="fastnear-interaction__copy-icon" />
                          )}
                        </button>
                        <button
                          ref={inlineExpandResponseButtonRef}
                          type="button"
                          className="fastnear-interaction__copy-button"
                          onClick={() => openResponseModal()}
                          disabled={!runResultText || isRunResultTextPending}
                          aria-label={uiText.expandResponse}
                          title={uiText.expandResponse}
                        >
                          <ExpandGlyph className="fastnear-interaction__copy-icon" />
                        </button>
                      </div>
                    </div>
                    {isRunResultTextPending ? (
                      <p className="fastnear-interaction__placeholder fastnear-interaction__placeholder--panel fastnear-interaction__placeholder--pending">
                        {uiText.responseFormattingPending}
                      </p>
                    ) : (
                      <FastnearOperationResponseText
                        className="fastnear-interaction__text-response"
                        text={runResultText}
                      />
                    )}
                  </div>
                </>
              ) : isRunning ? (
                <p className="fastnear-interaction__placeholder fastnear-interaction__placeholder--panel fastnear-interaction__placeholder--pending">
                  {uiText.sendingRequestPending}
                </p>
              ) : (
                <p className="fastnear-interaction__placeholder fastnear-interaction__placeholder--panel">
                  {uiText.liveResponsePlaceholder}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {isResponseModalOpen ? (
        <div
          className="fastnear-response-modal"
          role="presentation"
          onClick={() => closeResponseModal()}
        >
          <div
            className="fastnear-response-modal__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={expandedResponseTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="fastnear-response-modal__header">
              <div className="fastnear-response-modal__heading">
                <span
                  id={expandedResponseTitleId}
                  className="fastnear-interaction__label"
                >
                  {uiText.expandedResponseTitle}
                </span>
                <p className="fastnear-response-modal__copy">
                  {uiText.expandedResponseHint}
                </p>
              </div>
              <div className="fastnear-response-modal__header-actions">
                <button
                  type="button"
                  className="fastnear-button fastnear-button--secondary fastnear-response-modal__header-share-button"
                  aria-label={copiedViewUrl ? uiText.copiedViewUrl : uiText.copyViewUrl}
                  title={copiedViewUrl ? uiText.copiedViewUrl : uiText.copyViewUrl}
                  onClick={() => {
                    void handleCopyViewUrl();
                  }}
                  disabled={!exampleUrl}
                >
                  {copiedViewUrl ? (
                    <CheckGlyph className="fastnear-button__icon" />
                  ) : (
                    <CopyGlyph className="fastnear-button__icon" />
                  )}
                  <span>{uiText.copyViewUrlButtonLabel}</span>
                </button>
                <button
                  type="button"
                  className="fastnear-interaction__copy-button fastnear-response-modal__close-button"
                  onClick={() => closeResponseModal()}
                  aria-label={uiText.closeExpandedResponse}
                  title={uiText.closeExpandedResponse}
                >
                  <CloseGlyph className="fastnear-interaction__copy-icon" />
                </button>
              </div>
            </div>

            {runResult ? (
              <div className="fastnear-interaction__result-meta fastnear-response-modal__result-meta">
                <span
                  className={`fastnear-interaction__status ${
                    runResult.ok && !hasRpcError
                      ? "fastnear-interaction__status--success"
                      : "fastnear-interaction__status--error"
                  }`}
                >
                  {runResult.ok && !hasRpcError ? uiText.success : uiText.error}
                </span>
                <span>{uiText.httpStatus} {runResult.status}</span>
                <code className="fastnear-interaction__result-url">{runResult.url}</code>
              </div>
            ) : null}

            <div className="fastnear-response-modal__findbar">
              <label className="fastnear-response-modal__find-input-shell">
                <span className="sr-only">{uiText.findInResponse}</span>
                <input
                  ref={responseFindInputRef}
                  type="text"
                  className="fastnear-interaction__input fastnear-interaction__input--code fastnear-response-modal__find-input"
                  value={responseFindDraft}
                  onChange={(event) => setResponseFindDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }

                    event.preventDefault();
                    if (event.shiftKey) {
                      handlePreviousResponseMatch();
                      return;
                    }

                    handleNextResponseMatch();
                  }}
                  placeholder={uiText.findInResponsePlaceholder}
                  aria-label={uiText.findInResponse}
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>

              <span className="fastnear-response-modal__find-results" aria-live="polite">
                {responseFindResultsLabel}
              </span>

              <div className="fastnear-response-modal__find-actions">
                <button
                  type="button"
                  className="fastnear-response-modal__find-button"
                  onClick={handlePreviousResponseMatch}
                  disabled={!responseMatches.length}
                  aria-label={uiText.previousResponseMatch}
                  title={uiText.previousResponseMatch}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="fastnear-response-modal__find-button"
                  onClick={handleNextResponseMatch}
                  disabled={!responseMatches.length}
                  aria-label={uiText.nextResponseMatch}
                  title={uiText.nextResponseMatch}
                >
                  ↓
                </button>
              </div>
            </div>

            <div
              className="fastnear-response-modal__viewer"
              data-fastnear-response-scroll-container
              aria-busy={isRunResultTextPending ? "true" : "false"}
            >
              <div className="fastnear-interaction__result-action-rail fastnear-response-modal__viewer-rail">
                <div className="fastnear-interaction__result-actions fastnear-response-modal__viewer-actions">
                  <button
                    type="button"
                    className={`fastnear-interaction__copy-button ${
                      copiedResponse ? "is-copied" : ""
                    }`}
                    onClick={() => {
                      void handleCopyResponse();
                    }}
                    disabled={!canCopyResponse}
                    aria-label={copiedResponse ? uiText.responseCopied : uiText.copyResponse}
                    title={copiedResponse ? uiText.responseCopied : uiText.copyResponse}
                  >
                    {copiedResponse ? (
                      <CheckGlyph className="fastnear-interaction__copy-icon" />
                    ) : (
                      <CopyGlyph className="fastnear-interaction__copy-icon" />
                    )}
                  </button>
                </div>
              </div>
              {runError ? (
                <p className="fastnear-interaction__error">{runError}</p>
              ) : runResult ? (
                isRunResultTextPending ? (
                  <p className="fastnear-interaction__placeholder fastnear-interaction__placeholder--panel fastnear-interaction__placeholder--pending">
                    {uiText.responseFormattingPending}
                  </p>
                ) : (
                  <Suspense
                    fallback={
                      <FastnearOperationResponseText
                        activeMatchIndex={activeResponseFindIndex}
                        activeMatchOnly={useActiveOnlyResponseHighlight}
                        className="fastnear-interaction__text-response fastnear-response-modal__text-response"
                        matches={responseMatches}
                        text={runResultText}
                      />
                    }
                  >
                    {deferredRunResult?.kind === "json" ? (
                      <FastnearJsonResponseText
                        activeMatchIndex={activeResponseFindIndex}
                        activeMatchOnly={useActiveOnlyResponseHighlight}
                        className="fastnear-interaction__text-response fastnear-response-modal__text-response"
                        matches={responseMatches}
                        text={runResultText}
                      />
                    ) : (
                      <FastnearOperationResponseText
                        activeMatchIndex={activeResponseFindIndex}
                        activeMatchOnly={useActiveOnlyResponseHighlight}
                        className="fastnear-interaction__text-response fastnear-response-modal__text-response"
                        matches={responseMatches}
                        text={runResultText}
                      />
                    )}
                  </Suspense>
                )
              ) : isRunning ? (
                <p className="fastnear-interaction__placeholder fastnear-interaction__placeholder--panel fastnear-interaction__placeholder--pending">
                  {uiText.sendingRequestPending}
                </p>
              ) : (
                <p className="fastnear-interaction__placeholder fastnear-interaction__placeholder--panel">
                  {uiText.liveResponsePlaceholder}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <FastnearOperationReference
        pageModel={pageModel}
        selectedExampleId={selectedExampleId}
        onExampleSelect={handleExampleSelect}
      />
    </div>
  );
}

function FastnearOperationLoading() {
  const uiText = getFastnearOperationUiText();

  return (
    <div className="builder-fastnear-direct">
      <div
        className="fastnear-operation-page fastnear-operation-page--loading"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="fastnear-interaction fastnear-direct-loading-shell">
          <div className="fastnear-interaction__layout">
            <div className="fastnear-interaction__controls fastnear-direct-loading-shell__controls">
              <div
                className="fastnear-direct-loading-shell__line fastnear-direct-loading-shell__line--short"
                aria-hidden="true"
              />
              <div className="fastnear-direct-loading-shell__field" aria-hidden="true" />
              <div className="fastnear-direct-loading-shell__field" aria-hidden="true" />
              <div className="fastnear-direct-loading-shell__actions" aria-hidden="true" />
            </div>
            <div className="fastnear-interaction__sidebar fastnear-direct-loading-shell__sidebar">
              <div className="fastnear-interaction__auth fastnear-direct-loading-shell__card">
                <p className="fastnear-direct-loading-shell__status">{uiText.loadingPageModel}</p>
                <div
                  className="fastnear-direct-loading-shell__line fastnear-direct-loading-shell__line--medium"
                  aria-hidden="true"
                />
                <div
                  className="fastnear-direct-loading-shell__line fastnear-direct-loading-shell__line--short"
                  aria-hidden="true"
                />
              </div>
              <div className="fastnear-interaction__response fastnear-direct-loading-shell__card">
                <p className="fastnear-interaction__placeholder--panel fastnear-interaction__placeholder--pending">
                  {uiText.loadingPageModel}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="fastnear-reference fastnear-direct-loading-shell__reference">
          <div className="fastnear-reference__grid">
            <div className="fastnear-reference__panel fastnear-direct-loading-shell__reference-panel">
              <div
                className="fastnear-direct-loading-shell__line fastnear-direct-loading-shell__line--medium"
                aria-hidden="true"
              />
              <div
                className="fastnear-direct-loading-shell__line fastnear-direct-loading-shell__line--long"
                aria-hidden="true"
              />
              <div
                className="fastnear-direct-loading-shell__line fastnear-direct-loading-shell__line--medium"
                aria-hidden="true"
              />
            </div>
            <div className="fastnear-reference__panel fastnear-direct-loading-shell__reference-panel">
              <div
                className="fastnear-direct-loading-shell__line fastnear-direct-loading-shell__line--short"
                aria-hidden="true"
              />
              <div
                className="fastnear-direct-loading-shell__line fastnear-direct-loading-shell__line--long"
                aria-hidden="true"
              />
              <div
                className="fastnear-direct-loading-shell__line fastnear-direct-loading-shell__line--medium"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResolvedFastnearDirectOperation({ currentLocale, pageModelId, renderDescription }) {
  const pageModel = useFastnearPageModelById(pageModelId, currentLocale);
  const canonicalPageModel = useFastnearPageModelById(pageModelId, "en");
  const operationMeta = useMemo(
    () => getOperationDocsearchMeta(canonicalPageModel),
    [canonicalPageModel]
  );
  const seoKeywords = useMemo(() => buildOperationKeywords(pageModel), [pageModel]);
  const semanticMeta = useMemo(() => getOperationSemanticMeta(pageModel), [pageModel]);

  if (!pageModel) {
    const uiText = getFastnearOperationUiText();
    return (
      <FastnearOperationFailure
        message={
          <>
            {uiText.missingPageModel} <code>{pageModelId}</code>.
          </>
        }
      />
    );
  }

  return (
    <div
      className="builder-fastnear-direct"
      data-fastnear-crawler-root="operation"
      data-fastnear-audience={semanticMeta?.audience || undefined}
      data-fastnear-category={semanticMeta?.category || undefined}
      data-fastnear-family={semanticMeta?.family || undefined}
      data-fastnear-method-type={semanticMeta?.methodType || undefined}
      data-fastnear-page-type={semanticMeta?.pageType || undefined}
      data-fastnear-surface={semanticMeta?.surface || undefined}
    >
      {seoKeywords.length || operationMeta.transport || operationMeta.operationId || operationMeta.canonicalTarget ? (
        <Head>
          {seoKeywords.length ? (
            <meta name="keywords" content={seoKeywords.join(', ')} />
          ) : null}
          {operationMeta.transport ? (
            <meta name="docsearch:transport" content={operationMeta.transport} />
          ) : null}
          {operationMeta.operationId ? (
            <meta name="docsearch:operation_id" content={operationMeta.operationId} />
          ) : null}
          {operationMeta.canonicalTarget ? (
            <meta name="docsearch:canonical_target" content={operationMeta.canonicalTarget} />
          ) : null}
        </Head>
      ) : null}
      {renderDescription && pageModel.info?.description ? (
        <div data-fastnear-content="endpoint-description">
          <p>{pageModel.info.description}</p>
        </div>
      ) : null}
      <FastnearOperationPage pageModel={pageModel} />
    </div>
  );
}

function FastnearOperationFailure({ message }) {
  const uiText = getFastnearOperationUiText();
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };
  return (
    <div className="builder-fastnear-direct">
      <div
        className="fastnear-operation-page fastnear-operation-page--failed"
        role="alert"
      >
        <p className="fastnear-interaction__error">
          {message || uiText.loadFailed}
        </p>
        <button
          type="button"
          className="fastnear-interaction__retry"
          onClick={handleReload}
        >
          {uiText.retry}
        </button>
      </div>
    </div>
  );
}

class FastnearOperationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof console !== "undefined" && console.error) {
      console.error("FastnearDirectOperation failed:", error, info);
    }
  }

  render() {
    if (this.state.error) {
      return <FastnearOperationFailure />;
    }
    return this.props.children;
  }
}

export default function FastnearDirectOperation({ pageModelId, renderDescription = true }) {
  const { i18n } = useDocusaurusContext();
  const currentLocale = i18n.currentLocale || "en";

  return (
    <FastnearOperationErrorBoundary>
      <Suspense fallback={<FastnearOperationLoading />}>
        <ResolvedFastnearDirectOperation
          currentLocale={currentLocale}
          pageModelId={pageModelId}
          renderDescription={renderDescription}
        />
      </Suspense>
    </FastnearOperationErrorBoundary>
  );
}

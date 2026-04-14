import React, { useEffect, useId, useMemo, useState } from "react";
import Head from "@docusaurus/Head";

import PageActions from "@site/src/components/PageActions";
import { copyTextToClipboard } from "@site/src/utils/clipboard";
import {
  buildOperationMarkdown,
  sanitizePublicUrl,
} from "@site/src/utils/markdownExport";
import { buildOperationKeywords } from "@site/src/utils/seo";
import { FINALITY_OPTIONS } from "./finalityOptions";
import { getFastnearPageModelById } from "./pageModels";
import {
  clearPortalApiKey,
  setPortalApiKey,
  usePortalAuth,
} from "./portalAuth";

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

function getInitialNetwork(pageModel) {
  if (typeof window === "undefined") {
    return pageModel.interaction.networks[0]?.key || "mainnet";
  }

  const search = new URLSearchParams(window.location.search);
  const requestedNetwork = search.get("network");
  const matched = pageModel.interaction.networks.find((network) => network.key === requestedNetwork);
  return matched?.key || pageModel.interaction.networks[0]?.key || "mainnet";
}

function getDefaultFieldValue(pageModel, field, networkKey) {
  const selectedNetwork = pageModel.interaction.networks.find((network) => network.key === networkKey);
  return serializeFieldDraftValue(field, selectedNetwork?.defaultFields?.[field.name]);
}

function getDefaultFieldValues(pageModel, networkKey) {
  return Object.fromEntries(
    pageModel.interaction.fields.map((field) => [
      field.name,
      getDefaultFieldValue(pageModel, field, networkKey),
    ])
  );
}

const RUNTIME_STATUS_FIELD_DEFAULTS = {
  "rpc-block-by-height": "block_id",
};

async function fetchLatestBlockHeight(baseUrl, signal) {
  const normalizedUrl = baseUrl.replace(/\/+$/, "");

  try {
    const response = await fetch(`${normalizedUrl}/status`, {
      headers: { Accept: "application/json" },
      signal,
    });

    if (response.ok) {
      const payload = await response.json();
      const latestBlockHeight = Number(payload?.latest_block_height);
      if (Number.isFinite(latestBlockHeight)) {
        return latestBlockHeight;
      }
    }
  } catch {}

  try {
    const response = await fetch(normalizedUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "fastnear-docs",
        method: "status",
        params: [],
      }),
      signal,
    });

    if (response.ok) {
      const payload = await response.json();
      const latestBlockHeight = Number(payload?.result?.sync_info?.latest_block_height);
      if (Number.isFinite(latestBlockHeight)) {
        return latestBlockHeight;
      }
    }
  } catch {}

  return null;
}

function getFieldLocationLabel(field) {
  if (field.location === "path") {
    return "Path parameter";
  }

  if (field.location === "query") {
    return "Query parameter";
  }

  if (field.location === "body") {
    return "Request body field";
  }

  return undefined;
}

function getFieldTypeValues(field) {
  return Array.isArray(field.schema?.type)
    ? field.schema.type
    : field.schema?.type
      ? [field.schema.type]
      : [];
}

function fieldSupportsType(field, type) {
  const fieldTypes = getFieldTypeValues(field);
  const fieldOneOf = field.schema?.oneOf;

  return (
    fieldTypes.includes(type) ||
    (fieldOneOf || []).some((variant) => variant?.type === type)
  );
}

function isBooleanField(field) {
  return fieldSupportsType(field, "boolean");
}

function isArrayField(field) {
  return fieldSupportsType(field, "array") || Boolean(field.schema?.items);
}

function isObjectField(field) {
  return fieldSupportsType(field, "object") || Boolean(field.schema?.properties?.length);
}

function isMultilineField(field) {
  return isArrayField(field) || isObjectField(field);
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

function serializeFieldDraftValue(field, value) {
  if (value === undefined || value === null) {
    return "";
  }

  if (Array.isArray(value)) {
    if (field.schema?.items?.type === "string" || value.every((entry) => typeof entry === "string")) {
      return value.map((entry) => String(entry)).join("\n");
    }

    return JSON.stringify(value, null, 2);
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function parseFieldValue(field, rawValue) {
  const trimmedValue = rawValue.trim();
  const canBeArray = isArrayField(field);
  const canBeObject = isObjectField(field);
  const canBeBoolean = isBooleanField(field);
  const canBeInteger = fieldSupportsType(field, "integer");
  const canBeNumber = fieldSupportsType(field, "number");
  const fieldTypes = getFieldTypeValues(field);
  const canBeString = fieldSupportsType(field, "string") || fieldTypes.length === 0;

  if (canBeArray) {
    if (!trimmedValue) {
      return [];
    }

    if (trimmedValue.startsWith("[")) {
      try {
        return JSON.parse(trimmedValue);
      } catch (_error) {
        return trimmedValue
          .split(/\r?\n|,/)
          .map((entry) => entry.trim())
          .filter(Boolean);
      }
    }

    return trimmedValue
      .split(/\r?\n|,/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (canBeObject) {
    if (!trimmedValue) {
      return {};
    }

    if (trimmedValue.startsWith("{")) {
      try {
        return JSON.parse(trimmedValue);
      } catch (_error) {
        return trimmedValue;
      }
    }
  }

  if (canBeBoolean && (trimmedValue === "true" || trimmedValue === "false")) {
    return trimmedValue === "true";
  }

  if (canBeInteger && /^-?\d+$/.test(trimmedValue)) {
    return Number(trimmedValue);
  }

  if (canBeNumber && /^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    return Number(trimmedValue);
  }

  if (canBeString || canBeInteger || canBeNumber || canBeBoolean) {
    return trimmedValue;
  }

  return trimmedValue;
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
  if (auth.apiKeySource === "url") {
    return "From URL override";
  }

  if (auth.storedApiKey) {
    return "Saved in browser";
  }

  return "No saved key";
}

function getAuthSummary(pageModel, auth) {
  if (!auth.apiKey) {
    return "none detected";
  }

  if (pageModel.interaction.authTransport === "bearer") {
    return auth.apiKeySource === "url"
      ? "API key from URL via Bearer auth"
      : "saved browser API key via Bearer auth";
  }

  return auth.apiKeySource === "url"
    ? "API key from URL via query param"
    : "saved browser API key via query param";
}

function getSchemaTypeLabel(schema) {
  if (!schema) {
    return "unknown";
  }

  if (schema.oneOf?.length) {
    return "one of";
  }

  if (schema.anyOf?.length) {
    return "any of";
  }

  if (Array.isArray(schema.type)) {
    return schema.type.join(" | ");
  }

  if (schema.type) {
    return schema.type;
  }

  if (schema.properties?.length) {
    return "object";
  }

  if (schema.items) {
    return "array";
  }

  return "value";
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

function getRunResultText(runResult) {
  if (!runResult) {
    return "";
  }

  return runResult.kind === "json" ? formatJson(runResult.value) : runResult.value;
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

function getSchemaVariantLabel(schema, fallbackLabel) {
  if (!schema) {
    return fallbackLabel;
  }

  if (schema.refName) {
    return schema.refName;
  }

  if (Array.isArray(schema.enum) && schema.enum.length === 1) {
    return String(schema.enum[0]);
  }

  const typeLabel = getSchemaTypeLabel(schema);
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

  const typeLabel = getSchemaTypeLabel(schema);
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
            <span className="fastnear-reference-schema__flag">nullable</span>
          ) : null}
          {schema.refName ? (
            <span className="fastnear-reference-schema__flag">{schema.refName}</span>
          ) : null}
        </div>
        {schema.required?.length ? (
          <span className="fastnear-reference-schema__hint">
            requires {schema.required.join(", ")}
          </span>
        ) : null}
      </div>

      {schema.description ? (
        <p className="fastnear-reference-schema__description">
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
          Default: <code>{String(schema.default)}</code>
        </p>
      ) : null}

      {schema.example !== undefined ? (
        <p className="fastnear-reference-schema__meta">
          Example: <code>{String(schema.example)}</code>
        </p>
      ) : null}

      {inlineOneOf ? (
        <div className="fastnear-reference-schema__inline-variants">
          {schema.oneOf.map((variant, index) => (
            <span
              className="fastnear-reference-schema__inline-variant"
              key={`${name || "variant"}-oneof-inline-${index}`}
            >
              {getSchemaVariantLabel(variant, `Option ${index + 1}`)}
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
                {getSchemaVariantLabel(variant, `Option ${index + 1}`)}
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
              {getSchemaVariantLabel(variant, `Shape ${index + 1}`)}
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
                {getSchemaVariantLabel(variant, `Shape ${index + 1}`)}
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
    if (pageModel.route.transport === "json-rpc") {
      return `This operation accepts a JSON-RPC body over ${pageModel.route.method} to ${pageModel.route.path}.`;
    }

    if (httpHasBody) {
      return `This operation performs ${pageModel.route.method} ${pageModel.route.path} with an ${pageModel.request.mediaType || "HTTP"} request body.`;
    }

    return `This operation performs ${pageModel.route.method} ${pageModel.route.path}.`;
  }, [httpHasBody, pageModel.request.mediaType, pageModel.route.method, pageModel.route.path, pageModel.route.transport]);

  const handleExampleSelect = (exampleId) => {
    if (selectedExampleId === undefined) {
      setUncontrolledExampleId(exampleId);
    }

    onExampleSelect?.(exampleId);
  };

  return (
    <section className="fastnear-reference" aria-labelledby={headingId}>
      <div className="fastnear-reference__grid">
        <div className="fastnear-reference__panel">
          <div className="fastnear-reference__heading-row">
            <HeadingTag id={headingId}>Request reference</HeadingTag>
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
              role="tablist"
              aria-label="Request examples"
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

          <div className="fastnear-reference__summary">
            <p>{requestSummary}</p>
            <p>
              Required request inputs: <strong>{pageModel.request.required ? "yes" : "no"}</strong>
            </p>
          </div>

          {pageModel.route.transport === "json-rpc" ? (
            <>
              <pre className="fastnear-reference__code fastnear-reference__code--example">
                {formatJson(activeExample?.request?.body)}
              </pre>

              <div className="fastnear-reference__schema-block">
                <h3>Request schema</h3>
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
                    <h3>Request body schema</h3>
                    <SchemaNode schema={pageModel.request.bodySchema} />
                  </div>
                </>
              ) : null}

              <ParameterGroup parameters={pageModel.request.parameters.path} title="Path parameters" />
              <ParameterGroup
                parameters={pageModel.request.parameters.query}
                title="Query parameters"
              />
              <ParameterGroup
                parameters={pageModel.request.parameters.header}
                title="Header parameters"
              />
            </>
          )}
        </div>

        <div className="fastnear-reference__panel">
          <div className="fastnear-reference__heading-row">
            <HeadingTag>Response reference</HeadingTag>
            <span className="fastnear-reference__badge">
              {response?.status} {response?.mediaType}
            </span>
          </div>

          <p className="fastnear-reference__response-description">
            {renderInlineCodeText(response?.description)}
          </p>

          <div className="fastnear-reference__schema-block">
            <h3>Response schema</h3>
            <SchemaNode schema={response?.schema} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FastnearOperationPage({ pageModel }) {
  const auth = usePortalAuth();
  const [selectedNetwork, setSelectedNetwork] = useState(() => getInitialNetwork(pageModel));
  const [selectedExampleId, setSelectedExampleId] = useState(
    () =>
      pageModel.request.examples.find((example) => example.network === getInitialNetwork(pageModel))?.id ||
      pageModel.request.examples[0]?.id ||
      ""
  );
  const [selectedFinality, setSelectedFinality] = useState("final");
  const [fieldValues, setFieldValues] = useState(() =>
    getDefaultFieldValues(pageModel, getInitialNetwork(pageModel))
  );
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);
  const [runResult, setRunResult] = useState(null);
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
    const matchingExample = pageModel.request.examples.find(
      (example) => example.network === selectedNetwork
    );
    setSelectedExampleId(matchingExample?.id || pageModel.request.examples[0]?.id || "");
    setFieldValues(getDefaultFieldValues(pageModel, selectedNetwork));
  }, [pageModel, selectedNetwork]);

  useEffect(() => {
    const targetFieldName = RUNTIME_STATUS_FIELD_DEFAULTS[pageModel.pageModelId];
    if (!targetFieldName || !selectedNetworkDetails?.url) {
      return undefined;
    }

    const targetField = pageModel.interaction.fields.find((field) => field.name === targetFieldName);
    if (!targetField) {
      return undefined;
    }

    const expectedDefaultValue = getDefaultFieldValue(pageModel, targetField, selectedNetwork).trim();
    const controller = new AbortController();

    void (async () => {
      const latestBlockHeight = await fetchLatestBlockHeight(
        selectedNetworkDetails.url,
        controller.signal
      );

      if (!Number.isFinite(latestBlockHeight)) {
        return;
      }

      setFieldValues((currentValues) => {
        const currentValue = (currentValues[targetFieldName] || "").trim();
        if (currentValue && currentValue !== expectedDefaultValue) {
          return currentValues;
        }

        return {
          ...currentValues,
          [targetFieldName]: String(latestBlockHeight),
        };
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
  const runResultText = useMemo(() => getRunResultText(runResult), [runResult]);
  const currentUrl =
    typeof window !== "undefined" ? sanitizePublicUrl(window.location.href) : pageModel.canonicalPath;
  const operationMarkdown = useMemo(
    () =>
      buildOperationMarkdown({
        currentUrl,
        httpRequestBody,
        pageModel,
        requestUrl,
        rpcPayload,
        selectedExample,
        selectedFinality,
        selectedNetworkDetails,
      }),
    [
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
        label: "Copy Markdown",
        pendingLabel: "Copying...",
        completedLabel: "Copied",
        onSelect: async () => {
          await copyTextToClipboard(operationMarkdown);
        },
      },
    ],
    [operationMarkdown]
  );

  const handleNetworkChange = (networkKey) => {
    setSelectedNetwork(networkKey);
    setRunError(null);
    setRunResult(null);
    setCopiedResponse(false);
  };

  const handleFinalityChange = (finality) => {
    setSelectedFinality(finality);
    setRunError(null);
    setRunResult(null);
    setCopiedResponse(false);
  };

  const handleFieldChange = (fieldName, value) => {
    setFieldValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
    setRunError(null);
    setRunResult(null);
    setCopiedResponse(false);
  };

  const handleExampleSelect = (exampleId) => {
    const example = pageModel.request.examples.find((candidate) => candidate.id === exampleId);
    if (!example) {
      return;
    }

    setSelectedExampleId(example.id);
    if (example.network) {
      setSelectedNetwork(example.network);
    }

    const nextFieldValues = {
      ...getDefaultFieldValues(pageModel, example.network || selectedNetwork),
      ...(pageModel.route.transport === "json-rpc" &&
      example.request?.body &&
      typeof example.request.body === "object" &&
      !Array.isArray(example.request.body) &&
      example.request.body.params &&
      typeof example.request.body.params === "object" &&
      !Array.isArray(example.request.body.params)
        ? example.request.body.params
        : pageModel.route.transport === "json-rpc"
          ? {}
          : example.request?.body || {}),
      ...(example.request?.path || {}),
      ...(example.request?.query || {}),
    };

    setFieldValues(
      Object.fromEntries(
        Object.entries(nextFieldValues).map(([key, value]) => {
          const field = pageModel.interaction.fields.find((candidate) => candidate.name === key);
          return [key, field ? serializeFieldDraftValue(field, value) : String(value)];
        })
      )
    );
  };

  const handleRun = async () => {
    if (missingField) {
      setRunError(`Enter ${missingField.label.toLowerCase()} before running the request.`);
      return;
    }

    try {
      setIsRunning(true);
      setRunError(null);
      setCopiedResponse(false);

      if (pageModel.route.transport === "json-rpc") {
        if (!selectedNetworkDetails?.url || !rpcPayload) {
          throw new Error("No RPC server is configured for the selected network.");
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
        try {
          setRunResult({
            kind: "json",
            ok: response.ok,
            status: response.status,
            url: selectedNetworkDetails.url,
            value: JSON.parse(responseText),
          });
        } catch (_error) {
          setRunResult({
            kind: "text",
            ok: response.ok,
            status: response.status,
            url: selectedNetworkDetails.url,
            value: responseText,
          });
        }
        return;
      }

      if (!requestUrl) {
        throw new Error("No API server is configured for the selected network.");
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
      try {
        setRunResult({
          kind: "json",
          ok: response.ok,
          status: response.status,
          url: requestUrl.toString(),
          value: JSON.parse(responseText),
        });
      } catch (_error) {
        setRunResult({
          kind: "text",
          ok: response.ok,
          status: response.status,
          url: requestUrl.toString(),
          value: responseText,
        });
      }
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Request failed.");
      setRunResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fastnear-operation-page">
      <div className="fastnear-operation-page__toolbar">
        <PageActions actions={pageActions} />
      </div>

      <div className="fastnear-interaction">
        <div className="fastnear-interaction__layout">
          <div className="fastnear-interaction__sidebar">
            <div className="fastnear-interaction__controls">
              <div className="fastnear-interaction__field fastnear-interaction__field--network">
                <span className="fastnear-interaction__label">Network</span>
                <div
                  className="fastnear-segmented fastnear-segmented--network"
                  role="tablist"
                  aria-label="Select network"
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
                        { label: "True", value: "true" },
                        { label: "False", value: "false" },
                      ]
                    : [
                        { label: "Unset", value: "" },
                        { label: "True", value: "true" },
                        { label: "False", value: "false" },
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
                        aria-label={`Select ${field.label}`}
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
                    : [{ label: "Any", value: "" }].concat(
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
                      <div className="fastnear-segmented" role="tablist" aria-label={`Select ${field.label}`}>
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
                <span className="fastnear-interaction__label">FastNear API key</span>
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
                placeholder="Paste FastNear API key"
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
                <span>Get API key</span>
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
                      Save API key
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
                      Remove saved key
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="fastnear-interaction__actions">
              <button
                type="button"
                className="fastnear-button fastnear-button--primary"
                onClick={handleRun}
                disabled={isRunning || !!missingField}
              >
                {isRunning ? "Sending..." : "Send request"}
              </button>
              <button
                type="button"
                className="fastnear-button fastnear-button--secondary"
                onClick={async () => {
                  if (!curlCommand) {
                    return;
                  }

                  await copyTextToClipboard(curlCommand);
                  setCopiedCurl(true);
                }}
                disabled={!curlCommand}
              >
                {copiedCurl ? "Copied curl command" : "Copy curl command"}
              </button>
            </div>

            <div className="fastnear-interaction__meta">
              <div className="fastnear-interaction__meta-item">
                <span className="fastnear-interaction__meta-label">Endpoint</span>
                <code>
                  {pageModel.route.transport === "json-rpc"
                    ? selectedNetworkDetails?.url
                    : requestUrl?.origin || selectedNetworkDetails?.url}
                </code>
              </div>
              {pageModel.interaction.supportsFinality ? (
                <div className="fastnear-interaction__meta-item fastnear-interaction__meta-item--finality">
                  <span className="fastnear-interaction__meta-label">Finality</span>
                  <div
                    className="fastnear-segmented fastnear-segmented--finality"
                    role="tablist"
                    aria-label="Select finality"
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
                <span className="fastnear-interaction__meta-label">Auth</span>
                <span className="fastnear-interaction__meta-value">{effectiveAuthSummary}</span>
              </div>
            </div>
          </div>

          <div className="fastnear-interaction__response">
            <div className="fastnear-interaction__response-header">
              <div className="fastnear-interaction__response-heading">
                <span className="fastnear-interaction__label">Live Response</span>
                <p className="fastnear-interaction__response-copy">
                  Responses from the selected endpoint appear here after you run a request.
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
                      {runResult.ok && !hasRpcError ? "Success" : "Error"}
                    </span>
                    <span>HTTP {runResult.status}</span>
                    <code className="fastnear-interaction__result-url">{runResult.url}</code>
                  </div>

                  <div className="fastnear-interaction__result-shell">
                    <button
                      type="button"
                      className={`fastnear-interaction__copy-button ${
                        copiedResponse ? "is-copied" : ""
                      }`}
                      onClick={async () => {
                        if (!runResultText) {
                          return;
                        }

                        await copyTextToClipboard(runResultText);
                        setCopiedResponse(true);
                      }}
                      aria-label={copiedResponse ? "Response copied" : "Copy response"}
                      title={copiedResponse ? "Response copied" : "Copy response"}
                    >
                      {copiedResponse ? (
                        <CheckGlyph className="fastnear-interaction__copy-icon" />
                      ) : (
                        <CopyGlyph className="fastnear-interaction__copy-icon" />
                      )}
                    </button>
                    <pre className="fastnear-interaction__text-response">
                      {runResultText}
                    </pre>
                  </div>
                </>
              ) : (
                <p className="fastnear-interaction__placeholder fastnear-interaction__placeholder--panel">
                  Live response output will appear here after you run a request.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <FastnearOperationReference
        pageModel={pageModel}
        selectedExampleId={selectedExampleId}
        onExampleSelect={handleExampleSelect}
      />
    </div>
  );
}

export default function FastnearDirectOperation({ pageModelId }) {
  const pageModel = getFastnearPageModelById(pageModelId);
  const seoKeywords = useMemo(() => buildOperationKeywords(pageModel), [pageModel]);

  if (!pageModel) {
    return (
      <div className="builder-fastnear-direct">
        <p className="fastnear-interaction__error">
          No generated page model is available for <code>{pageModelId}</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="builder-fastnear-direct">
      {seoKeywords.length ? (
        <Head>
          <meta name="keywords" content={seoKeywords.join(', ')} />
        </Head>
      ) : null}
      <FastnearOperationPage pageModel={pageModel} />
    </div>
  );
}

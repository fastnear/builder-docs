const pageModels = require('../../../src/data/generatedFastnearPageModels.json');
const structuredGraph = require('../../../src/data/generatedFastnearStructuredGraph.json');
const {
  OPERATION_QUERY_PARAMS,
} = require('../../../src/utils/fastnearOperationUrlState');
const {
  computeFieldValuesForExample,
  pickInitialExample,
} = require('../../../src/utils/fastnearOperationSelection');
const {
  fieldSupportsType,
  isArrayField,
  isBooleanField,
  isObjectField,
  parseFieldValue,
} = require('../../../src/utils/fastnearFieldValueCodec');

const pathMapsByType = {
  canonicalPath: Object.fromEntries(
    (structuredGraph.operations || []).map((operation) => [operation.pageModelId, operation.canonicalPath])
  ),
  docsPath: Object.fromEntries(
    (structuredGraph.operations || []).map((operation) => [operation.pageModelId, operation.docsPath])
  ),
};

function normalizeUrl(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function buildMatrixQuery(pageModel) {
  const networkKey = pageModel.interaction.networks[0]?.key || 'mainnet';
  const example = pickInitialExample(pageModel, networkKey);
  const fieldValues = computeFieldValuesForExample(pageModel, networkKey, example);
  const params = new URLSearchParams();

  params.set(OPERATION_QUERY_PARAMS.network, networkKey);

  for (const field of pageModel.interaction.fields) {
    const value = fieldValues[field.name];
    if (!value || !value.trim()) {
      continue;
    }

    params.set(field.name, value);
  }

  return {
    network: pageModel.interaction.networks.find((candidate) => candidate.key === networkKey),
    queryString: params.toString(),
    trimmedFieldValues: Object.fromEntries(
      Object.entries(fieldValues).map(([key, value]) => [key, value.trim()])
    ),
  };
}

function buildExpectedHttpRequest(pageModel, network, trimmedFieldValues) {
  const path = pageModel.interaction.fields.reduce((currentPath, field) => {
    if (field.location !== 'path') {
      return currentPath;
    }

    const value = trimmedFieldValues[field.name];
    return currentPath.replace(`{${field.name}}`, encodeURIComponent(value));
  }, pageModel.route.path);

  const url = new URL(path, network.url);
  const body = {};

  for (const field of pageModel.interaction.fields) {
    const value = trimmedFieldValues[field.name];
    if (!value) {
      continue;
    }

    if (field.location === 'query') {
      url.searchParams.set(field.name, value);
    }

    if (field.location === 'body') {
      body[field.name] = parseFieldValue(field, value);
    }
  }

  return {
    body: Object.keys(body).length ? body : undefined,
    url: url.toString(),
  };
}

function buildExpectedRpcFields(pageModel, trimmedFieldValues) {
  return Object.fromEntries(
    pageModel.interaction.fields.flatMap((field) => {
      const value = trimmedFieldValues[field.name];
      if (!value) {
        return [];
      }

      return [[field.name, parseFieldValue(field, value)]];
    })
  );
}

async function fulfillRpcRoute(route, capture) {
  const request = route.request();
  const url = new URL(request.url());

  if (request.method() === 'GET' && url.pathname === '/status') {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sync_info: {
          latest_block_height: 999999,
          latest_block_hash: 'latest-block-hash',
        },
      }),
    });
    return;
  }

  const payload = request.postDataJSON();
  if (payload?.id === 'fastnear-docs') {
    let result = {};

    if (payload.method === 'status') {
      result = {
        sync_info: {
          latest_block_height: 999999,
          latest_block_hash: 'latest-block-hash',
        },
      };
    } else if (payload.method === 'block') {
      result = { chunks: [] };
    } else if (payload.method === 'chunk') {
      result = { transactions: [], receipts: [] };
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear-docs',
        result,
      }),
    });
    return;
  }

  capture.payload = payload;
  capture.url = request.url();

  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: payload?.id || 'fastnear',
      result: {},
    }),
  });
}

function getMatrixCases(pathType) {
  const pathByPageModelId = pathMapsByType[pathType];
  if (!pathByPageModelId) {
    throw new Error(`Unsupported path type for URL prefill matrix: ${pathType}`);
  }

  return pageModels
    .filter((pageModel) => pageModel.interaction?.fields?.length > 0)
    .map((pageModel) => ({
      pageModel,
      path: pathByPageModelId[pageModel.pageModelId],
    }))
    .filter((entry) => entry.path);
}

async function runUrlPrefillMatrixCase({ page, expect, path, pageModel, assertPageReady }) {
  const { network, queryString, trimmedFieldValues } = buildMatrixQuery(pageModel);
  const capture = {};

  await page.route(`${new URL(network.url).origin}/**`, async (route) => {
    if (pageModel.route.transport === 'json-rpc') {
      await fulfillRpcRoute(route, capture);
      return;
    }

    const request = route.request();
    capture.url = request.url();
    capture.body = request.postData() ? request.postDataJSON() : undefined;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto(`${path}?${queryString}`);

  if (assertPageReady) {
    await assertPageReady({ page, pageModel });
  }

  await page.locator('.fastnear-interaction__actions .fastnear-button--primary').click();

  if (pageModel.route.transport === 'json-rpc') {
    const expectedFields = buildExpectedRpcFields(pageModel, trimmedFieldValues);

    await expect.poll(() => capture.payload).toBeTruthy();
    expect(normalizeUrl(capture.url)).toBe(normalizeUrl(network.url));
    expect(capture.payload).toBeDefined();

    for (const [fieldName, fieldValue] of Object.entries(expectedFields)) {
      expect(capture.payload.params[fieldName]).toEqual(fieldValue);
    }

    return;
  }

  const expectedRequest = buildExpectedHttpRequest(pageModel, network, trimmedFieldValues);

  await expect.poll(() => capture.url).toBe(expectedRequest.url);
  if (expectedRequest.body) {
    expect(capture.body).toEqual(expectedRequest.body);
  } else {
    expect(capture.body).toBeUndefined();
  }
}

module.exports = {
  getMatrixCases,
  runUrlPrefillMatrixCase,
};

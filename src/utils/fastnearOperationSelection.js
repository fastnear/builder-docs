const { serializeFieldDraftValue } = require("./fastnearFieldValueCodec");

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

function pickInitialExample(pageModel, networkKey) {
  const examples = pageModel.request?.examples || [];
  if (examples.length === 0) {
    return null;
  }

  return examples.find((example) => example.network === networkKey) || examples[0] || null;
}

function computeFieldValuesForExample(pageModel, networkKey, example) {
  const defaults = getDefaultFieldValues(pageModel, networkKey);
  if (!example) {
    return defaults;
  }

  const fieldByName = Object.fromEntries(
    pageModel.interaction.fields.map((field) => [field.name, field])
  );
  const isJsonRpc = pageModel.route.transport === "json-rpc";
  const body = example.request?.body;
  const hasJsonRpcParams =
    isJsonRpc &&
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    body.params &&
    typeof body.params === "object" &&
    !Array.isArray(body.params);
  const bodyMerge = isJsonRpc ? (hasJsonRpcParams ? body.params : {}) : body || {};

  const merged = {
    ...defaults,
    ...bodyMerge,
    ...(example.request?.path || {}),
    ...(example.request?.query || {}),
  };

  return Object.fromEntries(
    Object.entries(merged).map(([key, value]) => {
      const field = fieldByName[key];
      return [key, field ? serializeFieldDraftValue(field, value) : String(value)];
    })
  );
}

function buildOperationSelectionState(pageModel, networkKey, example, fieldOverrides = {}) {
  return {
    selectedExampleId: example?.id || "",
    fieldValues: {
      ...computeFieldValuesForExample(pageModel, networkKey, example),
      ...fieldOverrides,
    },
  };
}

module.exports = {
  buildOperationSelectionState,
  computeFieldValuesForExample,
  getDefaultFieldValue,
  getDefaultFieldValues,
  pickInitialExample,
};

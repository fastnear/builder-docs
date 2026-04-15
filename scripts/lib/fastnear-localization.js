const path = require("node:path");
const fs = require("node:fs");

const {
  DEFAULT_LOCALE,
} = require("./localized-routes");
const { SRC_DATA_ROOT } = require("./locale-framework");

function loadTranslationCatalogs() {
  return Object.fromEntries(
    fs
      .readdirSync(SRC_DATA_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((fileName) => /^fastnearTranslations\.[A-Za-z0-9-]+\.json$/.test(fileName))
      .map((fileName) => {
        const match = fileName.match(/^fastnearTranslations\.([A-Za-z0-9-]+)\.json$/);
        return [
          match[1],
          require(path.join(SRC_DATA_ROOT, fileName)),
        ];
      })
  );
}

const TRANSLATION_CATALOGS = loadTranslationCatalogs();

function cloneJsonValue(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function getLocaleCatalog(locale) {
  if (!locale || locale === DEFAULT_LOCALE) {
    return null;
  }

  return TRANSLATION_CATALOGS[locale] || null;
}

function translateExactString(value, locale) {
  const catalog = getLocaleCatalog(locale);
  if (!catalog || typeof value !== "string") {
    return value;
  }

  return catalog.strings?.[value] || value;
}

function translateRecursive(value, locale) {
  if (Array.isArray(value)) {
    return value.map((entry) => translateRecursive(entry, locale));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, translateRecursive(entryValue, locale)])
    );
  }

  return translateExactString(value, locale);
}

function applyStringFields(target, translations, keys) {
  if (!target || !translations) {
    return;
  }

  keys.forEach((key) => {
    if (typeof translations[key] === "string") {
      target[key] = translations[key];
    }
  });
}

function localizeFieldGroup(fields, translatedFields) {
  if (!Array.isArray(fields) || !translatedFields) {
    return fields;
  }

  return fields.map((field) => {
    const nextField = cloneJsonValue(field);
    const translation = translatedFields[field.name];
    if (translation) {
      applyStringFields(nextField, translation, ["label", "description"]);
    }
    return nextField;
  });
}

function localizeExampleGroup(examples, translatedExamples) {
  if (!Array.isArray(examples) || !translatedExamples) {
    return examples;
  }

  return examples.map((example) => {
    const nextExample = cloneJsonValue(example);
    const translation = translatedExamples[example.id];
    if (translation) {
      applyStringFields(nextExample, translation, ["label", "description", "summary"]);
    }
    return nextExample;
  });
}

function localizeResponseGroup(responses, translatedResponses) {
  if (!Array.isArray(responses) || !translatedResponses) {
    return responses;
  }

  return responses.map((response, index) => {
    const nextResponse = cloneJsonValue(response);
    const translation = translatedResponses[response.status || String(index)];
    if (translation) {
      applyStringFields(nextResponse, translation, ["description", "summary"]);
    }
    return nextResponse;
  });
}

function localizeSecuritySchemes(schemes, translatedSchemes) {
  if (!Array.isArray(schemes) || !translatedSchemes) {
    return schemes;
  }

  return schemes.map((scheme) => {
    const nextScheme = cloneJsonValue(scheme);
    const translation = translatedSchemes[scheme.id || scheme.name];
    if (translation) {
      applyStringFields(nextScheme, translation, ["description"]);
    }
    return nextScheme;
  });
}

function localizePageModel(pageModel, locale = DEFAULT_LOCALE) {
  const catalog = getLocaleCatalog(locale);
  if (!catalog || !pageModel) {
    return pageModel;
  }

  const localizedPageModel = translateRecursive(cloneJsonValue(pageModel), locale);
  const pageModelTranslations = catalog.pageModels?.[pageModel.pageModelId];
  if (!pageModelTranslations) {
    return localizedPageModel;
  }

  applyStringFields(localizedPageModel.info, pageModelTranslations.info, [
    "title",
    "summary",
    "description",
    "headline",
  ]);

  if (pageModelTranslations.interaction?.fields) {
    localizedPageModel.interaction.fields = localizeFieldGroup(
      localizedPageModel.interaction.fields,
      pageModelTranslations.interaction.fields
    );
  }

  if (pageModelTranslations.interaction?.networks && Array.isArray(localizedPageModel.interaction?.networks)) {
    localizedPageModel.interaction.networks = localizedPageModel.interaction.networks.map((network) => {
      const translation = pageModelTranslations.interaction.networks[network.key || network.label];
      if (translation) {
        applyStringFields(network, translation, ["label", "description"]);
      }
      return network;
    });
  }

  if (pageModelTranslations.examples) {
    localizedPageModel.request.examples = localizeExampleGroup(
      localizedPageModel.request.examples,
      pageModelTranslations.examples
    );
  }

  if (pageModelTranslations.responses) {
    localizedPageModel.responses = localizeResponseGroup(
      localizedPageModel.responses,
      pageModelTranslations.responses
    );
  }

  if (pageModelTranslations.securitySchemes) {
    localizedPageModel.securitySchemes = localizeSecuritySchemes(
      localizedPageModel.securitySchemes,
      pageModelTranslations.securitySchemes
    );
  }

  if (pageModelTranslations.request?.parameters) {
    localizedPageModel.request.parameters = Object.fromEntries(
      Object.entries(localizedPageModel.request.parameters || {}).map(([location, fields]) => [
        location,
        localizeFieldGroup(fields, pageModelTranslations.request.parameters[location]),
      ])
    );
  }

  return localizedPageModel;
}

function localizeStructuredFamily(family, locale = DEFAULT_LOCALE) {
  const catalog = getLocaleCatalog(locale);
  if (!catalog || !family) {
    return family;
  }

  const localizedFamily = translateRecursive(cloneJsonValue(family), locale);
  applyStringFields(localizedFamily, catalog.families?.[family.id], ["name", "description"]);
  return localizedFamily;
}

function localizeStructuredOperation(operation, locale = DEFAULT_LOCALE) {
  const catalog = getLocaleCatalog(locale);
  if (!catalog || !operation) {
    return operation;
  }

  const localizedOperation = translateRecursive(cloneJsonValue(operation), locale);
  const pageModelTranslations = catalog.pageModels?.[operation.pageModelId];
  if (pageModelTranslations?.info) {
    applyStringFields(localizedOperation, pageModelTranslations.info, [
      "name",
      "headline",
      "summary",
      "description",
    ]);
  }

  return localizedOperation;
}

function localizeBreadcrumbItems(items, locale = DEFAULT_LOCALE) {
  const catalog = getLocaleCatalog(locale);
  if (!catalog || !Array.isArray(items)) {
    return items;
  }

  return items.map((item) => {
    const localizedItem = cloneJsonValue(item);
    const routeTranslation = catalog.routes?.[item.path];
    if (routeTranslation?.label) {
      localizedItem.label = routeTranslation.label;
    } else {
      localizedItem.label = translateExactString(item.label, locale);
    }
    return localizedItem;
  });
}

function localizeFastnearString(value, locale = DEFAULT_LOCALE) {
  return translateExactString(value, locale);
}

module.exports = {
  DEFAULT_LOCALE,
  getLocaleCatalog,
  localizeBreadcrumbItems,
  localizeFastnearString,
  localizePageModel,
  localizeStructuredFamily,
  localizeStructuredOperation,
};

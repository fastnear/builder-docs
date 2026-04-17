#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const { auditPageModels, loadPageModels } = require("./audit-generated-page-models");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src/data");
const OUTPUT_FILENAME_PREFIX = "generatedFastnearOperationSearchContent";
const CATALOG_FILENAME_RE = /^fastnearTranslations\.([A-Za-z0-9-]+)\.json$/;

function cloneJsonValue(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function translateStringsRecursive(value, stringsMap) {
  if (Array.isArray(value)) {
    return value.map((entry) => translateStringsRecursive(entry, stringsMap));
  }

  if (value && typeof value === "object") {
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = translateStringsRecursive(entry, stringsMap);
    }
    return result;
  }

  if (typeof value === "string" && stringsMap[value]) {
    return stringsMap[value];
  }

  return value;
}

function applyStringFields(target, translations, keys) {
  if (!target || !translations) {
    return;
  }

  for (const key of keys) {
    if (typeof translations[key] === "string" && translations[key].length) {
      target[key] = translations[key];
    }
  }
}

function localizeFieldGroup(fields, translatedFields) {
  if (!Array.isArray(fields) || !translatedFields) {
    return fields;
  }

  return fields.map((field) => {
    const next = cloneJsonValue(field);
    const translation = translatedFields[field?.name];
    if (translation) {
      applyStringFields(next, translation, ["label", "description"]);
    }
    return next;
  });
}

function localizeResponseGroup(responses, translatedResponses) {
  if (!Array.isArray(responses) || !translatedResponses) {
    return responses;
  }

  return responses.map((response, index) => {
    const next = cloneJsonValue(response);
    const translation = translatedResponses[response?.status || String(index)];
    if (translation) {
      applyStringFields(next, translation, ["description", "summary"]);
    }
    return next;
  });
}

function localizePageModelForLocale(pageModel, catalog) {
  if (!catalog) {
    return cloneJsonValue(pageModel);
  }

  const stringsMap = catalog.strings || {};
  const translated = translateStringsRecursive(cloneJsonValue(pageModel), stringsMap);
  const overrides = catalog.pageModels?.[pageModel.pageModelId];
  if (!overrides) {
    return translated;
  }

  applyStringFields(translated.info, overrides.info, [
    "title",
    "summary",
    "description",
    "headline",
  ]);

  if (overrides.interaction?.fields && translated.interaction?.fields) {
    translated.interaction.fields = localizeFieldGroup(
      translated.interaction.fields,
      overrides.interaction.fields
    );
  }

  if (overrides.request?.parameters && translated.request?.parameters) {
    const next = {};
    for (const [location, group] of Object.entries(translated.request.parameters)) {
      next[location] = localizeFieldGroup(group, overrides.request.parameters[location]);
    }
    translated.request.parameters = next;
  }

  if (overrides.responses && translated.responses) {
    translated.responses = localizeResponseGroup(translated.responses, overrides.responses);
  }

  return translated;
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
}

function collectParameterEntries(pageModel) {
  const entries = [];
  const seen = new Set();

  const pushField = (field) => {
    const name = normalizeText(field?.name);
    const description = normalizeText(field?.description) || normalizeText(field?.schema?.description);
    if (!name && !description) {
      return;
    }

    const key = `${name}::${description}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    entries.push({ name, description });
  };

  (pageModel?.interaction?.fields || []).forEach(pushField);

  const parameterGroups = pageModel?.request?.parameters;
  if (parameterGroups && typeof parameterGroups === "object") {
    for (const location of ["header", "path", "query"]) {
      (parameterGroups[location] || []).forEach(pushField);
    }
  }

  return entries;
}

function collectSchemaEntries(schema, entries, seenKeys, depth = 0) {
  if (!schema || depth > 8) {
    return;
  }

  const description = normalizeText(schema.description);
  const name = normalizeText(schema.name || schema.refName);

  if (description && name) {
    const key = `${name}::${description}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      entries.push({ name, description });
    }
  }

  if (Array.isArray(schema.properties)) {
    schema.properties.forEach((property) => {
      const propertyName = normalizeText(property?.name);
      const propertyDescription =
        normalizeText(property?.description) ||
        normalizeText(property?.schema?.description);

      if (propertyName && propertyDescription) {
        const key = `${propertyName}::${propertyDescription}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          entries.push({ name: propertyName, description: propertyDescription });
        }
      }

      if (property?.schema) {
        collectSchemaEntries(property.schema, entries, seenKeys, depth + 1);
      }
    });
  }

  if (schema.items) {
    collectSchemaEntries(schema.items, entries, seenKeys, depth + 1);
  }

  if (Array.isArray(schema.oneOf)) {
    schema.oneOf.forEach((variant) => collectSchemaEntries(variant, entries, seenKeys, depth + 1));
  }

  if (Array.isArray(schema.anyOf)) {
    schema.anyOf.forEach((variant) => collectSchemaEntries(variant, entries, seenKeys, depth + 1));
  }
}

function collectResponseEntries(pageModel) {
  const descriptions = [];
  const schemaEntries = [];
  const seenDescriptions = new Set();
  const seenSchemaKeys = new Set();

  (pageModel?.responses || []).forEach((response) => {
    const description = normalizeText(response?.description);
    if (description && !seenDescriptions.has(description)) {
      seenDescriptions.add(description);
      descriptions.push(description);
    }

    collectSchemaEntries(response?.schema, schemaEntries, seenSchemaKeys);
  });

  return { descriptions, schemaEntries };
}

function buildSearchContentEntry(pageModel) {
  const description = normalizeText(pageModel?.info?.description);
  const parameters = collectParameterEntries(pageModel);
  const { descriptions: responseDescriptions, schemaEntries } = collectResponseEntries(pageModel);

  const entry = {};
  if (description) {
    entry.description = description;
  }
  if (parameters.length) {
    entry.parameters = parameters;
  }
  if (responseDescriptions.length) {
    entry.response = responseDescriptions.join(" ");
  }
  if (schemaEntries.length) {
    entry.schema = schemaEntries;
  }

  return entry;
}

function loadTranslationCatalogs() {
  const catalogs = { en: null };
  for (const filename of fs.readdirSync(DATA_DIR)) {
    const match = filename.match(CATALOG_FILENAME_RE);
    if (!match) {
      continue;
    }
    const locale = match[1];
    const catalog = JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), "utf8"));
    catalogs[locale] = catalog;
  }
  return catalogs;
}

function writeJsonFile(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  const pageModels = loadPageModels();
  auditPageModels(pageModels);

  const catalogs = loadTranslationCatalogs();
  const locales = Object.keys(catalogs).sort();

  const summary = [];

  for (const locale of locales) {
    const catalog = catalogs[locale];
    const entries = {};

    pageModels.forEach((pageModel) => {
      const localized = localizePageModelForLocale(pageModel, catalog);
      const entry = buildSearchContentEntry(localized);
      if (Object.keys(entry).length) {
        entries[pageModel.pageModelId] = entry;
      }
    });

    const sortedEntries = Object.fromEntries(
      Object.entries(entries).sort(([left], [right]) => left.localeCompare(right))
    );

    const outputPath = path.join(DATA_DIR, `${OUTPUT_FILENAME_PREFIX}.${locale}.json`);
    writeJsonFile(outputPath, sortedEntries);
    summary.push(`  ${locale}: ${Object.keys(sortedEntries).length} entries -> ${path.relative(ROOT, outputPath)}`);
  }

  console.log(`Generated FastNear operation search content for ${locales.length} locale(s):`);
  summary.forEach((line) => console.log(line));
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSearchContentEntry,
  localizePageModelForLocale,
};

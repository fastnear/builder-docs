const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "../..");
const SRC_DATA_ROOT = path.join(ROOT, "src", "data");
const I18N_ROOT = path.join(ROOT, "i18n");
const LOCALE_REGISTRY_PATH = path.join(SRC_DATA_ROOT, "localeRegistry.json");
const localeRegistry = JSON.parse(fs.readFileSync(LOCALE_REGISTRY_PATH, "utf8"));

const DEFAULT_LOCALE = localeRegistry.defaultLocale;
const SUPPORTED_LOCALES = Object.keys(localeRegistry.locales);
const NON_DEFAULT_LOCALES = SUPPORTED_LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

function assertSupportedLocale(locale, { allowDefault = false } = {}) {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    throw new Error(
      `Unsupported locale "${locale}". Expected one of: ${SUPPORTED_LOCALES.join(", ")}`
    );
  }

  if (!allowDefault && locale === DEFAULT_LOCALE) {
    throw new Error(`Locale "${locale}" is the default locale and does not use i18n scaffolding.`);
  }
}

function loadYamlIfExists(filePath, fallbackValue) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  const parsed = yaml.load(fs.readFileSync(filePath, "utf8"));
  return parsed === undefined ? fallbackValue : parsed;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeReplacementList(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (!entry || typeof entry !== "object") {
          return null;
        }

        if (typeof entry.from !== "string" || typeof entry.to !== "string") {
          return null;
        }

        return {
          from: entry.from,
          to: entry.to,
        };
      })
      .filter(Boolean);
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "string")
      .map(([from, to]) => ({ from, to }));
  }

  return [];
}

function getLocaleRoot(locale) {
  return path.join(I18N_ROOT, locale);
}

function getLocaleDocsRoot(locale) {
  return path.join(getLocaleRoot(locale), "docusaurus-plugin-content-docs", "current");
}

function getLocaleFastnearTranslationsPath(locale) {
  return path.join(SRC_DATA_ROOT, `fastnearTranslations.${locale}.json`);
}

function getLocaleGlossaryPath(locale) {
  return path.join(getLocaleRoot(locale), "glossary.yml");
}

function getLocalePolicyPath(locale) {
  return path.join(getLocaleRoot(locale), "translation-policy.yml");
}

function getLocaleGlossary(locale) {
  assertSupportedLocale(locale);

  const glossary = loadYamlIfExists(getLocaleGlossaryPath(locale), {});
  const preserve = ensureArray(glossary.preserve).filter((value) => typeof value === "string");
  const translate = glossary.translate || {};
  const transliterate = glossary.transliterate || {};

  return {
    notes: ensureArray(glossary.notes).filter((value) => typeof value === "string"),
    preserve,
    translate: {
      exact: normalizeReplacementList(translate.exact),
      words: normalizeReplacementList(translate.words),
    },
    transliterate: {
      words: normalizeReplacementList(transliterate.words),
    },
  };
}

function normalizeWave(value) {
  return {
    docs: ensureArray(value?.docs).filter((entry) => typeof entry === "string"),
    pageModels: ensureArray(value?.pageModels).filter((entry) => typeof entry === "string"),
  };
}

function normalizeHiddenSection(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  if (typeof entry.routePrefix !== "string") {
    return null;
  }

  return {
    id:
      typeof entry.id === "string"
        ? entry.id
        : entry.routePrefix.replace(/^\//, "").replace(/[^\w-]+/g, "-"),
    routePrefix: entry.routePrefix,
    docPathPrefix: typeof entry.docPathPrefix === "string" ? entry.docPathPrefix : null,
  };
}

function getLocaleTranslationPolicy(locale) {
  assertSupportedLocale(locale);

  const policy = loadYamlIfExists(getLocalePolicyPath(locale), {});
  return {
    bootstrap: {
      routeLabels:
        policy.bootstrap?.routeLabels && typeof policy.bootstrap.routeLabels === "object"
          ? policy.bootstrap.routeLabels
          : {},
      translationJsonOverrides:
        policy.bootstrap?.translationJsonOverrides &&
        typeof policy.bootstrap.translationJsonOverrides === "object"
          ? policy.bootstrap.translationJsonOverrides
          : {},
    },
    hiddenSections: ensureArray(policy.hiddenSections).map(normalizeHiddenSection).filter(Boolean),
    waves: {
      wave1: normalizeWave(policy.waves?.wave1),
      wave2: normalizeWave(policy.waves?.wave2),
    },
  };
}

function getHiddenSectionsForClient() {
  const deduped = new Map();

  NON_DEFAULT_LOCALES.forEach((locale) => {
    getLocaleTranslationPolicy(locale).hiddenSections.forEach((entry) => {
      if (!deduped.has(entry.routePrefix)) {
        deduped.set(entry.routePrefix, {
          id: entry.id,
          routePrefix: entry.routePrefix,
        });
      }
    });
  });

  return [...deduped.values()].sort((left, right) =>
    left.routePrefix.localeCompare(right.routePrefix)
  );
}

function readLocaleRegistry() {
  return localeRegistry;
}

module.exports = {
  DEFAULT_LOCALE,
  I18N_ROOT,
  LOCALE_REGISTRY_PATH,
  NON_DEFAULT_LOCALES,
  ROOT,
  SRC_DATA_ROOT,
  SUPPORTED_LOCALES,
  assertSupportedLocale,
  getHiddenSectionsForClient,
  getLocaleDocsRoot,
  getLocaleFastnearTranslationsPath,
  getLocaleGlossary,
  getLocaleGlossaryPath,
  getLocalePolicyPath,
  getLocaleRoot,
  getLocaleTranslationPolicy,
  readLocaleRegistry,
};

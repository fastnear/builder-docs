const localeRegistry = require("../../src/data/localeRegistry.json");

const DEFAULT_LOCALE = localeRegistry.defaultLocale;
const SUPPORTED_LOCALES = Object.keys(localeRegistry.locales);

function stripOrigin(value) {
  const input = String(value || "").trim();
  if (!input) {
    return "";
  }

  try {
    const url = new URL(input, "https://builder-docs.fastnear.invalid/");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch (_error) {
    return input;
  }
}

function splitPathSuffix(value) {
  const match = String(value || "").match(/^([^?#]*)(.*)$/);
  return {
    path: match?.[1] || "",
    suffix: match?.[2] || "",
  };
}

function normalizeRoute(value) {
  const input = stripOrigin(value);
  if (!input) {
    return null;
  }

  const { path, suffix } = splitPathSuffix(input);
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return "/";
  }

  if (trimmedPath === "/") {
    return `/${suffix}`;
  }

  const prefixed = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
  return `${prefixed.replace(/\/+$/, "") || "/"}${suffix}`;
}

function splitLocalizedRoute(value) {
  const normalized = normalizeRoute(value);
  if (!normalized) {
    return {
      locale: DEFAULT_LOCALE,
      route: "/",
      localizedRoute: "/",
      suffix: "",
    };
  }

  const { path, suffix } = splitPathSuffix(normalized);
  const segments = path.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (SUPPORTED_LOCALES.includes(maybeLocale)) {
    const route = `/${segments.slice(1).join("/")}`.replace(/\/+$/, "") || "/";
    return {
      locale: maybeLocale,
      route,
      localizedRoute: `${route}${suffix}`,
      suffix,
    };
  }

  return {
    locale: DEFAULT_LOCALE,
    route: path || "/",
    localizedRoute: normalized,
    suffix,
  };
}

function stripLocalePrefix(value) {
  const { route, suffix } = splitLocalizedRoute(value);
  return `${route}${suffix}`;
}

function localizeRoute(value, locale = DEFAULT_LOCALE) {
  if (!value) {
    return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
  }

  const normalized = normalizeRoute(value);
  if (!normalized) {
    return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
  }

  if (!normalized.startsWith("/")) {
    return normalized;
  }

  const { route, suffix } = splitLocalizedRoute(normalized);
  const localizedPath =
    locale === DEFAULT_LOCALE
      ? route
      : route === "/"
        ? `/${locale}`
        : `/${locale}${route}`;

  return `${localizedPath}${suffix}`;
}

module.exports = {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  localizeRoute,
  normalizeRoute,
  splitLocalizedRoute,
  stripLocalePrefix,
};

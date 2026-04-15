import localeRegistry from '@site/src/data/localeRegistry.json';

export const DEFAULT_LOCALE = localeRegistry.defaultLocale;
export const SUPPORTED_LOCALES = Object.keys(localeRegistry.locales);

function stripOrigin(value) {
  const input = String(value || '').trim();
  if (!input) {
    return '';
  }

  try {
    const url = new URL(input, 'https://builder-docs.fastnear.invalid/');
    return `${url.pathname}${url.search}${url.hash}`;
  } catch (_error) {
    return input;
  }
}

function splitPathSuffix(value) {
  const match = String(value || '').match(/^([^?#]*)(.*)$/);
  return {
    path: match?.[1] || '',
    suffix: match?.[2] || '',
  };
}

export function normalizeRoute(value) {
  const input = stripOrigin(value);
  if (!input) {
    return null;
  }

  const { path, suffix } = splitPathSuffix(input);
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return '/';
  }

  if (trimmedPath === '/') {
    return `/${suffix}`;
  }

  const prefixed = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
  return `${prefixed.replace(/\/+$/, '') || '/'}${suffix}`;
}

export function splitLocalizedRoute(value) {
  const normalized = normalizeRoute(value);
  if (!normalized) {
    return {
      locale: DEFAULT_LOCALE,
      route: '/',
      localizedRoute: '/',
      suffix: '',
    };
  }

  const { path, suffix } = splitPathSuffix(normalized);
  const segments = path.split('/').filter(Boolean);
  const maybeLocale = segments[0];

  if (SUPPORTED_LOCALES.includes(maybeLocale)) {
    const route = `/${segments.slice(1).join('/')}`.replace(/\/+$/, '') || '/';
    return {
      locale: maybeLocale,
      route,
      localizedRoute: `${route}${suffix}`,
      suffix,
    };
  }

  return {
    locale: DEFAULT_LOCALE,
    route: path || '/',
    localizedRoute: normalized,
    suffix,
  };
}

export function getRouteLocale(value) {
  return splitLocalizedRoute(value).locale;
}

export function stripLocalePrefix(value) {
  const { route, suffix } = splitLocalizedRoute(value);
  return `${route}${suffix}`;
}

export function localizeRoute(value, locale = DEFAULT_LOCALE) {
  if (!value) {
    return locale === DEFAULT_LOCALE ? '/' : `/${locale}`;
  }

  const normalized = normalizeRoute(value);
  if (!normalized) {
    return locale === DEFAULT_LOCALE ? '/' : `/${locale}`;
  }

  if (!normalized.startsWith('/')) {
    return normalized;
  }

  const { route, suffix } = splitLocalizedRoute(normalized);
  const localizedPath =
    locale === DEFAULT_LOCALE
      ? route
      : route === '/'
        ? `/${locale}`
        : `/${locale}${route}`;

  return `${localizedPath}${suffix}`;
}

export function localizeHref(href, locale = DEFAULT_LOCALE) {
  const input = String(href || '').trim();
  if (!input || /^(?:[a-z]+:|#)/i.test(input)) {
    return input;
  }

  if (input.startsWith('/')) {
    return localizeRoute(input, locale);
  }

  return input;
}

export function matchesLocalizedRoutePrefix(route, prefix) {
  const normalizedRoute = splitLocalizedRoute(route).route;
  const normalizedPrefix = splitLocalizedRoute(prefix).route;

  return (
    normalizedRoute === normalizedPrefix ||
    normalizedRoute.startsWith(`${normalizedPrefix}/`)
  );
}

export function isLocalizedRoute(route, targetRoute) {
  return splitLocalizedRoute(route).route === splitLocalizedRoute(targetRoute).route;
}

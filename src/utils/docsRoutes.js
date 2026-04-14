const HIDDEN_VISIBLE_BREADCRUMB_ROUTES = new Set([
  '/',
  '/rpc',
  '/api',
  '/api/reference',
  '/agents/choosing-surfaces',
  '/tx',
  '/transfers',
  '/neardata',
  '/fastdata/kv',
  '/auth',
  '/snapshots',
  '/transaction-flow',
  '/redocly-config',
]);

function normalizeRoute(route) {
  const normalized = String(route || '').trim();
  if (!normalized) {
    return '/';
  }

  if (normalized === '/') {
    return '/';
  }

  const prefixed = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return prefixed.replace(/\/+$/, '') || '/';
}

function getSectionBreadcrumb(route) {
  const normalizedRoute = normalizeRoute(route);

  if (normalizedRoute.startsWith('/agents/')) {
    return { href: '/agents/choosing-surfaces', label: 'Agents' };
  }

  if (normalizedRoute.startsWith('/auth/')) {
    return { href: '/auth', label: 'Auth & Access' };
  }

  if (normalizedRoute.startsWith('/snapshots/')) {
    return { href: '/snapshots', label: 'Snapshots' };
  }

  if (normalizedRoute.startsWith('/transaction-flow/')) {
    return { href: '/transaction-flow', label: 'Transaction Flow' };
  }

  if (normalizedRoute.startsWith('/rpc/')) {
    return { href: '/rpc', label: 'RPC' };
  }

  if (normalizedRoute.startsWith('/api/')) {
    return { href: '/api', label: 'FastNear API' };
  }

  if (normalizedRoute.startsWith('/tx/')) {
    return { href: '/tx', label: 'Transactions API' };
  }

  if (normalizedRoute.startsWith('/transfers/')) {
    return { href: '/transfers', label: 'Transfers API' };
  }

  if (normalizedRoute.startsWith('/neardata/')) {
    return { href: '/neardata', label: 'NEAR Data API' };
  }

  if (normalizedRoute.startsWith('/fastdata/kv/')) {
    return { href: '/fastdata/kv', label: 'KV FastData API' };
  }

  return null;
}

export function shouldHideVisibleBreadcrumbs(route) {
  return HIDDEN_VISIBLE_BREADCRUMB_ROUTES.has(normalizeRoute(route));
}

export function buildFallbackBreadcrumbs(metadata, options = {}) {
  const route = normalizeRoute(metadata?.permalink);
  const title = metadata?.title;
  const includeHidden = Boolean(options.includeHidden);

  if (!title) {
    return [];
  }

  const hidden = shouldHideVisibleBreadcrumbs(route);
  if (hidden && !includeHidden) {
    return [];
  }

  const sectionBreadcrumb = getSectionBreadcrumb(route);
  if (!sectionBreadcrumb) {
    return hidden ? [{ href: route, label: title }] : [];
  }

  if (sectionBreadcrumb.href === route) {
    return hidden ? [{ href: route, label: title }] : [];
  }

  return [
    sectionBreadcrumb,
    { href: route, label: title },
  ];
}

export function trimVisibleBreadcrumbs(breadcrumbs) {
  const items = Array.isArray(breadcrumbs) ? breadcrumbs : [];
  if (!items.length) {
    return [];
  }

  if (items[0]?.href === '/' || items[0]?.label === 'RPC / API Reference') {
    return items.slice(1);
  }

  return items;
}

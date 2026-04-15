import { translate } from '@docusaurus/Translate';

import {
  getRouteLocale,
  isLocalizedRoute,
  localizeRoute,
  stripLocalePrefix,
} from './localizedRoutes';

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
  '/internationalization',
  '/snapshots',
  '/transaction-flow',
  '/redocly-config',
]);

const ROUTE_LABELS = {
  agents: translate({
    id: 'fastnear.docsRoutes.agents',
    message: 'Agents',
  }),
  auth: translate({
    id: 'fastnear.docsRoutes.auth',
    message: 'Auth & Access',
  }),
  snapshots: translate({
    id: 'fastnear.docsRoutes.snapshots',
    message: 'Snapshots',
  }),
  transactionFlow: translate({
    id: 'fastnear.docsRoutes.transactionFlow',
    message: 'Transaction Flow',
  }),
  rpc: translate({
    id: 'fastnear.docsRoutes.rpc',
    message: 'RPC',
  }),
  api: translate({
    id: 'fastnear.docsRoutes.api',
    message: 'FastNear API',
  }),
  tx: translate({
    id: 'fastnear.docsRoutes.tx',
    message: 'Transactions API',
  }),
  transfers: translate({
    id: 'fastnear.docsRoutes.transfers',
    message: 'Transfers API',
  }),
  neardata: translate({
    id: 'fastnear.docsRoutes.neardata',
    message: 'NEAR Data API',
  }),
  fastdata: translate({
    id: 'fastnear.docsRoutes.fastdata',
    message: 'KV FastData API',
  }),
};

function getSectionBreadcrumb(route) {
  const locale = getRouteLocale(route);
  const normalizedRoute = stripLocalePrefix(route);

  if (normalizedRoute.startsWith('/agents/')) {
    return {
      href: localizeRoute('/agents/choosing-surfaces', locale),
      label: ROUTE_LABELS.agents,
    };
  }

  if (normalizedRoute.startsWith('/auth/')) {
    return { href: localizeRoute('/auth', locale), label: ROUTE_LABELS.auth };
  }

  if (normalizedRoute.startsWith('/snapshots/')) {
    return { href: localizeRoute('/snapshots', locale), label: ROUTE_LABELS.snapshots };
  }

  if (normalizedRoute.startsWith('/transaction-flow/')) {
    return {
      href: localizeRoute('/transaction-flow', locale),
      label: ROUTE_LABELS.transactionFlow,
    };
  }

  if (normalizedRoute.startsWith('/rpc/')) {
    return { href: localizeRoute('/rpc', locale), label: ROUTE_LABELS.rpc };
  }

  if (normalizedRoute.startsWith('/api/')) {
    return { href: localizeRoute('/api', locale), label: ROUTE_LABELS.api };
  }

  if (normalizedRoute.startsWith('/tx/')) {
    return { href: localizeRoute('/tx', locale), label: ROUTE_LABELS.tx };
  }

  if (normalizedRoute.startsWith('/transfers/')) {
    return {
      href: localizeRoute('/transfers', locale),
      label: ROUTE_LABELS.transfers,
    };
  }

  if (normalizedRoute.startsWith('/neardata/')) {
    return { href: localizeRoute('/neardata', locale), label: ROUTE_LABELS.neardata };
  }

  if (normalizedRoute.startsWith('/fastdata/kv/')) {
    return { href: localizeRoute('/fastdata/kv', locale), label: ROUTE_LABELS.fastdata };
  }

  return null;
}

export function shouldHideVisibleBreadcrumbs(route) {
  return HIDDEN_VISIBLE_BREADCRUMB_ROUTES.has(stripLocalePrefix(route));
}

export function buildFallbackBreadcrumbs(metadata, options = {}) {
  const route = metadata?.permalink || '/';
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

  if (isLocalizedRoute(items[0]?.href, '/')) {
    return items.slice(1);
  }

  return items;
}

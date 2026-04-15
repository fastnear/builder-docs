const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'api',
  'by',
  'for',
  'from',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

const CANONICAL_KEYWORD_SETS = [
  {
    prefix: '/rpcs/',
    keywords: ['FastNear', 'NEAR', 'NEAR RPC', 'JSON-RPC', 'blockchain RPC'],
  },
  {
    prefix: '/apis/fastnear/',
    keywords: ['FastNear', 'NEAR', 'FastNear API', 'NEAR API', 'indexed NEAR data', 'REST API'],
  },
  {
    prefix: '/apis/transactions/',
    keywords: ['FastNear', 'NEAR', 'Transactions API', 'transaction history API', 'REST API'],
  },
  {
    prefix: '/apis/transfers/',
    keywords: ['FastNear', 'NEAR', 'Transfers API', 'transfer history API', 'REST API'],
  },
  {
    prefix: '/apis/neardata/',
    keywords: ['FastNear', 'NEAR', 'NEAR Data API', 'block data API', 'near realtime API', 'REST API'],
  },
  {
    prefix: '/apis/kv-fastdata/',
    keywords: ['FastNear', 'NEAR', 'KV FastData API', 'key value API', 'indexed contract state', 'REST API'],
  },
];

const DOCSEARCH_CATEGORY_RULES = [
  { prefix: '/api/reference', value: 'guide' },
  { prefix: '/rpc', value: 'rpc-reference' },
  { prefix: '/api', value: 'api-reference' },
  { prefix: '/tx', value: 'api-reference' },
  { prefix: '/transfers', value: 'api-reference' },
  { prefix: '/neardata', value: 'api-reference' },
  { prefix: '/fastdata', value: 'api-reference' },
  { prefix: '/auth', value: 'guide' },
  { prefix: '/agents', value: 'guide' },
  { prefix: '/internationalization', value: 'guide' },
  { prefix: '/snapshots', value: 'guide' },
  { prefix: '/transaction-flow', value: 'guide' },
  { prefix: '/redocly-config', value: 'guide' },
  { prefix: '/', value: 'guide' },
];

const DOCSEARCH_METHOD_TYPE_RULES = [
  { prefix: '/api/reference', value: null },
  { prefix: '/rpc/account', value: 'account' },
  { prefix: '/rpc/block', value: 'block' },
  { prefix: '/rpc/contract', value: 'contract' },
  { prefix: '/rpc/protocol', value: 'protocol' },
  { prefix: '/rpc/transaction', value: 'transaction' },
  { prefix: '/rpc/validators', value: 'validators' },
  { prefix: '/api', value: 'fastnear' },
  { prefix: '/tx', value: 'transactions' },
  { prefix: '/transfers', value: 'transfers' },
  { prefix: '/neardata', value: 'neardata' },
  { prefix: '/fastdata', value: 'kv-fastdata' },
];

const DOCSEARCH_SURFACE_RULES = [
  { prefix: '/rpc', value: 'rpc' },
  { prefix: '/api', value: 'api' },
  { prefix: '/tx', value: 'tx' },
  { prefix: '/transfers', value: 'transfers' },
  { prefix: '/neardata', value: 'neardata' },
  { prefix: '/fastdata', value: 'fastdata' },
  { prefix: '/auth', value: 'auth' },
  { prefix: '/agents', value: 'agents' },
  { prefix: '/internationalization', value: 'guide' },
  { prefix: '/snapshots', value: 'snapshots' },
  { prefix: '/transaction-flow', value: 'transaction-flow' },
  { prefix: '/redocly-config', value: 'guide' },
  { prefix: '/', value: 'guide' },
];

const DOCSEARCH_FAMILY_RULES = [
  { prefix: '/rpc/account', value: 'account' },
  { prefix: '/rpc/block', value: 'block' },
  { prefix: '/rpc/contract', value: 'contract' },
  { prefix: '/rpc/protocol', value: 'protocol' },
  { prefix: '/rpc/transaction', value: 'transaction' },
  { prefix: '/rpc/validators', value: 'validators' },
  { prefix: '/api', value: 'fastnear' },
  { prefix: '/tx', value: 'transactions' },
  { prefix: '/transfers', value: 'transfers' },
  { prefix: '/neardata', value: 'neardata' },
  { prefix: '/fastdata/kv', value: 'kv-fastdata' },
];

const REFERENCE_COLLECTION_ROUTES = new Set([
  '/api',
  '/fastdata/kv',
  '/neardata',
  '/rpc',
  '/transfers',
  '/tx',
]);

const HIDDEN_PUBLIC_DOC_PREFIXES = ['/transaction-flow'];

const OPERATION_CANONICAL_RULES = [
  { prefix: '/rpcs/account', family: 'account', methodType: 'account', surface: 'rpc' },
  { prefix: '/rpcs/block', family: 'block', methodType: 'block', surface: 'rpc' },
  { prefix: '/rpcs/contract', family: 'contract', methodType: 'contract', surface: 'rpc' },
  { prefix: '/rpcs/protocol', family: 'protocol', methodType: 'protocol', surface: 'rpc' },
  { prefix: '/rpcs/transaction', family: 'transaction', methodType: 'transaction', surface: 'rpc' },
  { prefix: '/rpcs/validators', family: 'validators', methodType: 'validators', surface: 'rpc' },
  { prefix: '/apis/fastnear', family: 'fastnear', methodType: 'fastnear', surface: 'api' },
  { prefix: '/apis/transactions', family: 'transactions', methodType: 'transactions', surface: 'tx' },
  { prefix: '/apis/transfers', family: 'transfers', methodType: 'transfers', surface: 'transfers' },
  { prefix: '/apis/neardata', family: 'neardata', methodType: 'neardata', surface: 'neardata' },
  { prefix: '/apis/kv-fastdata', family: 'kv-fastdata', methodType: 'kv-fastdata', surface: 'fastdata' },
];

function normalizeRoute(route) {
  const normalized = stripLocalePrefix(route);
  if (!normalized) {
    return null;
  }
  return normalized;
}

function matchesRoutePrefix(route, prefix) {
  return Boolean(route) && (route === prefix || route.startsWith(`${prefix}/`));
}

function resolveDocsearchValue(route, rules) {
  const normalizedRoute = normalizeRoute(route);
  if (!normalizedRoute) {
    return null;
  }

  return rules.find((rule) => matchesRoutePrefix(normalizedRoute, rule.prefix))?.value || null;
}

function dedupeKeywords(values) {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const normalized = String(value || '').trim().replace(/\s+/g, ' ');
    if (!normalized) {
      return;
    }

    const dedupeKey = normalized.toLowerCase();
    if (seen.has(dedupeKey)) {
      return;
    }

    seen.add(dedupeKey);
    result.push(normalized);
  });

  return result;
}

function humanizeKeyword(value) {
  return String(value || '')
    .replace(/[{}]/g, ' ')
    .replace(/[_/:-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractCanonicalKeywords(pageModel) {
  const canonicalPath = pageModel?.canonicalPath || '';
  return (
    CANONICAL_KEYWORD_SETS.find((entry) => canonicalPath.startsWith(entry.prefix))?.keywords || []
  );
}

function extractRoutePathKeywords(pageModel) {
  const routePath = pageModel?.route?.path || '';
  const segments = routePath
    .split('/')
    .map((segment) => humanizeKeyword(segment))
    .filter(Boolean)
    .filter((segment) => !STOP_WORDS.has(segment.toLowerCase()))
    .filter((segment) => segment.length > 2);

  return segments.slice(0, 4);
}

function extractNetworkKeywords(pageModel) {
  return (pageModel?.interaction?.networks || []).flatMap((network) => {
    const key = String(network?.key || '').toLowerCase();
    if (key === 'mainnet') {
      return ['mainnet', 'NEAR mainnet'];
    }
    if (key === 'testnet') {
      return ['testnet', 'NEAR testnet'];
    }
    return key ? [key] : [];
  });
}

export function buildOperationKeywords(pageModel) {
  if (!pageModel) {
    return [];
  }

  const title = pageModel.info?.title || '';
  const titleKeyword = humanizeKeyword(title);
  const operationId = pageModel.info?.operationId || '';
  const operationIdKeyword = humanizeKeyword(operationId);
  const requestTypeKeyword = humanizeKeyword(pageModel.interaction?.requestType || '');
  const transportKeyword =
    pageModel.route?.transport === 'json-rpc' ? ['JSON-RPC'] : ['HTTP API'];

  return dedupeKeywords([
    ...extractCanonicalKeywords(pageModel),
    title,
    titleKeyword,
    operationId,
    operationIdKeyword,
    requestTypeKeyword,
    ...transportKeyword,
    ...extractRoutePathKeywords(pageModel),
    ...extractNetworkKeywords(pageModel),
  ]);
}

export function isPublicDocsPermalink(permalink) {
  const normalizedRoute = normalizeRoute(permalink);
  return Boolean(
    normalizedRoute &&
      !HIDDEN_PUBLIC_DOC_PREFIXES.some(
        (prefix) => normalizedRoute === prefix || normalizedRoute.startsWith(`${prefix}/`)
      ) &&
      !normalizedRoute.startsWith('/rpcs/') &&
      !normalizedRoute.startsWith('/apis/')
  );
}

export function getDocsearchCategory(permalink) {
  return resolveDocsearchValue(permalink, DOCSEARCH_CATEGORY_RULES);
}

export function getDocsearchMethodType(permalink) {
  return resolveDocsearchValue(permalink, DOCSEARCH_METHOD_TYPE_RULES);
}

export function getDocsearchSurface(permalink) {
  return resolveDocsearchValue(permalink, DOCSEARCH_SURFACE_RULES);
}

export function getDocsearchFamily(permalink) {
  return resolveDocsearchValue(permalink, DOCSEARCH_FAMILY_RULES);
}

export function getDocsearchAudience(permalink) {
  const normalizedRoute = normalizeRoute(permalink);
  if (!normalizedRoute) {
    return null;
  }

  if (matchesRoutePrefix(normalizedRoute, '/agents')) {
    return 'agent';
  }

  if (matchesRoutePrefix(normalizedRoute, '/snapshots')) {
    return 'operator';
  }

  return 'builder';
}

function isReferenceLeafRoute(route, prefix) {
  return matchesRoutePrefix(route, prefix) && route !== prefix;
}

export function getDocsearchPageType(permalink) {
  const normalizedRoute = normalizeRoute(permalink);
  if (!normalizedRoute) {
    return null;
  }

  if (normalizedRoute === '/api/reference') {
    return 'guide';
  }

  if (REFERENCE_COLLECTION_ROUTES.has(normalizedRoute)) {
    return 'collection';
  }

  if (
    isReferenceLeafRoute(normalizedRoute, '/api') ||
    isReferenceLeafRoute(normalizedRoute, '/tx') ||
    isReferenceLeafRoute(normalizedRoute, '/transfers') ||
    isReferenceLeafRoute(normalizedRoute, '/neardata') ||
    isReferenceLeafRoute(normalizedRoute, '/fastdata/kv')
  ) {
    return 'reference';
  }

  const routeParts = normalizedRoute.split('/').filter(Boolean);
  if (matchesRoutePrefix(normalizedRoute, '/rpc') && routeParts.length >= 3) {
    return 'reference';
  }

  return 'guide';
}

export function getDocsearchSemanticMeta(permalink) {
  const normalizedRoute = normalizeRoute(permalink);
  if (!normalizedRoute) {
    return null;
  }

  return {
    audience: getDocsearchAudience(normalizedRoute),
    category: getDocsearchCategory(normalizedRoute),
    family: getDocsearchFamily(normalizedRoute),
    methodType: getDocsearchMethodType(normalizedRoute),
    pageType: getDocsearchPageType(normalizedRoute),
    surface: getDocsearchSurface(normalizedRoute),
  };
}

export function getOperationSemanticMeta(pageModel) {
  const normalizedCanonicalPath = normalizeRoute(pageModel?.canonicalPath);
  const matchedRule = OPERATION_CANONICAL_RULES.find((rule) =>
    matchesRoutePrefix(normalizedCanonicalPath, rule.prefix)
  );

  if (!matchedRule) {
    return null;
  }

  return {
    audience: 'builder',
    category: matchedRule.surface === 'rpc' ? 'rpc-reference' : 'api-reference',
    family: matchedRule.family,
    methodType: matchedRule.methodType,
    pageType: 'reference',
    surface: matchedRule.surface,
  };
}
import { stripLocalePrefix } from './localizedRoutes';

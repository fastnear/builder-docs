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

const FASTNEAR_PUBLISHER = {
  '@type': 'Organization',
  name: 'FastNear',
  url: 'https://fastnear.com',
};

function normalizeRoute(route) {
  const normalized = String(route || '').trim();
  if (!normalized) {
    return null;
  }

  if (normalized === '/') {
    return '/';
  }

  const prefixed = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return prefixed.replace(/\/+$/, '') || '/';
}

function matchesRoutePrefix(route, prefix) {
  return route === prefix || route.startsWith(`${prefix}/`);
}

function resolveDocsearchValue(route, rules) {
  const normalizedRoute = normalizeRoute(route);
  if (!normalizedRoute) {
    return null;
  }

  return rules.find((rule) => matchesRoutePrefix(normalizedRoute, rule.prefix))?.value || null;
}

function buildAbsoluteUrl(pathname, siteConfig) {
  const normalizedPath = normalizeRoute(pathname);
  if (!normalizedPath || !siteConfig?.url) {
    return null;
  }

  const baseUrl = String(siteConfig.baseUrl || '/');
  const siteBase = new URL(baseUrl, `${String(siteConfig.url).replace(/\/+$/, '')}/`);
  return new URL(normalizedPath.replace(/^\//, ''), siteBase).toString();
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

export function buildDocJsonLd({ description, keywords, permalink, siteConfig, title }) {
  if (!title || !description || !isPublicDocsPermalink(permalink)) {
    return null;
  }

  const url = buildAbsoluteUrl(permalink, siteConfig);
  if (!url) {
    return null;
  }

  const normalizedKeywords = Array.isArray(keywords) ? dedupeKeywords(keywords) : [];

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url,
    publisher: FASTNEAR_PUBLISHER,
    isPartOf: {
      '@type': 'WebSite',
      name: 'FastNear Docs',
      url: String(siteConfig?.url || '').replace(/\/+$/, ''),
    },
    ...(normalizedKeywords.length ? { keywords: normalizedKeywords.join(', ') } : {}),
  };
}

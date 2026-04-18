import {
  getDocsearchAudience,
  getDocsearchCategory,
  getDocsearchFamily,
  getDocsearchMethodType,
  getDocsearchPageType,
  getDocsearchSemanticMeta,
  getOperationSemanticMeta,
  isPublicDocsPermalink,
} from './docsearchClassification';

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
  const titleSegments = String(title)
    .split(/\s+[-–—]\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const titleTail = titleSegments.length > 1 ? titleSegments[titleSegments.length - 1] : '';
  const operationId = pageModel.info?.operationId || '';
  const operationIdKeyword = humanizeKeyword(operationId);
  const requestTypeKeyword = humanizeKeyword(pageModel.interaction?.requestType || '');
  const transportKeyword =
    pageModel.route?.transport === 'json-rpc' ? ['JSON-RPC'] : ['HTTP API'];

  return dedupeKeywords([
    ...extractCanonicalKeywords(pageModel),
    title,
    titleKeyword,
    titleTail,
    humanizeKeyword(titleTail),
    operationId,
    operationIdKeyword,
    requestTypeKeyword,
    ...transportKeyword,
    ...extractRoutePathKeywords(pageModel),
    ...extractNetworkKeywords(pageModel),
  ]);
}

export {
  getDocsearchAudience,
  getDocsearchCategory,
  getDocsearchFamily,
  getDocsearchMethodType,
  getDocsearchPageType,
  getDocsearchSemanticMeta,
  getOperationSemanticMeta,
  isPublicDocsPermalink,
};

import structuredGraph from '@site/src/data/generatedFastnearStructuredGraph.json';

import {
  DEFAULT_LOCALE,
  getRouteLocale,
  localizeRoute,
  stripLocalePrefix,
} from './localizedRoutes';
import {
  localizeBreadcrumbItems,
  localizeStructuredFamily,
  localizeStructuredOperation,
} from './fastnearLocalization';

const COLLECTION_ROUTE_SET = new Set([
  '/',
  '/api',
  '/api/reference',
  '/auth',
  '/fastdata/kv',
  '/neardata',
  '/rpc',
  '/snapshots',
  '/transaction-flow',
  '/transfers',
  '/tx',
]);

const WEBSITE_NAME = 'FastNear Docs';
const WEBSITE_DESCRIPTION =
  'API and RPC documentation for FastNear, high-performance infrastructure for the NEAR Protocol.';
const ORGANIZATION_DESCRIPTION =
  'High-performance RPC and API infrastructure for the NEAR Protocol blockchain.';
const ORGANIZATION_LOGO_PATH = '/img/fastnear_logo_black.png';
const ORGANIZATION_SAME_AS = ['https://github.com/fastnear', 'https://x.com/fast_near'];

function normalizeRoute(route) {
  return stripLocalePrefix(route) || '/';
}

function getSiteOrigin(siteConfig) {
  return String(siteConfig?.url || 'https://docs.fastnear.com').replace(/\/+$/, '');
}

function buildAbsoluteUrl(
  pathname,
  siteConfig,
  locale = DEFAULT_LOCALE,
  { localized = true } = {}
) {
  const normalizedPath = normalizeRoute(pathname);
  if (!normalizedPath) {
    return null;
  }

  const publicPath = localized ? localizeRoute(normalizedPath, locale) : normalizedPath;
  return new URL(publicPath.replace(/^\//, ''), `${getSiteOrigin(siteConfig)}/`).toString();
}

function buildWebsiteId(siteConfig) {
  return `${getSiteOrigin(siteConfig)}/#website`;
}

function buildOrganizationId(siteConfig) {
  return `${getSiteOrigin(siteConfig)}/#organization`;
}

function buildPageId(url) {
  return `${url}#page`;
}

function buildPageEntityRef(pathname, siteConfig, locale = DEFAULT_LOCALE) {
  const pageUrl = buildAbsoluteUrl(pathname, siteConfig, locale);
  if (!pageUrl) {
    return null;
  }

  return { '@id': buildPageId(pageUrl) };
}

function buildFamilyEntityId(siteConfig, familyId) {
  return `${getSiteOrigin(siteConfig)}/structured-data/families/${familyId}`;
}

function buildOperationEntityId(siteConfig, pageModelId) {
  return `${getSiteOrigin(siteConfig)}/structured-data/operations/${pageModelId}`;
}

function dedupeUrls(values) {
  return [...new Set(values.filter(Boolean))];
}

const structuredFamilies = structuredGraph.families || [];
const structuredOperations = structuredGraph.operations || [];
const structuredBreadcrumbs = structuredGraph.breadcrumbs || [];

const structuredFamiliesById = Object.fromEntries(
  structuredFamilies.map((family) => [family.id, family])
);

const structuredFamiliesByDocsPath = structuredFamilies.reduce((accumulator, family) => {
  const route = normalizeRoute(family.docsPath);
  if (!accumulator[route]) {
    accumulator[route] = [];
  }

  accumulator[route].push(family);
  return accumulator;
}, {});

const structuredOperationsByPageModelId = Object.fromEntries(
  structuredOperations.map((operation) => [operation.pageModelId, operation])
);

const structuredOperationsByDocsPath = Object.fromEntries(
  structuredOperations.map((operation) => [normalizeRoute(operation.docsPath), operation])
);

const structuredOperationsByCanonicalPath = Object.fromEntries(
  structuredOperations.map((operation) => [normalizeRoute(operation.canonicalPath), operation])
);

const structuredBreadcrumbsByCanonicalPath = Object.fromEntries(
  structuredBreadcrumbs.map((breadcrumb) => [normalizeRoute(breadcrumb.canonicalPath), breadcrumb])
);

const HIDDEN_FAMILY_IDS = new Set(['api-kv-fastdata', 'api-transfers']);

function isFamilyVisibleForSite(family, siteConfig) {
  if (!family) {
    return false;
  }

  if (!siteConfig?.customFields?.hideEarlyApiFamilies) {
    return true;
  }

  return !HIDDEN_FAMILY_IDS.has(family.id);
}

function getAssociatedFamiliesForDocsRoute(route, siteConfig) {
  const normalizedRoute = normalizeRoute(route);
  const directFamilies = (structuredFamiliesByDocsPath[normalizedRoute] || []).filter((family) =>
    isFamilyVisibleForSite(family, siteConfig)
  );
  if (directFamilies.length) {
    return directFamilies;
  }

  if (normalizedRoute === '/api/reference') {
    const family = structuredFamiliesById['api-fastnear'];
    return family && isFamilyVisibleForSite(family, siteConfig) ? [family] : [];
  }

  if (normalizedRoute === '/') {
    return structuredFamilies.filter((family) => isFamilyVisibleForSite(family, siteConfig));
  }

  return [];
}

function buildWebsiteEntity(siteConfig) {
  return {
    '@id': buildWebsiteId(siteConfig),
    '@type': 'WebSite',
    description: WEBSITE_DESCRIPTION,
    name: WEBSITE_NAME,
    publisher: { '@id': buildOrganizationId(siteConfig) },
    url: getSiteOrigin(siteConfig),
  };
}

function buildOrganizationEntity(siteConfig) {
  return {
    '@id': buildOrganizationId(siteConfig),
    '@type': 'Organization',
    description: ORGANIZATION_DESCRIPTION,
    logo: buildAbsoluteUrl(ORGANIZATION_LOGO_PATH, siteConfig, DEFAULT_LOCALE, {
      localized: false,
    }),
    name: 'FastNear',
    sameAs: ORGANIZATION_SAME_AS,
    url: 'https://fastnear.com',
  };
}

function buildFamilyEntity(family, siteConfig, locale = DEFAULT_LOCALE) {
  const docsUrl = buildAbsoluteUrl(family.docsPath, siteConfig, locale);
  return {
    '@id': buildFamilyEntityId(siteConfig, family.id),
    '@type': family.schemaType || 'WebAPI',
    description: family.description,
    documentation: docsUrl,
    identifier: family.id,
    inLanguage: locale,
    mainEntityOfPage: buildPageEntityRef(family.docsPath, siteConfig, locale) || undefined,
    name: family.name,
    provider: { '@id': buildOrganizationId(siteConfig) },
    serviceType: family.kind === 'rpc' ? 'JSON-RPC API' : 'REST API',
    url: docsUrl,
  };
}

function buildOperationEntity(operation, siteConfig, locale = DEFAULT_LOCALE) {
  const docsUrl = buildAbsoluteUrl(operation.docsPath || operation.canonicalPath, siteConfig, locale);
  const docsPageRef = buildPageEntityRef(
    operation.docsPath || operation.canonicalPath,
    siteConfig,
    locale
  );
  const canonicalPageRef = buildPageEntityRef(operation.canonicalPath, siteConfig, locale);
  const subjectOf = dedupeUrls(
    [docsPageRef?.['@id'], canonicalPageRef?.['@id']]
  ).map((id) => ({ '@id': id }));
  const sameAs = dedupeUrls(
    [operation.canonicalPath, operation.docsPath, ...(operation.routeAliases || [])].map((value) =>
      buildAbsoluteUrl(value, siteConfig, locale)
    )
  );

  return {
    '@id': buildOperationEntityId(siteConfig, operation.pageModelId),
    '@type': operation.schemaType || 'APIReference',
    abstract: operation.summary || operation.name,
    description: operation.description,
    headline: operation.headline || operation.name,
    identifier: operation.pageModelId,
    inLanguage: locale,
    isPartOf: { '@id': buildFamilyEntityId(siteConfig, operation.familyId) },
    mainEntityOfPage: docsPageRef || undefined,
    name: operation.name,
    publisher: { '@id': buildOrganizationId(siteConfig) },
    sameAs,
    subjectOf: subjectOf.length ? subjectOf : undefined,
    url: docsUrl,
  };
}

function buildBreadcrumbGraph(items, siteConfig, locale = DEFAULT_LOCALE) {
  const itemListElement = (items || [])
    .filter((item) => item?.path)
    .map((item, index) => ({
      '@type': 'ListItem',
      item: buildAbsoluteUrl(item.path, siteConfig, locale),
      name: item.label,
      position: index + 1,
    }));

  if (!itemListElement.length) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

function isCollectionDocsRoute(permalink) {
  return COLLECTION_ROUTE_SET.has(normalizeRoute(permalink));
}

function formatLastUpdatedTimestamp(lastUpdatedAt) {
  if (!lastUpdatedAt) {
    return undefined;
  }

  try {
    return new Date(lastUpdatedAt).toISOString();
  } catch (_error) {
    return undefined;
  }
}

function buildDocsPageEntity({
  currentLocale = DEFAULT_LOCALE,
  description,
  metadata,
  pageType,
  siteConfig,
  url,
}) {
  const dateModified = formatLastUpdatedTimestamp(metadata?.lastUpdatedAt);
  const baseEntity = {
    '@id': buildPageId(url),
    '@type': pageType,
    description,
    inLanguage: currentLocale,
    isPartOf: { '@id': buildWebsiteId(siteConfig) },
    name: metadata.title,
    publisher: { '@id': buildOrganizationId(siteConfig) },
    url,
    ...(dateModified ? { dateModified } : {}),
  };

  if (pageType === 'TechArticle') {
    return {
      ...baseEntity,
      abstract: description,
      headline: metadata.title,
    };
  }

  return baseEntity;
}

export function buildDocsStructuredData({
  currentLocale = getRouteLocale(metadata?.permalink),
  frontMatter,
  metadata,
  siteConfig,
}) {
  const route = metadata?.permalink || '/';
  const normalizedRoute = normalizeRoute(route);
  if (
    !normalizedRoute ||
    normalizedRoute.startsWith('/rpcs/') ||
    normalizedRoute.startsWith('/apis/')
  ) {
    return null;
  }

  const description = metadata?.description || frontMatter?.description || '';
  if (!description || !metadata?.title) {
    return null;
  }

  const url = buildAbsoluteUrl(normalizedRoute, siteConfig, currentLocale);
  if (!url) {
    return null;
  }

  const operation = localizeStructuredOperation(
    structuredOperationsByDocsPath[normalizedRoute],
    currentLocale
  );
  const families = getAssociatedFamiliesForDocsRoute(normalizedRoute, siteConfig).map((family) =>
    localizeStructuredFamily(family, currentLocale)
  );
  const pageType = operation
    ? 'WebPage'
    : isCollectionDocsRoute(normalizedRoute)
      ? 'CollectionPage'
      : 'TechArticle';
  const pageEntity = buildDocsPageEntity({
    currentLocale,
    description,
    metadata,
    pageType,
    siteConfig,
    url,
  });
  const graph = [pageEntity];

  if (operation) {
    pageEntity.mainEntity = { '@id': buildOperationEntityId(siteConfig, operation.pageModelId) };
    graph.push(
      buildFamilyEntity(
        localizeStructuredFamily(structuredFamiliesById[operation.familyId], currentLocale),
        siteConfig,
        currentLocale
      ),
      buildOperationEntity(operation, siteConfig, currentLocale)
    );
  } else if (families.length === 1) {
    pageEntity.mainEntity = { '@id': buildFamilyEntityId(siteConfig, families[0].id) };
    graph.push(buildFamilyEntity(families[0], siteConfig, currentLocale));
  } else if (families.length > 1) {
    pageEntity.about = families.map((family) => ({ '@id': buildFamilyEntityId(siteConfig, family.id) }));
    graph.push(...families.map((family) => buildFamilyEntity(family, siteConfig, currentLocale)));
  }

  return {
    pageSchemaType: pageType,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': graph,
    },
  };
}

export function buildHostedOperationStructuredData({
  currentLocale = DEFAULT_LOCALE,
  pageModelId,
  siteConfig,
}) {
  const operation = localizeStructuredOperation(structuredOperationsByPageModelId[pageModelId], currentLocale);
  if (!operation) {
    return null;
  }

  const family = localizeStructuredFamily(structuredFamiliesById[operation.familyId], currentLocale);
  if (!family) {
    return null;
  }

  const url = buildAbsoluteUrl(operation.canonicalPath, siteConfig, currentLocale);
  const pageEntity = {
    '@id': buildPageId(url),
    '@type': 'WebPage',
    about: [{ '@id': buildFamilyEntityId(siteConfig, operation.familyId) }],
    description: operation.description,
    inLanguage: currentLocale,
    isPartOf: { '@id': buildWebsiteId(siteConfig) },
    mainEntity: { '@id': buildOperationEntityId(siteConfig, operation.pageModelId) },
    name: operation.name,
    publisher: { '@id': buildOrganizationId(siteConfig) },
    url,
  };

  const breadcrumb = structuredBreadcrumbsByCanonicalPath[normalizeRoute(operation.canonicalPath)];

  return {
    breadcrumbStructuredData: buildBreadcrumbGraph(
      localizeBreadcrumbItems(breadcrumb?.items, currentLocale),
      siteConfig,
      currentLocale
    ),
    pageSchemaType: 'WebPage',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        pageEntity,
        buildFamilyEntity(family, siteConfig, currentLocale),
        buildOperationEntity(operation, siteConfig, currentLocale),
      ],
    },
  };
}

export function getStructuredGraphData() {
  return structuredGraph;
}

export function getStructuredOperationByDocsPath(route, locale = DEFAULT_LOCALE) {
  return localizeStructuredOperation(structuredOperationsByDocsPath[normalizeRoute(route)], locale);
}

export function getStructuredOperationByPageModelId(pageModelId, locale = DEFAULT_LOCALE) {
  return localizeStructuredOperation(structuredOperationsByPageModelId[pageModelId], locale);
}

export function getStructuredOperationByCanonicalPath(route, locale = DEFAULT_LOCALE) {
  return localizeStructuredOperation(
    structuredOperationsByCanonicalPath[normalizeRoute(route)],
    locale
  );
}

export function getStructuredFamiliesByDocsPath(route, locale = DEFAULT_LOCALE) {
  return (structuredFamiliesByDocsPath[normalizeRoute(route)] || []).map((family) =>
    localizeStructuredFamily(family, locale)
  );
}

export function getGlobalStructuredDataEntities(siteConfig) {
  return {
    organization: buildOrganizationEntity(siteConfig),
    website: buildWebsiteEntity(siteConfig),
  };
}

export function getStructuredDataConstants() {
  return {
    organizationDescription: ORGANIZATION_DESCRIPTION,
    organizationLogoPath: ORGANIZATION_LOGO_PATH,
    organizationSameAs: ORGANIZATION_SAME_AS,
    websiteDescription: WEBSITE_DESCRIPTION,
    websiteName: WEBSITE_NAME,
  };
}

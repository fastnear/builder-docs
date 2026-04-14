import structuredGraph from '@site/src/data/generatedFastnearStructuredGraph.json';

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

function getSiteOrigin(siteConfig) {
  return String(siteConfig?.url || 'https://docs.fastnear.com').replace(/\/+$/, '');
}

function buildAbsoluteUrl(pathname, siteConfig) {
  const normalizedPath = normalizeRoute(pathname);
  if (!normalizedPath) {
    return null;
  }

  const baseUrl = String(siteConfig?.baseUrl || '/');
  const siteBase = new URL(baseUrl, `${getSiteOrigin(siteConfig)}/`);
  return new URL(normalizedPath.replace(/^\//, ''), siteBase).toString();
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
  const directFamilies = (structuredFamiliesByDocsPath[route] || []).filter((family) =>
    isFamilyVisibleForSite(family, siteConfig)
  );
  if (directFamilies.length) {
    return directFamilies;
  }

  if (route === '/api/reference') {
    const family = structuredFamiliesById['api-fastnear'];
    return family && isFamilyVisibleForSite(family, siteConfig) ? [family] : [];
  }

  if (route === '/') {
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
    url: getSiteOrigin(siteConfig),
  };
}

function buildOrganizationEntity(siteConfig) {
  return {
    '@id': buildOrganizationId(siteConfig),
    '@type': 'Organization',
    description: ORGANIZATION_DESCRIPTION,
    logo: buildAbsoluteUrl(ORGANIZATION_LOGO_PATH, siteConfig),
    name: 'FastNear',
    sameAs: ORGANIZATION_SAME_AS,
    url: 'https://fastnear.com',
  };
}

function buildFamilyEntity(family, siteConfig) {
  return {
    '@id': buildFamilyEntityId(siteConfig, family.id),
    '@type': family.schemaType || 'WebAPI',
    description: family.description,
    identifier: family.id,
    name: family.name,
    provider: { '@id': buildOrganizationId(siteConfig) },
    url: buildAbsoluteUrl(family.docsPath, siteConfig),
  };
}

function buildOperationEntity(operation, siteConfig) {
  const primaryUrl = buildAbsoluteUrl(operation.docsPath || operation.canonicalPath, siteConfig);
  const sameAs = dedupeUrls(
    [operation.canonicalPath, operation.docsPath, ...(operation.routeAliases || [])].map((value) =>
      buildAbsoluteUrl(value, siteConfig)
    )
  );

  return {
    '@id': buildOperationEntityId(siteConfig, operation.pageModelId),
    '@type': operation.schemaType || 'APIReference',
    description: operation.description,
    headline: operation.headline || operation.name,
    identifier: operation.pageModelId,
    isPartOf: { '@id': buildFamilyEntityId(siteConfig, operation.familyId) },
    name: operation.name,
    publisher: { '@id': buildOrganizationId(siteConfig) },
    sameAs,
    url: primaryUrl,
  };
}

function buildBreadcrumbGraph(items, siteConfig) {
  const itemListElement = (items || [])
    .filter((item) => item?.path)
    .map((item, index) => ({
      '@type': 'ListItem',
      item: buildAbsoluteUrl(item.path, siteConfig),
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

function buildDocsPageEntity({ description, metadata, pageType, siteConfig, url }) {
  const baseEntity = {
    '@id': buildPageId(url),
    '@type': pageType,
    description,
    isPartOf: { '@id': buildWebsiteId(siteConfig) },
    name: metadata.title,
    publisher: { '@id': buildOrganizationId(siteConfig) },
    url,
  };

  if (pageType === 'TechArticle') {
    return {
      ...baseEntity,
      headline: metadata.title,
    };
  }

  return baseEntity;
}

export function buildDocsStructuredData({ frontMatter, metadata, siteConfig }) {
  const route = normalizeRoute(metadata?.permalink);
  if (
    !route ||
    route.startsWith('/rpcs/') ||
    route.startsWith('/apis/')
  ) {
    return null;
  }

  const description = metadata?.description || frontMatter?.description || '';
  if (!description || !metadata?.title) {
    return null;
  }

  const url = buildAbsoluteUrl(route, siteConfig);
  if (!url) {
    return null;
  }

  const operation = structuredOperationsByDocsPath[route];
  const families = getAssociatedFamiliesForDocsRoute(route, siteConfig);
  const pageType = operation
    ? 'WebPage'
    : isCollectionDocsRoute(route)
      ? 'CollectionPage'
      : 'TechArticle';
  const pageEntity = buildDocsPageEntity({
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
      buildFamilyEntity(structuredFamiliesById[operation.familyId], siteConfig),
      buildOperationEntity(operation, siteConfig)
    );
  } else if (families.length === 1) {
    pageEntity.mainEntity = { '@id': buildFamilyEntityId(siteConfig, families[0].id) };
    graph.push(buildFamilyEntity(families[0], siteConfig));
  } else if (families.length > 1) {
    pageEntity.about = families.map((family) => ({ '@id': buildFamilyEntityId(siteConfig, family.id) }));
    graph.push(...families.map((family) => buildFamilyEntity(family, siteConfig)));
  }

  return {
    pageSchemaType: pageType,
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': graph,
    },
  };
}

export function buildHostedOperationStructuredData({ pageModelId, siteConfig }) {
  const operation = structuredOperationsByPageModelId[pageModelId];
  if (!operation) {
    return null;
  }

  const family = structuredFamiliesById[operation.familyId];
  if (!family) {
    return null;
  }

  const url = buildAbsoluteUrl(operation.canonicalPath, siteConfig);
  const pageEntity = {
    '@id': buildPageId(url),
    '@type': 'WebPage',
    description: operation.description,
    isPartOf: { '@id': buildWebsiteId(siteConfig) },
    mainEntity: { '@id': buildOperationEntityId(siteConfig, operation.pageModelId) },
    name: operation.name,
    publisher: { '@id': buildOrganizationId(siteConfig) },
    url,
  };

  const breadcrumb = structuredBreadcrumbsByCanonicalPath[normalizeRoute(operation.canonicalPath)];

  return {
    breadcrumbStructuredData: buildBreadcrumbGraph(breadcrumb?.items, siteConfig),
    pageSchemaType: 'WebPage',
    structuredData: {
      '@context': 'https://schema.org',
      '@graph': [
        pageEntity,
        buildFamilyEntity(family, siteConfig),
        buildOperationEntity(operation, siteConfig),
      ],
    },
  };
}

export function getStructuredGraphData() {
  return structuredGraph;
}

export function getStructuredOperationByDocsPath(route) {
  return structuredOperationsByDocsPath[normalizeRoute(route)];
}

export function getStructuredOperationByPageModelId(pageModelId) {
  return structuredOperationsByPageModelId[pageModelId];
}

export function getStructuredOperationByCanonicalPath(route) {
  return structuredOperationsByCanonicalPath[normalizeRoute(route)];
}

export function getStructuredFamiliesByDocsPath(route) {
  return structuredFamiliesByDocsPath[normalizeRoute(route)] || [];
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

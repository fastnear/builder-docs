import structuredGraph from '@site/src/data/generatedFastnearStructuredGraph.json';

// Published OpenAPI documents, served from static/openapi (not localized).
// RFC 8631 link relation for a machine-readable service description.
export const OPENAPI_MEDIA_TYPE = 'application/vnd.oai.openapi+json';
export const OPENAPI_HUB_PATH = '/openapi';
export const OPENAPI_INDEX_PATH = '/openapi/index.json';

const FAMILY_SPEC_PATHS = (() => {
  const map = {};
  for (const family of structuredGraph.families || []) {
    if (!family.openapiPath) continue;
    const key = family.kind === 'rpc' ? 'rpc' : family.key;
    map[key] = { json: family.openapiPath, yaml: family.openapiYamlPath };
  }
  return map;
})();

// `familyKey` is the docsearch family value (rpc, fastnear, transactions,
// transfers, neardata, kv-fastdata), which matches the published spec families.
export function getFamilySpecPaths(familyKey) {
  return (familyKey && FAMILY_SPEC_PATHS[familyKey]) || null;
}

// Landing and guide pages carry a docsearch surface but not always a family
// (for example /rpc and /rpc/examples), so resolve the spec from the surface.
const SURFACE_TO_SPEC_FAMILY = {
  api: 'fastnear',
  fastdata: 'kv-fastdata',
  neardata: 'neardata',
  rpc: 'rpc',
  transfers: 'transfers',
  tx: 'transactions',
};

export function getFamilySpecPathsForSurface(surface) {
  return getFamilySpecPaths(SURFACE_TO_SPEC_FAMILY[surface]);
}

export function buildStaticAssetUrl(pathname, siteConfig) {
  const base = String(siteConfig?.baseUrl || '/').replace(/\/$/, '');
  return `${siteConfig?.url || ''}${base}${pathname}`;
}

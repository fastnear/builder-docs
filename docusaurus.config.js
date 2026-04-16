// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const configDir = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {
  DEFAULT_LOCALE: DEFAULT_DOCS_LOCALE,
  SUPPORTED_LOCALES: DOCS_LOCALES,
  getHiddenSectionsForClient,
  readLocaleRegistry,
} = require('./scripts/lib/locale-framework.js');
const localeRegistry = readLocaleRegistry();
const localeConfigs = Object.fromEntries(
  Object.entries(localeRegistry.locales).map(([locale, localeConfig]) => [
    locale,
    {
      htmlLang: localeConfig.htmlLang,
      label: localeConfig.label,
    },
  ])
);
const localeFrameworkHiddenSections = getHiddenSectionsForClient();
const LOCAL_ENV_KEYS = new Set([
  'DOCS_SEARCH_PROVIDER',
  'DOCSEARCH_APP_ID',
  'DOCSEARCH_API_KEY',
  'DOCSEARCH_INDEX_NAME',
  'HIDE_EARLY_API_FAMILIES',
  'CF_ANALYTICS_TOKEN',
]);

function loadLocalEnvFiles(baseDir) {
  const shellEnvKeys = new Set(Object.keys(process.env));
  const envPaths = ['.env', '.env.local'].map((fileName) => path.join(baseDir, fileName));

  envPaths.forEach((envPath) => {
    if (!fs.existsSync(envPath)) {
      return;
    }

    const raw = fs.readFileSync(envPath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      if (!LOCAL_ENV_KEYS.has(key) || shellEnvKeys.has(key)) {
        return;
      }

      const value = trimmed
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, '');

      process.env[key] = value;
    });
  });
}

loadLocalEnvFiles(configDir);
const sidebars = require('./sidebars.js').default;

const vscodeLanguageServerTypesEsmPath = path.join(
  configDir,
  'node_modules/vscode-languageserver-types/lib/esm/main.js'
);
const hideEarlyApiFamilies = /^(1|true|yes|on)$/i.test(
  process.env.HIDE_EARLY_API_FAMILIES || ''
);
const cfAnalyticsToken = (process.env.CF_ANALYTICS_TOKEN || '').trim();
const requestedSearchProvider = (process.env.DOCS_SEARCH_PROVIDER || 'local').toLowerCase();
const docsearchConfig = {
  appId: process.env.DOCSEARCH_APP_ID,
  apiKey: process.env.DOCSEARCH_API_KEY,
  indexName: process.env.DOCSEARCH_INDEX_NAME,
};
const hasDocsearchConfig = Boolean(
  docsearchConfig.appId && docsearchConfig.apiKey && docsearchConfig.indexName
);
const resolvedSearchProvider =
  requestedSearchProvider === 'algolia' && hasDocsearchConfig ? 'algolia' : 'local';
const docsearchInsightsConfig = hasDocsearchConfig ? { insights: true } : {};
const docsRoot = path.join(configDir, 'docs');
const localizedDocsRoot = (locale) =>
  path.join(configDir, 'i18n', locale, 'docusaurus-plugin-content-docs', 'current');
const localSearchTheme = [
  require.resolve('@easyops-cn/docusaurus-search-local'),
  {
    docsRouteBasePath: '/',
    explicitSearchResultPath: true,
    hashed: 'filename',
    ignoreCssSelectors: [
      '[data-markdown-skip]',
      '.fastnear-doc-page-actions',
      '.builder-fastnear-direct',
    ],
    ignoreFiles: hideEarlyApiFamilies
      ? [
          /\/transfers(?:\/|$)/,
          /\/fastdata(?:\/|$)/,
        ]
      : [],
    indexBlog: false,
    indexDocs: true,
    indexPages: false,
    language: ['en', 'ru'],
    searchBarPosition: 'right',
    searchBarShortcut: true,
    searchBarShortcutHint: true,
    searchBarShortcutKeymap: 'mod+k',
    searchResultContextMaxLength: 80,
    searchResultLimits: 8,
  },
];

function buildLocalizedIgnorePatterns(patterns) {
  return patterns.flatMap((pattern) => [
    pattern,
    ...DOCS_LOCALES.filter((locale) => locale !== DEFAULT_DOCS_LOCALE).map((locale) =>
      pattern === '/' ? `/${locale}` : `/${locale}${pattern}`
    ),
  ]);
}

function walkDocsFiles(dirPath) {
  const collected = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collected.push(...walkDocsFiles(fullPath));
      continue;
    }

    if (/\.(md|mdx)$/.test(entry.name)) {
      collected.push(fullPath);
    }
  }

  return collected;
}

function readFrontmatter(rawContent) {
  const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n?/);
  return frontmatterMatch ? frontmatterMatch[1] : '';
}

function readFrontmatterValue(rawContent, key) {
  const frontmatter = readFrontmatter(rawContent);
  if (!frontmatter) {
    return null;
  }

  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;
}

function readFirstHeading(rawContent) {
  const headingMatch = rawContent.match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : null;
}

function toDocId(filePath, docsDir) {
  return path.relative(docsDir, filePath).replace(/\.(md|mdx)$/i, '').split(path.sep).join('/');
}

function buildDefaultDocSlug(docId) {
  if (docId === 'index') {
    return '/';
  }

  return `/${docId.replace(/\/index$/, '')}`;
}

function localizeDocSlug(slug, locale) {
  if (locale === DEFAULT_DOCS_LOCALE) {
    return slug;
  }

  if (slug === `/${locale}` || slug.startsWith(`/${locale}/`)) {
    return slug;
  }

  return slug === '/' ? `/${locale}` : `/${locale}${slug}`;
}

function readDocMetadataById(docsDir) {
  if (!fs.existsSync(docsDir)) {
    return new Map();
  }

  return new Map(
    walkDocsFiles(docsDir).map((filePath) => {
      const rawContent = fs.readFileSync(filePath, 'utf8');
      const docId = toDocId(filePath, docsDir);
      const title = readFrontmatterValue(rawContent, 'title') || readFirstHeading(rawContent) || docId;
      const slug = readFrontmatterValue(rawContent, 'slug') || buildDefaultDocSlug(docId);
      return [docId, { title, slug }];
    })
  );
}

const docMetadataByLocale = (() => {
  const defaultDocs = readDocMetadataById(docsRoot);
  return Object.fromEntries(
    DOCS_LOCALES.map((locale) => {
      if (locale === DEFAULT_DOCS_LOCALE) {
        return [locale, defaultDocs];
      }

      const localizedDocs = readDocMetadataById(localizedDocsRoot(locale));
      return [locale, new Map([...defaultDocs, ...localizedDocs])];
    })
  );
})();

function resolveMobileSidebarLink(docId, locale) {
  const docMetadata = docMetadataByLocale[locale].get(docId);

  if (!docMetadata) {
    throw new Error(`Unable to resolve mobile sidebar doc "${docId}" for locale "${locale}"`);
  }

  return {
    type: 'link',
    docId,
    href: localizeDocSlug(docMetadata.slug, locale),
    label: docMetadata.title,
    unlisted: false,
  };
}

function resolveMobileSidebarItem(item, locale) {
  if (typeof item === 'string') {
    return resolveMobileSidebarLink(item, locale);
  }

  if (item.type === 'category') {
    return {
      type: 'category',
      label: item.label,
      collapsible: item.collapsible ?? true,
      collapsed: item.collapsed ?? true,
      items: (item.items || []).map((childItem) => resolveMobileSidebarItem(childItem, locale)),
    };
  }

  if (item.type === 'link') {
    return {
      type: 'link',
      href: item.href,
      label: item.label,
    };
  }

  return null;
}

const MOBILE_SIDEBAR_NAVBAR_IDS = [
  'rpcSidebar',
  'fastnearApiSidebar',
  'transactionsApiSidebar',
  'transfersApiSidebar',
  'nearDataApiSidebar',
  'kvFastDataSidebar',
];

function buildMobileSidebarItemsByLocale(sidebarId) {
  const sidebarItems = sidebars[sidebarId] || [];
  return Object.fromEntries(
    DOCS_LOCALES.map((locale) => [
      locale,
      sidebarItems
        .map((item) => resolveMobileSidebarItem(item, locale))
        .filter(Boolean),
    ])
  );
}

function generateMobileSidebarItemsFile() {
  const allSidebars = Object.fromEntries(
    MOBILE_SIDEBAR_NAVBAR_IDS.filter((id) => sidebars[id]).map((sidebarId) => [
      sidebarId,
      buildMobileSidebarItemsByLocale(sidebarId),
    ])
  );
  const targetPath = path.join(
    configDir,
    'src',
    'data',
    'generatedFastnearMobileSidebarItems.json'
  );
  const nextContent = `${JSON.stringify(allSidebars)}\n`;
  let shouldWrite = true;
  try {
    shouldWrite = fs.readFileSync(targetPath, 'utf8') !== nextContent;
  } catch (_error) {
    shouldWrite = true;
  }
  if (shouldWrite) {
    fs.writeFileSync(targetPath, nextContent);
  }
}

generateMobileSidebarItemsFile();

function readDocSlugs() {
  return walkDocsFiles(docsRoot)
    .map((filePath) => {
      const rawContent = fs.readFileSync(filePath, 'utf8');
      const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n?/);
      if (!frontmatterMatch) {
        return null;
      }

      const slugMatch = frontmatterMatch[1].match(/^slug:\s*(.+)$/m);
      if (!slugMatch) {
        return null;
      }

      return slugMatch[1].trim().replace(/^['"]|['"]$/g, '');
    })
    .filter(Boolean)
    .sort();
}

function buildLegacyRedirects() {
  const redirectsByTarget = new Map();

  function addRedirect(from, to) {
    if (!from || !to || from === to) {
      return;
    }

    if (!redirectsByTarget.has(to)) {
      redirectsByTarget.set(to, new Set());
    }

    redirectsByTarget.get(to).add(from);
  }

  addRedirect('/docs', '/');
  addRedirect('/docs/rpc-api', '/');
  addRedirect('/docs/redocly-config', '/redocly-config');

  readDocSlugs().forEach((slug) => {
    if (slug === '/rpc') {
      addRedirect('/docs/rpc-api/rpc', slug);
      return;
    }

    if (slug.startsWith('/rpc/')) {
      addRedirect(`/docs/rpc-api/${slug.slice('/rpc/'.length)}`, slug);
      return;
    }

    if (slug === '/api') {
      addRedirect('/docs/rpc-api/api', slug);
      return;
    }

    if (slug === '/auth') {
      addRedirect('/docs/rpc-api/api-key', slug);
      addRedirect('/docs/rpc-api/auth-browser-demo', slug);
      addRedirect('/docs/rpc-api/auth-production-backend', slug);
      return;
    }

    if (slug.startsWith('/snapshots') || slug.startsWith('/transaction-flow')) {
      addRedirect(`/docs${slug}`, slug);
    }
  });

  return [...redirectsByTarget.entries()]
    .map(([to, from]) => ({
      from: [...from].sort(),
      to,
    }))
    .sort((left, right) => left.to.localeCompare(right.to));
}

const legacyRedirects = buildLegacyRedirects();

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Builder Docs',
  tagline: 'Fundamentals for advanced building on NEAR',
  favicon: 'img/favicon.png',

  // Set the production url of your site here
  url: 'https://docs.fastnear.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',
  trailingSlash: false,
  headTags: [
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@id': 'https://docs.fastnear.com/#website',
        '@type': 'WebSite',
        description:
          'API and RPC documentation for FastNear, high-performance infrastructure for the NEAR Protocol.',
        name: 'FastNear Docs',
        url: 'https://docs.fastnear.com',
        publisher: {
          '@id': 'https://docs.fastnear.com/#organization',
        },
      }),
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@id': 'https://docs.fastnear.com/#organization',
        '@type': 'Organization',
        name: 'FastNear',
        url: 'https://fastnear.com',
        logo: 'https://docs.fastnear.com/img/fastnear_logo_black.png',
        description:
          'High-performance RPC and API infrastructure for the NEAR Protocol blockchain.',
        sameAs: ['https://github.com/fastnear', 'https://x.com/fast_near'],
      }),
    },
  ],

  scripts: [
    ...(cfAnalyticsToken
      ? [
          {
            src: 'https://static.cloudflareinsights.com/beacon.min.js',
            defer: true,
            'data-cf-beacon': JSON.stringify({ token: cfAnalyticsToken }),
          },
        ]
      : []),
  ],

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'fastnear', // Usually your GitHub org/username.
  projectName: 'builder-docs', // Usually your repo name.

  onBrokenLinks: 'throw',
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: [
    '@docusaurus/theme-mermaid',
    ...(resolvedSearchProvider === 'local' ? [localSearchTheme] : []),
    ...(resolvedSearchProvider === 'algolia' ? [require.resolve('@docsearch/docusaurus-adapter')] : []),
  ],

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: DEFAULT_DOCS_LOCALE,
    locales: DOCS_LOCALES,
    localeConfigs,
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        blog: false,
        debug: false,
        docs: {
          breadcrumbs: true,
          path: './docs',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/fastnear/builder-docs/edit/main/',
          showLastUpdateAuthor: false,
          showLastUpdateTime: true,
        },
        sitemap: {
          changefreq: null,
          ignorePatterns: buildLocalizedIgnorePatterns([
            '/api/reference',
            '/redocly-config',
            '/transaction-flow',
            '/transaction-flow/**',
            ...(hideEarlyApiFamilies ? ['/transfers/**', '/fastdata/**'] : []),
          ]),
          lastmod: 'date',
          priority: null,
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  plugins: [
    function vscodeLanguageServerTypesWebpackAlias() {
      return {
        name: 'fastnear-vscode-languageserver-types-webpack-alias',
        configureWebpack() {
          return {
            resolve: {
              alias: {
                // Mermaid's Langium parser stack otherwise resolves the UMD entry,
                // which triggers a noisy webpack critical-dependency warning.
                'vscode-languageserver-types$': vscodeLanguageServerTypesEsmPath,
              },
            },
          };
        },
      };
    },
    function prismIncludeLanguagesNoopWebpackAlias(context) {
      // `@docusaurus/theme-classic` registers `lib/prism-include-languages.js`
      // as a clientModule that statically imports `{ Prism } from 'prism-react-renderer'`
      // and then iterates `themeConfig.prism.additionalLanguages`. We don't
      // configure any `additionalLanguages`, so the module is a no-op at
      // runtime but still drags ~135 KB raw (~30 KB gz) of prism-react-renderer
      // into main.js. Alias it to an empty module so main.js sheds that cost;
      // `CodeBlock/Content` is swizzled to load Highlight from a lazy chunk.
      const additionalLanguages =
        context?.siteConfig?.themeConfig?.prism?.additionalLanguages;
      if (Array.isArray(additionalLanguages) && additionalLanguages.length > 0) {
        throw new Error(
          `[fastnear-prism-include-languages-noop] themeConfig.prism.additionalLanguages is non-empty (${JSON.stringify(
            additionalLanguages
          )}), but this plugin aliases @docusaurus/theme-classic/lib/prism-include-languages to a no-op ` +
            `to shed ~135 KB raw (~30 KB gz) from main.js. Additional languages would be silently dropped. ` +
            `Either remove them from themeConfig.prism.additionalLanguages, or remove this plugin from ` +
            `docusaurus.config.js to restore language registration.`
        );
      }
      return {
        name: 'fastnear-prism-include-languages-noop',
        configureWebpack() {
          return {
            resolve: {
              alias: {
                [require.resolve('@docusaurus/theme-classic/lib/prism-include-languages')]:
                  require.resolve('./src/clientModules/prismIncludeLanguagesNoop.js'),
              },
            },
          };
        },
      };
    },
    path.resolve(configDir, 'plugins/finalizeLocalizedStaticAssets.cjs'),
    path.resolve(configDir, 'plugins/bundleAnalyzerStatic.cjs'),
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          ...legacyRedirects,
          {
            from: ['/rpcs/openapi'],
            to: '/rpc',
          },
          {
            from: ['/apis/openapi'],
            to: '/api/reference',
          },
        ],
      },
    ],
  ],
  customFields: {
    localeFramework: {
      defaultLocale: DEFAULT_DOCS_LOCALE,
      hiddenSections: localeFrameworkHiddenSections,
      locales: DOCS_LOCALES,
    },
    hideEarlyApiFamilies,
    requestedSearchProvider,
    resolvedSearchProvider,
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        defaultMode: 'light',
        disableSwitch: false,
        respectPrefersColorScheme: false,
      },
      navbar: {
        title: '',
        logo: {
          alt: 'FastNear Builder Docs',
          src: 'img/fastnear_logo_black.png',
          srcDark: 'img/fastnear_logo_white.png',
          href: '/',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'rpcSidebar',
            label: 'RPC',
            position: 'left',
          },
          {
            type: 'docSidebar',
            sidebarId: 'fastnearApiSidebar',
            label: 'API',
            position: 'left',
          },
          {
            type: 'docSidebar',
            sidebarId: 'transactionsApiSidebar',
            label: 'Transactions',
            position: 'left',
          },
          ...(!hideEarlyApiFamilies
            ? [
                {
                  type: 'docSidebar',
                  sidebarId: 'transfersApiSidebar',
                  label: 'Transfers',
                  position: 'left',
                },
              ]
            : []),
          {
            type: 'docSidebar',
            sidebarId: 'nearDataApiSidebar',
            label: 'NEAR\u00A0Data',
            position: 'left',
          },
          ...(!hideEarlyApiFamilies
            ? [
                {
                  type: 'docSidebar',
                  sidebarId: 'kvFastDataSidebar',
                  label: 'FastData',
                  position: 'left',
                },
              ]
            : []),
          {
            to: '/snapshots/',
            label: 'Snapshots',
            position: 'left',
          },
          {
            href: 'https://status.fastnear.com',
            position: 'left',
            label: 'Status',
          },
          {
            type: 'search',
            position: 'right',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
        ],
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      ...(resolvedSearchProvider === 'algolia'
        ? {
            docsearch: {
              appId: docsearchConfig.appId,
              apiKey: docsearchConfig.apiKey,
              indexName: docsearchConfig.indexName,
              contextualSearch: true,
              ...docsearchInsightsConfig,
            },
          }
        : {}),
      footer: {
        style: 'dark',
        links: [
          {
            title: 'FastNear',
            items: [
              {
                label: 'Company',
                href: 'https://fastnear.com',
              },
            ],
          },
          {
            title: 'Additional Resources',
            items: [
              {
                label: 'NEAR.org Docs',
                href: 'https://docs.near.org',
              },
              {
                label: 'Nomicon Spec',
                href: 'https://nomicon.io',
              },
              {
                label: 'NEAR Whitepaper',
                href: 'https://pages.near.org/papers/the-official-near-white-paper',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'JS API (alpha version)',
                href: 'https://js.fastnear.com',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} FastNear`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.gruvboxMaterialDark,
      },
    }),
};

export default config;

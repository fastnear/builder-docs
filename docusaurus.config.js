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

const vscodeLanguageServerTypesEsmPath = path.join(
  configDir,
  'node_modules/vscode-languageserver-types/lib/esm/main.js'
);
const hideEarlyApiFamilies = /^(1|true|yes|on)$/i.test(
  process.env.HIDE_EARLY_API_FAMILIES || ''
);
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
    path.resolve(configDir, 'plugins/finalizeLocalizedStaticAssets.cjs'),
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
                  type: 'doc',
                  docId: 'fastdata/kv/index',
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

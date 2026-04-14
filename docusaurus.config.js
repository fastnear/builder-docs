// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const configDir = path.dirname(fileURLToPath(import.meta.url));
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
  assistantId: process.env.DOCSEARCH_ASSISTANT_ID,
};
const hasDocsearchConfig = Boolean(
  docsearchConfig.appId && docsearchConfig.apiKey && docsearchConfig.indexName
);
const resolvedSearchProvider =
  requestedSearchProvider === 'algolia' && hasDocsearchConfig ? 'algolia' : 'local';
const localSearchTheme = [
  require.resolve('@easyops-cn/docusaurus-search-local'),
  {
    docsRouteBasePath: '/docs',
    explicitSearchResultPath: true,
    hashed: 'filename',
    ignoreCssSelectors: [
      '[data-markdown-skip]',
      '.fastnear-doc-page-actions',
      '.builder-fastnear-direct',
    ],
    ignoreFiles: hideEarlyApiFamilies
      ? [
          /\/docs\/rpc-api\/transfers-api(?:\/|$)/,
          /\/docs\/rpc-api\/kv-fastdata-api(?:\/|$)/,
          /\/docs\/transfers(?:\/|$)/,
          /\/docs\/fastdata(?:\/|$)/,
        ]
      : [],
    indexBlog: false,
    indexDocs: true,
    indexPages: false,
    language: 'en',
    searchBarPosition: 'right',
    searchBarShortcut: true,
    searchBarShortcutHint: true,
    searchBarShortcutKeymap: 'mod+k',
    searchResultContextMaxLength: 80,
    searchResultLimits: 8,
  },
];

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
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        debug: false,
        docs: {
          breadcrumbs: false,
          path: './docs',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/fastnear/builder-docs/edit/main/',
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
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            from: ['/docs/rpc-api/fastnear-api'],
            to: '/docs/api',
          },
          {
            from: ['/docs/rpc-api/rpc'],
            to: '/docs/rpc',
          },
          {
            from: ['/docs/rpc-api/transactions-api'],
            to: '/docs/tx',
          },
          {
            from: ['/docs/rpc-api/transfers-api'],
            to: '/docs/transfers',
          },
          {
            from: ['/docs/rpc-api/neardata-api'],
            to: '/docs/neardata',
          },
          {
            from: ['/docs/rpc-api/kv-fastdata-api'],
            to: '/docs/fastdata/kv',
          },
          {
            from: ['/docs/ai-agents'],
            to: '/docs/ai-agents/choosing-surfaces',
          },
        ],
      },
    ],
  ],
  customFields: {
    hideEarlyApiFamilies,
    requestedSearchProvider,
    resolvedSearchProvider,
    docsearchAssistantId: docsearchConfig.assistantId || null,
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: '',
        logo: {
          alt: 'FastNear Builder Docs',
          src: 'img/fastnear_logo_black.png',
          srcDark: 'img/fastnear_logo_white.png',
          href: '/docs/rpc-api',
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
            label: 'NEAR Data',
            position: 'left',
          },
          ...(!hideEarlyApiFamilies
            ? [
                {
                  label: 'FastData',
                  position: 'left',
                  items: [
                    {
                      type: 'doc',
                      docId: 'rpc-api/kv-fastdata-api/index',
                      label: 'KV FastData API',
                    },
                  ],
                },
              ]
            : []),
          {
            to: '/docs/snapshots/',
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
            href: 'https://github.com/fastnear/builder-docs',
            label: 'GitHub',
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
              ...(docsearchConfig.assistantId
                ? {
                    askAi: {
                      assistantId: docsearchConfig.assistantId,
                      sidePanel: true,
                    },
                  }
                : {}),
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
                label: 'Company GitHub',
                href: 'https://github.com/fastnear',
              },
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

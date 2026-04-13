// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const hideEarlyApiFamilies = /^(1|true|yes|on)$/i.test(
  process.env.HIDE_EARLY_API_FAMILIES || ''
);

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Builder Docs',
  tagline: 'Fundamentals for advanced building on NEAR',
  favicon: 'img/favicon.png',

  // Set the production url of your site here
  url: 'https://builder-docs.fastnear.com',
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
  themes: ['@docusaurus/theme-mermaid'],

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
  customFields: {
    hideEarlyApiFamilies,
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

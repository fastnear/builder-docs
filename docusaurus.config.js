// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Builder Documentation',
  tagline: 'Fundamentals for advanced building on NEAR',
  favicon: 'img/favicon.png',

  // Set the production url of your site here
  url: 'https://builder-docs.fastnear.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'fastnear', // Usually your GitHub org/username.
  projectName: 'builder-docs', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

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
          path: './docs',
          sidebarPath: require.resolve('./docs/sidebars.js'),
          editUrl: 'https://github.com/fastnear/builder-docs/edit/main/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Builder Docs',
        items: [
          // Seems like we'll want to have sidebars, don't get this yet
          // {
          //   type: 'docSidebar',
          //   sidebarId: 'tutorialSidebar',
          //   position: 'left',
          //   label: 'Tutorial',
          //   className: 'header-github-link',
          // },
          {
            to: '/docs/rpc-api/',
            label: 'RPC / API',
            position: 'left',
          },
          {
            href: 'https://github.com/fastnear/builder-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'FastNEAR',
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
        copyright: `Copyright © ${new Date().getFullYear()} FastNEAR`,
      },
      prism: {
        theme: prismThemes.oneLight,
        darkTheme: prismThemes.gruvboxMaterialDark,
      },
    }),
};

export default config;

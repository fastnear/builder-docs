const fs = require('node:fs');
const path = require('node:path');

function getSiteOrigin(siteConfig) {
  return String(siteConfig?.url || 'https://docs.fastnear.com').replace(/\/+$/, '');
}

function copyNestedLocaleAssets(localeRoot, locale) {
  const nestedLocaleRoot = path.join(localeRoot, locale);
  if (!fs.existsSync(nestedLocaleRoot)) {
    return;
  }

  for (const entry of fs.readdirSync(nestedLocaleRoot)) {
    fs.cpSync(path.join(nestedLocaleRoot, entry), path.join(localeRoot, entry), {
      force: true,
      recursive: true,
    });
  }

  fs.rmSync(nestedLocaleRoot, { force: true, recursive: true });
}

function appendLocalizedSitemapHints({ defaultLocale, locales, robotsPath, siteOrigin }) {
  if (!fs.existsSync(robotsPath)) {
    return;
  }

  const robotsText = fs.readFileSync(robotsPath, 'utf8');
  const requiredSitemaps = [
    `${siteOrigin}/sitemap.xml`,
    ...locales
      .filter((locale) => locale !== defaultLocale)
      .map((locale) => `${siteOrigin}/${locale}/sitemap.xml`),
  ];

  const missingLines = requiredSitemaps
    .filter((sitemapUrl) => !robotsText.includes(`Sitemap: ${sitemapUrl}`))
    .map((sitemapUrl) => `Sitemap: ${sitemapUrl}`);

  if (!missingLines.length) {
    return;
  }

  const suffix = robotsText.endsWith('\n') ? '' : '\n';
  fs.writeFileSync(robotsPath, `${robotsText}${suffix}${missingLines.join('\n')}\n`, 'utf8');
}

module.exports = function finalizeLocalizedStaticAssets(context) {
  const defaultLocale = context.i18n?.defaultLocale || 'en';
  const currentLocale = context.i18n?.currentLocale || defaultLocale;
  const locales = context.i18n?.locales || [defaultLocale];
  const siteOrigin = getSiteOrigin(context.siteConfig);

  return {
    name: 'fastnear-finalize-localized-static-assets',
    async postBuild({ outDir }) {
      if (currentLocale === defaultLocale) {
        appendLocalizedSitemapHints({
          defaultLocale,
          locales,
          robotsPath: path.join(outDir, 'robots.txt'),
          siteOrigin,
        });
        return;
      }

      const localeRoot = path.basename(outDir) === currentLocale
        ? outDir
        : path.join(outDir, currentLocale);

      // Docusaurus copies /static/<locale> into each locale outDir. For locale builds
      // that creates /<locale>/<locale>/..., so we promote those files back to the
      // locale root to keep /ru/llms.txt, /ru/index.md, and /ru/structured-data/** stable.
      copyNestedLocaleAssets(localeRoot, currentLocale);
    },
  };
};

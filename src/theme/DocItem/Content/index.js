import React, { useMemo, useRef } from 'react';
import Head from '@docusaurus/Head';
import { translate } from '@docusaurus/Translate';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DocItemContent from '@theme-original/DocItem/Content';

import PageActions from '@site/src/components/PageActions';
import { copyTextToClipboard } from '@site/src/utils/clipboard';
import {
  buildMarkdownFromDocContent,
  sanitizePublicUrl,
} from '@site/src/utils/markdownExport';
import { matchesLocalizedRoutePrefix } from '@site/src/utils/localizedRoutes';
import {
  getDocsearchSemanticMeta,
  isPublicDocsPermalink,
} from '@site/src/utils/seo';
import { buildDocsStructuredData } from '@site/src/utils/structuredData';

export default function WrappedDocItemContent(props) {
  const contentRef = useRef(null);
  const { metadata, frontMatter } = useDoc();
  const { i18n, siteConfig } = useDocusaurusContext();
  const currentLocale = i18n.currentLocale || 'en';
  const hiddenSections = Array.isArray(siteConfig.customFields?.localeFramework?.hiddenSections)
    ? siteConfig.customFields.localeFramework.hiddenSections
    : [];
  const pageActions = Array.isArray(frontMatter.page_actions)
    ? frontMatter.page_actions
    : typeof frontMatter.page_actions === 'string'
      ? [frontMatter.page_actions]
      : [];
  const hiddenSection = useMemo(
    () =>
      hiddenSections.find((entry) =>
        matchesLocalizedRoutePrefix(metadata.permalink, entry.routePrefix)
      ) || null,
    [hiddenSections, metadata.permalink]
  );
  const shouldExposeSeo = useMemo(
    () => !hiddenSection && isPublicDocsPermalink(metadata.permalink),
    [hiddenSection, metadata.permalink]
  );

  const actions = useMemo(() => {
    if (!pageActions.includes('markdown')) {
      return [];
    }

    return [
      {
        id: 'copy-markdown',
        label: translate({
          id: 'fastnear.docContent.copyMarkdown',
          message: 'Copy Markdown',
        }),
        pendingLabel: translate({
          id: 'fastnear.docContent.copyMarkdown.pending',
          message: 'Copying...',
        }),
        completedLabel: translate({
          id: 'fastnear.docContent.copyMarkdown.completed',
          message: 'Copied',
        }),
        onSelect: async () => {
          const markdownRoot = contentRef.current?.querySelector('.theme-doc-markdown');
          const markdown = buildMarkdownFromDocContent(markdownRoot, {
            sourceUrl:
              typeof window !== 'undefined' ? sanitizePublicUrl(window.location.href) : metadata.permalink,
          });

          await copyTextToClipboard(markdown);
        },
      },
    ];
  }, [metadata.permalink, pageActions]);

  const seoMeta = useMemo(() => {
    if (!shouldExposeSeo) {
      return null;
    }

    const keywords = Array.isArray(frontMatter.keywords)
      ? frontMatter.keywords
      : typeof frontMatter.keywords === 'string'
        ? [frontMatter.keywords]
        : [];
    const description = metadata.description || frontMatter.description || '';

    return {
      ...getDocsearchSemanticMeta(metadata.permalink),
      structuredData: buildDocsStructuredData({
        currentLocale,
        frontMatter: {
          ...frontMatter,
          description,
          keywords,
        },
        metadata,
        siteConfig,
      }),
    };
  }, [
    frontMatter.description,
    frontMatter.keywords,
    currentLocale,
    shouldExposeSeo,
    metadata.description,
    metadata.permalink,
    metadata.title,
    siteConfig,
  ]);

  return (
    <div
      className="fastnear-doc-content-shell"
      ref={contentRef}
      data-fastnear-crawler-root={seoMeta ? 'docs' : undefined}
      data-fastnear-audience={seoMeta?.audience || undefined}
      data-fastnear-category={seoMeta?.category || undefined}
      data-fastnear-family={seoMeta?.family || undefined}
      data-fastnear-method-type={seoMeta?.methodType || undefined}
      data-fastnear-page-type={seoMeta?.pageType || undefined}
      data-fastnear-surface={seoMeta?.surface || undefined}
    >
      {seoMeta ? (
        <Head>
          {seoMeta.category ? (
            <meta name="docsearch:category" content={seoMeta.category} />
          ) : null}
          {seoMeta.surface ? (
            <meta name="docsearch:surface" content={seoMeta.surface} />
          ) : null}
          {seoMeta.family ? (
            <meta name="docsearch:family" content={seoMeta.family} />
          ) : null}
          {seoMeta.audience ? (
            <meta name="docsearch:audience" content={seoMeta.audience} />
          ) : null}
          {seoMeta.pageType ? (
            <meta name="docsearch:page_type" content={seoMeta.pageType} />
          ) : null}
          {seoMeta.methodType ? (
            <meta name="docsearch:method_type" content={seoMeta.methodType} />
          ) : null}
          {seoMeta.structuredData?.structuredData ? (
            <script type="application/ld+json">
              {JSON.stringify(seoMeta.structuredData.structuredData)}
            </script>
          ) : null}
        </Head>
      ) : null}
      {hiddenSection ? (
        <Head>
          <meta name="robots" content="noindex" />
          <meta name="googlebot" content="noindex" />
        </Head>
      ) : null}
      {actions.length ? (
        <div className="fastnear-doc-content__toolbar" data-markdown-skip>
          <PageActions actions={actions} />
        </div>
      ) : null}
      {hiddenSection ? (
        <div
          className="alert alert--warning margin-bottom--md"
          data-fastnear-hidden-section={hiddenSection.id}
          data-markdown-skip
          role="note"
        >
          <p className="margin-bottom--xs">
            <strong>
              {translate({
                id: 'fastnear.hiddenSectionScope.title',
                message: 'Editorial polish is still intentionally in progress',
              })}
            </strong>
          </p>
          <p className="margin-bottom--0">
            {translate({
              id: 'fastnear.hiddenSectionScope.message',
              message:
                'This section is hidden from primary navigation. Translation and editorial polish are intentionally out of scope until the section is public.',
            })}
          </p>
        </div>
      ) : null}
      <DocItemContent {...props} />
    </div>
  );
}

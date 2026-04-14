import React, { useMemo, useRef } from 'react';
import Head from '@docusaurus/Head';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DocItemContent from '@theme-original/DocItem/Content';

import PageActions from '@site/src/components/PageActions';
import { copyTextToClipboard } from '@site/src/utils/clipboard';
import {
  buildMarkdownFromDocContent,
  sanitizePublicUrl,
} from '@site/src/utils/markdownExport';
import {
  getDocsearchCategory,
  getDocsearchMethodType,
  isPublicDocsPermalink,
} from '@site/src/utils/seo';
import { buildDocsStructuredData } from '@site/src/utils/structuredData';

export default function WrappedDocItemContent(props) {
  const contentRef = useRef(null);
  const { metadata, frontMatter } = useDoc();
  const { siteConfig } = useDocusaurusContext();
  const pageActions = Array.isArray(frontMatter.page_actions)
    ? frontMatter.page_actions
    : typeof frontMatter.page_actions === 'string'
      ? [frontMatter.page_actions]
      : [];

  const actions = useMemo(() => {
    if (!pageActions.includes('markdown')) {
      return [];
    }

    return [
      {
        id: 'copy-markdown',
        label: 'Copy Markdown',
        pendingLabel: 'Copying...',
        completedLabel: 'Copied',
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
    if (!isPublicDocsPermalink(metadata.permalink)) {
      return null;
    }

    const keywords = Array.isArray(frontMatter.keywords)
      ? frontMatter.keywords
      : typeof frontMatter.keywords === 'string'
        ? [frontMatter.keywords]
        : [];
    const description = metadata.description || frontMatter.description || '';

    return {
      category: getDocsearchCategory(metadata.permalink),
      structuredData: buildDocsStructuredData({
        frontMatter: {
          ...frontMatter,
          description,
          keywords,
        },
        metadata,
        siteConfig,
      }),
      methodType: getDocsearchMethodType(metadata.permalink),
    };
  }, [
    frontMatter.description,
    frontMatter.keywords,
    metadata.description,
    metadata.permalink,
    metadata.title,
    siteConfig,
  ]);

  return (
    <div ref={contentRef}>
      {seoMeta ? (
        <Head>
          {seoMeta.category ? (
            <meta name="docsearch:category" content={seoMeta.category} />
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
      {actions.length ? (
        <div className="fastnear-doc-content__toolbar" data-markdown-skip>
          <PageActions actions={actions} />
        </div>
      ) : null}
      <DocItemContent {...props} />
    </div>
  );
}

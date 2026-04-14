import React, { useMemo, useRef } from 'react';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import DocItemContent from '@theme-original/DocItem/Content';

import PageActions from '@site/src/components/PageActions';
import { copyTextToClipboard } from '@site/src/utils/clipboard';
import {
  buildMarkdownFromDocContent,
  sanitizePublicUrl,
} from '@site/src/utils/markdownExport';

export default function WrappedDocItemContent(props) {
  const contentRef = useRef(null);
  const { metadata, frontMatter } = useDoc();
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

  return (
    <div ref={contentRef}>
      {actions.length ? (
        <div className="fastnear-doc-content__toolbar" data-markdown-skip>
          <PageActions actions={actions} />
        </div>
      ) : null}
      <DocItemContent {...props} />
    </div>
  );
}

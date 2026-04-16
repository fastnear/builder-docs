import React, { Suspense, lazy } from 'react';
import clsx from 'clsx';
import BrowserOnly from '@docusaurus/BrowserOnly';
import { useCodeBlockContext } from '@docusaurus/theme-common/internal';

const OriginalContent = lazy(() => import('@theme-original/CodeBlock/Content'));

function PlainCodeFallback({ className }) {
  const { metadata, wordWrap } = useCodeBlockContext();
  return (
    <pre
      ref={wordWrap.codeBlockRef}
      tabIndex={0}
      className={clsx(className, 'thin-scrollbar', 'fastnear-codeblock-pending')}
    >
      <code>{metadata.code}</code>
    </pre>
  );
}

export default function CodeBlockContent(props) {
  return (
    <BrowserOnly fallback={<PlainCodeFallback {...props} />}>
      {() => (
        <Suspense fallback={<PlainCodeFallback {...props} />}>
          <OriginalContent {...props} />
        </Suspense>
      )}
    </BrowserOnly>
  );
}

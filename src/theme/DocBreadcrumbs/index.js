import React from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import {
  useBreadcrumbsStructuredData,
  useDoc,
  useSidebarBreadcrumbs,
} from '@docusaurus/plugin-content-docs/client';

import {
  buildFallbackBreadcrumbs,
  shouldHideVisibleBreadcrumbs,
  trimVisibleBreadcrumbs,
} from '@site/src/utils/docsRoutes';

function countLinkedBreadcrumbs(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item?.href).length;
}

export default function DocBreadcrumbs() {
  const { metadata } = useDoc();
  const sidebarBreadcrumbs = useSidebarBreadcrumbs();
  const fallbackBreadcrumbs = buildFallbackBreadcrumbs(metadata, { includeHidden: true });
  const shouldUseFallback =
    fallbackBreadcrumbs.length > (sidebarBreadcrumbs?.length || 0) ||
    countLinkedBreadcrumbs(fallbackBreadcrumbs) > countLinkedBreadcrumbs(sidebarBreadcrumbs);
  const breadcrumbs = shouldUseFallback ? fallbackBreadcrumbs : sidebarBreadcrumbs;

  if (!breadcrumbs?.length) {
    return null;
  }

  const structuredData = useBreadcrumbsStructuredData({ breadcrumbs });
  const visibleBreadcrumbs = shouldHideVisibleBreadcrumbs(metadata.permalink)
    ? []
    : trimVisibleBreadcrumbs(breadcrumbs);

  return (
    <>
      {structuredData ? (
        <Head>
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Head>
      ) : null}
      {visibleBreadcrumbs.length ? (
        <nav className="theme-doc-breadcrumbs" aria-label="Breadcrumbs">
          <ul className="breadcrumbs">
            {visibleBreadcrumbs.map((breadcrumb, index) => {
              const isLast = index === visibleBreadcrumbs.length - 1;

              return (
                <li
                  key={`${breadcrumb.href}-${breadcrumb.label}`}
                  className={`breadcrumbs__item${isLast ? ' breadcrumbs__item--active' : ''}`}>
                  {isLast ? (
                    <span className="breadcrumbs__link">{breadcrumb.label}</span>
                  ) : (
                    <Link className="breadcrumbs__link" href={breadcrumb.href}>
                      <span>{breadcrumb.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </>
  );
}

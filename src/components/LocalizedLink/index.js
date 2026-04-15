import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

import { localizeHref } from '@site/src/utils/localizedRoutes';

export default function LocalizedLink({ href, to, ...props }) {
  const { i18n } = useDocusaurusContext();
  const currentLocale = i18n.currentLocale || 'en';

  return (
    <Link
      {...props}
      href={typeof href === 'string' ? localizeHref(href, currentLocale) : href}
      to={typeof to === 'string' ? localizeHref(to, currentLocale) : to}
    />
  );
}

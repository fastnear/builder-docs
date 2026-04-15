import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useAnchorTargetClassName } from '@docusaurus/theme-common';

import { localizeHref } from '@site/src/utils/localizedRoutes';

export default function MDXA(props) {
  const { i18n } = useDocusaurusContext();
  const currentLocale = i18n.currentLocale || 'en';
  const anchorTargetClassName = useAnchorTargetClassName(props.id);

  return (
    <Link
      {...props}
      className={clsx(anchorTargetClassName, props.className)}
      href={typeof props.href === 'string' ? localizeHref(props.href, currentLocale) : props.href}
      to={typeof props.to === 'string' ? localizeHref(props.to, currentLocale) : props.to}
    />
  );
}

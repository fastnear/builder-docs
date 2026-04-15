import React from 'react';

import { isLocalizedRoute } from '@site/src/utils/localizedRoutes';
import LocalizedLink from '@site/src/components/LocalizedLink';
import styles from './styles.module.css';

export default function SimpleButton({to, children}) {
  // If used inside MDX content where it might be nested in an anchor tag
  // we can check for this scenario by examining the 'to' prop
  const isExternalLink = to && (to.startsWith('http://') || to.startsWith('https://'));

  // For non-link usage or when we suspect nesting issues
  if (!to || (typeof window !== 'undefined' && isLocalizedRoute(window.location.pathname, to))) {
    return (
      <span className={styles.button}>
        {children}
      </span>
    );
  }

  // Otherwise, render as a link
  return (
    <LocalizedLink
      className={styles.button}
      to={to}>
      {children}
    </LocalizedLink>
  );
}

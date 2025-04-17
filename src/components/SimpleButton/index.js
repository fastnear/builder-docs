import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export default function SimpleButton({to, children}) {
  // If used inside MDX content where it might be nested in an anchor tag
  // we can check for this scenario by examining the 'to' prop
  const isExternalLink = to && (to.startsWith('http://') || to.startsWith('https://'));

  // For non-link usage or when we suspect nesting issues
  if (!to || typeof window !== 'undefined' && window.location.pathname === to) {
    return (
      <span className={styles.button}>
        {children}
      </span>
    );
  }

  // Otherwise, render as a link
  return (
    <Link
      className={styles.button}
      to={to}>
      {children}
    </Link>
  );
}

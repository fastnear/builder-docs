import React, { useState } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import {
  useAnnouncementBar,
  useScrollPosition,
} from '@docusaurus/theme-common/internal';
import { translate } from '@docusaurus/Translate';
import DocSidebarItems from '@theme/DocSidebarItems';
import {
  FastnearApiSidebarVersionControl,
  useFastnearApiSidebarSelection,
} from '@site/src/components/FastnearApiSidebarVersionControl';

import styles from './styles.module.css';

function useShowAnnouncementBar() {
  const { isActive } = useAnnouncementBar();
  const [showAnnouncementBar, setShowAnnouncementBar] = useState(isActive);

  useScrollPosition(
    ({ scrollY }) => {
      if (isActive) {
        setShowAnnouncementBar(scrollY === 0);
      }
    },
    [isActive]
  );

  return isActive && showAnnouncementBar;
}

export default function DocSidebarDesktopContent({ path, sidebar, className }) {
  const showAnnouncementBar = useShowAnnouncementBar();
  const {
    filteredItems,
    onVersionChange,
    selectedVersion,
    showVersionControl,
    versionKeys,
  } = useFastnearApiSidebarSelection(sidebar);

  return (
    <nav
      aria-label={translate({
        id: 'theme.docs.sidebar.navAriaLabel',
        message: 'Docs sidebar',
        description: 'The ARIA label for the sidebar navigation',
      })}
      className={clsx(
        'menu thin-scrollbar',
        styles.menu,
        showAnnouncementBar && styles.menuWithAnnouncementBar,
        className
      )}
    >
      {showVersionControl ? (
        <FastnearApiSidebarVersionControl
          className="fastnear-api-sidebar-version-control--desktop"
          selectedVersion={selectedVersion}
          versionKeys={versionKeys}
          onVersionChange={onVersionChange}
        />
      ) : null}
      <ul className={clsx(ThemeClassNames.docs.docSidebarMenu, 'menu__list')}>
        <DocSidebarItems items={filteredItems} activePath={path} level={1} />
      </ul>
    </nav>
  );
}

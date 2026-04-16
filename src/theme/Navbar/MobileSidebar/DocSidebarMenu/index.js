import React from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import DocSidebarItems from '@theme/DocSidebarItems';
import {
  FastnearApiSidebarVersionControl,
  useFastnearApiSidebarSelection,
} from '@site/src/components/FastnearApiSidebarVersionControl';

export default function DocSidebarMenu({ sidebar, path }) {
  const mobileSidebar = useNavbarMobileSidebar();
  const {
    filteredItems,
    onVersionChange,
    selectedVersion,
    showVersionControl,
    versionKeys,
  } = useFastnearApiSidebarSelection(sidebar);

  return (
    <>
      {showVersionControl ? (
        <FastnearApiSidebarVersionControl
          className="fastnear-api-sidebar-version-control--mobile"
          selectedVersion={selectedVersion}
          versionKeys={versionKeys}
          onVersionChange={(nextVersion) => {
            onVersionChange(nextVersion);
            mobileSidebar.toggle();
          }}
        />
      ) : null}
      <ul className={clsx(ThemeClassNames.docs.docSidebarMenu, 'menu__list')}>
        <DocSidebarItems
          items={filteredItems}
          activePath={path}
          onItemClick={(item) => {
            if (item.type === 'category' && item.href) {
              mobileSidebar.toggle();
            }
            if (item.type === 'link') {
              mobileSidebar.toggle();
            }
          }}
          level={1}
        />
      </ul>
    </>
  );
}

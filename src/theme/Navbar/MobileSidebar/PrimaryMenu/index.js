import React from 'react';
import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  useActiveDocContext,
  useLayoutDocsSidebar,
} from '@docusaurus/plugin-content-docs/client';
import { useThemeConfig } from '@docusaurus/theme-common';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';
import {
  MOBILE_NAVBAR_SECONDARY_PANEL_ID,
  useMobileNavbarDocsMenu,
} from '../context';

function useNavbarItems() {
  return useThemeConfig().navbar.items;
}

function MobileDocSidebarNavbarItem({
  sidebarId,
  label,
  docsPluginId,
  className,
  mobileSidebarItemsByLocale,
}) {
  const { i18n } = useDocusaurusContext();
  const { activeDoc } = useActiveDocContext(docsPluginId);
  const { openMenu, selectedMenu } = useMobileNavbarDocsMenu();
  const sidebarLink = useLayoutDocsSidebar(sidebarId, docsPluginId).link;
  const sidebarItems =
    mobileSidebarItemsByLocale?.[i18n.currentLocale] ??
    mobileSidebarItemsByLocale?.en ??
    [];
  const triggerId = `fastnear-mobile-navbar-trigger-${sidebarId}`;
  const isExpanded = selectedMenu?.sidebarId === sidebarId;

  if (!sidebarLink) {
    throw new Error(
      `DocSidebarNavbarItem: Sidebar with ID "${sidebarId}" doesn't have anything to be linked to.`
    );
  }

  return (
    <li className="menu__list-item">
      <button
        type="button"
        id={triggerId}
        className={clsx(
          'menu__link',
          'fastnear-mobile-navbar__drilldown',
          className,
          activeDoc?.sidebar === sidebarId && 'menu__link--active'
        )}
        aria-controls={MOBILE_NAVBAR_SECONDARY_PANEL_ID}
        aria-expanded={isExpanded}
        onClick={() =>
          openMenu({
            label: label ?? sidebarLink.label,
            path: sidebarLink.path,
            sidebarId,
            sidebar: sidebarItems,
            triggerId,
          })
        }>
        <span className="fastnear-mobile-navbar__drilldown-label">
          {label ?? sidebarLink.label}
        </span>
        <span className="fastnear-mobile-navbar__drilldown-icon" aria-hidden="true">
          ›
        </span>
      </button>
    </li>
  );
}

export default function NavbarMobilePrimaryMenu() {
  const mobileSidebar = useNavbarMobileSidebar();
  const items = useNavbarItems();

  return (
    <ul className="menu__list">
      {items.map((item, i) =>
        item.type === 'docSidebar' && item.mobileSidebarItemsByLocale ? (
          <MobileDocSidebarNavbarItem key={i} {...item} />
        ) : (
          <NavbarItem
            mobile
            {...item}
            onClick={() => mobileSidebar.toggle()}
            key={i}
          />
        )
      )}
    </ul>
  );
}

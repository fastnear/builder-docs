import React, { useCallback } from 'react';
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

let mobileSidebarItemsPromise = null;

function loadMobileSidebarItems() {
  if (!mobileSidebarItemsPromise) {
    mobileSidebarItemsPromise = import(
      /* webpackChunkName: "fastnear-mobile-sidebar-items" */
      '@site/src/data/generatedFastnearMobileSidebarItems.json'
    )
      .then((moduleValue) => moduleValue?.default || moduleValue || {})
      .catch((error) => {
        console.error('Unable to load mobile sidebar items:', error);
        return {};
      });
  }

  return mobileSidebarItemsPromise;
}

function MobileDocSidebarNavbarItem({
  sidebarId,
  label,
  docsPluginId,
  className,
}) {
  const { i18n } = useDocusaurusContext();
  const { activeDoc } = useActiveDocContext(docsPluginId);
  const { openMenu, selectedMenu } = useMobileNavbarDocsMenu();
  const sidebarLink = useLayoutDocsSidebar(sidebarId, docsPluginId).link;
  const triggerId = `fastnear-mobile-navbar-trigger-${sidebarId}`;
  const isExpanded = selectedMenu?.sidebarId === sidebarId;

  if (!sidebarLink) {
    throw new Error(
      `DocSidebarNavbarItem: Sidebar with ID "${sidebarId}" doesn't have anything to be linked to.`
    );
  }

  const handleClick = useCallback(async () => {
    const data = await loadMobileSidebarItems();
    const sidebarItems =
      data[sidebarId]?.[i18n.currentLocale] ??
      data[sidebarId]?.en ??
      [];
    openMenu({
      label: label ?? sidebarLink.label,
      path: sidebarLink.path,
      sidebarId,
      sidebar: sidebarItems,
      triggerId,
    });
  }, [i18n.currentLocale, label, openMenu, sidebarId, sidebarLink.label, sidebarLink.path, triggerId]);

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
        onPointerEnter={() => {
          void loadMobileSidebarItems();
        }}
        onClick={handleClick}>
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
        item.type === 'docSidebar' ? (
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

import React, { version } from 'react';
import clsx from 'clsx';
import { useNavbarSecondaryMenu } from '@docusaurus/theme-common/internal';
import { ThemeClassNames } from '@docusaurus/theme-common';
import {
  MOBILE_NAVBAR_SECONDARY_PANEL_ID,
  useMobileNavbarDocsMenu,
} from '../context';

function inertProps(inert) {
  const isBeforeReact19 = parseInt(version.split('.')[0], 10) < 19;
  if (isBeforeReact19) {
    return { inert: inert ? '' : undefined };
  }
  return { inert };
}

function NavbarMobileSidebarPanel({ children, id, inert, labelledBy }) {
  return (
    <div
      id={id}
      className={clsx(
        ThemeClassNames.layout.navbar.mobileSidebar.panel,
        'navbar-sidebar__item menu'
      )}
      aria-labelledby={labelledBy}
      {...inertProps(inert)}>
      {children}
    </div>
  );
}

export default function NavbarMobileSidebarLayout({
  header,
  primaryMenu,
  secondaryMenu,
}) {
  const defaultSecondaryMenu = useNavbarSecondaryMenu();
  const { selectedMenu } = useMobileNavbarDocsMenu();
  const secondaryMenuShown = Boolean(selectedMenu) || defaultSecondaryMenu.shown;

  return (
    <div
      className={clsx(
        ThemeClassNames.layout.navbar.mobileSidebar.container,
        'navbar-sidebar'
      )}>
      {header}
      <div
        className={clsx('navbar-sidebar__items', {
          'navbar-sidebar__items--show-secondary': secondaryMenuShown,
        })}>
        <NavbarMobileSidebarPanel inert={secondaryMenuShown}>
          {primaryMenu}
        </NavbarMobileSidebarPanel>
        <NavbarMobileSidebarPanel
          id={MOBILE_NAVBAR_SECONDARY_PANEL_ID}
          inert={!secondaryMenuShown}
          labelledBy={selectedMenu?.triggerId}>
          {secondaryMenu}
        </NavbarMobileSidebarPanel>
      </div>
    </div>
  );
}

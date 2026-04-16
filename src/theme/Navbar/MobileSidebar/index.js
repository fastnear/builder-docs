import React from 'react';
import {
  useLockBodyScroll,
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import NavbarMobileSidebarLayout from '@theme/Navbar/MobileSidebar/Layout';
import NavbarMobileSidebarHeader from '@theme/Navbar/MobileSidebar/Header';
import NavbarMobileSidebarPrimaryMenu from '@theme/Navbar/MobileSidebar/PrimaryMenu';
import NavbarMobileSidebarSecondaryMenu from '@theme/Navbar/MobileSidebar/SecondaryMenu';
import { MobileNavbarDocsMenuProvider } from './context';

export default function NavbarMobileSidebar() {
  const mobileSidebar = useNavbarMobileSidebar();
  useLockBodyScroll(mobileSidebar.shown);

  if (!mobileSidebar.shouldRender) {
    return null;
  }

  return (
    <MobileNavbarDocsMenuProvider>
      <NavbarMobileSidebarLayout
        header={<NavbarMobileSidebarHeader />}
        primaryMenu={<NavbarMobileSidebarPrimaryMenu />}
        secondaryMenu={<NavbarMobileSidebarSecondaryMenu />}
      />
    </MobileNavbarDocsMenuProvider>
  );
}

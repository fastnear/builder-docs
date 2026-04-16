import React from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import { useNavbarSecondaryMenu } from '@docusaurus/theme-common/internal';
import Translate from '@docusaurus/Translate';
import DocSidebarMenu from '@theme/Navbar/MobileSidebar/DocSidebarMenu';
import { useMobileNavbarDocsMenu } from '../context';

function SecondaryMenuBackButton(props) {
  return (
    <button {...props} type="button" className="clean-btn navbar-sidebar__back">
      <Translate
        id="theme.navbar.mobileSidebarSecondaryMenu.backButtonLabel"
        description="The label of the back button to return to main menu, inside the mobile navbar sidebar secondary menu (notably used to display the docs sidebar)">
        ← Back to main menu
      </Translate>
    </button>
  );
}

export default function NavbarMobileSidebarSecondaryMenu() {
  const isPrimaryMenuEmpty = useThemeConfig().navbar.items.length === 0;
  const defaultSecondaryMenu = useNavbarSecondaryMenu();
  const { closeMenu, selectedMenu } = useMobileNavbarDocsMenu();

  if (selectedMenu) {
    return (
      <>
        {!isPrimaryMenuEmpty && <SecondaryMenuBackButton onClick={closeMenu} />}
        {selectedMenu.label ? (
          <div className="fastnear-mobile-navbar__section-title">
            {selectedMenu.label}
          </div>
        ) : null}
        <DocSidebarMenu path={selectedMenu.path} sidebar={selectedMenu.sidebar} />
      </>
    );
  }

  return (
    <>
      {!isPrimaryMenuEmpty && (
        <SecondaryMenuBackButton onClick={() => defaultSecondaryMenu.hide()} />
      )}
      {defaultSecondaryMenu.content}
    </>
  );
}

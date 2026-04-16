import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ReactContextError } from '@docusaurus/theme-common';
import { useNavbarMobileSidebar } from '@docusaurus/theme-common/internal';

const MobileNavbarDocsMenuContext = React.createContext(undefined);
export const MOBILE_NAVBAR_SECONDARY_PANEL_ID = 'fastnear-mobile-navbar-secondary-panel';

export function MobileNavbarDocsMenuProvider({ children }) {
  const mobileSidebar = useNavbarMobileSidebar();
  const [selectedMenu, setSelectedMenu] = useState(null);

  useEffect(() => {
    if (!mobileSidebar.shown) {
      setSelectedMenu(null);
    }
  }, [mobileSidebar.shown]);

  const openMenu = useCallback((menu) => {
    setSelectedMenu(menu);
  }, []);

  const closeMenu = useCallback(() => {
    setSelectedMenu(null);
  }, []);

  const value = useMemo(
    () => ({
      selectedMenu,
      openMenu,
      closeMenu,
    }),
    [closeMenu, openMenu, selectedMenu]
  );

  return (
    <MobileNavbarDocsMenuContext.Provider value={value}>
      {children}
    </MobileNavbarDocsMenuContext.Provider>
  );
}

export function useMobileNavbarDocsMenu() {
  const value = useContext(MobileNavbarDocsMenuContext);

  if (!value) {
    throw new ReactContextError('MobileNavbarDocsMenuProvider');
  }

  return value;
}

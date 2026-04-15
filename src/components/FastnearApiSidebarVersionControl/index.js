import React, { useEffect, useMemo, useState } from 'react';
import { translate } from '@docusaurus/Translate';
import clsx from 'clsx';
import { useHistory, useLocation } from '@docusaurus/router';

import {
  getRouteLocale,
  localizeRoute,
  stripLocalePrefix,
} from '@site/src/utils/localizedRoutes';

const STORAGE_KEY = 'fastnear-api:selected-version';
const VERSION_LABEL_RE = /^V(\d+)$/i;
const VERSIONED_ITEM_LABEL_RE = /^V\d+\s+/i;
const VERSION_PATH_RE = /^(\/api\/)(v\d+)(\/[^?#]+)?\/?$/i;

function getVersionKeyFromLabel(label) {
  const match = String(label).match(VERSION_LABEL_RE);
  return match ? `v${match[1]}`.toLowerCase() : null;
}

function isVersionCategory(item) {
  return item?.type === 'category' && Boolean(getVersionKeyFromLabel(item.label));
}

function collectLinks(items) {
  return items.flatMap((item) => {
    if (item.type === 'link' && item.href) {
      return [item.href];
    }

    if (item.type === 'category') {
      const ownLink = item.href && !item.linkUnlisted ? [item.href] : [];
      return [...ownLink, ...collectLinks(item.items || [])];
    }

    return [];
  });
}

function getVersionCategories(items) {
  return items.filter(isVersionCategory).map((item) => ({
    item,
    key: getVersionKeyFromLabel(item.label),
    links: collectLinks(item.items || []),
  }));
}

function getVersionFromPath(pathname, versionKeys) {
  const match = stripLocalePrefix(pathname).match(/\/api\/(v\d+)(?:\/|$)/i);
  if (!match) {
    return null;
  }

  const version = match[1].toLowerCase();
  return versionKeys.includes(version) ? version : null;
}

function getDefaultVersion(versionKeys) {
  if (versionKeys.includes('v1')) {
    return 'v1';
  }

  return versionKeys[0] || null;
}

function readStoredVersion(versionKeys) {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(STORAGE_KEY);
  return value && versionKeys.includes(value) ? value : null;
}

function writeStoredVersion(versionKey) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, versionKey);
}

function findTargetHref(versionCategories, currentPath, targetVersion) {
  const targetCategory = versionCategories.find((category) => category.key === targetVersion);
  if (!targetCategory) {
    return null;
  }

  const currentLocale = getRouteLocale(currentPath);
  const matchedVersionPath = stripLocalePrefix(currentPath).match(VERSION_PATH_RE);
  if (matchedVersionPath) {
    const candidatePath = localizeRoute(
      `${matchedVersionPath[1]}${targetVersion}${matchedVersionPath[3] || ''}`,
      currentLocale
    );
    if (targetCategory.links.includes(candidatePath)) {
      return candidatePath;
    }
  }

  return targetCategory.links[0] || null;
}

function stripVersionPrefix(label) {
  return typeof label === 'string' ? label.replace(VERSIONED_ITEM_LABEL_RE, '') : label;
}

function normalizeVersionedItem(item) {
  if (!item || typeof item !== 'object') {
    return item;
  }

  if (item.type === 'category') {
    return {
      ...item,
      label: stripVersionPrefix(item.label),
      items: (item.items || []).map(normalizeVersionedItem),
    };
  }

  return {
    ...item,
    label: stripVersionPrefix(item.label),
  };
}

function createSystemSection(items) {
  if (!items.length) {
    return [];
  }

  return [
    {
      type: 'category',
      label: translate({
        id: 'fastnear.apiSidebar.system',
        message: 'System',
      }),
      collapsible: false,
      collapsed: false,
      items,
    },
  ];
}

export function useFastnearApiSidebarSelection(sidebarItems) {
  const history = useHistory();
  const location = useLocation();

  const versionCategories = useMemo(
    () => getVersionCategories(sidebarItems),
    [sidebarItems]
  );
  const isVersionedSidebar = versionCategories.length > 0;
  const versionKeys = useMemo(
    () => versionCategories.map((category) => category.key),
    [versionCategories]
  );
  const activeVersionFromPath = useMemo(
    () => getVersionFromPath(location.pathname, versionKeys),
    [location.pathname, versionKeys]
  );

  const [selectedVersion, setSelectedVersion] = useState(() => {
    return activeVersionFromPath || getDefaultVersion(versionKeys);
  });

  useEffect(() => {
    if (!isVersionedSidebar) {
      return;
    }

    if (activeVersionFromPath) {
      setSelectedVersion(activeVersionFromPath);
      writeStoredVersion(activeVersionFromPath);
      return;
    }

    const storedVersion = readStoredVersion(versionKeys);
    if (storedVersion && storedVersion !== selectedVersion) {
      setSelectedVersion(storedVersion);
      return;
    }

    const defaultVersion = getDefaultVersion(versionKeys);
    if (defaultVersion && defaultVersion !== selectedVersion) {
      setSelectedVersion(defaultVersion);
    }
  }, [activeVersionFromPath, isVersionedSidebar, selectedVersion, versionKeys]);

  const filteredItems = useMemo(() => {
    if (!isVersionedSidebar || !selectedVersion) {
      return sidebarItems;
    }

    const leadingItems = [];
    const trailingItems = [];
    let selectedVersionItems = [];
    let hasSeenVersionCategory = false;

    sidebarItems.forEach((item) => {
      if (!isVersionCategory(item)) {
        if (hasSeenVersionCategory) {
          trailingItems.push(item);
        } else {
          leadingItems.push(item);
        }
        return;
      }

      hasSeenVersionCategory = true;

      if (getVersionKeyFromLabel(item.label) === selectedVersion) {
        selectedVersionItems = (item.items || []).map(normalizeVersionedItem);
      }
    });

    return [
      ...leadingItems,
      ...selectedVersionItems,
      ...createSystemSection(trailingItems),
    ];
  }, [isVersionedSidebar, selectedVersion, sidebarItems]);

  const showVersionControl = isVersionedSidebar && versionCategories.length > 1;

  function onVersionChange(nextVersion) {
    setSelectedVersion(nextVersion);
    writeStoredVersion(nextVersion);

    const currentVersion = getVersionFromPath(location.pathname, versionKeys);
    if (!currentVersion || currentVersion === nextVersion) {
      return;
    }

    const targetHref = findTargetHref(versionCategories, location.pathname, nextVersion);
    if (targetHref && targetHref !== location.pathname) {
      history.push(targetHref);
    }
  }

  return {
    filteredItems,
    showVersionControl,
    selectedVersion,
    versionKeys,
    onVersionChange,
  };
}

export function FastnearApiSidebarVersionControl({
  selectedVersion,
  versionKeys,
  onVersionChange,
  className,
}) {
  return (
    <div className={clsx('fastnear-api-sidebar-version-control', className)}>
      <label className="fastnear-api-sidebar-version-control__label" htmlFor="fastnear-api-version-select">
        {translate({
          id: 'fastnear.apiSidebar.versionLabel',
          message: 'Version',
        })}
      </label>
      <select
        id="fastnear-api-version-select"
        className="fastnear-api-sidebar-version-control__select"
        value={selectedVersion || ''}
        onChange={(event) => onVersionChange(event.target.value)}
      >
        {versionKeys.map((versionKey) => (
          <option key={versionKey} value={versionKey}>
            {versionKey.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}

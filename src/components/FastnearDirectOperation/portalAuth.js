import { useEffect, useState } from "react";

const API_KEY_STORAGE_KEY = "fastnear:apiKey";
const LEGACY_API_KEY_STORAGE_KEYS = ["fastnear_api_key"];
const API_KEY_STORAGE_KEYS = [API_KEY_STORAGE_KEY, ...LEGACY_API_KEY_STORAGE_KEYS];
const BEARER_STORAGE_KEYS = ["fastnear:bearer"];
const PORTAL_AUTH_EVENT = "fastnear:authchange";
const PORTAL_LOCATION_EVENT = "fastnear:locationchange";

function readStorageValue(key) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (_error) {
    return null;
  }
}

function readFirstStorageValue(keys) {
  for (const key of keys) {
    const value = readStorageValue(key)?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

function readSearchValue(search, key) {
  const value = search.get(key)?.trim();
  return value || undefined;
}

function dispatchPortalEvent(eventName) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(eventName));
}

function normalizeStoredApiKey() {
  if (typeof window === "undefined") {
    return false;
  }

  const canonicalValue = readStorageValue(API_KEY_STORAGE_KEY)?.trim();
  const legacyValue = readFirstStorageValue(LEGACY_API_KEY_STORAGE_KEYS);
  const hasLegacyValue = LEGACY_API_KEY_STORAGE_KEYS.some((key) => readStorageValue(key) !== null);

  try {
    if (canonicalValue) {
      if (!hasLegacyValue) {
        return false;
      }

      for (const key of LEGACY_API_KEY_STORAGE_KEYS) {
        window.localStorage.removeItem(key);
      }
      return true;
    }

    if (!legacyValue) {
      return false;
    }

    window.localStorage.setItem(API_KEY_STORAGE_KEY, legacyValue);
    for (const key of LEGACY_API_KEY_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
    return true;
  } catch (_error) {
    return false;
  }
}

function ensureHistoryPatch() {
  if (typeof window === "undefined" || window.__fastnearPortalHistoryPatched) {
    return;
  }

  window.__fastnearPortalHistoryPatched = true;

  const wrapHistoryMethod = (method) =>
    function patchedHistoryMethod(...args) {
      const result = method.apply(this, args);
      dispatchPortalEvent(PORTAL_LOCATION_EVENT);
      return result;
    };

  window.history.pushState = wrapHistoryMethod(window.history.pushState);
  window.history.replaceState = wrapHistoryMethod(window.history.replaceState);
}

export function getPortalAuth(search) {
  const resolvedSearch =
    search ??
    (typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams());

  const urlApiKey = readSearchValue(resolvedSearch, "apiKey");
  const storedApiKey =
    readStorageValue(API_KEY_STORAGE_KEY)?.trim() ||
    readFirstStorageValue(LEGACY_API_KEY_STORAGE_KEYS);
  const urlBearer = readSearchValue(resolvedSearch, "token");
  const storedBearer = readFirstStorageValue(BEARER_STORAGE_KEYS);

  return {
    apiKey: urlApiKey || storedApiKey,
    bearer: urlBearer || storedBearer,
    urlApiKey,
    storedApiKey,
    urlBearer,
    storedBearer,
    apiKeySource: urlApiKey ? "url" : storedApiKey ? "storage" : undefined,
    bearerSource: urlBearer ? "url" : storedBearer ? "storage" : undefined,
  };
}

export function setPortalApiKey(apiKey) {
  if (typeof window === "undefined") {
    return;
  }

  const trimmedApiKey = apiKey.trim();
  if (!trimmedApiKey) {
    clearPortalApiKey();
    return;
  }

  try {
    window.localStorage.setItem(API_KEY_STORAGE_KEY, trimmedApiKey);
    for (const key of LEGACY_API_KEY_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch (_error) {
    return;
  }

  dispatchPortalEvent(PORTAL_AUTH_EVENT);
}

export function clearPortalApiKey() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    for (const key of API_KEY_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch (_error) {
    return;
  }

  dispatchPortalEvent(PORTAL_AUTH_EVENT);
}

export function usePortalAuth() {
  const [auth, setAuth] = useState(() => getPortalAuth());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    ensureHistoryPatch();

    const syncAuth = () => {
      setAuth(getPortalAuth());
    };

    const handleStorage = (event) => {
      if (!event.key || [...API_KEY_STORAGE_KEYS, ...BEARER_STORAGE_KEYS].includes(event.key)) {
        syncAuth();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PORTAL_AUTH_EVENT, syncAuth);
    window.addEventListener(PORTAL_LOCATION_EVENT, syncAuth);
    window.addEventListener("popstate", syncAuth);

    const didNormalizeStorage = normalizeStoredApiKey();
    syncAuth();
    if (didNormalizeStorage) {
      dispatchPortalEvent(PORTAL_AUTH_EVENT);
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PORTAL_AUTH_EVENT, syncAuth);
      window.removeEventListener(PORTAL_LOCATION_EVENT, syncAuth);
      window.removeEventListener("popstate", syncAuth);
    };
  }, []);

  return auth;
}

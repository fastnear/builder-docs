import React, { useMemo } from "react";
import { useColorMode } from "@docusaurus/theme-common";

/**
 * RpcRedoc component for embedding single Redocly operation pages
 *
 * @param {Object} props
 * @param {string} props.redoclyBase - Base URL of your Redocly portal
 * @param {string} props.path - Path to the operation page (e.g., "/rpcs/account/view_account")
 * @param {string} props.operationHref - Alternative: path to operation page if using pagination:item routes
 * @param {string} props.apiKey - Optional explicit API key
 * @param {string} props.bearerToken - Optional explicit bearer token
 * @param {string} props.apiKeyStorageKey - localStorage key for API key (default: "fastnear:apiKey")
 * @param {string} props.bearerStorageKey - localStorage key for bearer token (default: "fastnear:bearer")
 * @param {string} props.height - iframe height (default: "calc(100vh - 140px)")
 */
export default function RpcRedoc({
  redoclyBase,
  operationHref,
  path,
  apiKey,                // optional explicit prop
  bearerToken,           // optional explicit prop
  apiKeyStorageKey = "fastnear:apiKey",
  bearerStorageKey = "fastnear:bearer",
  height = "calc(100vh - 140px)",
}) {
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === "dark";

  if (!redoclyBase) throw new Error("redoclyBase is required");

  // Auto-detect localhost (Docusaurus dev server) → use local Redocly preview.
  // Can also force local via ?redoclyLocal in the page URL.
  const effectiveBase = useMemo(() => {
    if (typeof window !== "undefined") {
      const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const hasLocalParam = new URLSearchParams(window.location.search).has("redoclyLocal");
      if (isLocalhost || hasLocalParam) {
        return "http://127.0.0.1:4000";
      }
    }
    return redoclyBase;
  }, [redoclyBase]);

  const { apiKeyFinal, bearerFinal } = useMemo(() => {
    const qs = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const fromUrlKey = qs.get("apiKey");
    const fromUrlBearer = qs.get("token");
    const fromStorageKey = typeof window !== "undefined" ? window.localStorage.getItem(apiKeyStorageKey) : null;
    const fromStorageBearer = typeof window !== "undefined" ? window.localStorage.getItem(bearerStorageKey) : null;
    return {
      apiKeyFinal: apiKey ?? fromUrlKey ?? fromStorageKey ?? "",
      bearerFinal: bearerToken ?? fromUrlBearer ?? fromStorageBearer ?? ""
    };
  }, [apiKey, bearerToken, apiKeyStorageKey, bearerStorageKey]);

  const src = useMemo(() => {
    const u = new URL((operationHref || path || ""), effectiveBase);
    // Pass either ?apiKey=... or ?token=... (both if you want)
    if (apiKeyFinal) u.searchParams.set("apiKey", apiKeyFinal);
    if (bearerFinal) u.searchParams.set("token", bearerFinal);
    // Sync dark mode with the Docusaurus theme toggle
    u.searchParams.set("colorSchema", isDarkMode ? "dark" : "light");
    return u.toString();
  }, [effectiveBase, operationHref, path, apiKeyFinal, bearerFinal, isDarkMode]);

  return (
    <iframe
      title="Redocly Reference"
      src={src}
      style={{ width: "100%", border: 0, height }}
      loading="lazy"
      referrerPolicy="no-referrer"
      // Keep tight sandbox; allow scripts + same-origin for Redocly app + Try It.
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
      // Some consoles copy examples to clipboard
      allow="clipboard-write"
    />
  );
}
import React, { useCallback, useEffect, useRef, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import SearchBarFallback from '@theme-original/SearchBar';
import translations from '@theme/SearchTranslations';
import './shell.css';

let algoliaSearchRuntimePromise = null;

function loadAlgoliaSearchRuntime() {
  if (!algoliaSearchRuntimePromise) {
    algoliaSearchRuntimePromise = import('./AlgoliaSearchRuntime');
  }

  return algoliaSearchRuntimePromise;
}

function SearchIcon(props) {
  return (
    <svg
      aria-hidden="true"
      className="fastnear-search-shell__icon"
      fill="none"
      viewBox="0 0 20 20"
      {...props}
    >
      <path
        d="M14.167 14.167L17.5 17.5M15.833 9.167A6.667 6.667 0 1 1 2.5 9.167a6.667 6.667 0 0 1 13.333 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SearchShellButton({
  buttonAriaLabel,
  buttonText,
  isLoading,
  onActivate,
  onPreload,
}) {
  return (
    <div className="fastnear-search-shell">
      <button
        type="button"
        className="fastnear-search-shell__button"
        aria-label={buttonAriaLabel}
        aria-busy={isLoading ? 'true' : undefined}
        onClick={onActivate}
        onFocus={onPreload}
        onPointerEnter={onPreload}
        onTouchStart={onPreload}
      >
        <span className="fastnear-search-shell__content">
          <SearchIcon />
          <span className="fastnear-search-shell__placeholder">
            {isLoading ? `${buttonText}...` : buttonText}
          </span>
        </span>
        <span className="fastnear-search-shell__keys" aria-hidden="true">
          <kbd className="fastnear-search-shell__key">⌘</kbd>
          <kbd className="fastnear-search-shell__key">K</kbd>
        </span>
      </button>
    </div>
  );
}

function LazyAlgoliaSearchBar(props) {
  const [RuntimeComponent, setRuntimeComponent] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [openRequestId, setOpenRequestId] = useState(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const preloadRuntime = useCallback(() => {
    void loadAlgoliaSearchRuntime();
  }, []);

  const activateRuntime = useCallback(async () => {
    if (RuntimeComponent) {
      setOpenRequestId((value) => value + 1);
      return;
    }

    setIsLoading(true);

    try {
      const moduleValue = await loadAlgoliaSearchRuntime();
      if (!isMountedRef.current) {
        return;
      }

      setRuntimeComponent(() => moduleValue.default);
      setOpenRequestId((value) => value + 1);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [RuntimeComponent]);

  useEffect(() => {
    if (RuntimeComponent || typeof window === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) {
        return;
      }

      if (!(event.metaKey || event.ctrlKey) || String(event.key).toLowerCase() !== 'k') {
        return;
      }

      event.preventDefault();
      void activateRuntime();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [RuntimeComponent, activateRuntime]);

  if (RuntimeComponent) {
    return <RuntimeComponent {...props} openRequestId={openRequestId} />;
  }

  const buttonTranslations = props.translations?.button ?? translations.button;
  const buttonText = buttonTranslations?.buttonText || 'Search';
  const buttonAriaLabel = buttonTranslations?.buttonAriaLabel || buttonText;

  return (
    <SearchShellButton
      buttonAriaLabel={buttonAriaLabel}
      buttonText={buttonText}
      isLoading={isLoading}
      onActivate={() => {
        void activateRuntime();
      }}
      onPreload={preloadRuntime}
    />
  );
}

export default function SearchBar(props) {
  const { siteConfig } = useDocusaurusContext();
  const resolvedSearchProvider = siteConfig?.customFields?.resolvedSearchProvider;

  if (resolvedSearchProvider !== 'algolia') {
    return <SearchBarFallback {...props} />;
  }

  return <LazyAlgoliaSearchBar {...props} />;
}

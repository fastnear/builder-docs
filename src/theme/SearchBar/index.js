import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from '@docusaurus/Head';
import Link from '@docusaurus/Link';
import { useHistory } from '@docusaurus/router';
import { isRegexpStringMatch } from '@docusaurus/theme-common';
import Translate from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import SearchBarFallback from '@theme-init/SearchBar';
import translations from '@theme/SearchTranslations';
import { DocSearchButton } from '@docsearch/react/button';
import { SidepanelButton } from '@docsearch/react/sidepanel';
import { useDocSearchKeyboardEvents } from '@docsearch/react/useDocSearchKeyboardEvents';
import { createPortal } from 'react-dom';

import {
  mergeFacetFilters,
  useAlgoliaAskAi,
  useAlgoliaAskAiSidepanel,
  useAlgoliaContextualFacetFilters,
  useAlgoliaThemeConfig,
  useSearchResultUrlProcessor,
} from '@docsearch/docusaurus-adapter/client';
import {
  getAlgoliaHighlightPlainText,
  normalizeAlgoliaHighlightHtml,
} from './highlight.mjs';

const FASTNEAR_DEFAULT_SEARCH_PARAMETERS = {
  attributesToRetrieve: [
    'hierarchy',
    'content',
    'anchor',
    'url',
    'url_without_anchor',
    'type',
    'category',
    'method_type',
    'surface',
    'family',
    'audience',
    'page_type',
    'transport',
    'operation_id',
    'canonical_target',
  ],
  attributesToSnippet: ['content:30'],
  clickAnalytics: true,
  distinct: false,
  hitsPerPage: 36,
  removeWordsIfNoResults: 'allOptional',
  snippetEllipsisText: '…',
};

let DocSearchModal = null;
let DocSearchSidepanel = null;

function importDocSearchModalIfNeeded() {
  if (DocSearchModal) {
    return Promise.resolve();
  }

  return Promise.all([
    import('@docsearch/react/modal'),
    import('@docsearch/react/style'),
    import('./styles.css'),
  ]).then(([{ DocSearchModal: Modal }]) => {
    DocSearchModal = Modal;
  });
}

async function importDocSearchSidepanelIfNeeded() {
  await importDocSearchModalIfNeeded();
  if (DocSearchSidepanel) {
    return Promise.resolve();
  }

  return Promise.all([
    import('@docsearch/react/sidepanel'),
    import('@docsearch/react/style/sidepanel'),
  ]).then(([{ Sidepanel }]) => {
    DocSearchSidepanel = Sidepanel;
  });
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return value ? [value] : [];
}

function firstValue(value) {
  return toArray(value)[0] || '';
}

function getProcessedBaseUrl(value) {
  const rawValue = String(value || '');
  if (!rawValue) {
    return '';
  }

  const withoutHash = rawValue.split('#')[0];

  try {
    return new URL(withoutHash, 'https://docs.fastnear.com').toString();
  } catch {
    return withoutHash;
  }
}

function getPathLabel(url) {
  try {
    const pathname = decodeURIComponent(new URL(url, 'https://docs.fastnear.com').pathname);
    return pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
  } catch {
    return String(url || '').replace(/^https?:\/\/[^/]+/i, '').split('#')[0] || '/';
  }
}

function getTitleText(hit) {
  return (
    firstValue(hit?.hierarchy?.lvl1) ||
    firstValue(hit?.hierarchy?.lvl2) ||
    firstValue(hit?.hierarchy?.lvl0) ||
    getPathLabel(hit?.url)
  );
}

function getTitleHtml(hit) {
  return (
    hit?._highlightResult?.hierarchy?.lvl1?.value ||
    hit?._highlightResult?.hierarchy?.lvl2?.value ||
    null
  );
}

function getSnippetText(hit) {
  return (
    hit?._snippetResult?.content?.value ||
    hit?._highlightResult?.content?.value ||
    firstValue(hit?.content) ||
    ''
  );
}

function getEndpointDetail({ canonicalTarget, operationId, surface }) {
  if (surface === 'rpc') {
    return operationId || canonicalTarget || '';
  }

  return canonicalTarget || operationId || '';
}

function buildResultCardData(hit) {
  const operationId = firstValue(hit?.operation_id);
  const canonicalTarget = firstValue(hit?.canonical_target);
  const surface = firstValue(hit?.surface);
  const endpointFamily = firstValue(hit?.family) || firstValue(hit?.method_type);
  const isEndpoint = Boolean(
    canonicalTarget || operationId || firstValue(hit?.transport)
  );
  const endpointDetail = getEndpointDetail({
    canonicalTarget,
    operationId,
    surface,
  });
  const titleHtml = normalizeAlgoliaHighlightHtml(getTitleHtml(hit));
  const snippetValue = getSnippetText(hit);
  const snippetHtml = normalizeAlgoliaHighlightHtml(snippetValue);

  return {
    canonicalTarget,
    endpointBadge: isEndpoint ? (surface === 'rpc' ? 'RPC' : 'API') : '',
    endpointDetail,
    endpointFamily,
    isEndpoint,
    pathLabel: getPathLabel(hit?.url),
    snippetHtml,
    snippetText: snippetHtml
      ? getAlgoliaHighlightPlainText(snippetHtml)
      : getAlgoliaHighlightPlainText(snippetValue) || snippetValue,
    titleHtml,
    titleText: getTitleText(hit),
  };
}

function mergeContentIntoPrimary(primary, contentRecord) {
  if (!contentRecord || contentRecord === primary) {
    return primary;
  }

  const merged = { ...primary };

  if (!merged.content && contentRecord.content) {
    merged.content = contentRecord.content;
  }

  const primarySnippet = merged._snippetResult?.content?.value;
  const contentSnippet = contentRecord._snippetResult?.content?.value;
  if (!primarySnippet && contentSnippet) {
    merged._snippetResult = {
      ...(merged._snippetResult || {}),
      content: contentRecord._snippetResult.content,
    };
  }

  const primaryHighlight = merged._highlightResult?.content?.value;
  const contentHighlight = contentRecord._highlightResult?.content?.value;
  if (!primaryHighlight && contentHighlight) {
    merged._highlightResult = {
      ...(merged._highlightResult || {}),
      content: contentRecord._highlightResult.content,
    };
  }

  return merged;
}

function buildFastnearSearchItems(items, processSearchResultUrl) {
  const grouped = new Map();

  items.forEach((item) => {
    const processedUrl = processSearchResultUrl(item.url);
    const processedBaseUrl = getProcessedBaseUrl(item.url_without_anchor || processedUrl);
    const normalizedItem = {
      ...item,
      url: processedUrl,
      url_without_anchor: processedBaseUrl,
    };
    const pageKey = processedBaseUrl || processedUrl;
    const isContentRecord = normalizedItem.type === 'content' && Boolean(normalizedItem.content);

    const existing = grouped.get(pageKey);
    if (!existing) {
      grouped.set(pageKey, {
        primary: normalizedItem,
        contentRecord: isContentRecord ? normalizedItem : null,
      });
      return;
    }

    if (!existing.contentRecord && isContentRecord) {
      existing.contentRecord = normalizedItem;
    }
  });

  return [...grouped.values()].map(({ primary, contentRecord }) => {
    const merged = mergeContentIntoPrimary(primary, contentRecord);
    return {
      ...merged,
      __fastnear: buildResultCardData(merged),
    };
  });
}

function useNavigator({ externalUrlRegex }) {
  const history = useHistory();

  return useMemo(
    () => ({
      navigate(params) {
        if (isRegexpStringMatch(externalUrlRegex, params.itemUrl)) {
          window.location.href = params.itemUrl;
        } else {
          history.push(params.itemUrl);
        }
      },
    }),
    [externalUrlRegex, history]
  );
}

function useTransformSearchClient() {
  const {
    siteMetadata: { docusaurusVersion },
  } = useDocusaurusContext();

  return useCallback(
    (searchClient) => {
      searchClient.addAlgoliaAgent('docusaurus', docusaurusVersion);
      return searchClient;
    },
    [docusaurusVersion]
  );
}

function useTransformItems(props) {
  const processSearchResultUrl = useSearchResultUrlProcessor();

  return useMemo(
    () => (items) => {
      const normalizedItems = buildFastnearSearchItems(items, processSearchResultUrl);
      return props.transformItems ? props.transformItems(normalizedItems) : normalizedItems;
    },
    [processSearchResultUrl, props.transformItems]
  );
}

function ResultsFooter({ state, onClose, searchPagePath }) {
  const searchPageLink = useBaseUrl(searchPagePath);
  const nbHits = state?.context?.nbHits ?? 0;
  const searchLink = state.query
    ? `${searchPageLink}${searchPageLink.includes('?') ? '&' : '?'}q=${encodeURIComponent(state.query)}`
    : searchPageLink;

  return (
    <Link to={searchLink} onClick={onClose}>
      <Translate id="theme.SearchBar.seeAll" values={{ count: nbHits }}>
        {'See all {count} results'}
      </Translate>
    </Link>
  );
}

function useResultsFooterComponent({ closeModal, searchPagePath }) {
  return useMemo(
    () =>
      searchPagePath
        ? ({ state }) => (
            <ResultsFooter state={state} searchPagePath={searchPagePath} onClose={closeModal} />
          )
        : undefined,
    [closeModal, searchPagePath]
  );
}

function Hit({ hit, children }) {
  const card = hit.__fastnear || buildResultCardData(hit);

  return (
    <Link to={hit.url} className="fastnear-search-hit">
      <div className="fastnear-search-hit__shell">
        {card.isEndpoint ? (
          <>
            <div className="fastnear-search-hit__header">
              <div className="fastnear-search-hit__title-row">
                {card.endpointBadge ? (
                  <span
                    className={`fastnear-search-hit__badge fastnear-search-hit__badge--${card.endpointBadge.toLowerCase()}`}
                  >
                    {card.endpointBadge}
                  </span>
                ) : null}
                <span
                  className="fastnear-search-hit__title"
                  {...(card.titleHtml ? { dangerouslySetInnerHTML: { __html: card.titleHtml } } : {})}
                >
                  {!card.titleHtml ? card.titleText : null}
                </span>
              </div>
              {card.endpointFamily ? (
                <div className="fastnear-search-hit__header-meta">
                  <span className="fastnear-search-hit__badge fastnear-search-hit__badge--family">
                    {card.endpointFamily}
                  </span>
                </div>
              ) : null}
            </div>

            {card.endpointDetail ? (
              <div className="fastnear-search-hit__endpoint-stack">
                <code className="fastnear-search-hit__target fastnear-search-hit__target--primary">
                  {card.endpointDetail}
                </code>
              </div>
            ) : null}
          </>
        ) : (
          <div className="fastnear-search-hit__header">
            <span
              className="fastnear-search-hit__title"
              {...(card.titleHtml ? { dangerouslySetInnerHTML: { __html: card.titleHtml } } : {})}
            >
              {!card.titleHtml ? card.titleText : null}
            </span>
            <span className="fastnear-search-hit__path">{card.pathLabel}</span>
          </div>
        )}

        {card.snippetText ? (
          <p
            className="fastnear-search-hit__snippet"
            {...(card.snippetHtml
              ? { dangerouslySetInnerHTML: { __html: card.snippetHtml } }
              : {})}
          >
            {!card.snippetHtml ? card.snippetText : null}
          </p>
        ) : null}
        <span className="fastnear-search-hit__legacy-children" hidden>
          {children}
        </span>
      </div>
    </Link>
  );
}

function useSearchParameters({ contextualSearch, ...props }) {
  const { i18n } = useDocusaurusContext();
  const currentLocale = i18n.currentLocale || 'en';
  const contextualSearchFacetFilters = useAlgoliaContextualFacetFilters();
  const localeFacetFilters = useMemo(
    () => [`language:${currentLocale}`],
    [currentLocale]
  );
  const configFacetFilters = mergeFacetFilters(
    localeFacetFilters,
    props.searchParameters?.facetFilters ?? []
  );

  const facetFilters = contextualSearch
    ? mergeFacetFilters(contextualSearchFacetFilters, configFacetFilters)
    : configFacetFilters;

  return {
    ...FASTNEAR_DEFAULT_SEARCH_PARAMETERS,
    ...props.searchParameters,
    facetFilters,
  };
}

function DocSearch({ externalUrlRegex, ...props }) {
  const navigator = useNavigator({ externalUrlRegex });
  const searchParameters = useSearchParameters(props);
  const transformItems = useTransformItems(props);
  const transformSearchClient = useTransformSearchClient();

  const searchContainer = useRef(null);
  const searchButtonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState(undefined);

  const { isAskAiActive, currentPlaceholder, onAskAiToggle, extraAskAiProps, askAi } =
    useAlgoliaAskAi(props);
  const {
    sidePanelEnabled,
    showSidepanelButton,
    sidePanelOptions,
    sidePanelAgentStudio,
    sidepanelPortalContainer,
    isSidepanelOpen,
    sidepanelInitialMessage,
    openSidepanel,
    closeSidepanel,
    toggleSidepanel,
    handleSidepanelOpen,
    loadSidepanel,
  } = useAlgoliaAskAiSidepanel({
    askAiConfig: askAi,
    importSidepanel: importDocSearchSidepanelIfNeeded,
  });

  const prepareSearchContainer = useCallback(() => {
    if (!searchContainer.current) {
      const divElement = document.createElement('div');
      searchContainer.current = divElement;
      document.body.insertBefore(divElement, document.body.firstChild);
    }
  }, []);

  const openModal = useCallback(() => {
    prepareSearchContainer();
    importDocSearchModalIfNeeded().then(() => setIsOpen(true));
  }, [prepareSearchContainer]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    searchButtonRef.current?.focus();
    setInitialQuery(undefined);
    onAskAiToggle(false);
  }, [onAskAiToggle]);

  const handleAskAiToggle = useCallback(
    (active, payload) => {
      if (active && sidePanelEnabled) {
        closeModal();
        openSidepanel(payload);
        return;
      }

      onAskAiToggle(active);
    },
    [closeModal, onAskAiToggle, openSidepanel, sidePanelEnabled]
  );

  useEffect(
    () => () => {
      if (searchContainer.current) {
        searchContainer.current.remove();
        searchContainer.current = null;
      }
    },
    []
  );

  const handleInput = useCallback(
    (event) => {
      if (event.key === 'f' && (event.metaKey || event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      setInitialQuery(event.key);
      openModal();
    },
    [openModal]
  );

  const resultsFooterSearchPagePath =
    typeof props.searchPagePath === 'string' ? props.searchPagePath : undefined;
  const resultsFooterComponent = useResultsFooterComponent({
    closeModal,
    searchPagePath: resultsFooterSearchPagePath,
  });

  useDocSearchKeyboardEvents({
    isOpen,
    onOpen: openModal,
    onClose: closeModal,
    onInput: handleInput,
    searchButtonRef,
    isAskAiActive: isAskAiActive ?? false,
    onAskAiToggle: onAskAiToggle ?? (() => {}),
  });

  return (
    <>
      <Head>
        <link
          rel="preconnect"
          href={`https://${props.appId}-dsn.algolia.net`}
          crossOrigin="anonymous"
        />
      </Head>

      <div className="DocSearch-SearchBar">
        <DocSearchButton
          ref={searchButtonRef}
          translations={props.translations?.button ?? translations.button}
          onTouchStart={importDocSearchModalIfNeeded}
          onFocus={importDocSearchModalIfNeeded}
          onMouseOver={importDocSearchModalIfNeeded}
          onClick={openModal}
        />
        {showSidepanelButton ? (
          <SidepanelButton
            translations={{
              buttonText: '',
              buttonAriaLabel: 'Ask AI',
            }}
            variant={sidePanelOptions?.variant ?? 'inline'}
            keyboardShortcuts={sidePanelOptions?.keyboardShortcuts}
            onTouchStart={loadSidepanel}
            onFocus={loadSidepanel}
            onMouseOver={loadSidepanel}
            onClick={toggleSidepanel}
          />
        ) : null}
      </div>

      {isOpen && DocSearchModal && searchContainer.current
        ? createPortal(
            <DocSearchModal
              initialScrollY={window.scrollY}
              initialQuery={initialQuery}
              maxResultsPerGroup={6}
              navigator={navigator}
              transformItems={transformItems}
              hitComponent={Hit}
              transformSearchClient={transformSearchClient}
              interceptAskAiEvent={(payload) => {
                if (!sidePanelEnabled) {
                  return false;
                }

                closeModal();
                openSidepanel(payload);
                return true;
              }}
              onClose={closeModal}
              {...(resultsFooterSearchPagePath ? { resultsFooterComponent } : {})}
              placeholder={currentPlaceholder}
              {...props}
              translations={props.translations?.modal ?? translations.modal}
              searchParameters={searchParameters}
              {...extraAskAiProps}
              isHybridModeSupported={sidePanelEnabled}
              onAskAiToggle={handleAskAiToggle}
            />,
            searchContainer.current
          )
        : null}

      {sidePanelEnabled && DocSearchSidepanel && askAi && sidepanelPortalContainer
        ? createPortal(
            <DocSearchSidepanel
              {...sidePanelOptions}
              variant={sidePanelOptions?.variant ?? 'inline'}
              pushSelector={sidePanelOptions?.pushSelector ?? '#__docusaurus'}
              assistantId={askAi.assistantId}
              apiKey={askAi.apiKey}
              appId={askAi.appId}
              indexName={askAi.indexName}
              agentStudio={sidePanelAgentStudio}
              suggestedQuestions={sidePanelOptions?.suggestedQuestions ?? askAi.suggestedQuestions}
              isOpen={isSidepanelOpen}
              initialMessage={sidepanelInitialMessage}
              onOpen={handleSidepanelOpen}
              onClose={closeSidepanel}
            />,
            sidepanelPortalContainer
          )
        : null}
    </>
  );
}

export default function SearchBar(props) {
  const { siteConfig } = useDocusaurusContext();
  const resolvedSearchProvider = siteConfig?.customFields?.resolvedSearchProvider;

  if (resolvedSearchProvider !== 'algolia') {
    return <SearchBarFallback {...props} />;
  }

  return <AlgoliaSearchBar {...props} />;
}

function AlgoliaSearchBar(props) {
  const themeConfig = useAlgoliaThemeConfig();
  const docSearchProps = {
    ...themeConfig,
    ...props,
  };

  return <DocSearch {...docSearchProps} />;
}

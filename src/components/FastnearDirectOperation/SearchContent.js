import React from "react";

import Head from "@docusaurus/Head";

import searchContentEn from "@site/src/data/generatedFastnearOperationSearchContent.en.json";
import searchContentRu from "@site/src/data/generatedFastnearOperationSearchContent.ru.json";

const SEARCH_CONTENT_BY_LOCALE = {
  en: searchContentEn,
  ru: searchContentRu,
};

function getLocaleEntry(pageModelId, locale) {
  const normalizedLocale = typeof locale === "string" && locale.length ? locale : "en";
  const localized = SEARCH_CONTENT_BY_LOCALE[normalizedLocale]?.[pageModelId];
  if (localized) {
    return localized;
  }
  return SEARCH_CONTENT_BY_LOCALE.en?.[pageModelId] || null;
}

export default function FastnearOperationSearchContent({ pageModelId, locale }) {
  if (!pageModelId) {
    return null;
  }

  const entry = getLocaleEntry(pageModelId, locale);
  if (!entry || !entry.description) {
    return null;
  }

  return (
    <>
      <Head>
        <meta name="description" content={entry.description} />
      </Head>
      <div data-fastnear-content="endpoint-description">
        <p>{entry.description}</p>
      </div>
    </>
  );
}

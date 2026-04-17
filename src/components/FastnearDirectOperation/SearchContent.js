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
  if (!entry) {
    return null;
  }

  const hasParameters = Array.isArray(entry.parameters) && entry.parameters.length > 0;
  const hasSchema = Array.isArray(entry.schema) && entry.schema.length > 0;
  const hasResponse = typeof entry.response === "string" && entry.response.length > 0;

  return (
    <>
      {entry.description ? (
        <Head>
          <meta name="description" content={entry.description} />
        </Head>
      ) : null}
      {entry.description ? (
        <div data-fastnear-content="endpoint-description">
          <p>{entry.description}</p>
        </div>
      ) : null}
      {hasParameters ? (
        <div data-fastnear-content="endpoint-parameters" hidden>
          <ul>
            {entry.parameters.map((parameter) => (
              <li key={parameter.name}>
                <strong>{parameter.name}</strong>: {parameter.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {hasResponse ? (
        <div data-fastnear-content="endpoint-response" hidden>
          <p>{entry.response}</p>
        </div>
      ) : null}
      {hasSchema ? (
        <div data-fastnear-content="endpoint-schema" hidden>
          <ul>
            {entry.schema.map((property) => (
              <li key={property.name}>
                <strong>{property.name}</strong>: {property.description}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

export const FASTNEAR_SEARCH_HIGHLIGHT_CLASS = 'fastnear-search-hit__highlight';

function stripHtmlTags(value) {
  return String(value || '').replace(/<[^>]+>/g, '');
}

export function getAlgoliaHighlightPlainText(value) {
  return stripHtmlTags(value).replace(/\s+/g, ' ').trim();
}

export function normalizeAlgoliaHighlightHtml(value) {
  const rawValue = String(value || '').trim();
  if (!rawValue) {
    return null;
  }

  const normalized = rawValue
    .replace(/\r\n/g, '\n')
    .replace(/<mark>/g, `<span class="${FASTNEAR_SEARCH_HIGHLIGHT_CLASS}">`)
    .replace(/<\/mark>/g, '</span>')
    .replace(
      /<span class="algolia-docsearch-suggestion--highlight">/g,
      `<span class="${FASTNEAR_SEARCH_HIGHLIGHT_CLASS}">`
    );

  if (!normalized.includes('<span')) {
    return null;
  }

  if (/<(?!\/?span\b)[^>]+>/i.test(normalized)) {
    return null;
  }

  const openingTags = normalized.match(/<span\b[^>]*>/g) || [];
  const hasUnexpectedSpan = openingTags.some(
    (tag) => tag !== `<span class="${FASTNEAR_SEARCH_HIGHLIGHT_CLASS}">`
  );
  if (hasUnexpectedSpan) {
    return null;
  }

  return normalized;
}

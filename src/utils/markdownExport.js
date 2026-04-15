import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

const SECRET_QUERY_PARAM_PATTERNS = [/^apiKey$/i, /^token$/i, /^header\./i];
const DOC_SKIP_SELECTORS = [
  '[data-markdown-skip]',
  'button',
  'input',
  'select',
  'textarea',
  'script',
  'style',
  'noscript',
  '.hash-link',
  '.clean-btn',
];

const turndownService = new TurndownService({
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  headingStyle: 'atx',
});

turndownService.use(gfm);

const MARKDOWN_EXPORT_LABELS = {
  en: {
    activeExample: 'Active example',
    array: 'array',
    auth: 'Auth',
    bearerTokenViaHeader: 'Bearer token via `Authorization: Bearer <token>` header',
    body: 'body',
    currentRequest: 'Current request',
    endpoint: 'Endpoint',
    finality: 'Finality',
    headerParameters: 'Header parameters',
    inputs: 'Inputs',
    mediaType: 'Media type',
    method: 'Method',
    network: 'Network',
    networks: 'Networks',
    noAuthRequired: 'No auth required',
    notSpecified: 'Not specified',
    object: 'object',
    operation: 'Operation',
    path: 'Path',
    pathField: 'path',
    pathParameters: 'Path parameters',
    queryParameters: 'Query parameters',
    queryField: 'query',
    requestBody: 'Request body',
    requestBodyField: 'body',
    requestReference: 'Request reference',
    requestSchema: 'Request schema',
    required: 'required',
    responseReference: 'Response reference',
    responseSchema: 'Response schema',
    sourceLinks: 'Source links',
    sourceSpec: 'Source spec',
    status: 'Status',
    summary: 'Summary',
    transport: 'Transport',
    type: 'type',
    url: 'URL',
    value: 'value',
    withoutSavedCredentials: 'This export intentionally omits any locally saved credentials',
    apiKeyVia: 'API key via',
  },
  ru: {
    activeExample: 'Активный пример',
    array: 'массив',
    auth: 'Авторизация',
    bearerTokenViaHeader: 'Bearer-токен через заголовок `Authorization: Bearer <token>`',
    body: 'тело',
    currentRequest: 'Текущий запрос',
    endpoint: 'Эндпоинт',
    finality: 'Финальность',
    headerParameters: 'Параметры заголовков',
    inputs: 'Входные данные',
    mediaType: 'Тип данных',
    method: 'Метод',
    network: 'Сеть',
    networks: 'Сети',
    noAuthRequired: 'Авторизация не требуется',
    notSpecified: 'Не указано',
    object: 'объект',
    operation: 'Операция',
    path: 'Путь',
    pathField: 'путь',
    pathParameters: 'Параметры пути',
    queryParameters: 'Параметры запроса',
    queryField: 'query',
    requestBody: 'Тело запроса',
    requestBodyField: 'тело',
    requestReference: 'Справка по запросу',
    requestSchema: 'Схема запроса',
    required: 'обязательный',
    responseReference: 'Справка по ответу',
    responseSchema: 'Схема ответа',
    sourceLinks: 'Ссылки на источник',
    sourceSpec: 'Исходная спецификация',
    status: 'Статус',
    summary: 'Краткое описание',
    transport: 'Транспорт',
    type: 'тип',
    url: 'URL',
    value: 'значение',
    withoutSavedCredentials: 'Этот экспорт намеренно не включает локально сохранённые учётные данные',
    apiKeyVia: 'API-ключ через',
  },
};

function getMarkdownExportLabels(locale = 'en') {
  return MARKDOWN_EXPORT_LABELS[locale] || MARKDOWN_EXPORT_LABELS.en;
}

function isSecretQueryParam(key) {
  return SECRET_QUERY_PARAM_PATTERNS.some((pattern) => pattern.test(key));
}

export function sanitizePublicUrl(input, baseUrl) {
  if (!input) {
    return '';
  }

  let url;

  try {
    url = new URL(input, baseUrl || (typeof window !== 'undefined' ? window.location.href : undefined));
  } catch (_error) {
    return String(input);
  }

  [...url.searchParams.keys()].forEach((key) => {
    if (isSecretQueryParam(key)) {
      url.searchParams.delete(key);
    }
  });

  return url.toString();
}

export function buildMarkdownMirrorPath(inputPath) {
  if (!inputPath) {
    return '/index.md';
  }

  const normalizedPath = String(inputPath).replace(/\/index\.md$/, '').replace(/\.html$/, '');
  if (normalizedPath === '/' || normalizedPath === '') {
    return '/index.md';
  }

  return `${normalizedPath.replace(/\/+$/, '')}.md`;
}

export function buildMarkdownMirrorUrl(input, baseUrl) {
  if (!input) {
    return buildMarkdownMirrorPath('/');
  }

  try {
    const url = new URL(input, baseUrl || (typeof window !== 'undefined' ? window.location.origin : undefined));
    url.search = '';
    url.hash = '';
    url.pathname = buildMarkdownMirrorPath(url.pathname);
    return url.toString();
  } catch (_error) {
    return buildMarkdownMirrorPath(String(input));
  }
}

function normalizeMarkdown(markdown) {
  return markdown.replace(/\n{3,}/g, '\n\n').trim();
}

function toAbsoluteUrl(href, baseUrl) {
  if (!href) {
    return href;
  }

  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return href;
  }

  return sanitizePublicUrl(href, baseUrl);
}

function prepareDocClone(rootElement, sourceUrl) {
  const clone = rootElement.cloneNode(true);

  DOC_SKIP_SELECTORS.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((node) => node.remove());
  });

  clone.querySelectorAll('[aria-hidden="true"]').forEach((node) => {
    if (!node.textContent?.trim()) {
      node.remove();
    }
  });

  clone.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      link.setAttribute('href', toAbsoluteUrl(href, sourceUrl));
    }
  });

  if (sourceUrl) {
    const sourceParagraph = clone.ownerDocument.createElement('p');
    const strong = clone.ownerDocument.createElement('strong');
    const anchor = clone.ownerDocument.createElement('a');
    strong.textContent = 'Source:';
    anchor.href = sanitizePublicUrl(sourceUrl);
    anchor.textContent = sanitizePublicUrl(sourceUrl);
    sourceParagraph.append(strong, ' ', anchor);
    clone.prepend(sourceParagraph);
  }

  return clone;
}

function formatCodeBlock(language, value) {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  return `\`\`\`${language}\n${value}\n\`\`\``;
}

function formatJsonCodeBlock(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return formatCodeBlock('json', JSON.stringify(value, null, 2));
}

function formatNetworkLines(networks, labels) {
  if (!Array.isArray(networks) || !networks.length) {
    return `- ${labels.notSpecified}`;
  }

  return networks
    .map((network) => `- ${network.label || network.key}: ${sanitizePublicUrl(network.url)}`)
    .join('\n');
}

function formatSchemaType(schema = {}, labels = MARKDOWN_EXPORT_LABELS.en) {
  if (Array.isArray(schema.type)) {
    return schema.type.join(' | ');
  }

  if (schema.type) {
    return schema.type;
  }

  if (schema.oneOf?.length) {
    return schema.oneOf
      .map((variant) => variant?.type)
      .filter(Boolean)
      .join(' | ');
  }

  if (schema.properties) {
    return labels.object;
  }

  if (schema.items) {
    return labels.array;
  }

  return labels.value;
}

function formatFieldDescription(field, labels) {
  if (!field) {
    return '';
  }

  const parts = [];
  if (field.location === 'path') {
    parts.push(labels.pathField);
  } else if (field.location === 'query') {
    parts.push(labels.queryField);
  } else {
    parts.push(field.location || labels.requestBodyField || labels.body);
  }
  if (field.required) {
    parts.push(labels.required);
  }

  const type = formatSchemaType(field.schema, labels);
  if (type) {
    parts.push(type);
  }

  const description = field.description || field.schema?.description;
  const suffix = description ? `: ${description}` : '';

  return `- \`${field.name}\` (${parts.join(', ')})${suffix}`;
}

function formatParameterGroup(title, parameters, labels = MARKDOWN_EXPORT_LABELS.en) {
  if (!parameters?.length) {
    return '';
  }

  return [
    `### ${title}`,
    '',
    ...parameters.map((parameter) => formatFieldDescription(parameter, labels)).filter(Boolean),
    '',
  ].join('\n');
}

function formatSecuritySummary(securitySchemes, labels) {
  if (!Array.isArray(securitySchemes) || !securitySchemes.length) {
    return `- ${labels.noAuthRequired}`;
  }

  const lines = securitySchemes.map((scheme) => {
    if (scheme.type === 'apiKey') {
      return `- ${labels.apiKeyVia} ${scheme.in} \`${scheme.name}\`${scheme.description ? `: ${scheme.description}` : ''}`;
    }

    if (scheme.type === 'http' && scheme.scheme === 'bearer') {
      return `- ${labels.bearerTokenViaHeader}`;
    }

    return `- ${scheme.id || 'Auth'} (${scheme.type || 'custom'})${scheme.description ? `: ${scheme.description}` : ''}`;
  });

  lines.push(`- ${labels.withoutSavedCredentials}`);
  return lines.join('\n');
}

function sanitizeExampleRequest(example) {
  if (!example?.request) {
    return null;
  }

  const sanitized = JSON.parse(JSON.stringify(example.request));

  if (sanitized.query) {
    Object.keys(sanitized.query).forEach((key) => {
      if (isSecretQueryParam(key)) {
        delete sanitized.query[key];
      }
    });
  }

  if (sanitized.headers) {
    Object.keys(sanitized.headers).forEach((key) => {
      if (/^authorization$/i.test(key) || /^x-api-key$/i.test(key)) {
        delete sanitized.headers[key];
      }
    });
  }

  return sanitized;
}

function formatCurrentRequestSection({
  locale = 'en',
  pageModel,
  requestUrl,
  httpRequestBody,
  rpcPayload,
  selectedExample,
  selectedFinality,
  selectedNetworkDetails,
}) {
  const labels = getMarkdownExportLabels(locale);
  const lines = [`## ${labels.currentRequest}`, ''];

  if (selectedNetworkDetails?.label || selectedNetworkDetails?.key) {
    lines.push(`- ${labels.network}: ${selectedNetworkDetails.label || selectedNetworkDetails.key}`);
  }

  if (pageModel.route.transport === 'json-rpc') {
    if (selectedFinality) {
      lines.push(`- ${labels.finality}: ${selectedFinality}`);
    }
    lines.push(`- ${labels.endpoint}: ${sanitizePublicUrl(selectedNetworkDetails?.url)}`);
    lines.push('');
    lines.push(`### ${labels.requestBody}`);
    lines.push('');
    lines.push(formatJsonCodeBlock(rpcPayload));
  } else {
    lines.push(`- ${labels.method}: ${pageModel.route.method}`);
    lines.push(`- ${labels.url}: ${sanitizePublicUrl(requestUrl?.toString())}`);
    if (selectedExample?.label) {
      lines.push(`- ${labels.activeExample}: ${selectedExample.label}`);
    }
    lines.push('');
    if (httpRequestBody) {
      lines.push(`### ${labels.requestBody}`);
      lines.push('');
      lines.push(formatJsonCodeBlock(httpRequestBody));
    }
  }

  return lines.filter(Boolean).join('\n');
}

function formatRequestReference(pageModel, selectedExample, locale = 'en') {
  const labels = getMarkdownExportLabels(locale);
  const sections = [`## ${labels.requestReference}`, ''];
  const exampleRequest = sanitizeExampleRequest(selectedExample);

  if (exampleRequest) {
    sections.push(`### ${labels.activeExample}`);
    sections.push('');
    sections.push(formatJsonCodeBlock(exampleRequest));
    sections.push('');
  }

  if (pageModel.interaction?.fields?.length) {
    sections.push(`### ${labels.inputs}`);
    sections.push('');
    sections.push(...pageModel.interaction.fields.map((field) => formatFieldDescription(field, labels)));
    sections.push('');
  }

  if (pageModel.request?.bodySchema) {
    sections.push(`### ${labels.requestSchema}`);
    sections.push('');
    sections.push(formatJsonCodeBlock(pageModel.request.bodySchema));
    sections.push('');
  }

  if (pageModel.request?.parameters) {
    const { path = [], query = [], header = [] } = pageModel.request.parameters;
    sections.push(formatParameterGroup(labels.pathParameters, path, labels));
    sections.push(formatParameterGroup(labels.queryParameters, query, labels));
    sections.push(formatParameterGroup(labels.headerParameters, header, labels));
  }

  return sections.filter(Boolean).join('\n');
}

function formatResponseReference(response, locale = 'en') {
  if (!response) {
    return '';
  }

  const labels = getMarkdownExportLabels(locale);
  const lines = [`## ${labels.responseReference}`, ''];
  lines.push(`- ${labels.status}: ${response.status || '200'}`);
  if (response.mediaType) {
    lines.push(`- ${labels.mediaType}: ${response.mediaType}`);
  }
  if (response.description) {
    lines.push(`- ${labels.summary}: ${response.description}`);
  }
  lines.push('');
  if (response.schema) {
    lines.push(`### ${labels.responseSchema}`);
    lines.push('');
    lines.push(formatJsonCodeBlock(response.schema));
  }

  return lines.filter(Boolean).join('\n');
}

export function buildMarkdownFromDocContent(rootElement, { sourceUrl } = {}) {
  if (!rootElement) {
    return '';
  }

  const clone = prepareDocClone(rootElement, sourceUrl);
  const markdown = turndownService.turndown(clone.innerHTML);
  return `${normalizeMarkdown(markdown)}\n`;
}

export function buildOperationMarkdown({
  currentUrl,
  httpRequestBody,
  locale = 'en',
  pageModel,
  requestUrl,
  rpcPayload,
  selectedExample,
  selectedFinality,
  selectedNetworkDetails,
}) {
  const labels = getMarkdownExportLabels(locale);
  const sourceLinks = new Set();
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : currentUrl;

  [currentUrl, pageModel.canonicalPath, ...(pageModel.routeAliases || [])]
    .filter(Boolean)
    .forEach((value) => sourceLinks.add(sanitizePublicUrl(value, baseUrl)));

  const sections = [`# ${pageModel.info.title}`, ''];

  if (pageModel.info.summary) {
    sections.push(pageModel.info.summary, '');
  }

  if (pageModel.info.description && pageModel.info.description !== pageModel.info.summary) {
    sections.push(pageModel.info.description, '');
  }

  sections.push(`## ${labels.sourceLinks}`, '');
  sections.push(...[...sourceLinks].map((link) => `- ${link}`));
  sections.push('');
  sections.push(`## ${labels.operation}`, '');
  sections.push(`- ${labels.transport}: ${pageModel.route.transport}`);
  sections.push(`- ${labels.method}: ${pageModel.route.method}`);
  sections.push(`- ${labels.path}: \`${pageModel.route.path}\``);
  if (pageModel.sourceSpec) {
    sections.push(`- ${labels.sourceSpec}: \`${pageModel.sourceSpec}\``);
  }
  sections.push('');
  sections.push(`## ${labels.networks}`, '');
  sections.push(formatNetworkLines(pageModel.interaction?.networks, labels));
  sections.push('');
  sections.push(`## ${labels.auth}`, '');
  sections.push(formatSecuritySummary(pageModel.securitySchemes, labels));
  sections.push('');
  sections.push(
    formatCurrentRequestSection({
      locale,
      pageModel,
      requestUrl,
      httpRequestBody,
      rpcPayload,
      selectedExample,
      selectedFinality,
      selectedNetworkDetails,
    })
  );
  sections.push('');
  sections.push(formatRequestReference(pageModel, selectedExample, locale));
  sections.push('');
  sections.push(formatResponseReference(pageModel.responses?.[0], locale));

  return `${normalizeMarkdown(sections.filter(Boolean).join('\n'))}\n`;
}

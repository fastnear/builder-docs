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

function formatNetworkLines(networks) {
  if (!Array.isArray(networks) || !networks.length) {
    return '- Not specified';
  }

  return networks
    .map((network) => `- ${network.label || network.key}: ${sanitizePublicUrl(network.url)}`)
    .join('\n');
}

function formatSchemaType(schema = {}) {
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
    return 'object';
  }

  if (schema.items) {
    return 'array';
  }

  return 'value';
}

function formatFieldDescription(field) {
  const parts = [];
  parts.push(field.location || 'body');
  if (field.required) {
    parts.push('required');
  }

  const type = formatSchemaType(field.schema);
  if (type) {
    parts.push(type);
  }

  const description = field.description || field.schema?.description;
  const suffix = description ? `: ${description}` : '';

  return `- \`${field.name}\` (${parts.join(', ')})${suffix}`;
}

function formatParameterGroup(title, parameters) {
  if (!parameters?.length) {
    return '';
  }

  return [`### ${title}`, '', ...parameters.map((parameter) => formatFieldDescription(parameter)), ''].join(
    '\n'
  );
}

function formatSecuritySummary(securitySchemes) {
  if (!Array.isArray(securitySchemes) || !securitySchemes.length) {
    return '- No auth required';
  }

  const lines = securitySchemes.map((scheme) => {
    if (scheme.type === 'apiKey') {
      return `- API key via ${scheme.in} \`${scheme.name}\`${scheme.description ? `: ${scheme.description}` : ''}`;
    }

    if (scheme.type === 'http' && scheme.scheme === 'bearer') {
      return '- Bearer token via `Authorization: Bearer <token>` header';
    }

    return `- ${scheme.id || 'Auth'} (${scheme.type || 'custom'})${scheme.description ? `: ${scheme.description}` : ''}`;
  });

  lines.push('- This export intentionally omits any locally saved credentials');
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
  pageModel,
  requestUrl,
  httpRequestBody,
  rpcPayload,
  selectedExample,
  selectedFinality,
  selectedNetworkDetails,
}) {
  const lines = ['## Current request', ''];

  if (selectedNetworkDetails?.label || selectedNetworkDetails?.key) {
    lines.push(`- Network: ${selectedNetworkDetails.label || selectedNetworkDetails.key}`);
  }

  if (pageModel.route.transport === 'json-rpc') {
    if (selectedFinality) {
      lines.push(`- Finality: ${selectedFinality}`);
    }
    lines.push(`- Endpoint: ${sanitizePublicUrl(selectedNetworkDetails?.url)}`);
    lines.push('');
    lines.push('### Request body');
    lines.push('');
    lines.push(formatJsonCodeBlock(rpcPayload));
  } else {
    lines.push(`- Method: ${pageModel.route.method}`);
    lines.push(`- URL: ${sanitizePublicUrl(requestUrl?.toString())}`);
    if (selectedExample?.label) {
      lines.push(`- Active example: ${selectedExample.label}`);
    }
    lines.push('');
    if (httpRequestBody) {
      lines.push('### Request body');
      lines.push('');
      lines.push(formatJsonCodeBlock(httpRequestBody));
    }
  }

  return lines.filter(Boolean).join('\n');
}

function formatRequestReference(pageModel, selectedExample) {
  const sections = ['## Request reference', ''];
  const exampleRequest = sanitizeExampleRequest(selectedExample);

  if (exampleRequest) {
    sections.push('### Active example');
    sections.push('');
    sections.push(formatJsonCodeBlock(exampleRequest));
    sections.push('');
  }

  if (pageModel.interaction?.fields?.length) {
    sections.push('### Inputs');
    sections.push('');
    sections.push(...pageModel.interaction.fields.map((field) => formatFieldDescription(field)));
    sections.push('');
  }

  if (pageModel.request?.bodySchema) {
    sections.push('### Request schema');
    sections.push('');
    sections.push(formatJsonCodeBlock(pageModel.request.bodySchema));
    sections.push('');
  }

  if (pageModel.request?.parameters) {
    const { path = [], query = [], header = [] } = pageModel.request.parameters;
    sections.push(formatParameterGroup('Path parameters', path));
    sections.push(formatParameterGroup('Query parameters', query));
    sections.push(formatParameterGroup('Header parameters', header));
  }

  return sections.filter(Boolean).join('\n');
}

function formatResponseReference(response) {
  if (!response) {
    return '';
  }

  const lines = ['## Response reference', ''];
  lines.push(`- Status: ${response.status || '200'}`);
  if (response.mediaType) {
    lines.push(`- Media type: ${response.mediaType}`);
  }
  if (response.description) {
    lines.push(`- Summary: ${response.description}`);
  }
  lines.push('');
  if (response.schema) {
    lines.push('### Response schema');
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
  pageModel,
  requestUrl,
  rpcPayload,
  selectedExample,
  selectedFinality,
  selectedNetworkDetails,
}) {
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

  sections.push('## Source links', '');
  sections.push(...[...sourceLinks].map((link) => `- ${link}`));
  sections.push('');
  sections.push('## Operation', '');
  sections.push(`- Transport: ${pageModel.route.transport}`);
  sections.push(`- Method: ${pageModel.route.method}`);
  sections.push(`- Path: \`${pageModel.route.path}\``);
  if (pageModel.sourceSpec) {
    sections.push(`- Source spec: \`${pageModel.sourceSpec}\``);
  }
  sections.push('');
  sections.push('## Networks', '');
  sections.push(formatNetworkLines(pageModel.interaction?.networks));
  sections.push('');
  sections.push('## Auth', '');
  sections.push(formatSecuritySummary(pageModel.securitySchemes));
  sections.push('');
  sections.push(
    formatCurrentRequestSection({
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
  sections.push(formatRequestReference(pageModel, selectedExample));
  sections.push('');
  sections.push(formatResponseReference(pageModel.responses?.[0]));

  return `${normalizeMarkdown(sections.filter(Boolean).join('\n'))}\n`;
}

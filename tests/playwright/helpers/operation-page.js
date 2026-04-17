const { expect } = require('@playwright/test');

async function installClipboardSpy(page) {
  await page.addInitScript(() => {
    window.__copiedText = null;

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => {
          window.__copiedText = value;
        },
      },
    });
  });
}

async function getCopiedText(page) {
  await expect.poll(() => page.evaluate(() => window.__copiedText)).toBeTruthy();
  return page.evaluate(() => window.__copiedText);
}

function getSegmentedButton(page, fieldName, groupClassName, label) {
  return page
    .locator(`.fastnear-interaction__field--${fieldName} .${groupClassName} button`)
    .filter({ hasText: label });
}

function getRequestPayload(request) {
  try {
    return request.postDataJSON();
  } catch (_error) {
    return null;
  }
}

function waitForOperationRequest(page, { baseUrl, method, matcher = () => true }) {
  return page.waitForRequest((request) => {
    if (request.method() !== method || !request.url().startsWith(baseUrl)) {
      return false;
    }

    return matcher(request);
  });
}

function waitForRpcRequest(page, baseUrl, matcher = () => true) {
  return waitForOperationRequest(page, {
    baseUrl,
    method: 'POST',
    matcher: (request) => matcher(getRequestPayload(request), request),
  });
}

function waitForHttpRequest(page, baseUrl, options = {}) {
  return waitForOperationRequest(page, {
    baseUrl,
    method: options.method || 'GET',
    matcher: options.matcher,
  });
}

module.exports = {
  getCopiedText,
  getRequestPayload,
  getSegmentedButton,
  installClipboardSpy,
  waitForHttpRequest,
  waitForRpcRequest,
};

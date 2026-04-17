const { test, expect } = require('@playwright/test');
const {
  getRequestPayload,
  waitForRpcRequest,
} = require('./helpers/operation-page');

test('RPC operation pages live under /rpc', async ({ page }) => {
  await page.goto('/rpc/account/view-account');

  await expect(page).toHaveURL(/\/rpc\/account\/view-account\/?$/);
  await expect(page.getByRole('heading', { name: 'View Account' })).toBeVisible();
  await expect(page.getByText('view_account request type')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
});

test('RPC operation pages prefill request fields from matching URL params', async ({ page }) => {
  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: { amount: '1' },
      }),
    });
  });

  await page.goto('/rpc/account/view-account?account_id=near');

  const accountIdInput = page.locator('.fastnear-interaction__field--account_id input');
  await expect(accountIdInput).toHaveValue('near');

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.getByRole('button', { name: 'Send request' }).click();

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
});

test('apiKey URL params preload the auth input and bearer header for RPC requests', async ({ page }) => {
  let authorizationHeader = null;

  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    authorizationHeader = route.request().headers().authorization || null;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: { amount: '1' },
      }),
    });
  });

  await page.goto('/rpc/account/view-account?account_id=near&apiKey=test-key-123');

  const apiKeyInput = page.locator('.fastnear-interaction__auth input');
  await expect(apiKeyInput).toHaveValue('test-key-123');
  await expect(apiKeyInput).toHaveAttribute('readonly', '');
  await expect(page.getByText('From URL override')).toBeVisible();

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.getByRole('button', { name: 'Send request' }).click();

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
  expect(authorizationHeader).toBe('Bearer test-key-123');
});

test('operation-state URLs execute RPC requests on load when inputs are ready', async ({ page }) => {
  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: { amount: '1' },
      }),
    });
  });

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.goto('/rpc/account/view-account?account_id=near');

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
  await expect(page.locator('.fastnear-interaction__text-response')).toContainText('"amount": "1"');
});

test('apiKey-only URLs do not auto-run RPC requests', async ({ page }) => {
  let requestCount = 0;

  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: { amount: '1' },
      }),
    });
  });

  await page.goto('/rpc/account/view-account?apiKey=test-key-123');

  await expect(page.locator('.fastnear-interaction__auth input')).toHaveValue('test-key-123');
  await page.waitForTimeout(350);
  expect(requestCount).toBe(0);
});

test('expanded response modal supports find, next, previous, and keyboard navigation', async ({ page }) => {
  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: {
          amount: '1',
          nested: {
            amount: '2',
          },
          note: 'amount',
        },
      }),
    });
  });

  await page.goto('/rpc/account/view-account?account_id=near');

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.getByRole('button', { name: 'Send request' }).click();
  await requestPromise;

  await page.getByRole('button', { name: 'Expand response' }).click();
  const dialog = page.getByRole('dialog', { name: 'Expanded response' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('"amount": "1"');

  const findInput = dialog.getByRole('textbox', { name: 'Find in response' });
  await findInput.fill('amount');
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('1 of 3');
  await expect(dialog.locator('[data-fastnear-response-match-active="true"]')).toHaveAttribute(
    'data-fastnear-response-match-index',
    '0'
  );

  await dialog.getByRole('button', { name: 'Next match' }).click();
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('2 of 3');
  await expect(dialog.locator('[data-fastnear-response-match-active="true"]')).toHaveAttribute(
    'data-fastnear-response-match-index',
    '1'
  );

  await dialog.getByRole('button', { name: 'Previous match' }).click();
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('1 of 3');

  await findInput.press('Enter');
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('2 of 3');

  await findInput.press('Shift+Enter');
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('1 of 3');
});

test('expanded response modal stays within the viewport on large protocol responses', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: {
          active_peers: Array.from({ length: 80 }, (_, index) => ({
            id: `peer-${index}`,
            height: 100000 + index,
            addr: `127.0.0.1:${24567 + index}`,
          })),
          known_producers: Array.from({ length: 40 }, (_, index) => `validator-${index}`),
        },
      }),
    });
  });

  await page.goto('/rpc/protocol/network-info?responseView=expanded');

  const dialog = page.getByRole('dialog', { name: 'Expanded response' });
  const closeButton = dialog.getByRole('button', { name: 'Close expanded response' });
  await expect(dialog).toBeVisible();
  await expect(closeButton).toBeVisible();

  const metrics = await page.evaluate(() => {
    const dialogElement = document.querySelector('.fastnear-response-modal__dialog');
    const closeElement = document.querySelector('.fastnear-response-modal__close-button');
    if (!dialogElement || !closeElement) {
      return null;
    }

    const dialogRect = dialogElement.getBoundingClientRect();
    const closeRect = closeElement.getBoundingClientRect();
    return {
      dialogBottom: dialogRect.bottom,
      dialogTop: dialogRect.top,
      closeRight: closeRect.right,
      closeTop: closeRect.top,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics.dialogTop).toBeGreaterThanOrEqual(0);
  expect(metrics.dialogBottom).toBeLessThanOrEqual(metrics.viewportHeight);
  expect(metrics.closeTop).toBeGreaterThanOrEqual(0);
  expect(metrics.closeRight).toBeLessThanOrEqual(metrics.viewportWidth);

  await closeButton.click();
  await expect(dialog).toBeHidden();
});

test('expanded response URL state opens the modal immediately during implicit auto-run', async ({ page }) => {
  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: { amount: '1' },
      }),
    });
  });

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.goto('/rpc/account/view-account?account_id=near&responseView=expanded');

  const dialog = page.getByRole('dialog', { name: 'Expanded response' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Sending request to the selected endpoint...')).toBeVisible();

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
  await expect(dialog).toContainText('"amount": "1"');
});

test('responseFind URL params prefill modal search and activate the first result after implicit auto-run', async ({ page }) => {
  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: {
          sections: Array.from({ length: 75 }, (_, index) => ({
            index,
            text:
              index === 8
                ? `needle first ${'a'.repeat(120)}`
                : index === 36
                  ? `needle second ${'b'.repeat(120)}`
                  : index === 64
                    ? `needle third ${'c'.repeat(120)}`
                    : `${'filler '.repeat(12)}${index}`,
          })),
        },
      }),
    });
  });

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.goto('/rpc/account/view-account?account_id=near&responseView=expanded&responseFind=needle');

  const dialog = page.getByRole('dialog', { name: 'Expanded response' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Find in response' })).toHaveValue('needle');

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('1 of 3');
  await expect(dialog.locator('[data-fastnear-response-match-active="true"]')).toHaveAttribute(
    'data-fastnear-response-match-index',
    '0'
  );

  await dialog.getByRole('button', { name: 'Next match' }).click();
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('2 of 3');

  const centering = await page.evaluate(() => {
    const viewer = document.querySelector('.fastnear-response-modal__viewer');
    const activeMatch = document.querySelector('[data-fastnear-response-match-active="true"]');
    if (!viewer || !activeMatch) {
      return null;
    }

    const viewerRect = viewer.getBoundingClientRect();
    const matchRect = activeMatch.getBoundingClientRect();
    const viewerMiddle = viewerRect.top + viewerRect.height / 2;
    const matchMiddle = matchRect.top + matchRect.height / 2;

    return {
      delta: Math.abs(matchMiddle - viewerMiddle),
      viewerHeight: viewerRect.height,
    };
  });

  expect(centering).not.toBeNull();
  expect(centering.delta).toBeLessThan(centering.viewerHeight * 0.3);
});

test('response action rails stay visible while scrolling inline and expanded responses', async ({ page }) => {
  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: {
          rows: Array.from({ length: 160 }, (_, index) => ({
            index,
            text: `row-${index} ${'payload '.repeat(10)}`,
          })),
        },
      }),
    });
  });

  await page.goto('/rpc/account/view-account?account_id=near');
  await expect(page.locator('.fastnear-interaction__text-response')).toContainText('"row-159');

  const inlineMetrics = await page.evaluate(() => {
    const shell = document.querySelector('.fastnear-interaction__result-shell');
    const rail = document.querySelector('.fastnear-interaction__result-action-rail');
    if (!shell || !rail) {
      return null;
    }

    shell.scrollTop = shell.scrollHeight;
    const shellRect = shell.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();

    return {
      shellTop: shellRect.top,
      railTop: railRect.top,
    };
  });

  expect(inlineMetrics).not.toBeNull();
  expect(Math.abs(inlineMetrics.railTop - inlineMetrics.shellTop)).toBeLessThan(28);

  await page.getByRole('button', { name: 'Expand response' }).click();
  const dialog = page.getByRole('dialog', { name: 'Expanded response' });
  await expect(dialog).toBeVisible();

  const modalMetrics = await page.evaluate(() => {
    const viewer = document.querySelector('.fastnear-response-modal__viewer');
    const rail = document.querySelector('.fastnear-response-modal__viewer-rail');
    if (!viewer || !rail) {
      return null;
    }

    viewer.scrollTop = viewer.scrollHeight;
    const viewerRect = viewer.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();

    return {
      railTop: railRect.top,
      viewerTop: viewerRect.top,
    };
  });

  expect(modalMetrics).not.toBeNull();
  expect(Math.abs(modalMetrics.railTop - modalMetrics.viewerTop)).toBeLessThan(36);
});

test('request example and finality URL params restore extra UI state on load', async ({ page }) => {
  await page.route('https://rpc.testnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: { amount: '1' },
      }),
    });
  });

  await page.goto(
    '/rpc/account/view-account?network=mainnet&requestExample=testnet&requestFinality=near-final&account_id=alice.testnet'
  );

  await expect(
    page.getByLabel('Select network').getByRole('button', { name: 'Testnet' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fastnear-reference__tabs button.is-active')).toHaveText('Testnet');
  await expect(
    page.getByLabel('Select finality').getByRole('button', { name: 'Near-final' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('alice.testnet');

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.testnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.getByRole('button', { name: 'Send request' }).click();

  const request = await requestPromise;
  const sentPayload = getRequestPayload(request);
  expect(request.url().startsWith('https://rpc.testnet.fastnear.com')).toBeTruthy();
  expect(sentPayload?.params?.account_id).toBe('alice.testnet');
  expect(sentPayload?.params?.finality).toBe('near-final');
});

test('runtime hydration does not overwrite block_id provided via URL params', async ({ page }) => {
  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === 'GET' && url.pathname === '/status') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sync_info: {
            latest_block_height: 999999,
            latest_block_hash: 'latest-block-hash',
          },
        }),
      });
      return;
    }

    const payload = request.postDataJSON();
    if (payload?.id === 'fastnear-docs') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'fastnear-docs',
          result: {
            chunks: [],
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: payload?.id || 'fastnear',
        result: {
          header: {
            height: 123,
          },
        },
      }),
    });
  });

  const hydrationRequestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id === 'fastnear-docs'
  );
  await page.goto('/rpc/block/block-by-height?block_id=123');

  const blockIdInput = page.locator('.fastnear-interaction__field--block_id input');
  await expect(blockIdInput).toHaveValue('123');
  const hydrationPayload = getRequestPayload(await hydrationRequestPromise);
  expect(hydrationPayload?.params?.block_id).toBe(999999);
  await expect(blockIdInput).toHaveValue('123');

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.getByRole('button', { name: 'Send request' }).click();

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.block_id).toBe(123);
});

test('hosted /rpcs routes prefill request fields from matching URL params', async ({ page }) => {
  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: { amount: '1' },
      }),
    });
  });

  await page.goto('/rpcs/account/view_account?account_id=near');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('near');

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.locator('.fastnear-interaction__actions .fastnear-button--primary').click();

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
});

test('Russian locale hosted /rpcs routes prefill request fields from matching URL params', async ({ page }) => {
  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: { amount: '1' },
      }),
    });
  });

  await page.goto('/ru/rpcs/account/view_account?account_id=near');

  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('near');

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.locator('.fastnear-interaction__actions .fastnear-button--primary').click();

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
});

test('network query params combine with field prefills on RPC pages', async ({ page }) => {
  await page.route('https://rpc.testnet.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'fastnear',
        result: { amount: '1' },
      }),
    });
  });

  await page.goto('/rpc/account/view-account?network=testnet&account_id=alice.testnet');
  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('alice.testnet');

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.testnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.getByRole('button', { name: 'Send request' }).click();

  const request = await requestPromise;
  const sentPayload = getRequestPayload(request);
  expect(request.url().startsWith('https://rpc.testnet.fastnear.com')).toBeTruthy();
  expect(sentPayload?.params?.account_id).toBe('alice.testnet');
});

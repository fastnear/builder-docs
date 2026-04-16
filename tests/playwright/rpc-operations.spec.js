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

test('autorun query params execute RPC requests on load when inputs are ready', async ({ page }) => {
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
  await page.goto('/rpc/account/view-account?account_id=near&autorun=1');

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
  await expect(page.locator('.fastnear-interaction__text-response')).toContainText('"amount": "1"');
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

test('expanded response URL state opens the modal immediately during autorun', async ({ page }) => {
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
  await page.goto('/rpc/account/view-account?account_id=near&autorun=1&responseView=expanded');

  const dialog = page.getByRole('dialog', { name: 'Expanded response' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Sending request to the selected endpoint...')).toBeVisible();

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
  await expect(dialog).toContainText('"amount": "1"');
});

test('responseFind URL params prefill modal search and activate the first result after autorun', async ({ page }) => {
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

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.goto(
    '/rpc/account/view-account?account_id=near&autorun=1&responseView=expanded&responseFind=amount'
  );

  const dialog = page.getByRole('dialog', { name: 'Expanded response' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Find in response' })).toHaveValue('amount');

  const sentPayload = getRequestPayload(await requestPromise);
  expect(sentPayload?.params?.account_id).toBe('near');
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('1 of 3');
  await expect(dialog.locator('[data-fastnear-response-match-active="true"]')).toHaveAttribute(
    'data-fastnear-response-match-index',
    '0'
  );
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

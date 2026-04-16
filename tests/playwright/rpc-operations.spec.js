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

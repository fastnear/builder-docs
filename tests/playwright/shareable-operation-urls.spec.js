const { test, expect } = require('@playwright/test');
const {
  OPERATION_QUERY_PARAMS,
} = require('../../src/utils/fastnearOperationUrlState');
const {
  getCopiedText,
  getRequestPayload,
  getSegmentedButton,
  installClipboardSpy,
  waitForHttpRequest,
  waitForRpcRequest,
} = require('./helpers/operation-page');

test('Copy example URL copies a shareable docs URL and shows the help tooltip', async ({ page }) => {
  await installClipboardSpy(page);
  await page.goto('/rpc/account/view-account?account_id=near');

  await page.getByLabel('Select network').getByRole('button', { name: 'Testnet' }).click();
  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('root.testnet');
  await page.locator('.fastnear-interaction__field--account_id input').fill('alice.testnet');
  await page.getByLabel('Select finality').getByRole('button', { name: 'Near-final' }).click();

  await page.getByRole('button', { name: 'About example URLs' }).click();
  await expect(page.getByRole('tooltip')).toContainText(
    'selected network, request example, finality, and any filled inputs'
  );

  await page.getByRole('button', { name: 'Copy example URL' }).click();
  await expect(page.getByRole('button', { name: 'Copied example URL' })).toBeVisible();

  const copiedUrl = new URL(await getCopiedText(page));
  expect(copiedUrl.pathname).toBe('/rpc/account/view-account');
  expect(copiedUrl.searchParams.get('network')).toBe('testnet');
  expect(copiedUrl.searchParams.get('requestExample')).toBe('testnet');
  expect(copiedUrl.searchParams.get('requestFinality')).toBe('near-final');
  expect(copiedUrl.searchParams.get('account_id')).toBe('alice.testnet');
  expect(copiedUrl.searchParams.get('apiKey')).toBeNull();
  expect(copiedUrl.searchParams.get('token')).toBeNull();
});

test('Copy example URL round-trips RPC extra UI state', async ({ page }) => {
  await installClipboardSpy(page);

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

  await page.goto('/rpc/account/view-account');

  await page.getByLabel('Select network').getByRole('button', { name: 'Testnet' }).click();
  await page.locator('.fastnear-interaction__field--account_id input').fill('alice.testnet');
  await page.getByLabel('Select finality').getByRole('button', { name: 'Near-final' }).click();
  await page.getByRole('button', { name: 'Copy example URL' }).click();

  const copiedUrl = new URL(await getCopiedText(page));
  expect(copiedUrl.pathname).toBe('/rpc/account/view-account');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.network)).toBe('testnet');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.requestExample)).toBe('testnet');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.requestFinality)).toBe('near-final');
  expect(copiedUrl.searchParams.get('account_id')).toBe('alice.testnet');

  await page.goto(copiedUrl.toString());

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

test('Copy example URL round-trips HTTP boolean body state on first paint', async ({ page }) => {
  await installClipboardSpy(page);

  await page.route('https://kv.test.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        entries: [],
      }),
    });
  });

  await page.goto('/fastdata/kv/all-by-predecessor');

  await page.getByLabel('Select network').getByRole('button', { name: 'Testnet' }).click();
  await page.locator('.fastnear-interaction__field--predecessor_id input').fill('copied.testnet');
  await getSegmentedButton(page, 'include_metadata', 'fastnear-segmented--boolean', 'False').click();
  await page.locator('.fastnear-interaction__field--limit input').fill('25');
  await page.locator('.fastnear-interaction__field--page_token input').fill('next-1');
  await page.getByRole('button', { name: 'Copy example URL' }).click();

  const copiedUrl = new URL(await getCopiedText(page));
  expect(copiedUrl.pathname).toBe('/fastdata/kv/all-by-predecessor');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.network)).toBe('testnet');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.requestExample)).toBe('testnet');
  expect(copiedUrl.searchParams.get('predecessor_id')).toBe('copied.testnet');
  expect(copiedUrl.searchParams.get('include_metadata')).toBe('false');
  expect(copiedUrl.searchParams.get('limit')).toBe('25');
  expect(copiedUrl.searchParams.get('page_token')).toBe('next-1');

  await page.goto(copiedUrl.toString());

  await expect(
    page.getByLabel('Select network').getByRole('button', { name: 'Testnet' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fastnear-interaction__field--predecessor_id input')).toHaveValue('copied.testnet');
  await expect(page.locator('.fastnear-interaction__field--limit input')).toHaveValue('25');
  await expect(page.locator('.fastnear-interaction__field--page_token input')).toHaveValue('next-1');
  await expect(
    getSegmentedButton(page, 'include_metadata', 'fastnear-segmented--boolean', 'False')
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    getSegmentedButton(page, 'include_metadata', 'fastnear-segmented--boolean', 'True')
  ).toHaveAttribute('aria-pressed', 'false');

  const requestPromise = waitForHttpRequest(page, 'https://kv.test.fastnear.com', { method: 'POST' });
  await page.getByRole('button', { name: 'Send request' }).click();

  const request = await requestPromise;
  expect(request.url()).toBe('https://kv.test.fastnear.com/v0/all/copied.testnet');
  expect(getRequestPayload(request)).toEqual({
    include_metadata: false,
    limit: 25,
    page_token: 'next-1',
  });
});

test('Copy example URL preserves hosted canonical routes and safe wrapper params', async ({ page }) => {
  await installClipboardSpy(page);
  await page.goto('/apis/fastnear/v1/account_full?account_id=near&colorSchema=dark&unknown_param=ignored');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await page.getByRole('button', { name: 'Copy example URL' }).click();

  const copiedUrl = new URL(await getCopiedText(page));
  expect(copiedUrl.pathname).toBe('/apis/fastnear/v1/account_full');
  expect(copiedUrl.searchParams.get('colorSchema')).toBe('dark');
  expect(copiedUrl.searchParams.get('network')).toBe('mainnet');
  expect(copiedUrl.searchParams.get('requestExample')).toBe('mainnet');
  expect(copiedUrl.searchParams.get('account_id')).toBe('near');
  expect(copiedUrl.searchParams.get('unknown_param')).toBeNull();
  expect(copiedUrl.searchParams.get('apiKey')).toBeNull();
  expect(copiedUrl.searchParams.get('token')).toBeNull();
});

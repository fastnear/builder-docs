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

test('Copy example URL copies a shareable docs URL and shows button-specific help tooltips', async ({ page }) => {
  await installClipboardSpy(page);
  await page.goto('/rpc/account/view-account');

  await page.getByLabel('Select network').getByRole('button', { name: 'Testnet' }).click();
  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('root.testnet');
  await page.locator('.fastnear-interaction__field--account_id input').fill('alice.testnet');
  await page.getByLabel('Select finality').getByRole('button', { name: 'Near-final' }).click();

  await page.getByRole('button', { name: 'About curl command' }).click();
  await expect(page.getByRole('tooltip')).toContainText(
    'Copies a curl command for the current request'
  );
  await expect(page.getByRole('tooltip')).toContainText('jq');

  await page.getByRole('button', { name: 'About example URL' }).click();
  await expect(page.getByRole('tooltip')).toContainText(
    'Reloads this request with the current network'
  );
  await expect(page.getByRole('tooltip')).not.toContainText('jq');

  await page.getByRole('button', { name: 'Copy example URL' }).click();
  await expect(page.getByRole('button', { name: 'Copied example URL' })).toBeVisible();

  const copiedUrl = new URL(await getCopiedText(page));
  expect(copiedUrl.pathname).toBe('/rpc/account/view-account');
  expect(copiedUrl.searchParams.get('network')).toBe('testnet');
  expect(copiedUrl.searchParams.get('requestExample')).toBeNull();
  expect(copiedUrl.searchParams.get('requestFinality')).toBe('near-final');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.responseView)).toBeNull();
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.responseFind)).toBeNull();
  expect(copiedUrl.searchParams.get('account_id')).toBe('alice.testnet');
  expect(copiedUrl.searchParams.get('apiKey')).toBeNull();
  expect(copiedUrl.searchParams.get('token')).toBeNull();
});

test('copy actions stay side by side on laptop widths and stack on narrow screens', async ({ page }) => {
  const curlButton = page.getByRole('button', { name: 'Copy curl command' });
  const exampleUrlButton = page.getByRole('button', { name: 'Copy example URL' });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/rpc/account/view-account');
  await expect(curlButton).toBeVisible();
  await expect(exampleUrlButton).toBeVisible();
  await curlButton.scrollIntoViewIfNeeded();

  const desktopCurlAction = await curlButton.boundingBox();
  const desktopExampleAction = await exampleUrlButton.boundingBox();
  expect(desktopCurlAction).not.toBeNull();
  expect(desktopExampleAction).not.toBeNull();
  expect(Math.abs(desktopCurlAction.y - desktopExampleAction.y)).toBeLessThan(8);
  expect(desktopExampleAction.x).toBeGreaterThan(desktopCurlAction.x);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/rpc/account/view-account');
  await expect(curlButton).toBeVisible();
  await expect(exampleUrlButton).toBeVisible();
  await curlButton.scrollIntoViewIfNeeded();

  const mobileCurlAction = await curlButton.boundingBox();
  const mobileExampleAction = await exampleUrlButton.boundingBox();
  expect(mobileCurlAction).not.toBeNull();
  expect(mobileExampleAction).not.toBeNull();
  expect(Math.abs(mobileCurlAction.x - mobileExampleAction.x)).toBeLessThan(8);
  expect(mobileExampleAction.y).toBeGreaterThan(mobileCurlAction.y + 8);
});

test('Copy example URL round-trips RPC extra UI state and auto-runs on reopen', async ({ page }) => {
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
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.requestExample)).toBeNull();
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.requestFinality)).toBe('near-final');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.responseView)).toBeNull();
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.responseFind)).toBeNull();
  expect(copiedUrl.searchParams.get('account_id')).toBe('alice.testnet');

  const requestPromise = waitForRpcRequest(
    page,
    'https://rpc.testnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.goto(copiedUrl.toString());

  await expect(
    page.getByLabel('Select network').getByRole('button', { name: 'Testnet' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fastnear-reference__tabs button.is-active')).toHaveText('Testnet');
  await expect(
    page.getByLabel('Select finality').getByRole('button', { name: 'Near-final' })
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('alice.testnet');

  const request = await requestPromise;
  const sentPayload = getRequestPayload(request);
  expect(request.url().startsWith('https://rpc.testnet.fastnear.com')).toBeTruthy();
  expect(sentPayload?.params?.account_id).toBe('alice.testnet');
  expect(sentPayload?.params?.finality).toBe('near-final');
  await expect(page.locator('.fastnear-interaction__text-response')).toContainText('"amount": "1"');
});

test('Copy example URL round-trips HTTP boolean body state on first paint and auto-runs on reopen', async ({ page }) => {
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
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.requestExample)).toBeNull();
  expect(copiedUrl.searchParams.get('predecessor_id')).toBe('copied.testnet');
  expect(copiedUrl.searchParams.get('include_metadata')).toBe('false');
  expect(copiedUrl.searchParams.get('limit')).toBe('25');
  expect(copiedUrl.searchParams.get('page_token')).toBe('next-1');

  const requestPromise = waitForHttpRequest(page, 'https://kv.test.fastnear.com', { method: 'POST' });
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

  const request = await requestPromise;
  expect(request.url()).toBe('https://kv.test.fastnear.com/v0/all/copied.testnet');
  expect(getRequestPayload(request)).toEqual({
    include_metadata: false,
    limit: 25,
    page_token: 'next-1',
  });
});

test('URL in this view in the expanded response modal preserves response view state and exposes help', async ({ page }) => {
  await installClipboardSpy(page);

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

  await page.goto('/rpc/account/view-account');

  await page.locator('.fastnear-interaction__field--account_id input').fill('near');
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
  await dialog.getByRole('textbox', { name: 'Find in response' }).fill('amount');
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('1 of 3');

  await dialog.getByRole('button', { name: 'About URL in this view' }).click();
  await expect(dialog.getByRole('tooltip')).toContainText(
    'reopens this expanded response'
  );
  await expect(dialog.getByRole('tooltip')).not.toContainText('jq');

  await dialog.getByRole('button', { name: 'Copy URL in this view' }).click();

  const copiedUrl = new URL(await getCopiedText(page));
  expect(copiedUrl.pathname).toBe('/rpc/account/view-account');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.network)).toBe('mainnet');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.responseView)).toBe('expanded');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.responseFind)).toBe('amount');
  expect(copiedUrl.searchParams.get('account_id')).toBe('near');
});

test('URL in this view round-trips response view state, auto-runs on reopen, and strips secrets', async ({ page }) => {
  await installClipboardSpy(page);

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

  await page.goto('/rpc/account/view-account?apiKey=test-key-123');

  await page.locator('.fastnear-interaction__field--account_id input').fill('near');
  let requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.getByRole('button', { name: 'Send request' }).click();
  await requestPromise;

  await page.getByRole('button', { name: 'Expand response' }).click();
  const dialog = page.getByRole('dialog', { name: 'Expanded response' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('textbox', { name: 'Find in response' }).fill('amount');
  await expect(dialog.locator('.fastnear-response-modal__find-results')).toHaveText('1 of 3');

  await dialog.getByRole('button', { name: 'Copy URL in this view' }).click();

  const copiedUrl = new URL(await getCopiedText(page));
  expect(copiedUrl.pathname).toBe('/rpc/account/view-account');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.network)).toBe('mainnet');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.responseView)).toBe('expanded');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.responseFind)).toBe('amount');
  expect(copiedUrl.searchParams.get('account_id')).toBe('near');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.apiKey)).toBeNull();
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.token)).toBeNull();

  requestPromise = waitForRpcRequest(
    page,
    'https://rpc.mainnet.fastnear.com',
    (payload) => payload?.id !== 'fastnear-docs'
  );
  await page.goto(copiedUrl.toString());

  const roundTripDialog = page.getByRole('dialog', { name: 'Expanded response' });
  await expect(roundTripDialog).toBeVisible();
  await expect(
    roundTripDialog.getByRole('textbox', { name: 'Find in response' })
  ).toHaveValue('amount');

  await requestPromise;
  await expect(roundTripDialog.locator('.fastnear-response-modal__find-results')).toHaveText('1 of 3');
});

test('Copy example URL preserves hosted canonical routes and safe wrapper params', async ({ page }) => {
  await installClipboardSpy(page);

  await page.route('https://api.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account_id: 'near',
      }),
    });
  });

  await page.goto('/apis/fastnear/v1/account_full?account_id=near&colorSchema=dark&unknown_param=ignored');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await page.getByRole('button', { name: 'Copy example URL' }).click();

  const copiedUrl = new URL(await getCopiedText(page));
  expect(copiedUrl.pathname).toBe('/apis/fastnear/v1/account_full');
  expect(copiedUrl.searchParams.get('colorSchema')).toBe('dark');
  expect(copiedUrl.searchParams.get('network')).toBe('mainnet');
  expect(copiedUrl.searchParams.get('requestExample')).toBeNull();
  expect(copiedUrl.searchParams.get('account_id')).toBe('near');
  expect(copiedUrl.searchParams.get('unknown_param')).toBeNull();
  expect(copiedUrl.searchParams.get('apiKey')).toBeNull();
  expect(copiedUrl.searchParams.get('token')).toBeNull();
});

test('Copy example URL strips apiKey URL overrides from the copied docs link', async ({ page }) => {
  await installClipboardSpy(page);
  await page.goto('/rpc/account/view-account?apiKey=test-key-123');

  await expect(page.locator('.fastnear-interaction__auth input')).toHaveValue('test-key-123');
  await page.locator('.fastnear-interaction__field--account_id input').fill('near');
  await page.getByRole('button', { name: 'Copy example URL' }).click();

  const copiedUrl = new URL(await getCopiedText(page));
  expect(copiedUrl.pathname).toBe('/rpc/account/view-account');
  expect(copiedUrl.searchParams.get('account_id')).toBe('near');
  expect(copiedUrl.searchParams.get(OPERATION_QUERY_PARAMS.network)).toBe('mainnet');
  expect(copiedUrl.searchParams.get('apiKey')).toBeNull();
  expect(copiedUrl.searchParams.get('token')).toBeNull();
});

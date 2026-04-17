const { test, expect } = require('@playwright/test');
const {
  getRequestPayload,
  waitForHttpRequest,
} = require('./helpers/operation-page');

test('unknown query params are ignored when building requests', async ({ page }) => {
  await page.route('https://api.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account_id: 'near',
      }),
    });
  });

  await page.goto('/api/v1/account-full?account_id=near&unknown_param=ignored');

  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('near');
  const requestPromise = waitForHttpRequest(page, 'https://api.fastnear.com');
  await page.getByRole('button', { name: 'Send request' }).click();

  const request = await requestPromise;
  expect(request.url()).toBe('https://api.fastnear.com/v1/account/near/full');
});

test('URL field prefills do not reapply after the user changes network', async ({ page }) => {
  await page.route('https://test.api.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account_id: 'root.testnet',
      }),
    });
  });

  await page.goto('/api/v1/account-full?account_id=near');

  const accountIdInput = page.locator('.fastnear-interaction__field--account_id input');
  await expect(accountIdInput).toHaveValue('near');

  await page.getByLabel('Select network').getByRole('button', { name: 'Testnet' }).click();
  await expect(accountIdInput).toHaveValue('root.testnet');

  const requestPromise = waitForHttpRequest(page, 'https://test.api.fastnear.com');
  await page.getByRole('button', { name: 'Send request' }).click();

  const request = await requestPromise;
  expect(request.url()).toBe('https://test.api.fastnear.com/v1/account/root.testnet/full');
});

test('API operation pages live under the short docs prefixes', async ({ page }) => {
  await page.goto('/fastdata/kv/all-by-predecessor');

  await expect(page).toHaveURL(/\/fastdata\/kv\/all-by-predecessor\/?$/);
  await expect(page.getByRole('heading', { name: 'All by Predecessor' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
});

test('HTTP pages focus Send request on load so Enter runs the default example', async ({ page }) => {
  await page.route('https://api.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account_id: 'root.near',
      }),
    });
  });

  await page.goto('/api/v1/account-full');

  const sendButton = page.getByRole('button', { name: 'Send request' });
  await expect(sendButton).toBeFocused();

  const requestPromise = waitForHttpRequest(page, 'https://api.fastnear.com');
  await page.keyboard.press('Enter');

  const request = await requestPromise;
  expect(request.url()).toBe('https://api.fastnear.com/v1/account/root.near/full');
});

test('HTTP operation pages prefill path fields from matching URL params', async ({ page }) => {
  await page.route('https://api.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account_id: 'near',
      }),
    });
  });

  await page.goto('/api/v1/account-full?account_id=near');

  const accountIdInput = page.locator('.fastnear-interaction__field--account_id input');
  await expect(accountIdInput).toHaveValue('near');

  const requestPromise = waitForHttpRequest(page, 'https://api.fastnear.com');
  await page.getByRole('button', { name: 'Send request' }).click();

  const request = await requestPromise;
  expect(request.url()).toBe('https://api.fastnear.com/v1/account/near/full');
});

test('operation-state URLs execute HTTP requests on load when inputs are ready', async ({ page }) => {
  await page.route('https://api.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account_id: 'near',
      }),
    });
  });

  const requestPromise = waitForHttpRequest(page, 'https://api.fastnear.com');
  await page.goto('/api/v1/account-full?account_id=near');

  const request = await requestPromise;
  expect(request.url()).toBe('https://api.fastnear.com/v1/account/near/full');
  await expect(page.locator('.fastnear-interaction__text-response')).toContainText('"account_id": "near"');
});

test('HTTP response metadata shows the full request URL in inline and expanded views', async ({ page }) => {
  await page.route('https://api.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account_id: 'near',
      }),
    });
  });

  await page.goto('/api/v1/account-full?account_id=near');

  const requestPromise = waitForHttpRequest(page, 'https://api.fastnear.com');
  await page.getByRole('button', { name: 'Send request' }).click();
  await requestPromise;

  const expectedUrl = 'https://api.fastnear.com/v1/account/near/full';
  await expect(page.locator('.fastnear-interaction__result-meta .fastnear-interaction__result-url')).toHaveText(
    expectedUrl
  );

  await page.getByRole('button', { name: 'Expand response' }).click();
  const dialog = page.getByRole('dialog', { name: 'Expanded response' });
  await expect(dialog.locator('.fastnear-interaction__result-url')).toHaveText(expectedUrl);
});

test('colorSchema-only hosted URLs do not auto-run HTTP requests', async ({ page }) => {
  let requestCount = 0;

  await page.route('https://api.fastnear.com/**', async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account_id: 'near',
      }),
    });
  });

  await page.goto('/apis/fastnear/v1/account_full?colorSchema=dark');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await page.waitForTimeout(350);
  expect(requestCount).toBe(0);
});

test('FastData operation pages prefill path and body fields from matching URL params', async ({ page }) => {
  await page.route('https://kv.main.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        entries: [],
      }),
    });
  });

  await page.goto(
    '/fastdata/kv/all-by-predecessor?predecessor_id=near&include_metadata=false&limit=25&page_token=next-1'
  );

  await expect(page.locator('.fastnear-interaction__field--predecessor_id input')).toHaveValue('near');
  await expect(page.locator('.fastnear-interaction__field--limit input')).toHaveValue('25');

  const requestPromise = waitForHttpRequest(page, 'https://kv.main.fastnear.com', { method: 'POST' });
  await page.getByRole('button', { name: 'Send request' }).click();

  const request = await requestPromise;
  expect(request.url()).toBe('https://kv.main.fastnear.com/v0/all/near');
  expect(getRequestPayload(request)).toEqual({
    include_metadata: false,
    limit: 25,
    page_token: 'next-1',
  });
});

test('NEAR Data pages prefill multiple path fields from matching URL params', async ({ page }) => {
  await page.route('https://mainnet.neardata.xyz/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        block_height: 123,
        shard_id: 2,
      }),
    });
  });

  await page.goto('/neardata/block-chunk?block_height=123&shard_id=2');

  await expect(page.locator('.fastnear-interaction__field--block_height input')).toHaveValue('123');
  await expect(page.locator('.fastnear-interaction__field--shard_id input')).toHaveValue('2');

  const requestPromise = waitForHttpRequest(page, 'https://mainnet.neardata.xyz');
  await page.getByRole('button', { name: 'Send request' }).click();

  const request = await requestPromise;
  expect(request.url()).toBe('https://mainnet.neardata.xyz/v0/block/123/chunk/2');
});

test('Transactions pages prefill mixed body fields from matching URL params', async ({ page }) => {
  await page.route('https://tx.main.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transactions: [],
      }),
    });
  });

  await page.goto('/tx/block?block_id=456&with_receipts=false&with_transactions=false');
  await expect(page.locator('.fastnear-interaction__field--block_id input')).toHaveValue('456');

  const requestPromise = waitForHttpRequest(page, 'https://tx.main.fastnear.com', { method: 'POST' });
  await page.getByRole('button', { name: 'Send request' }).click();

  expect(getRequestPayload(await requestPromise)).toEqual({
    block_id: 456,
    with_receipts: false,
    with_transactions: false,
  });
});

test('Transfers pages prefill string, enum, boolean, integer, and number body fields from matching URL params', async ({ page }) => {
  await page.route('https://transfers.main.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transfers: [],
      }),
    });
  });

  await page.goto(
    '/transfers/query?account_id=near&asset_id=native%3Anear&desc=false&direction=sender&limit=3&min_amount=100&min_human_amount=1.25'
  );

  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('near');
  await expect(page.locator('.fastnear-interaction__field--limit input')).toHaveValue('3');

  const requestPromise = waitForHttpRequest(page, 'https://transfers.main.fastnear.com', { method: 'POST' });
  await page.getByRole('button', { name: 'Send request' }).click();

  expect(getRequestPayload(await requestPromise)).toEqual({
    account_id: 'near',
    asset_id: 'native:near',
    desc: false,
    direction: 'sender',
    limit: 3,
    min_amount: '100',
    min_human_amount: 1.25,
  });
});

test('FastData multi pages prefill array body fields from matching URL params', async ({ page }) => {
  await page.route('https://kv.main.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        entries: [],
      }),
    });
  });

  await page.goto(
    '/fastdata/kv/multi?include_metadata=false&keys=acct.one%2Fpred.one%2Fkey-one,acct.two%2Fpred.two%2Fkey-two'
  );

  await expect(page.locator('.fastnear-interaction__field--keys textarea')).toHaveValue(
    'acct.one/pred.one/key-one,acct.two/pred.two/key-two'
  );

  const requestPromise = waitForHttpRequest(page, 'https://kv.main.fastnear.com', { method: 'POST' });
  await page.getByRole('button', { name: 'Send request' }).click();

  expect(getRequestPayload(await requestPromise)).toEqual({
    include_metadata: false,
    keys: ['acct.one/pred.one/key-one', 'acct.two/pred.two/key-two'],
  });
});

test('hosted /apis routes prefill path fields from matching URL params', async ({ page }) => {
  await page.route('https://api.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        account_id: 'near',
      }),
    });
  });

  await page.goto('/apis/fastnear/v1/account_full?account_id=near');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('near');

  const requestPromise = waitForHttpRequest(page, 'https://api.fastnear.com');
  await page.locator('.fastnear-interaction__actions .fastnear-button--primary').click();

  const request = await requestPromise;
  expect(request.url()).toBe('https://api.fastnear.com/v1/account/near/full');
});

test('hosted /apis routes prefill mixed body fields from matching URL params', async ({ page }) => {
  await page.route('https://tx.main.fastnear.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        transactions: [],
      }),
    });
  });

  await page.goto('/apis/transactions/v0/block?block_id=456&with_receipts=false&with_transactions=false');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('.fastnear-interaction__field--block_id input')).toHaveValue('456');

  const requestPromise = waitForHttpRequest(page, 'https://tx.main.fastnear.com', { method: 'POST' });
  await page.locator('.fastnear-interaction__actions .fastnear-button--primary').click();

  expect(getRequestPayload(await requestPromise)).toEqual({
    block_id: 456,
    with_receipts: false,
    with_transactions: false,
  });
});

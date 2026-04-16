const { test, expect } = require('@playwright/test');

test('RPC operation pages live under /rpc', async ({ page }) => {
  await page.goto('/rpc/account/view-account');

  await expect(page).toHaveURL(/\/rpc\/account\/view-account\/?$/);
  await expect(page.getByRole('heading', { name: 'View Account' })).toBeVisible();
  await expect(page.getByText('view_account request type')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
});

test('RPC operation pages prefill request fields from matching URL params', async ({ page }) => {
  let sentPayload;

  await page.route('https://rpc.mainnet.fastnear.com/**', async (route) => {
    sentPayload = route.request().postDataJSON();
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

  const sendButton = page.getByRole('button', { name: 'Send request' });
  await expect(sendButton).toBeEnabled();
  await sendButton.click();

  await expect.poll(() => sentPayload?.params?.account_id).toBe('near');
});

test('runtime hydration does not overwrite block_id provided via URL params', async ({ page }) => {
  let hydrationPayload;
  let sentPayload;

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
      hydrationPayload = payload;
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

    sentPayload = payload;
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

  await page.goto('/rpc/block/block-by-height?block_id=123');

  const blockIdInput = page.locator('.fastnear-interaction__field--block_id input');
  await expect(blockIdInput).toHaveValue('123');
  await expect.poll(() => hydrationPayload?.params?.block_id).toBe(999999);
  await expect(blockIdInput).toHaveValue('123');

  await page.getByRole('button', { name: 'Send request' }).click();
  await expect.poll(() => sentPayload?.params?.block_id).toBe(123);
});

test('API operation pages live under the short docs prefixes', async ({ page }) => {
  await page.goto('/fastdata/kv/all-by-predecessor');

  await expect(page).toHaveURL(/\/fastdata\/kv\/all-by-predecessor\/?$/);
  await expect(page.getByRole('heading', { name: 'All by Predecessor' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
});

test('HTTP operation pages prefill path fields from matching URL params', async ({ page }) => {
  let requestedUrl;

  await page.route('https://api.fastnear.com/**', async (route) => {
    requestedUrl = route.request().url();
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

  await page.getByRole('button', { name: 'Send request' }).click();
  await expect.poll(() => requestedUrl).toBe('https://api.fastnear.com/v1/account/near/full');
});

test('Russian locale preserves localized homepage navigation', async ({ page }) => {
  await page.goto('/ru/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(
    page.getByText('FastNear предлагает несколько документированных поверхностей', { exact: false })
  ).toBeVisible();
  await expect(page.getByText('docs поверхности')).toHaveCount(0);

  const apiLink = page.locator('main').getByRole('link', { name: 'FastNear API', exact: true }).first();
  await expect(apiLink).toHaveAttribute('href', /\/ru\/api\/?$/);

  await apiLink.click();
  await expect(page).toHaveURL(/\/ru\/api\/?$/);
});

test('Russian RPC operation pages live under /ru/rpc with translated controls', async ({ page }) => {
  await page.goto('/ru/rpc/account/view-account');

  await expect(page).toHaveURL(/\/ru\/rpc\/account\/view-account\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.getByRole('heading', { name: 'Просмотр аккаунта' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Копировать Markdown' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Отправить запрос' })).toBeVisible();
  await expect(page.getByText('Сведения об аккаунте')).toBeVisible();
  await expect(page.getByText('Successful ответ')).toHaveCount(0);
});

test('auth and agent guides live under clean docs prefixes', async ({ page }) => {
  await page.goto('/auth');

  await expect(page).toHaveURL(/\/auth\/?$/);
  await expect(page.getByRole('heading', { name: 'Auth & Access' })).toBeVisible();

  await page.goto('/agents/choosing-surfaces');

  await expect(page).toHaveURL(/\/agents\/choosing-surfaces\/?$/);
  await expect(page.getByRole('heading', { name: 'Choosing the Right Surface' })).toBeVisible();
});

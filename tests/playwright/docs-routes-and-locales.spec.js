const { test, expect } = require('@playwright/test');
const {
  getRequestPayload,
  waitForHttpRequest,
} = require('./helpers/operation-page');

test('Russian locale API routes prefill matching URL params across request body types', async ({ page }) => {
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
    '/ru/transfers/query?account_id=near&asset_id=native%3Anear&desc=false&direction=sender&limit=3&min_amount=100&min_human_amount=1.25'
  );

  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('.fastnear-interaction__field--account_id input')).toHaveValue('near');
  await expect(page.locator('.fastnear-interaction__field--limit input')).toHaveValue('3');

  const requestPromise = waitForHttpRequest(page, 'https://transfers.main.fastnear.com', { method: 'POST' });
  await page.locator('.fastnear-interaction__actions .fastnear-button--primary').click();

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

test('Russian locale hosted /apis routes prefill matching URL params', async ({ page }) => {
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

  await page.goto('/ru/apis/neardata/v0/block_chunk?block_height=123&shard_id=2');

  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('.fastnear-interaction__field--block_height input')).toHaveValue('123');
  await expect(page.locator('.fastnear-interaction__field--shard_id input')).toHaveValue('2');

  const requestPromise = waitForHttpRequest(page, 'https://mainnet.neardata.xyz');
  await page.locator('.fastnear-interaction__actions .fastnear-button--primary').click();

  const request = await requestPromise;
  expect(request.url()).toBe('https://mainnet.neardata.xyz/v0/block/123/chunk/2');
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

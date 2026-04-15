const { test, expect } = require('@playwright/test');

test('RPC operation pages live under /rpc', async ({ page }) => {
  await page.goto('/rpc/account/view-account');

  await expect(page).toHaveURL(/\/rpc\/account\/view-account\/?$/);
  await expect(page.getByRole('heading', { name: 'View Account' })).toBeVisible();
  await expect(page.getByText('view_account request type')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
});

test('API operation pages live under the short docs prefixes', async ({ page }) => {
  await page.goto('/fastdata/kv/all-by-predecessor');

  await expect(page).toHaveURL(/\/fastdata\/kv\/all-by-predecessor\/?$/);
  await expect(page.getByRole('heading', { name: 'All by Predecessor' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
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

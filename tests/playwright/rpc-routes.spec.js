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

test('auth and agent guides live under clean docs prefixes', async ({ page }) => {
  await page.goto('/auth');

  await expect(page).toHaveURL(/\/auth\/?$/);
  await expect(page.getByRole('heading', { name: 'Auth & Access' })).toBeVisible();

  await page.goto('/agents/choosing-surfaces');

  await expect(page).toHaveURL(/\/agents\/choosing-surfaces\/?$/);
  await expect(page.getByRole('heading', { name: 'Choosing the Right Surface' })).toBeVisible();
});

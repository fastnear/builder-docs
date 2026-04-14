const { test, expect } = require('@playwright/test');

test('RPC operation pages live under /docs/rpc', async ({ page }) => {
  await page.goto('/docs/rpc/account/view-account');

  await expect(page).toHaveURL(/\/docs\/rpc\/account\/view-account\/?$/);
  await expect(page.getByRole('heading', { name: 'View Account' })).toBeVisible();
  await expect(page.getByText('view_account request type')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy Markdown' })).toBeVisible();
});

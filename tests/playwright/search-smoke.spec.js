const { test, expect } = require('@playwright/test');

async function openSearch(page) {
  const algoliaShell = page.locator('.fastnear-search-shell__button');

  if (await algoliaShell.count()) {
    await expect(algoliaShell).toBeVisible();
    await algoliaShell.click();

    const modal = page.locator('.DocSearch-Container');
    const input = modal.locator('.DocSearch-Input');

    await expect(modal).toBeVisible();
    await expect(input).toBeVisible();

    return {
      input,
      resultsRoot: modal,
      provider: 'algolia',
    };
  }

  const input = page.locator('input[aria-label="Search"]');
  const resultsRoot = page.locator('.navbar__search');

  await expect(input).toBeVisible();

  return {
    input,
    resultsRoot,
    provider: 'local',
  };
}

async function expectSearchResult(page) {
  const { input, resultsRoot, provider } = await openSearch(page);

  await input.fill(provider === 'algolia' ? 'view access key' : 'view_access_key');

  await expect(
    resultsRoot.getByText('View Access Key', { exact: true }).first()
  ).toBeVisible({ timeout: 15000 });
}

test('homepage search renders and returns a known RPC result', async ({ page }) => {
  await page.goto('/');

  await expectSearchResult(page);
});

test('RPC page keeps search working while the operation UI stays interactive', async ({ page }) => {
  await page.goto('/rpc/account/view-account');

  await expect(page.getByRole('button', { name: 'Send request' })).toBeVisible();
  await expect(page.locator('.builder-fastnear-direct .fastnear-interaction__input').first()).toBeVisible();

  await expectSearchResult(page);
});

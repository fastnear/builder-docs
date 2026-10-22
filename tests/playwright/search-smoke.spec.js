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

// The full-page /search route (the "See all N results" link in the modal) must stay scoped to
// the current locale. It is served by src/theme/SearchPage and only exists with the Algolia
// provider, so the test skips itself when the local provider is active.
async function expectFullPageSearchScopedToLocale(page, { path, query, expectedPath, foreignPrefix }) {
  await page.goto(`${path}?q=${encodeURIComponent(query)}`);

  const resultLinks = page.locator('main article h2 a[href]');
  await expect(resultLinks.first()).toBeVisible({ timeout: 15000 });

  const hrefs = await resultLinks.evaluateAll((anchors) =>
    anchors.map((a) => new URL(a.getAttribute('href'), window.location.origin).pathname)
  );
  expect(hrefs.length).toBeGreaterThan(0);
  expect(hrefs).toContain(expectedPath);
  expect(hrefs.filter((href) => foreignPrefix(href))).toEqual([]);
}

test('full-page search results stay scoped to the current locale', async ({ page }) => {
  await page.goto('/');
  test.skip(
    (await page.locator('.fastnear-search-shell__button').count()) === 0,
    'full-page Algolia search route is only mounted with the Algolia provider'
  );

  await expectFullPageSearchScopedToLocale(page, {
    path: '/search',
    query: 'view account',
    expectedPath: '/rpc/account/view-account',
    foreignPrefix: (href) => href.startsWith('/ru/'),
  });

  await expectFullPageSearchScopedToLocale(page, {
    path: '/ru/search',
    query: 'история аккаунта',
    expectedPath: '/ru/tx/account',
    foreignPrefix: (href) => !href.startsWith('/ru/'),
  });
});

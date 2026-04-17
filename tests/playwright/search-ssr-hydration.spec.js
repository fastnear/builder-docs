const { test, expect } = require('@playwright/test');

function collectConsoleIssues(page) {
  const messages = [];
  page.on('console', (message) => {
    const type = message.type();
    if (type !== 'warning' && type !== 'error') {
      return;
    }
    messages.push({ type, text: message.text() });
  });
  page.on('pageerror', (error) => {
    messages.push({ type: 'pageerror', text: String(error) });
  });
  return messages;
}

function filterHydrationIssues(messages) {
  const hydrationPattern = /hydrat|did not match|expected server HTML/i;
  return messages.filter((entry) => hydrationPattern.test(entry.text));
}

function filterSearchIssues(messages) {
  return messages.filter((entry) => /search|docsearch|algolia/i.test(entry.text));
}

async function expectSearchShellPresent(page) {
  const algoliaShell = page.locator('.fastnear-search-shell__button');
  const localInput = page.locator('input[aria-label="Search"]');
  await expect(algoliaShell.or(localInput).first()).toBeVisible({ timeout: 15000 });
}

test('homepage renders the search shell with no hydration or pageerror surface', async ({ page }) => {
  const messages = collectConsoleIssues(page);

  await page.goto('/');
  await expectSearchShellPresent(page);
  await page.waitForLoadState('networkidle');

  const hydrationIssues = filterHydrationIssues(messages);
  const searchIssues = filterSearchIssues(messages.filter((m) => m.type === 'pageerror' || m.type === 'error'));

  expect(hydrationIssues, `hydration issues: ${JSON.stringify(hydrationIssues)}`).toEqual([]);
  expect(searchIssues, `search surface errors: ${JSON.stringify(searchIssues)}`).toEqual([]);
});

test('Russian homepage renders the search shell with no hydration issues', async ({ page }) => {
  const messages = collectConsoleIssues(page);

  await page.goto('/ru/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expectSearchShellPresent(page);
  await page.waitForLoadState('networkidle');

  const hydrationIssues = filterHydrationIssues(messages);
  expect(hydrationIssues, `hydration issues: ${JSON.stringify(hydrationIssues)}`).toEqual([]);
});

test('RPC operation page preserves search shell + no hydration issues', async ({ page }) => {
  const messages = collectConsoleIssues(page);

  await page.goto('/rpc/account/view-account');

  await expect(page.getByRole('heading', { name: 'View Account' })).toBeVisible();
  await page.waitForLoadState('networkidle');

  const hydrationIssues = filterHydrationIssues(messages);
  expect(hydrationIssues, `hydration issues: ${JSON.stringify(hydrationIssues)}`).toEqual([]);
});

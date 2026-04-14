const { test, expect } = require('@playwright/test');

test('FastNear API sidebar does not trigger the DocsSidebarProvider hook warning', async ({ page }) => {
  const sidebarWarnings = [];

  page.on('console', (message) => {
    const text = message.text();
    if (text.includes('useDocsSidebar is called outside the <DocsSidebarProvider>')) {
      sidebarWarnings.push(text);
    }
  });

  page.on('pageerror', (error) => {
    const text = error.message || String(error);
    if (text.includes('useDocsSidebar is called outside the <DocsSidebarProvider>')) {
      sidebarWarnings.push(text);
    }
  });

  await page.goto('/api/v1/public-key');
  await expect(page.getByRole('navigation', { name: 'Docs sidebar' })).toBeVisible();
  expect(sidebarWarnings).toHaveLength(0);
});

test('FastNear API sidebar hides redundant version prefixes once a version is selected', async ({ page }) => {
  await page.goto('/api/v1/public-key');

  const sidebar = page.getByRole('navigation', { name: 'Docs sidebar' });

  await expect(sidebar.getByRole('link', { name: 'Public Key Lookup', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'Public Key Lookup All', exact: true })).toBeVisible();
  await expect(sidebar.getByText('V1 Public Key Lookup')).toHaveCount(0);
  await expect(sidebar.getByText('V1 Public Key Lookup All')).toHaveCount(0);
});

test('FastNear API sidebar groups utility pages under System below versioned endpoints', async ({ page }) => {
  await page.goto('/api/v1/public-key');

  const sidebar = page.getByRole('navigation', { name: 'Docs sidebar' });

  await expect(sidebar.getByText('System', { exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'FastNear Status', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('link', { name: 'FastNear Health', exact: true })).toBeVisible();

  const sidebarText = await sidebar.textContent();
  expect(sidebarText.indexOf('Full Account View')).toBeLessThan(sidebarText.indexOf('System'));
  expect(sidebarText.indexOf('System')).toBeLessThan(sidebarText.indexOf('FastNear Status'));
});

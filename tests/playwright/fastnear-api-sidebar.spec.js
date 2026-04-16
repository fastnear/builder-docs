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

test('Russian FastNear API sidebar keeps locale during version switching', async ({ page }) => {
  await page.goto('/ru/api/v1/public-key');

  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');

  const sidebar = page.getByRole('navigation', { name: 'Боковая панель документации' });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByText('Система', { exact: true })).toBeVisible();
  await expect(page.getByText('Версия', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'V1 Поиск по публичному ключу' })).toBeVisible();
  await expect(
    page.getByText(
      'Получите индексированные ID аккаунтов, связанные с публичным ключом полного доступа.',
      { exact: false }
    )
  ).toBeVisible();
  await expect(page.getByText('Use the v1 endpoint for the newer namespace.')).toHaveCount(0);

  await page.locator('#fastnear-api-version-select').selectOption('v0');
  await expect(page).toHaveURL(/\/ru\/api\/v0\/public-key\/?$/);
});

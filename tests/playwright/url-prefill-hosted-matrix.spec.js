const { test, expect } = require('@playwright/test');

const {
  getMatrixCases,
  runUrlPrefillMatrixCase,
} = require('./helpers/url-prefill-matrix');

const hostedMatrixCases = getMatrixCases('canonicalPath');

for (const { path, pageModel } of hostedMatrixCases) {
  test(`Hosted URL prefill matrix covers ${pageModel.pageModelId}`, async ({ page }) => {
    await runUrlPrefillMatrixCase({
      page,
      expect,
      path,
      pageModel,
      assertPageReady: async ({ page: currentPage }) => {
        await expect(currentPage.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
      },
    });
  });
}

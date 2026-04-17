const { test, expect } = require('@playwright/test');

const {
  getMatrixCases,
  runUrlPrefillMatrixCase,
} = require('./helpers/url-prefill-matrix');

const matrixCases = getMatrixCases('docsPath');

for (const { path, pageModel } of matrixCases) {
  test(`URL prefill matrix covers ${pageModel.pageModelId}`, async ({ page }) => {
    await runUrlPrefillMatrixCase({
      page,
      expect,
      path,
      pageModel,
    });
  });
}

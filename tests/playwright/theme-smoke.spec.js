const { test, expect } = require('@playwright/test');

async function setTheme(page, theme) {
  await page.addInitScript((nextTheme) => {
    localStorage.setItem('theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  }, theme);
}

for (const theme of ['light', 'dark']) {
  test(`snapshot chooser buttons stay legible in ${theme} mode`, async ({ page }) => {
    await setTheme(page, theme);
    await page.goto('/snapshots/');

    const button = page.getByRole('link', { name: 'Mainnet Snapshots' });
    await button.hover();
    await page.waitForTimeout(200);

    const styles = await button.evaluate((element) => {
      const computed = getComputedStyle(element);
      return {
        color: computed.color,
        background: computed.backgroundColor,
      };
    });

    expect(styles.color).toBe('rgb(255, 255, 255)');
    expect(styles.background).not.toBe('rgba(0, 0, 0, 0)');
  });
}

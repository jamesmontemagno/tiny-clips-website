import { test, expect } from '@playwright/test';

const toggle = (page) => page.getByRole('button', { name: 'Dark mode', exact: true });

test('light is the default and a keyboard-selected theme persists across every page', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  await toggle(page).focus();
  await page.keyboard.press('Space');
  await expect(toggle(page)).toBeFocused();
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(7, 10, 20)');
  expect(await page.evaluate(() => localStorage.getItem('tiny-clips-theme'))).toBe('dark');
  await page.reload();

  for (const path of ['/', '/privacy.html', '/terms.html', '/404.html']) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
    expect(
      await page.locator('head').evaluate((head) => {
        const script = head.querySelector('script[src$="theme.js"]');
        const stylesheet = head.querySelector('link[rel="stylesheet"]');
        return Boolean(script.compareDocumentPosition(stylesheet) & Node.DOCUMENT_POSITION_FOLLOWING);
      })
    ).toBe(true);
  }
  await toggle(page).focus();
  await page.keyboard.press('Enter');
  await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(248, 250, 252)');
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
});

test('blocked storage does not prevent theme switching', async ({ page }) => {
  const errors = [];
  const warnings = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'warning') warnings.push(message.text());
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage blocked', 'SecurityError');
      },
    });
  });
  await page.goto('/');
  await toggle(page).click();
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await toggle(page).click();
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  expect(errors).toEqual([]);
  expect(warnings.some((warning) => warning.includes('blocked reading the saved theme'))).toBe(true);
  expect(warnings.some((warning) => warning.includes('blocked saving the theme'))).toBe(true);
});

test('theme changes and cleared preferences synchronize across open tabs', async ({ page, context }) => {
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/privacy.html');
  await toggle(page).click();
  await expect(other.locator('html')).toHaveCSS('color-scheme', 'dark');
  await expect(toggle(other)).toHaveAttribute('aria-pressed', 'true');
  await toggle(other).click();
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await toggle(page).click();
  await expect(other.locator('html')).toHaveCSS('color-scheme', 'dark');
  await page.evaluate(() => localStorage.clear());
  await expect(other.locator('html')).toHaveCSS('color-scheme', 'light');
});

test('theme switch remains outside the mobile menu without header overflow', async ({ page }) => {
  await page.goto('/');
  for (const width of [320, 390, 901, 960, 1100, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(toggle(page)).toBeVisible();
    expect(await page.locator('.header-content').evaluate((header) => header.scrollWidth <= header.clientWidth)).toBe(
      true
    );
    await toggle(page).click();
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
    await toggle(page).click();
  }
});

test('website theme does not change the simulated app palette', async ({ page }) => {
  await page.goto('/');
  const colors = async () =>
    page.locator('.demo-stage').evaluate((stage) => {
      const style = getComputedStyle(stage);
      return ['--accent', '--ink-on-accent', '--desk-text', '--desk-window'].map((name) =>
        style.getPropertyValue(name)
      );
    });
  const before = await colors();
  await toggle(page).click();
  expect(await colors()).toEqual(before);
});

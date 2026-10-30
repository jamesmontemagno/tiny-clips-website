import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const audit = async (page) => {
  const results = await new AxeBuilder({ page })
    // The YouTube player is third-party markup and not controlled by this site.
    .exclude('.video-embed')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
};

for (const theme of ['light', 'dark']) {
  for (const width of [1440, 390]) {
    test.describe(`accessible ${theme} theme at ${width}px`, () => {
      test.use({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });

      test.beforeEach(async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem('tiny-clips-theme', value), theme);
      });

      for (const path of ['/index.html', '/privacy.html', '/terms.html', '/404.html']) {
        test(`${path} has themed surfaces and no automated WCAG violations`, async ({ page }) => {
          await page.goto(path);
          await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
          await expect(page.locator('body')).toHaveCSS(
            'background-color',
            theme === 'dark' ? 'rgb(7, 10, 20)' : 'rgb(248, 250, 252)'
          );
          await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
            'content',
            theme === 'dark' ? '#070a14' : '#f8fafc'
          );
          await audit(page);
        });
      }

      test('alternate install tab, expanded FAQ, and lightbox remain accessible', async ({ page }) => {
        await page.goto('/');
        await page.locator('.platform-tab[data-platform="macos"]').click();
        await page.locator('.faq-item summary').first().click();
        await audit(page);
        await page.locator('.gallery-item').first().focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('dialog', { name: 'Enlarged screenshot' })).toBeVisible();
        await audit(page);
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Close enlarged image' })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.locator('.gallery-item').first()).toBeFocused();
      });
    });
  }
}

test('skip link, install tabs, and focus indicator work from the keyboard', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveCSS('outline-style', 'solid');
  await expect(skip).toHaveCSS('outline-width', '3px');
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();

  const windows = page.locator('.platform-tab[data-platform="windows"]');
  await windows.click();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.platform-tab[data-platform="macos"]')).toBeFocused();
  await expect(page.locator('#platform-panel-macos')).toBeVisible();
  await page.keyboard.press('Home');
  await expect(windows).toBeFocused();
  await expect(windows).toHaveAttribute('aria-selected', 'true');
});

test('mobile navigation hides closed links from keyboard and accessibility tree', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Dark mode' })).toBeFocused();
  await page.keyboard.press('Tab');
  const toggle = page.locator('.nav-toggle');
  await expect(toggle).toHaveAccessibleName('Open menu');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#primary-nav a:focus')).toHaveCount(0);
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('link', { name: 'Try it', exact: true })).toBeFocused();
  await audit(page);
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('reduced motion stops automatic video playback, including preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const video = page.locator('.hero-video');
  await expect(video).not.toHaveAttribute('autoplay');
  expect(await video.evaluate((element) => element.paused)).toBe(true);
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto');

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await expect(video).toHaveAttribute('autoplay');
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(true);
  await expect(video).not.toHaveAttribute('autoplay');
});

test('320px reflow keeps page content in bounds and demo targets at native size', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');
  const { scrollWidth, overflow } = await page.evaluate(() => {
    const hasClippedAncestor = (element) => {
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        if (['auto', 'clip', 'hidden', 'scroll'].includes(getComputedStyle(parent).overflowX)) return true;
      }
      return false;
    };
    const overflow = [...document.querySelectorAll('body *')]
      .map((element) => {
        const bounds = element.getBoundingClientRect();
        return {
          element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${typeof element.className === 'string' && element.className ? `.${element.className.trim().replace(/\s+/g, '.')}` : ''}`,
          right: Math.round(bounds.right),
          clipped: hasClippedAncestor(element),
        };
      })
      .filter((element) => element.right > innerWidth && !element.clipped)
      .slice(0, 10);
    return { scrollWidth: document.documentElement.scrollWidth, overflow };
  });
  expect(scrollWidth, `Unclipped elements exceed the viewport: ${JSON.stringify(overflow)}`).toBe(320);
  const desktop = page.getByRole('region', { name: /Interactive desktop/ });
  await desktop.focus();
  await page.keyboard.press('End');
  const tray = page.locator('.demo-tray-btn');
  await tray.scrollIntoViewIfNeeded();
  const target = await tray.boundingBox();
  expect(target.width).toBeGreaterThanOrEqual(24);
  expect(target.height).toBeGreaterThanOrEqual(24);
  await tray.click();
  await expect(page.locator('.demo-flyout')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.demo-flyout')).toBeHidden();
  await expect(page.locator('.shortcuts-table-wrap')).toHaveAttribute('tabindex', '0');
  await expect(page.locator('.command-line code').first()).toHaveAttribute('tabindex', '0');
});

test('forced colors retain a visible keyboard outline', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveCSS('outline-style', 'solid');
  await expect(page.locator(':focus')).toHaveCSS('outline-width', '3px');
  await page.locator('.demo-stage').focus();
  await expect(page.locator('.demo-stage')).toHaveCSS('outline-style', 'solid');
  await expect(page.locator('.demo-stage')).toHaveCSS('outline-width', '3px');
});

for (const theme of ['light', 'dark']) {
  test(`${theme} palette meets AA text and non-text contrast thresholds`, async ({ page }) => {
    await page.goto('/');
    if (theme === 'dark') await page.getByRole('button', { name: 'Dark mode' }).click();
    const colors = await page.locator('html').evaluate((element) => {
      const style = getComputedStyle(element);
      return Object.fromEntries(
        [
          '--text',
          '--text-2',
          '--text-3',
          '--accent',
          '--accent-2',
          '--ink-on-accent',
          '--bg',
          '--bg-2',
          '--bg-3',
          '--surface',
          '--surface-2',
          '--surface-3',
          '--ok',
          '--focus-color',
          '--border-strong',
        ].map((name) => [name, style.getPropertyValue(name).trim()])
      );
    });
    const luminance = (hex) => {
      const full =
        hex.length === 4
          ? hex
              .slice(1)
              .split('')
              .map((digit) => digit + digit)
              .join('')
          : hex.slice(1);
      const channels = full.match(/../g).map((channel) => {
        const value = parseInt(channel, 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const contrast = (foreground, background) => {
      const values = [luminance(colors[foreground]), luminance(colors[background])].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    for (const surface of ['--bg', '--bg-2', '--bg-3', '--surface', '--surface-2', '--surface-3']) {
      for (const text of ['--text', '--text-2', '--text-3', '--accent', '--accent-2']) {
        expect(contrast(text, surface), `${text} on ${surface}`).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast('--focus-color', surface)).toBeGreaterThanOrEqual(3);
      expect(contrast('--border-strong', surface)).toBeGreaterThanOrEqual(3);
    }
    for (const fill of ['--accent', '--ok']) {
      expect(contrast('--ink-on-accent', fill)).toBeGreaterThanOrEqual(4.5);
    }
  });
}

test('desktop demo fits without horizontal scrollbars and responds to resizing', async ({ page }) => {
  await page.goto('/');
  const desktop = page.locator('.demo-stage-outer');
  await expect(desktop).toHaveCSS('overflow-x', 'hidden');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(desktop).toHaveCSS('overflow-x', 'auto');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(desktop).toHaveCSS('overflow-x', 'hidden');
});

test('light theme and manual video controls do not require JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  await expect(page.locator('.hero-video')).toHaveAttribute('controls');
  await expect(page.locator('.hero-video')).not.toHaveAttribute('autoplay');
  await expect(page.getByRole('button', { name: 'Dark mode', includeHidden: true })).toBeHidden();
  await context.close();
});

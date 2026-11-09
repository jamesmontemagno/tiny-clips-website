import { test, expect } from '@playwright/test';

const STORE_WINDOWS = 'https://apps.microsoft.com/detail/9ndt5p7lcjwg';
const STORE_MAC = 'https://apps.apple.com/us/app/tiny-clips/id6759208660';

/** Collect uncaught errors and console errors for the lifetime of a page. */
const watchErrors = (page) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  return errors;
};

const gotoHome = async (page) => {
  await page.goto('/index.html', { waitUntil: 'load' });
  // The hero video loops forever, so never wait for networkidle. Smooth scrolling
  // makes bounding boxes stale mid-scroll, so turn it off for coordinate input.
  await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
};

test.describe('Agent Control setup page', () => {
  const body = async (page) => (await page.locator('body').textContent()).replace(/\s+/g, ' ');

  test('states it is off by default and that Tiny Clips is not an AI model', async ({ page }) => {
    await page.goto('/agents.html', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Set up Agent Control');
    const note = page.locator('.doc-note');
    await expect(note).toContainText('Agent Control is off by default.');
    await expect(note).toContainText('Tiny Clips provides the tools, not an AI model');
  });

  test('covers every setup section in order', async ({ page }) => {
    await page.goto('/agents.html', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'What agents can do',
      'Requirements',
      'Turn it on',
      'Install the plugin',
      'Pair your agent',
      'Verify the connection',
      'Take a first screenshot',
      'Manual MCP setup',
      'CLI-only setup',
      'Prompts to try',
      'Security model',
      'Troubleshooting',
    ]);
  });

  test('copy buttons copy the displayed command, except the placeholder command', async ({ page }) => {
    await page.goto('/agents.html', { waitUntil: 'load' });
    const lines = page.locator('.command-line');
    const commands = await lines.evaluateAll((items) =>
      items.map((item) => ({
        code: item.querySelector('code').textContent,
        copy: item.querySelector('button')?.dataset.copyCommand ?? null,
      }))
    );
    for (const expected of [
      'https://github.com/jamesmontemagno/tiny-clips.git',
      'copilot plugin install jamesmontemagno/tiny-clips',
      'dnx TinyClips --yes -- pair --name "My agent"',
      'dnx TinyClips --yes -- status',
      'dnx TinyClips --yes -- capture.targets kind=windows',
      'dotnet tool install -g TinyClips',
    ]) {
      expect(commands.map((command) => command.code)).toContain(expected);
    }
    for (const { code, copy } of commands) {
      expect(copy).toBe(code.includes('<') ? null : code);
    }
    expect(commands.filter((command) => command.copy === null)).toEqual([
      { code: 'dnx TinyClips --yes -- capture.screenshot mode=window windowId=<returned-window-id>', copy: null },
    ]);
  });

  test('MCP example is valid JSON using the documented command', async ({ page }) => {
    await page.goto('/agents.html', { waitUntil: 'load' });
    const config = JSON.parse(await page.locator('#mcp-config').textContent());
    expect(config.mcpServers.tinyclips).toEqual({
      command: 'dotnet',
      args: ['dnx', 'TinyClips', '--verbosity', 'quiet', '--yes', '--', 'mcp'],
    });
  });

  test('uses the feature name consistently and does not mention Pro', async ({ page }) => {
    await page.goto('/agents.html', { waitUntil: 'load' });
    const text = await body(page);
    expect(text).not.toMatch(/agent mode/i);
    expect(text).not.toMatch(/agent control|Agent control/);
    expect(text).not.toMatch(/\bPro\b|pro_required/);
  });

  for (const width of [320, 390, 1440]) {
    test(`does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/agents.html', { waitUntil: 'load' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    });
  }
});

test.describe('pages', () => {
  test('sitemap lists the Agent Control page', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml');
    expect(await response.text()).toContain('<loc>https://tinyclips.app/agents.html</loc>');
  });

  test('homepage uses the Agent Control name', async ({ page }) => {
    await gotoHome(page);
    const text = (await page.locator('body').textContent()).replace(/\s+/g, ' ');
    expect(text).not.toMatch(/agent mode/i);
    expect(text).not.toMatch(/agent control|Agent control/);
  });

  for (const path of ['/index.html', '/agents.html', '/privacy.html', '/terms.html']) {
    test(`${path} nav lists Documentation before FAQ and omits Highlights`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'load' });
      await expect(page.locator('.nav-links a')).toHaveText(['Try it', 'Features', 'Screens', 'Documentation', 'FAQ']);
      await expect(page.locator('.nav-links a', { hasText: 'Documentation' })).toHaveAttribute('href', './agents.html');
    });
  }

  test('Documentation is marked as the current page only on the docs page', async ({ page }) => {
    await page.goto('/agents.html', { waitUntil: 'load' });
    await expect(page.locator('.nav-links a[aria-current="page"]')).toHaveText('Documentation');
    await page.goto('/index.html', { waitUntil: 'load' });
    await expect(page.locator('.nav-links a[aria-current="page"]')).toHaveCount(0);
  });

  for (const path of ['/index.html', '/agents.html', '/privacy.html', '/terms.html', '/404.html']) {
    test(`${path} loads without errors`, async ({ page }) => {
      const errors = watchErrors(page);
      const response = await page.goto(path, { waitUntil: 'load' });
      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('main')).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  for (const width of [1440, 390]) {
    for (const path of ['/index.html', '/privacy.html', '/terms.html']) {
      test(`${path} skip link keeps page corners square at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 960 });
        await page.goto(path, { waitUntil: 'load' });

        const skipLink = page.locator('.skip-link');
        await page.keyboard.press('Tab');
        await expect(skipLink).toBeFocused();
        await expect(skipLink).not.toHaveCSS('box-shadow', 'none');
        await page.keyboard.press('Enter');

        const main = page.locator('main');
        await expect(main).toBeFocused();
        await expect(main).toHaveCSS('border-radius', '0px');
        await expect(main).toHaveCSS('box-shadow', 'none');

        await page.keyboard.press('Tab');
        const firstLink = main.locator('a[href]').first();
        await expect(firstLink).toBeFocused();
        await expect(firstLink).not.toHaveCSS('box-shadow', 'none');
      });
    }
  }

  test('homepage SEO and store links are correct', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://tinyclips.app/');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://tinyclips.app/');

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graph = jsonLd.flatMap((text) => JSON.parse(text)['@graph'] ?? [JSON.parse(text)]);
    const app = graph.find((node) => node['@type'] === 'SoftwareApplication');
    expect(app).toBeTruthy();
    expect(app.installUrl.join(' ')).toContain(STORE_WINDOWS);
    expect(app.installUrl.join(' ')).toContain(STORE_MAC);
    expect(graph.some((node) => node['@type'] === 'FAQPage')).toBeTruthy();

    expect(await page.locator(`a[href^="${STORE_WINDOWS}"]`).count()).toBeGreaterThanOrEqual(3);
    expect(await page.locator(`a[href^="${STORE_MAC}"]`).count()).toBeGreaterThanOrEqual(3);
  });

  for (const theme of ['light', 'dark']) {
    for (const width of [320, 390, 1440]) {
      test(`launch hero, product previews, and benefits render in ${theme} theme at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.addInitScript((value) => localStorage.setItem('tiny-clips-theme', value), theme);
        await gotoHome(page);

        const hero = page.locator('.hero-studio');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        await expect(hero).toHaveCSS('background-color', theme === 'dark' ? 'rgb(8, 13, 25)' : 'rgb(243, 246, 252)');
        await expect(page.getByRole('heading', { name: 'From quick capture to clear demo.' })).toBeVisible();
        await expect(hero.locator('.studio-preview-pill')).toHaveText(/^\s*Tiny Clips 2\.1 · Agent Control · Studio Preview\s*$/);
        await expect(hero.locator('.hero-capture-types')).toContainText('Screenshots');
        await expect(hero.locator('.hero-capture-types')).toContainText('Recordings');
        await expect(hero.locator('.hero-capture-types')).toContainText('GIFs');
        await expect(hero.locator('.hero-trust')).toContainText('No account required');

        const download = hero.getByRole('link', { name: /^Download (for Windows|for Mac|Tiny Clips)$/ });
        await expect(download).toHaveAttribute('href', /#download|apps\.microsoft\.com|apps\.apple\.com/);
        await expect(hero.getByRole('link', { name: 'See the workflow' })).toHaveAttribute('href', '#try');

        const tabs = hero.getByRole('tablist', { name: 'Product preview' });
        const editorTab = tabs.getByRole('tab', { name: 'Screenshot editor' });
        const studioTab = tabs.getByRole('tab', { name: /^Studio/ });
        await expect(editorTab).toHaveAttribute('aria-selected', 'true');

        const editor = page.getByRole('img', { name: /Illustrative Tiny Clips screenshot editor/ });
        await expect(editor).toBeVisible();
        await expect(editor).toContainText('not an app screenshot');
        await expect(editor.locator('.editor-redact-card')).toContainText('Pixelate');
        await expect(editor.locator('.editor-frame-card')).toContainText('9:16');
        await expect(hero).toContainText('Illustrative mockup of the screenshot editor');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

        await studioTab.click();
        await expect(studioTab).toHaveAttribute('aria-selected', 'true');
        await expect(editor).toBeHidden();
        await expect(hero).toContainText('on by default in Tiny Clips 2.1 unless previously disabled');
        await expect(hero).toContainText('Saved opt-outs stay off');
        await expect(hero).toContainText('Video remains a standard recording');

        const showcase = page.getByRole('img', { name: /Illustrative Tiny Clips Studio preview interface/ });
        await expect(showcase).toBeVisible();
        await expect(showcase).toContainText('not an app screenshot');
        await expect(showcase).toContainText('Screen');
        await expect(showcase).toContainText('Camera');
        await expect(showcase.locator('.studio-export-card')).toContainText('MP4 video');
        await expect(showcase.locator('.studio-screenshot-card')).toHaveCount(0);
        await expect(showcase.locator('.studio-tool-rail .studio-tool span')).toHaveText([
          'Background',
          'Screen',
          'Zoom',
          'Cut',
          'Speed',
          'Project',
        ]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);

        const agentTab = tabs.getByRole('tab', { name: 'Agent Control' });
        await agentTab.click();
        await expect(agentTab).toHaveAttribute('aria-selected', 'true');
        await expect(showcase).toBeHidden();
        const agent = page.getByRole('img', { name: /Illustrative AI agent working through Tiny Clips Agent Control/ });
        await expect(agent).toBeVisible();
        await expect(agent).toContainText('not an app screenshot');
        await expect(agent.locator('.agent-steps li')).toHaveCount(3);
        await expect(agent.locator('.agent-scope')).toHaveText(['capture', 'capture', 'edit']);
        await expect(hero).toContainText('off by default');
        await expect(hero).toContainText('Tiny Clips provides the tools, not an AI model');
        await expect(hero.getByRole('link', { name: 'Set up Agent Control' })).toHaveAttribute('href', './agents.html');
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
        const tabBar = await tabs.boundingBox();
        expect(tabBar.x).toBeGreaterThanOrEqual(0);
        expect(tabBar.x + tabBar.width).toBeLessThanOrEqual(width);
        const layoutProblems = await hero.evaluate((root) => {
          const rect = (el) => el.getBoundingClientRect();
          const problems = [];
          const tabEls = Array.from(root.querySelectorAll('.showcase-tab'));
          tabEls.forEach((tab, index) => {
            const box = rect(tab);
            if (box.height < 44) problems.push(`tab ${index} is under 44px`);
            const range = document.createRange();
            range.selectNodeContents(tab);
            const content = range.getBoundingClientRect();
            if (content.left < box.left - 0.5 || content.right > box.right + 0.5) {
              problems.push(`tab ${index} content overflows`);
            }
            if (index && box.left < rect(tabEls[index - 1]).right - 0.5 && box.top < rect(tabEls[index - 1]).bottom - 0.5) {
              problems.push(`tab ${index} overlaps the previous tab`);
            }
          });
          const edge = document.documentElement.clientWidth;
          for (const selector of ['.studio-preview-pill', '.agent-window', '.agent-permissions-card', '.agent-steps li']) {
            for (const el of root.querySelectorAll(selector)) {
              if (rect(el).left < 0 || rect(el).right > edge) problems.push(`${selector} leaves the viewport`);
            }
          }
          for (const li of root.querySelectorAll('.agent-steps li')) {
            for (const child of li.children) {
              if (rect(child).right > rect(li).right + 0.5) problems.push('agent step content overflows its row');
            }
          }
          const windowEl = root.querySelector('.agent-window');
          if (windowEl.scrollWidth > windowEl.clientWidth) problems.push('agent window content is clipped');
          return problems;
        });
        expect(layoutProblems).toEqual([]);

        const benefits = page.locator('.studio-benefits');
        await expect(benefits.getByRole('heading', { name: /Fast when you capture/ })).toBeVisible();
        await expect(benefits).toContainText('Flexible when you edit.');
        await expect(benefits.locator('.studio-benefit')).toHaveCount(3);
      });
    }
  }

  const PLATFORMS = {
    windows: {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      platform: 'Win32',
      uaPlatform: 'Windows',
      download: 'Download for Windows',
      store: STORE_WINDOWS,
      alt: 'Also on Mac',
      altStore: STORE_MAC,
      editorTitle: 'Edit screenshot',
      library: 'Clips Library',
    },
    macos: {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      platform: 'MacIntel',
      uaPlatform: 'macOS',
      download: 'Download for Mac',
      store: STORE_MAC,
      alt: 'Also on Windows',
      altStore: STORE_WINDOWS,
      editorTitle: 'Edit Screenshot',
      library: 'Clips Library',
    },
  };

  for (const [os, expected] of Object.entries(PLATFORMS)) {
    test(`hero download and mockups adapt to ${os}`, async ({ browser }) => {
      const context = await browser.newContext({ userAgent: expected.userAgent });
      await context.addInitScript(({ platform, uaPlatform }) => {
        Object.defineProperty(navigator, 'platform', { get: () => platform });
        Object.defineProperty(navigator, 'userAgentData', {
          get: () => ({ platform: uaPlatform, mobile: false, brands: [] }),
        });
      }, expected);
      const page = await context.newPage();
      await gotoHome(page);

      await expect(page.locator('html')).toHaveAttribute('data-platform', os);
      const hero = page.locator('.hero-studio');
      const download = hero.getByRole('link', { name: expected.download, exact: true });
      await expect(download).toHaveAttribute('href', new RegExp(`^${expected.store.replace(/[.?/]/g, '\\$&')}`));
      await expect(download).toHaveAttribute('target', '_blank');
      await expect(download.locator(`.os-icon-${os}`)).toBeVisible();
      await expect(download.locator('.os-icon').filter({ visible: true })).toHaveCount(1);

      const alt = hero.getByRole('link', { name: expected.alt, exact: true });
      await expect(alt).toHaveAttribute('href', new RegExp(`^${expected.altStore.replace(/[.?/]/g, '\\$&')}`));
      await expect(alt).toHaveAttribute('rel', 'noopener noreferrer');

      await expect(
        page.locator('.editor-window .mock-titlebar').getByText(expected.editorTitle, { exact: true })
      ).toBeVisible();
      await expect(page.locator('.library-window').getByText(expected.library, { exact: true })).toBeVisible();
      await expect(page.locator('.hl-keycaps').filter({ visible: true })).toHaveCount(1);
      await context.close();
    });
  }

  test('hero preview tabs support keyboard selection', async ({ page }) => {
    await gotoHome(page);
    const editorTab = page.getByRole('tab', { name: 'Screenshot editor' });
    const studioTab = page.getByRole('tab', { name: /^Studio/ });
    const editorPanel = page.getByRole('tabpanel', { name: 'Screenshot editor' });
    const studioPanel = page.locator('#showcase-studio');
    const agentTab = page.getByRole('tab', { name: 'Agent Control' });
    const agentPanel = page.locator('#showcase-agent');

    await editorTab.focus();
    await page.keyboard.press('ArrowRight');
    await expect(studioTab).toBeFocused();
    await expect(studioTab).toHaveAttribute('aria-selected', 'true');
    await expect(studioTab).toHaveAttribute('tabindex', '0');
    await expect(editorTab).toHaveAttribute('tabindex', '-1');
    await expect(studioPanel).toBeVisible();
    await expect(editorPanel).toBeHidden();

    await page.keyboard.press('ArrowRight');
    await expect(agentTab).toBeFocused();
    await expect(agentPanel).toBeVisible();
    await expect(studioPanel).toBeHidden();

    await page.keyboard.press('ArrowRight');
    await expect(editorTab).toBeFocused();
    await expect(editorPanel).toBeVisible();
    await page.keyboard.press('ArrowLeft');
    await expect(agentTab).toBeFocused();
    await page.keyboard.press('Home');
    await expect(editorTab).toBeFocused();
    await page.keyboard.press('End');
    await expect(agentTab).toBeFocused();
    await page.keyboard.press('Home');
    await expect(editorTab).toBeFocused();
    await expect(editorTab).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Tab');
    await expect(editorPanel).toBeFocused();
  });

  test('hero download and all previews work without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/index.html', { waitUntil: 'load' });
    const hero = page.locator('.hero-studio');
    await expect(hero.getByRole('link', { name: 'Download Tiny Clips', exact: true })).toHaveAttribute(
      'href',
      '#download'
    );
    await expect(hero.getByRole('link', { name: 'Windows and Mac downloads' })).toHaveAttribute('href', '#download');
    await expect(page.locator('.showcase-tabs')).toBeHidden();
    await expect(hero.getByRole('tabpanel')).toHaveCount(0);
    await expect(page.getByRole('img', { name: /Illustrative Tiny Clips screenshot editor/ })).toBeVisible();
    await expect(page.getByRole('img', { name: /Illustrative Tiny Clips Studio preview interface/ })).toBeVisible();
    await expect(page.getByRole('img', { name: /Illustrative AI agent working through Tiny Clips Agent Control/ })).toBeVisible();
    await context.close();
  });

  test('highlights show core workflows with labeled mockups', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#primary-nav a').first()).toHaveText('Try it');
    await expect(page.locator('#compare')).toHaveCount(0);

    const highlights = page.locator('#highlights');
    await expect(highlights.getByRole('heading', { level: 2 })).toHaveText('Small app. Big clarity.');
    await expect(highlights.locator('.highlight-card')).toHaveCount(6);
    for (const name of [
      'Record without the setup',
      'One shortcut, any target',
      'GIFs, trimmed to the moment',
      'Copy text from the screen',
      'Scrolling capture',
      'Find it later',
    ]) {
      await expect(highlights.getByRole('heading', { level: 3, name })).toBeVisible();
    }
    await expect(highlights.locator('.hl-mock:not([aria-hidden="true"])')).toHaveCount(0);
    await expect(highlights).toContainText('teleprompter that never shows up in the recording');
    await expect(highlights).toContainText('Mockups are simplified illustrations');
    await expect(highlights.getByRole('link', { name: 'See real screens' })).toHaveAttribute('href', '#gallery');
  });

  test('install tabs switch platforms and copy buttons exist', async ({ page }) => {
    await gotoHome(page);
    await page.click('.platform-tab[data-platform="windows"]');
    await expect(page.locator('#platform-panel-windows')).toBeVisible();
    await expect(page.locator('#platform-panel-macos')).toBeHidden();
    await expect(page.locator('#platform-panel-windows code').first()).toHaveText(
      'winget install Refractored.TinyClips'
    );

    await page.click('.platform-tab[data-platform="macos"]');
    await expect(page.locator('#platform-panel-macos')).toBeVisible();
    await expect(page.locator('#platform-panel-macos .command-line code').first()).toContainText(
      'brew tap jamesmontemagno/tiny-clips'
    );
  });

  for (const width of [390, 1440]) {
    test(`Studio preview content and keyboard access at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoHome(page);
      const studio = page.getByRole('article', { name: 'Tiny Clips Studio (Preview)', exact: true });
      await expect(studio.getByRole('heading', { level: 3 })).toBeVisible();
      await expect(studio).toContainText('separate editable layers');
      await expect(studio).toContainText("camera's position, size, and shape");
      await expect(studio).toContainText('backgrounds, padding, and rounded corners');
      await expect(studio).toContainText('Trim and export an MP4');
      await expect(studio).toContainText('on by default unless you previously turned it off');
      await expect(studio).toContainText('Your saved opt-out stays off');

      await studio.getByRole('link', { name: 'How to try the preview' }).click();
      const summary = page.locator('#studio-preview');
      await expect(summary).toBeFocused();
      await page.keyboard.press('Enter');
      const answer = summary.locator('..').locator('.faq-body');
      await expect(answer).toBeVisible();
      await expect(answer).toContainText('included in Tiny Clips 2.1');
      await expect(answer).toContainText('Settings → Studio');
      await expect(answer).toContainText('on by default unless you previously turned it off');
      await expect(answer).toContainText('saved opt-outs stay off');
      await expect(answer).toContainText('existing Video command still uses the regular recording workflow');
      await expect(answer).toContainText('On macOS, choose Studio Recording…');
      await expect(answer).toContainText('On Windows, choose the Studio tile');
      await expect(answer).not.toContainText('main branch');
      for (const stale of ['not part of the current store releases', 'Welcome Back', 'preview builds']) {
        await expect(page.locator('main')).not.toContainText(stale);
      }

      const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
      const faq = graph.find((node) => node['@type'] === 'FAQPage').mainEntity;
      const studioFaq = faq.find((item) => item.name === 'How do I try Tiny Clips Studio?');
      expect((await answer.textContent()).replace(/\s+/g, ' ').trim()).toBe(studioFaq.acceptedAnswer.text);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
      await page.keyboard.press('Enter');
      await expect(answer).toBeHidden();
    });
  }

  test('Studio showcase uses its editing controls without a floating screenshot card', async ({ page }) => {
    await gotoHome(page);
    await page.getByRole('tab', { name: /Studio/ }).click();
    const showcase = page.locator('#showcase-studio');
    await expect(showcase.locator('.studio-tool-rail .studio-tool span')).toHaveText([
      'Background',
      'Screen',
      'Zoom',
      'Cut',
      'Speed',
      'Project',
    ]);
    await expect(showcase.locator('.studio-screenshot-card')).toHaveCount(0);
    await expect(showcase.locator('.studio-export-card')).toBeVisible();
  });

  test('gallery lightbox opens and closes with Escape', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.gallery-item').first().click();
    const lightbox = page.locator('.gallery-lightbox');
    await expect(lightbox).toBeVisible();
    await expect(lightbox.locator('img')).toHaveAttribute('src', /assets\//);
    await page.keyboard.press('Escape');
    await expect(lightbox).toBeHidden();
  });

  for (const width of [390, 1440]) {
    test(`Studio video opens on demand and dismisses at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      let videoRequests = 0;
      await page.route('**/tiny-clips-studio-launch.mp4', async (route) => {
        videoRequests++;
        await route.fulfill({ path: 'site/assets/tiny-clips-promo.mp4', contentType: 'video/mp4' });
      });
      await gotoHome(page);
      const link = page.getByRole('link', { name: 'Watch the launch video' });
      const dialog = page.getByRole('dialog', { name: 'Meet Tiny Clips Studio' });
      const video = page.locator('.studio-video');
      expect(videoRequests).toBe(0);
      await expect(video).not.toHaveAttribute('src');

      await link.focus();
      await page.keyboard.press('Enter');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Close video' })).toBeFocused();
      await expect(video).toHaveAttribute('src', await link.getAttribute('href'));
      await expect(video).toHaveJSProperty('controls', true);
      await expect(video).toHaveJSProperty('autoplay', false);
      await video.evaluate((element) => element.play());
      await expect.poll(() => video.evaluate((element) => element.currentTime)).toBeGreaterThan(0);
      expect(videoRequests).toBeGreaterThan(0);
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(link).toBeFocused();
      await expect(video).toHaveJSProperty('paused', true);
      await expect(video).not.toHaveAttribute('src');
      await expect(page.locator('body')).not.toHaveClass(/is-studio-open/);

      await link.click();
      await dialog.getByText('Read the video summary', { exact: true }).click();
      await expect(dialog.getByText(/A quick trimmer becomes Studio/)).toBeVisible();
      await expect(dialog.getByRole('link', { name: 'Studio preview notes' })).toHaveAttribute(
        'href',
        'https://github.com/jamesmontemagno/tiny-clips/blob/main/plans/video-studio-plan.md'
      );
      await expect(page.locator('body')).toHaveClass(/is-studio-open/);
      const bounds = await dialog.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      await dialog.getByRole('button', { name: 'Close video' }).click();
      await expect(dialog).toBeHidden();
      await expect(link).toBeFocused();

      await link.click();
      await page.mouse.click(1, 1);
      await expect(dialog).toBeHidden();
      await expect(link).toBeFocused();
    });
  }

  test('Studio video link works without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/index.html', { waitUntil: 'load' });
    await expect(page.getByRole('link', { name: 'Watch the launch video' })).toHaveAttribute(
      'href',
      'https://github.com/jamesmontemagno/tiny-clips-marketing/raw/refs/heads/main/marketing/studio-launch/tiny-clips-studio-launch.mp4'
    );
    await expect(page.locator('.studio-video-dialog')).toBeHidden();
    await context.close();
  });

  test('mobile navigation toggles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHome(page);
    const toggle = page.locator('.nav-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('#primary-nav')).toHaveClass(/is-open/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#primary-nav')).not.toHaveClass(/is-open/);
  });
});

test.describe('interactive demo', () => {
  /** Scroll the simulated desktop into view and return its on-screen box plus logical→pixel scale. */
  const stageBox = async (page) => {
    await page.evaluate(() => document.querySelector('.demo-stage-outer').scrollIntoView({ block: 'center' }));
    const box = await page.locator('.demo-stage-outer').boundingBox();
    return { ...box, scale: box.width / 1000 };
  };

  const dragOnStage = async (page, from, to) => {
    const s = await stageBox(page);
    await page.mouse.move(s.x + from[0] * s.scale, s.y + from[1] * s.scale);
    await page.mouse.down();
    await page.mouse.move(s.x + to[0] * s.scale, s.y + to[1] * s.scale, { steps: 6 });
    await page.mouse.up();
  };

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 1000 });
    await gotoHome(page);
    // Keep the sticky header from overlapping the stage during coordinate input.
    await page.addStyleTag({ content: '.site-header{position:static!important}' });
  });

  test('Windows: screenshot → region → editor → annotate → save → library', async ({ page }) => {
    const errors = watchErrors(page);
    await page.click('.demo-seg button[data-platform="windows"]');
    await page.click('.demo-tray-btn');
    await expect(page.locator('.demo-flyout')).toBeVisible();
    await page.click('.demo-tile:has-text("Screenshot")');
    await expect(page.locator('.demo-picker')).toBeVisible();
    await page.keyboard.press('r');
    await expect(page.locator('.demo-select-layer')).toBeVisible();

    await dragOnStage(page, [60, 120], [400, 330]);
    const editor = page.locator('.demo-editor');
    await expect(editor).toBeVisible();
    await expect(editor.locator('.demo-editor-status')).toContainText('340 × 210 px');

    // Draw an arrow, a rectangle, and a blur redaction.
    const layer = await page.locator('.demo-anno-layer').boundingBox();
    await page.mouse.move(layer.x + 30, layer.y + 30);
    await page.mouse.down();
    await page.mouse.move(layer.x + 160, layer.y + 120, { steps: 5 });
    await page.mouse.up();
    await page.click('.demo-tool[aria-label="Rectangle"]');
    await page.mouse.move(layer.x + 50, layer.y + 140);
    await page.mouse.down();
    await page.mouse.move(layer.x + 220, layer.y + 190, { steps: 5 });
    await page.mouse.up();
    await page.click('.demo-tool[aria-label="Redact"]');
    await page.mouse.move(layer.x + 20, layer.y + 70);
    await page.mouse.down();
    await page.mouse.move(layer.x + 150, layer.y + 100, { steps: 5 });
    await page.mouse.up();
    await expect(editor.locator('.demo-editor-status')).toContainText('2 annotations');
    await expect(page.locator('.demo-redact[data-style="blur"]')).toHaveCount(1);

    await page.click('.demo-chip:has-text("16:9")');
    await expect(editor.locator('.demo-editor-status')).toContainText('export');

    await page.click('.demo-editor-toolbar button:has-text("Save"):not(:has-text("as"))');
    await expect(editor).toBeHidden();
    await expect(page.locator('.demo-toast')).toContainText('Screenshot saved');

    await page.click('.demo-toolbar button:has-text("Library")');
    await expect(page.locator('.demo-library')).toBeVisible();
    await expect(page.locator('.demo-clip')).toHaveCount(1);
    await expect(page.locator('.demo-clip-badge')).toHaveText('PNG');
    expect(errors).toEqual([]);
  });

  test('Windows: PowerToys tray icon opens the easter egg', async ({ page }) => {
    await page.click('.demo-seg button[data-platform="windows"]');
    await page.click('.demo-powertoys-btn');
    await expect(page.locator('.demo-powertoys-panel')).toBeVisible();
    await expect(page.locator('.demo-powertoys-btn img')).toHaveAttribute('src', './assets/powertoys-icon.svg');
    await expect(page.locator('.demo-powertoys-panel')).toContainText('Nice catch!');
    await expect(page.locator('.demo-powertoys-panel a')).toHaveAttribute(
      'href',
      'https://learn.microsoft.com/windows/powertoys/'
    );
    await page.click('.demo-powertoys-panel button:has-text("Back to Tiny Clips")');
    await expect(page.locator('.demo-powertoys-panel')).toBeHidden();
  });

  test('Windows: video with webcam + teleprompter → hotkey stop → trimmer', async ({ page }) => {
    const errors = watchErrors(page);
    await page.click('.demo-seg button[data-platform="windows"]');
    await page.click('.demo-tray-btn');
    await page.click('.demo-tile:has-text("Video")');
    await page.selectOption('select[aria-label="Countdown"]', '0');
    await page.keyboard.press('s');

    const setup = page.locator('.demo-setup');
    await expect(setup).toBeVisible();
    await setup.locator('.demo-toggle:has-text("Webcam")').click();
    await setup.locator('.demo-toggle:has-text("Teleprompter")').click();
    await setup.locator('.demo-btn.is-rec').click();

    await expect(page.locator('.demo-recbar')).toBeVisible();
    await expect(page.locator('.demo-webcam')).toBeVisible();
    await expect(page.locator('.demo-teleprompter')).toBeVisible();
    await page.waitForTimeout(1200);
    await expect(page.locator('.demo-rec-time')).not.toHaveText('0:00.0');

    await page.keyboard.press('Control+Shift+S');
    const trimmer = page.locator('.demo-trimmer');
    await expect(trimmer).toBeVisible({ timeout: 10_000 });
    await expect(trimmer.locator('.demo-appwin-title')).toContainText('Video Trimmer');
    await expect(trimmer.locator('.demo-appwin-title')).toContainText('webcam');
    await trimmer.locator('button:has-text("Save trimmed")').click();
    await expect(page.locator('.demo-toast')).toContainText('Video saved');
    expect(errors).toEqual([]);
  });

  test('Windows: scrolling capture stitches a taller image', async ({ page }) => {
    const errors = watchErrors(page);
    await page.click('.demo-seg button[data-platform="windows"]');
    await page.click('.demo-tray-btn');
    await page.click('.demo-tile:has-text("Screenshot")');
    await page.keyboard.press('p');
    await dragOnStage(page, [470, 130], [940, 420]);
    await expect(page.locator('.demo-scrollpanel')).toBeVisible();
    await expect(page.locator('.demo-editor')).toBeVisible({ timeout: 15_000 });
    const status = await page.locator('.demo-editor-status').textContent();
    const [, width, height] = status.match(/(\d+) × (\d+) px/);
    expect(Number(width)).toBe(470);
    expect(Number(height)).toBeGreaterThan(290);
    expect(errors).toEqual([]);
  });

  test('macOS: menu bar → OCR reads on-screen text → Clips Library', async ({ page }) => {
    const errors = watchErrors(page);
    await page.click('.demo-seg button[data-platform="macos"]');
    await expect(page.locator('.demo-menubar')).toBeVisible();
    await page.click('.demo-tray-btn');
    await expect(page.locator('.demo-macmenu')).toBeVisible();
    await page.click('.demo-macmenu-item:has-text("Copy Text")');
    await dragOnStage(page, [50, 120], [420, 340]);
    const ocr = page.locator('.demo-ocr');
    await expect(ocr).toBeVisible({ timeout: 10_000 });
    await expect(ocr.locator('pre')).toContainText('Launch checklist');
    await ocr.locator('button:has-text("Copy text")').click();
    await expect(page.locator('.demo-toast')).toContainText('Text copied');

    await page.click('.demo-tray-btn');
    await page.click('.demo-macmenu-item:has-text("Clips Library")');
    const library = page.locator('.demo-library');
    await expect(library).toBeVisible();
    await expect(library.locator('.demo-appwin-title')).toContainText('Clips Library');
    await expect(library.locator('.demo-side-item:has-text("Release")')).toBeVisible();
    await expect(library.locator('.demo-appwin-title')).not.toContainText('null');
    expect(errors).toEqual([]);
  });

  test('Escape cancels a flow and Reset clears clips', async ({ page }) => {
    await page.click('.demo-seg button[data-platform="windows"]');
    // Global hotkeys only apply while the pointer is over the demo or focus is inside it.
    await page.locator('.demo-stage').hover();
    await page.keyboard.press('Control+Shift+5');
    await expect(page.locator('.demo-picker')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.demo-picker')).toBeHidden();
    await page.click('.demo-toolbar button:has-text("Reset")');
    await expect(page.locator('.demo-toast')).toContainText('Demo reset');
  });
});

# Tiny Clips Website

This repository contains the static marketing website for Tiny Clips, published at **https://tinyclips.app**.

## Links

- Website: https://tinyclips.app
- Microsoft Store: https://apps.microsoft.com/detail/9ndt5p7lcjwg
- Mac App Store: https://apps.apple.com/us/app/tiny-clips/id6759208660?mt=12
- Main app repository: https://github.com/jamesmontemagno/tiny-clips

## What is in this repo?

| Path                                                           | Purpose                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `site/index.html`                                              | Homepage: hero with store badges, platform-aware install section, interactive demo, features, shortcuts, Mac vs Windows comparison, gallery, video, trust, FAQ. Also holds all SEO metadata and JSON-LD (`SoftwareApplication`, `FAQPage`, `VideoObject`, `Organization`).                                                                                                                                     |
| `site/styles.css`                                              | Site design system and page styles.                                                                                                                                                                                                                                                                                                                                                                            |
| `site/demo.css` / `site/demo.js`                               | The interactive "Try Tiny Clips" simulator: a fake Windows/macOS desktop with the tray flyout / menu bar menu, capture picker, region/window/screen selection, scrolling capture, OCR, screenshot editor (annotations, redaction, backgrounds, export frames), recording with webcam + teleprompter overlays, video/GIF trimmer, Clips Library / Clips Manager, and Settings. Self-contained, no dependencies. |
| `site/script.js`                                               | Platform detection (store badge ordering, install tab), copy buttons, mobile nav, active-section nav, gallery lightbox.                                                                                                                                                                                                                                                                                        |
| `site/privacy.html`, `site/terms.html`, `site/404.html`        | Legal and error pages.                                                                                                                                                                                                                                                                                                                                                                                         |
| `site/assets/`                                                 | App icon, official store badges (`badge-microsoft-store.svg`, `badge-mac-app-store.svg`), screenshots, promo video, OG image.                                                                                                                                                                                                                                                                                  |
| `site/robots.txt`, `site/sitemap.xml`, `site/site.webmanifest` | Discovery and manifest files.                                                                                                                                                                                                                                                                                                                                                                                  |
| `DESIGN.md`, `PRODUCT.md`                                      | Design system and product brief that guide changes to the site.                                                                                                                                                                                                                                                                                                                                                |

## Working locally

The site is plain HTML/CSS/JS. Serve the `site/` folder with any static server, for example:

```powershell
npm install
npm run serve        # http://127.0.0.1:8765/
```

## Checks

The same checks run in CI (`.github/workflows/ci.yml`) on every pull request and push to `main`:

| Command                | What it does                                                                                                                                                                                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint:html`    | Validates every page with [html-validate](https://html-validate.org/) (`.htmlvalidate.json`).                                                                                                                                                                                                       |
| `npm run lint:css`     | Lints stylesheets with stylelint (`.stylelintrc.json`).                                                                                                                                                                                                                                             |
| `npm run lint:js`      | Lints `site/*.js` with ESLint (`eslint.config.js`).                                                                                                                                                                                                                                                 |
| `npm run check:format` | Verifies Prettier formatting; `npm run format` fixes it.                                                                                                                                                                                                                                            |
| `npm run check:links`  | Crawls the locally served site and fails on broken internal links (needs `npm run serve` running).                                                                                                                                                                                                  |
| `npm run test:e2e`     | Playwright smoke tests in `tests/` — loads every page, checks SEO/store links, install tabs, lightbox, mobile nav, and drives the interactive demo end to end (screenshot → editor → save, video with webcam/teleprompter → trimmer, scrolling capture, OCR, Clips Manager). Starts its own server. |
| `npm test`             | Lint + e2e.                                                                                                                                                                                                                                                                                         |

CI also validates `sitemap.xml`, `robots.txt`, the web manifest, the canonical URL, both store links, and that every JSON-LD block parses.

First run of the e2e tests needs a browser: `npx playwright install chromium`.

## Appearance and accessibility

The site uses a light theme on every page, independent of OS appearance and without
JavaScript. Browser chrome and the web manifest use the same light canvas. Product
screenshots, official store badges, and the simulated app's native colors are preserved.

`tests/accessibility.spec.js` runs axe WCAG A/AA checks (through WCAG 2.2) on all pages
at desktop and mobile widths, plus alternate install content, expanded FAQ, mobile
navigation, and the gallery lightbox. It also covers keyboard focus, skip navigation,
320px reflow, forced-colors focus outlines, reduced-motion video behavior, and the
no-JavaScript light theme. These checks complement, not replace, manual assistive
technology review.

On small screens the interactive desktop scrolls sideways at native size so controls
remain readable and touch-sized. Reduced motion stops hero autoplay; the video's
manual controls remain available. See `DESIGN.md` for palette and accessibility rules.

## Keeping the site in sync with the app

When a new Tiny Clips release ships, check:

- **Feature lists** in the Features, Mac vs Windows, and FAQ sections of `site/index.html`.
- **Version / size claims** (Windows ~21 MB MSIX, Mac ~4 MB) and OS requirements.
- **Install commands** (`winget install Refractored.TinyClips`, Homebrew tap) and store links.
- **Demo parity**: if a user-visible capture feature lands in the app, consider mirroring it in `site/demo.js`.
- `lastmod` dates in `site/sitemap.xml`.

## Deployment

The website is deployed with GitHub Pages from this repository using the workflow in
`.github/workflows/deploy-pages.yml`. On pushes to `main`, the workflow publishes the `site/` directory to
https://tinyclips.app (custom domain with HTTPS enforced).

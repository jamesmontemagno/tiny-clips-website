# Tiny Clips Website

This repository contains the static marketing website for Tiny Clips.

## Links

- Website: https://tinyclips.app
- Main app repository: https://github.com/jamesmontemagno/tiny-clips

## What is in this repo?

- `site/index.html` — homepage content and SEO metadata
- `site/styles.css` — site styling
- `site/script.js` — interactive UI behavior (tabs, copy buttons, etc.)
- `site/assets/` — images, icons, and media used by the site
- `site/robots.txt` and `site/sitemap.xml` — search engine discovery files

## Deployment

The website is deployed with GitHub Pages from this repository using the workflow in:

- `.github/workflows/deploy-pages.yml`

On pushes to `main`, the workflow publishes the `site/` directory.

---
name: Tiny Clips Website
description: Static marketing website for Tiny Clips, a free, lightweight Windows and Mac screen capture app available on the Microsoft Store and Mac App Store.
colors:
  background: '#f8fafc'
  background-soft: '#eef3fa'
  background-elevated: '#ffffff'
  text: '#17243b'
  text-secondary: '#43536a'
  text-muted: '#52627a'
  accent: '#175cd3'
  accent-2: '#6340c8'
  brand-gradient: 'linear-gradient(135deg, #175cd3 0%, #6340c8 100%)'
  accent-glow: '#175cd32e'
  recording: '#c92c44'
  success: '#087849'
  border: '#ccd7e5'
  border-hover: '#73849c'
  code-text: '#17243b'
typography:
  display:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: 'clamp(2.25rem, 4.4vw, 3.5rem)'
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: '-0.02em'
  headline:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '-0.01em'
  title:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: '0.1em'
rounded:
  xs: '8px'
  sm: '10px'
  md: '12px'
  lg: '14px'
  xl: '16px'
  frame: '20px'
  pill: '999px'
spacing:
  xs: '0.5rem'
  sm: '0.75rem'
  md: '1rem'
  lg: '1.5rem'
  xl: '2rem'
  section: '5rem'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '#ffffff'
    rounded: '{rounded.md}'
    padding: '0.85rem 1.75rem'
    typography: '{typography.body}'
  button-primary-large:
    backgroundColor: '{colors.accent}'
    textColor: '#ffffff'
    rounded: '{rounded.lg}'
    padding: '1.05rem 2.8rem'
    typography: '{typography.body}'
  button-secondary:
    backgroundColor: '{colors.background-soft}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '0.85rem 1.75rem'
    typography: '{typography.body}'
  card:
    backgroundColor: '{colors.background-elevated}'
    textColor: '{colors.text}'
    rounded: '{rounded.xl}'
    padding: '1.75rem'
  nav-pill:
    backgroundColor: '#ffffff00'
    textColor: '{colors.text-secondary}'
    rounded: '{rounded.pill}'
    padding: '0.5rem 1rem'
  command-chip:
    backgroundColor: '{colors.background-soft}'
    textColor: '{colors.code-text}'
    rounded: '{rounded.sm}'
    padding: '0.5rem 0.65rem'
---

# Design System: Tiny Clips Website

## 1. Overview

**Creative North Star: "The Pocket Capture Studio"**

Tiny Clips should feel like a compact creative tool sitting one click away: clear, quiet, and immediately useful. The website uses a light canvas with dark blue ink for readability in bright rooms and screen-sharing sessions. Product screenshots, video, and simulated native app surfaces retain their own appearance.

The system uses a focused cool palette, product imagery, rounded native-feeling controls, and restrained glow to communicate speed and capability. It rejects bloated enterprise SaaS marketing: no vague productivity murals, no fake metrics, no endless decorative feature grids, and no design moves that make a sub-5 MB utility feel like a subscription platform.

**Key Characteristics:**

- White and soft blue surfaces that keep copy readable and let real product imagery stand out.
- Compact controls with clear platform choices and copyable install commands.
- Quiet elevation: borders, tonal layers, and soft shadows rather than heavy glow.
- Direct product proof through real app imagery, demo video, and exact install paths.
- Creator-friendly clarity without developer-tool costume.

## 2. Colors

The palette is a restrained light capture-studio palette: a cool off-white canvas, white panels, dark blue text, readable slate support text, and one deep blue action color. The site stays light regardless of OS appearance and requires no JavaScript or saved preference.

### Primary

- **Capture Blue**: The single action color for primary buttons, active platform tabs, focus accents, check marks, glows, and the rare highest-emphasis label. It should stay scarce enough that it means "act now" or "selected."

### Neutral

- **Canvas White** (`#f8fafc`): Page background.
- **Panel Blue** (`#eef3fa`): Grouped controls, code, and table headers.
- **Paper White** (`#ffffff`): Cards and elevated surfaces; also ink on solid action colors.
- **Capture Ink** (`#17243b`): Headings and primary text.
- **Slate** (`#43536a`, muted `#52627a`): Body, navigation, legal, and supporting text.
- **Soft Blue Border** (`#ccd7e5`): Decorative surface separation.
- **Control Border** (`#73849c`): Control boundaries that need stronger contrast.

### Named Rules

**The One Blue Rule (with the icon gradient).** Capture Blue is the only saturated UI accent. The single exception is the Brand Gradient (blue → violet) lifted from the app icon itself: use it for the hero highlight word, the recommended-install card wash, and the final CTA card — never for body UI, buttons, or repeated decoration. Recording red and success green exist only as semantic state colors (record dot, copied state).

**The Proof Over Decoration Rule.** Blue glow must attach to something functional: a button, selected tab, screenshot frame, or active state. Decorative glow without product meaning is forbidden.

**The Capture-Corner Rule.** The signature motif is the four corner brackets of a capture region (`.capture-frame`). Reserve it for product media (hero video, demo video) and the final CTA card so it keeps meaning ""this is the capture""; do not frame ordinary cards with it.

## 3. Typography

**Display Font:** Inter with system sans fallbacks.
**Body Font:** Inter with system sans fallbacks.
**Label/Mono Font:** No separate mono face; command text stays in the browser default code face only inside `<code>`.

**Character:** The type system is utilitarian and native: compact, readable, and direct. Inter is already committed in the shipping site, so preserve it as identity rather than chasing novelty.

### Hierarchy

- **Display** (700, `clamp(2.25rem, 4.4vw, 3.5rem)`, 1.1): Hero and legal-page titles. Use only once per page-level surface.
- **Headline** (700, `clamp(1.8rem, 4vw, 2.5rem)`, approximately 1.2): Section headlines and major product proof points.
- **Title** (700, `1.25rem`, 1.25): Card titles, install panels, manager headings, and dense feature labels.
- **Body** (400, `1rem`, 1.6): General reading text. Keep long prose to about 60ch where possible.
- **Label** (700, `0.75rem`, `0.1em`, uppercase): Use sparingly for the hero and signature platform/manager cues. Repeating tiny uppercase labels above every section is prohibited.

### Named Rules

**The Native Utility Rule.** Type should read like a polished native app, not a campaign poster. Avoid oversized display theatrics and keep copy scannable.

**The Sparse Label Rule.** One or two uppercase labels can orient the page; using them as section scaffolding across the whole site is forbidden.

## 4. Elevation

Tiny Clips uses white and soft blue panels for depth at rest. Subtle blue-gray shadows appear on product media and prominent surfaces; borders separate cards without turning them into heavy boxes.

### Shadow Vocabulary

- **Button Glow** (`rgba(23, 92, 211, 0.18)`): Restrained emphasis on primary buttons and selected controls.
- **Surface Large** (`0 30px 60px -20px rgba(29, 53, 88, 0.16), 0 12px 24px -12px rgba(29, 53, 88, 0.12)`): Media frames, lightbox imagery, and prominent sections.
- **Media Halo** (`0 0 120px rgba(79, 180, 255, 0.1)`): Hero video frame only; use smaller variants for supporting product imagery.

### Named Rules

**The Lift On Intent Rule.** Flat tonal surfaces are the default. Strong shadow, scale, and glow should appear only for interaction, media emphasis, or selected state.

**The No Arbitrary Z Rule.** Keep layering semantic: sticky header, lightbox overlay, lightbox content. Replace arbitrary values like `999` with a named z-index scale when touching related CSS.

## 5. Components

### Buttons

- **Shape:** Rounded native rectangle (`12px`, `14px` for large hero CTA).
- **Primary:** Deep Capture Blue background with white text; hover darkens the blue.
- **Hover / Focus:** Restrained upward motion and a solid 3px focus outline with 3px offset, including in forced-colors mode.
- **Secondary:** Soft blue fill, blue border, Capture Ink text. Use for GitHub, TestFlight, manual, and support actions.

### Chips

- **Style:** Existing badge and command chips use transparent or blue-tinted fills with soft borders and compact padding.
- **State:** Selected platform and install-method chips invert to Capture Blue with white text. Unselected states use readable slate text.

### Cards / Containers

- **Corner Style:** Gently rounded panels (`14px` to `16px`), with `20px` reserved for media frames.
- **Background:** White panels or soft blue grouped surfaces.
- **Shadow Strategy:** Resting containers use border and tone; hover can add Surface Large shadow.
- **Border:** Soft Blue Border by default; Control Border when stronger separation is needed.
- **Internal Padding:** Cards use `1.15rem` to `1.75rem`; section-level panels use `1.25rem`.

### Inputs / Fields

- **Style:** The site does not currently ship form fields. If adding any, match install tabs: light background, `12px` radius, Control Border, Capture Ink input text, and slate placeholders that meet contrast.
- **Focus:** Capture Blue border plus subtle glow. Never rely on color alone.
- **Error / Disabled:** Disabled controls may reduce opacity, but disabled text must remain legible and state must be conveyed structurally.

### Navigation

- **Style:** Sticky light header with a compact brand lockup, 32px icon, pill-shaped nav links, and slate text.
- **Hover:** Nav links shift to Capture Ink with a soft blue fill.
- **Mobile Treatment:** Navigation opens below 900px. Closed links must be hidden from keyboard navigation and the accessibility tree.

### Platform Install Tabs

Platform and install-method tabs are the signature interaction pattern. They should feel like native segmented controls: compact, immediate, keyboard-accessible, and visually decisive when selected.

### Product Media Frames

Hero video, gallery items, and Clips Manager imagery sit inside rounded, bordered frames with restrained glow. Product imagery is mandatory on this brand surface; do not replace it with decorative abstract panels.

### Store Badges

Official Microsoft Store and Mac App Store badges are the primary download affordance. They appear in the hero (visitor's detected platform first), inside each install panel, and in the final CTA. Never redraw or recolor them; keep them at 52–58px tall with a subtle lift on hover. Terminal installs (winget, Homebrew), TestFlight, and GitHub Releases are secondary options beside the badge, not competitors to it.

### Interactive Demo

The "Try Tiny Clips" section (`demo.js` / `demo.css`) is a simulated desktop, not a marketing illustration. It must mirror real product behavior: tray flyout on Windows, menu bar menu on Mac, Region/Screen/Window picker with R/S/W keys, countdown, editor with the real tool set, trimmer, and library. New app features that are user-visible should be reflected here. Keep it self-contained (no frameworks), keyboard-operable, and respectful of `prefers-reduced-motion`. The wrapper follows the light site; the native stage owns its app colors. Below 640px of available width, use a keyboard-focusable horizontal scroller at native size instead of shrinking touch targets.

### Comparison and Shortcut Tables

Tables use white surfaces with soft blue headers, hairline row borders, and keyboard-focusable scroll wrappers. Checks are small blue circles. These are proof surfaces: keep them factual and aligned with the app's README and changelog.

## 6. Do's and Don'ts

### Do:

- **Do** keep the site as lean as the product: every section needs concrete proof, a platform decision, or an install action.
- **Do** use Capture Blue for action, selected state, and product proof; keep it rare enough to matter.
- **Do** preserve real screenshots, videos, and app imagery as the main brand material.
- **Do** lead every download moment with the Microsoft Store (Windows) or Mac App Store (macOS); keep winget, Homebrew, TestFlight, and GitHub Releases one step behind with exact commands.
- **Do** maintain WCAG 2.2 AA contrast, keyboard-friendly tab controls, visible focus states, and reduced-motion alternatives.
- **Do** underline inline text links and keep secondary copy at least 4.5:1 against its surface. Reduced motion disables hero autoplay, including when the preference changes while the page is open; manual video controls remain available.

### Don't:

- **Don't** make Tiny Clips look like bloated enterprise SaaS marketing.
- **Don't** ship generic AI landing-page polish: fake metrics, decorative glass cards, repeated tiny uppercase section labels, or endless identical feature grids. The single gradient word in the hero is the brand icon's gradient, not a template effect; do not add more.
- **Don't** over-technicalize the brand. Command-line install paths are useful affordances, not the entire personality.
- **Don't** add side-stripe borders, arbitrary z-index values, or purely decorative glow.
- **Don't** introduce a second accent hue unless the product itself gains a real semantic need for it.

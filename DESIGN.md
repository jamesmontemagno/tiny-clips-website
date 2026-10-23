---
name: Tiny Clips Website
description: Static marketing website for Tiny Clips, a free, lightweight Windows and Mac screen capture app available on the Microsoft Store and Mac App Store.
colors:
  background: '#070a14'
  background-soft: '#0b1020'
  background-elevated: '#121a30'
  text: '#f6f8ff'
  text-secondary: '#a7b1cd'
  accent: '#4fb4ff'
  accent-2: '#7a6cf7'
  brand-gradient: 'linear-gradient(135deg, #3d8bff 0%, #6a4ff0 100%)'
  accent-glow: '#4fb4ff59'
  recording: '#ff4d5e'
  success: '#3ddc97'
  border: '#8ca6db26'
  border-hover: '#8ca6db4d'
  code-text: '#dce9ff'
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
    textColor: '{colors.background}'
    rounded: '{rounded.md}'
    padding: '0.85rem 1.75rem'
    typography: '{typography.body}'
  button-primary-large:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.background}'
    rounded: '{rounded.lg}'
    padding: '1.05rem 2.8rem'
    typography: '{typography.body}'
  button-secondary:
    backgroundColor: '#ffffff0d'
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
    backgroundColor: '#4fb4ff1a'
    textColor: '{colors.code-text}'
    rounded: '{rounded.sm}'
    padding: '0.5rem 0.65rem'
---

# Design System: Tiny Clips Website

## 1. Overview

**Creative North Star: "The Pocket Capture Studio"**

Tiny Clips should feel like a compact creative tool sitting one click away: blue-lit, quiet, and immediately useful. The interface is dark because the product lives around screen capture and media work; the site should feel comfortable beside a Mac menu bar, a Windows tray, a video timeline, or a screenshot editor without turning into a theatrical developer console.

The system uses a focused cool palette, product imagery, rounded native-feeling controls, and restrained glow to communicate speed and capability. It rejects bloated enterprise SaaS marketing: no vague productivity murals, no fake metrics, no endless decorative feature grids, and no design moves that make a sub-5 MB utility feel like a subscription platform.

**Key Characteristics:**

- Dark, blue-lit surfaces that make screenshots and video assets feel native.
- Compact controls with clear platform choices and copyable install commands.
- Ambient elevation: borders, tonal layers, and glow rather than heavy drop shadows.
- Direct product proof through real app imagery, demo video, and exact install paths.
- Creator-friendly clarity without developer-tool costume.

## 2. Colors

The palette is a restrained dark capture-studio palette: near-black blue surfaces, high-contrast cool white text, muted periwinkle support text, and one electric blue action color.

### Primary

- **Capture Blue**: The single action color for primary buttons, active platform tabs, focus accents, check marks, glows, and the rare highest-emphasis label. It should stay scarce enough that it means "act now" or "selected."

### Neutral

- **Studio Black**: The page background and primary ink-on-accent color. It carries the product's native dark-tool atmosphere.
- **Panel Navy**: The elevated section and control background used where a surface needs to separate from the page without becoming a card stack.
- **Glass Navy**: The translucent elevated material for cards, tabs, manager panels, and grouped content.
- **Capture White**: Primary text for headings, high-emphasis labels, and important list terms.
- **Muted Periwinkle**: Secondary copy, navigation, muted legal text, and descriptive card body text.
- **Cool Command Text**: Command-line text and technical detail copy that needs to feel trustworthy without becoming pure white.
- **Soft Periwinkle Border**: Default borders on cards, tabs, gallery frames, and command chips.
- **Active Periwinkle Border**: Hover, active, and selected borders.

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

Tiny Clips uses hybrid elevation: translucent tonal panels establish depth at rest, while shadows and glows appear primarily on interactive emphasis, media frames, and hover states. Borders are part of the elevation vocabulary; most components are separated by a soft periwinkle stroke before they are lifted by shadow.

### Shadow Vocabulary

- **Button Glow** (`0 4px 14px rgba(79, 180, 255, 0.4)`): Primary buttons and selected controls.
- **Button Hover Glow** (`0 8px 20px rgba(79, 180, 255, 0.4)`): Hovered primary buttons.
- **Surface Large** (`0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)`): Media frames, cards on hover, lightbox imagery, and prominent sections.
- **Media Halo** (`0 0 120px rgba(79, 180, 255, 0.1)`): Hero video frame only; use smaller variants for supporting product imagery.

### Named Rules

**The Lift On Intent Rule.** Flat tonal surfaces are the default. Strong shadow, scale, and glow should appear only for interaction, media emphasis, or selected state.

**The No Arbitrary Z Rule.** Keep layering semantic: sticky header, lightbox overlay, lightbox content. Replace arbitrary values like `999` with a named z-index scale when touching related CSS.

## 5. Components

### Buttons

- **Shape:** Rounded native rectangle (`12px`, `14px` for large hero CTA).
- **Primary:** Capture Blue background with Studio Black text. Default padding is `0.85rem 1.75rem`; hero CTA uses `1.05rem 2.8rem`.
- **Hover / Focus:** Slight upward motion and brighter blue glow. Add visible `:focus-visible` treatment whenever new button CSS is written.
- **Secondary:** Translucent white fill, soft periwinkle border, Capture White text. Use for GitHub, TestFlight, manual, and support actions.

### Chips

- **Style:** Existing badge and command chips use transparent or blue-tinted fills with soft borders and compact padding.
- **State:** Selected platform and install-method chips invert to Capture Blue with Studio Black text. Unselected states stay muted until hover.

### Cards / Containers

- **Corner Style:** Gently rounded panels (`14px` to `16px`), with `20px` reserved for media frames.
- **Background:** Glass Navy or dark translucent panels, not opaque white or gray.
- **Shadow Strategy:** Resting containers use border and tone; hover can add Surface Large shadow.
- **Border:** Soft Periwinkle Border by default; Active Periwinkle Border on hover or selected state.
- **Internal Padding:** Cards use `1.15rem` to `1.75rem`; section-level panels use `1.25rem`.

### Inputs / Fields

- **Style:** The site does not currently ship form fields. If adding any, match install tabs: dark translucent background, `12px` radius, soft border, Capture White input text, and Muted Periwinkle placeholders that still meet contrast.
- **Focus:** Capture Blue border plus subtle glow. Never rely on color alone.
- **Error / Disabled:** Disabled controls may reduce opacity, but disabled text must remain legible and state must be conveyed structurally.

### Navigation

- **Style:** Sticky glass header with a compact brand lockup, 32px icon, pill-shaped nav links, and muted default text.
- **Hover:** Nav links shift to Capture White with a low white fill and faint blue glow.
- **Mobile Treatment:** Existing nav wraps down under 900px. Preserve clear tap targets and avoid clipped dropdowns or overflow-hidden popovers.
- **Skip Link:** Keep the main-content destination focusable without applying the rounded control focus ring to the whole page. Links and controls retain their visible keyboard-focus indicators.

### Platform Install Tabs

Platform and install-method tabs are the signature interaction pattern. They should feel like native segmented controls: compact, immediate, keyboard-accessible, and visually decisive when selected.

### Product Media Frames

Hero video, gallery items, and Clips Manager imagery sit inside rounded, bordered frames with restrained glow. Product imagery is mandatory on this brand surface; do not replace it with decorative abstract panels.

### Store Badges

Official Microsoft Store and Mac App Store badges are the primary download affordance. They appear in the hero (visitor's detected platform first), inside each install panel, and in the final CTA. Never redraw or recolor them; keep them at 52–58px tall with a subtle lift on hover. Terminal installs (winget, Homebrew), TestFlight, and GitHub Releases are secondary options beside the badge, not competitors to it.

### Interactive Demo

The "Try Tiny Clips" section (`demo.js` / `demo.css`) is a simulated desktop, not a marketing illustration. It must mirror real product behavior: tray flyout on Windows, menu bar menu on Mac, Region/Screen/Window picker with R/S/W keys, countdown, editor with the real tool set, trimmer, and library. New app features that are user-visible should be reflected here. Keep it self-contained (no frameworks), keyboard-operable, and respectful of `prefers-reduced-motion`.

### Comparison and Shortcut Tables

Tables use a dark translucent wrap with hairline row borders and uppercase column headers. Checks are small blue circles. These are proof surfaces: keep them factual and aligned with the app's README and changelog.

## 6. Do's and Don'ts

### Do:

- **Do** keep the site as lean as the product: every section needs concrete proof, a platform decision, or an install action.
- **Do** use Capture Blue for action, selected state, and product proof; keep it rare enough to matter.
- **Do** preserve real screenshots, videos, and app imagery as the main brand material.
- **Do** lead every download moment with the Microsoft Store (Windows) or Mac App Store (macOS); keep winget, Homebrew, TestFlight, and GitHub Releases one step behind with exact commands.
- **Do** maintain WCAG 2.2 AA contrast, keyboard-friendly tab controls, visible focus states, and reduced-motion alternatives.

### Don't:

- **Don't** make Tiny Clips look like bloated enterprise SaaS marketing.
- **Don't** ship generic AI landing-page polish: fake metrics, decorative glass cards, repeated tiny uppercase section labels, or endless identical feature grids. The single gradient word in the hero is the brand icon's gradient, not a template effect; do not add more.
- **Don't** over-technicalize the brand. Command-line install paths are useful affordances, not the entire personality.
- **Don't** add side-stripe borders, arbitrary z-index values, or purely decorative glow.
- **Don't** introduce a second accent hue unless the product itself gains a real semantic need for it.

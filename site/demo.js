/* =========================================================================
   Tiny Clips interactive demo
   A faithful, self-contained simulation of the Tiny Clips capture loop:
   tray / menu bar → capture picker → region, window, screen, scroll, OCR →
   screenshot editor or recording → trimmer → Clips Library / Manager.
   Everything happens in the page; nothing is uploaded or stored.
   ========================================================================= */
(() => {
  'use strict';

  const root = document.getElementById('demo-app');
  if (!root) return;

  const STAGE_W = 1000;
  const STAGE_H = 625;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Tiny DOM helpers
     --------------------------------------------------------------------- */
  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'style' && typeof value === 'object') {
        for (const [prop, v] of Object.entries(value)) {
          if (prop.startsWith('--')) node.style.setProperty(prop, v);
          else node.style[prop] = v;
        }
      } else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else if (key === 'html') node.innerHTML = value;
      else if (value === true) node.setAttribute(key, '');
      else node.setAttribute(key, String(value));
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child instanceof Node ? child : document.createTextNode(String(child)));
    }
    return node;
  };

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}) => {
    const node = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined) continue;
      node.setAttribute(key, String(value));
    }
    return node;
  };

  const ICONS = {
    tinyclips:
      '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/><circle cx="12" cy="12" r="2.6"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.2"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3"/>',
    gif: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 12h2v3H7v-6h2.5M12 9v6M15 15V9h3M15 12h2.5"/>',
    text: '<path d="M4 7V5h16v2M12 5v14M9 19h6"/>',
    region:
      '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4"/>',
    screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    window: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
    scroll: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M12 8v8M9 13l3 3 3-3"/>',
    library:
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 3-2 6 4"/><circle cx="16" cy="9" r="1.5"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
    power: '<path d="M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0"/>',
    bug: '<path d="M8 9a4 4 0 0 1 8 0v5a4 4 0 0 1-8 0zM8 11H4M20 11h-4M8 15l-3 2M16 15l3 2M9 6 7 4M15 6l2-2"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    play: '<path d="M7 5v14l11-7z"/>',
    pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    restart: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    micOff: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M4 4l16 16"/>',
    speaker: '<path d="M4 10v4h3l4 3V7L7 10zM15 9a4 4 0 0 1 0 6M17.5 6.5a8 8 0 0 1 0 11"/>',
    webcam: '<circle cx="12" cy="10" r="6"/><circle cx="12" cy="10" r="2"/><path d="M8 21h8M12 16v5"/>',
    prompter: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 8h10M7 11h7M9 20h6"/>',
    pointer: '<path d="m5 4 14 7-6 2-3 6z"/>',
    undo: '<path d="M9 14 4 9l5-5M4 9h9a6 6 0 0 1 0 12h-3"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5h10"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    saveCopy: '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M12 12v6M9 15h6"/>',
    crop: '<path d="M7 3v14h14M3 7h14v14"/>',
    select: '<path d="m5 4 14 7-6 2-3 6z"/>',
    rect: '<rect x="4" y="5" width="16" height="14" rx="1.5"/>',
    ellipse: '<ellipse cx="12" cy="12" rx="8" ry="6"/>',
    arrow: '<path d="M5 19 19 5M11 5h8v8"/>',
    line: '<path d="M5 19 19 5"/>',
    pen: '<path d="m4 20 4-1L19.5 7.5a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/>',
    number: '<path d="M10 7h4M10 12h4M10 17h4M6 5v14M18 5v14"/>',
    redact:
      '<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M6.5 6.5C4 8.5 2.5 12 2.5 12s3.5 7 9.5 7c1.6 0 3-.4 4.3-1M9.9 5.1C10.6 5 11.3 5 12 5c6 0 9.5 7 9.5 7s-.8 1.6-2.3 3.2"/>',
    zoomIn: '<circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20 20l-4-4"/>',
    zoomOut: '<circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-4-4"/>',
    fit: '<path d="M4 9V5h4M16 5h4v4M20 15v4h-4M8 19H4v-4"/>',
    stepBack: '<path d="M18 5v14L8 12zM6 5v14"/>',
    stepFwd: '<path d="M6 5v14l10-7zM18 5v14"/>',
    frame: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="12" cy="12" r="3"/>',
    star: '<path d="m12 3 2.8 6 6.2.8-4.6 4.3 1.3 6.4L12 17.3 6.3 20.5l1.3-6.4L3 9.8 9.2 9z"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    wifi: '<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01"/>',
    battery: '<rect x="2" y="8" width="17" height="8" rx="2"/><path d="M21 11v2M5 11v2h10v-2z"/>',
    chevronUp: '<path d="m6 15 6-6 6 6"/>',
    sparkle:
      '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    apple:
      '<path d="M16.4 12.6c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-2.9-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.8 2.3 1.1 0 1.6-.7 2.9-.7 1.4 0 1.7.7 2.9.7s2-1.1 2.7-2.2c.9-1.2 1.2-2.4 1.2-2.5 0 0-2.3-.9-2.3-3.8ZM14.3 6c.6-.7 1-1.8.9-2.8-.9 0-2 .6-2.6 1.3-.6.6-1.1 1.7-.9 2.7 1 .1 2-.5 2.6-1.2Z"/>',
  };

  const icon = (name, cls = '') => {
    const svg = svgEl('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', class: cls });
    svg.innerHTML = ICONS[name] || '';
    return svg;
  };
  const powerToysIcon = (cls = '') => el('img', { class: cls, src: './assets/powertoys-icon.svg', alt: '' });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtTime = (seconds) => {
    const s = Math.max(0, seconds);
    return `${Math.floor(s / 60)}:${pad2(Math.floor(s % 60))}.${Math.floor((s % 1) * 10)}`;
  };
  const fileName = (ext, suffix = '') => {
    const d = new Date();
    return `TinyClips ${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} at ${pad2(d.getHours())}.${pad2(d.getMinutes())}.${pad2(d.getSeconds())}${suffix}.${ext}`;
  };

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  const detectPlatform = () => {
    const p = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || '').toLowerCase();
    return p.includes('mac') ? 'macos' : 'windows';
  };

  const state = {
    platform: detectPlatform(),
    theme: null, // resolved per platform when null
    mode: 'idle',
    settings: {
      countdown: 3,
      openEditor: true,
      openTrimmer: true,
      watermark: false,
      clicks: true,
      clipboard: true,
      reveal: false,
      webcam: false,
      keepAwake: true,
      launchAtLogin: true,
    },
    clips: [],
    clipSeq: 1,
    timers: new Set(),
    hovering: false,
  };

  const resolvedTheme = () => state.theme || (state.platform === 'macos' ? 'dark' : 'light');
  const isMac = () => state.platform === 'macos';
  const folderFor = (kind) => {
    const base = isMac() ? '~/' : '';
    const sep = isMac() ? '/' : '\\';
    return kind === 'screenshot'
      ? `${base}Pictures${sep}TinyClips`
      : `${base}${isMac() ? 'Movies' : 'Videos'}${sep}TinyClips`;
  };

  const later = (fn, ms) => {
    const id = window.setTimeout(() => {
      state.timers.delete(id);
      fn();
    }, ms);
    state.timers.add(id);
    return id;
  };
  const every = (fn, ms) => {
    const id = window.setInterval(fn, ms);
    state.timers.add(id);
    return id;
  };
  const cancelTimer = (id) => {
    window.clearTimeout(id);
    window.clearInterval(id);
    state.timers.delete(id);
  };
  const clearTimers = () => {
    state.timers.forEach((id) => {
      window.clearTimeout(id);
      window.clearInterval(id);
    });
    state.timers.clear();
  };

  /* ---------------------------------------------------------------------
     Shell: toolbar + stage
     --------------------------------------------------------------------- */
  const statusEl = el('p', { class: 'demo-status', role: 'status', 'aria-live': 'polite' });
  const libraryBtn = el(
    'button',
    { class: 'btn btn-secondary btn-sm', type: 'button', onclick: () => openLibrary() },
    'Library'
  );
  const resetBtn = el('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => resetDemo() }, 'Reset');

  const platformSeg = el(
    'div',
    { class: 'demo-seg', role: 'group', 'aria-label': 'Demo platform' },
    el(
      'button',
      {
        type: 'button',
        dataset: { platform: 'windows' },
        'aria-pressed': 'false',
        onclick: () => setPlatform('windows'),
      },
      'Windows'
    ),
    el(
      'button',
      { type: 'button', dataset: { platform: 'macos' }, 'aria-pressed': 'false', onclick: () => setPlatform('macos') },
      'macOS'
    )
  );

  const toolbar = el(
    'div',
    { class: 'demo-toolbar' },
    el('div', { class: 'demo-toolbar-group' }, platformSeg),
    statusEl,
    el('div', { class: 'demo-toolbar-group' }, libraryBtn, resetBtn)
  );

  const desktop = el('div', { class: 'demo-desktop' });
  const overlay = el('div', { class: 'demo-overlay' });
  const toasts = el('div', { class: 'demo-toasts', 'aria-live': 'polite' });
  overlay.append(toasts);
  const stage = el(
    'div',
    { class: 'demo-stage', tabindex: '0', 'aria-label': 'Simulated desktop running Tiny Clips' },
    desktop,
    overlay
  );
  const stageOuter = el(
    'div',
    {
      class: 'demo-stage-outer',
      role: 'region',
      'aria-label': 'Interactive desktop. Scroll horizontally on small screens.',
      tabindex: '0',
    },
    stage
  );

  root.append(toolbar, stageOuter);

  let stageScale = 1;
  const fitStage = () => {
    const width = stageOuter.clientWidth || STAGE_W;
    // Keep native controls readable and touch-sized on narrow screens.
    stageScale = width < 640 ? 1 : width / STAGE_W;
    stageOuter.style.overflowX = width < 640 ? 'auto' : 'hidden';
    stage.style.transform = `scale(${stageScale})`;
    const scrollbarHeight = stageOuter.offsetHeight - stageOuter.clientHeight;
    stageOuter.style.height = `${STAGE_H * stageScale + scrollbarHeight}px`;
  };
  fitStage();
  if ('ResizeObserver' in window) new ResizeObserver(fitStage).observe(stageOuter);
  else window.addEventListener('resize', fitStage);

  const stagePoint = (event) => {
    const rect = stage.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / stageScale, 0, STAGE_W),
      y: clamp((event.clientY - rect.top) / stageScale, 0, STAGE_H),
    };
  };

  stage.addEventListener('pointerenter', () => (state.hovering = true));
  stage.addEventListener('pointerleave', () => (state.hovering = false));

  const setStatus = (html) => {
    statusEl.innerHTML = html;
  };

  /* ---------------------------------------------------------------------
     Desktop scene
     --------------------------------------------------------------------- */
  const WINDOWS = {
    notes: { x: 40, y: 60, w: 380, h: 300, title: 'Launch checklist — Notes' },
    browser: { x: 450, y: 48, w: 500, h: 380, title: 'Tiny Tool Town' },
    terminal: { x: 70, y: 392, w: 430, h: 170, title: 'Terminal' },
  };

  const CARDS = [
    ['Tiny Clips', 'Screenshots, video, GIF — Windows & Mac', '4.9 ★'],
    ['Release notes', 'v1.7 adds OCR, scrolling capture, teleprompter', 'New'],
    ['Webcam overlay', 'Circle, rounded, or square in any corner', 'Tip'],
    ['Clips Library', 'Every capture, one window away', 'Guide'],
    ['Keyboard shortcuts', 'Ctrl+Shift+5 / 6 / 7 — rebind anything', 'Docs'],
    ['Export frames', '1:1, 4:3, 16:9, 9:16 with 3×3 alignment', 'Tip'],
    ['Teleprompter', 'Your script scrolls; the recording never sees it', 'New'],
    ['Uploadcare sharing', 'Bring your own account, share a link', 'Guide'],
  ];

  const clockText = () => {
    const d = new Date();
    const h = d.getHours();
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${pad2(d.getMinutes())} ${h < 12 ? 'AM' : 'PM'}`;
  };
  const dateText = () => {
    const d = new Date();
    return `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${d.getFullYear()}`;
  };

  const makeWindow = (key, bodyClass, ...body) => {
    const spec = WINDOWS[key];
    const title = isMac()
      ? el(
          'div',
          { class: 'demo-win-title' },
          el('div', { class: 'demo-lights' }, el('span'), el('span'), el('span')),
          el('span', { class: 'demo-win-name' }, spec.title),
          el('span', { style: { width: '44px' } })
        )
      : el(
          'div',
          { class: 'demo-win-title' },
          el('span', { class: 'demo-win-name', style: { textAlign: 'left' } }, spec.title),
          el('span', { class: 'demo-wincontrols' }, el('span', {}, '—'), el('span', {}, '▢'), el('span', {}, '✕'))
        );
    return el(
      'div',
      {
        class: `demo-win ${bodyClass}`,
        dataset: { win: key },
        style: { left: `${spec.x}px`, top: `${spec.y}px`, width: `${spec.w}px`, height: `${spec.h}px` },
      },
      title,
      ...body
    );
  };

  const buildDesktop = () => {
    desktop.innerHTML = '';
    desktop.dataset.platform = state.platform;
    desktop.dataset.theme = resolvedTheme();
    stage.dataset.platform = state.platform;
    stage.dataset.theme = resolvedTheme();

    const notes = makeWindow(
      'notes',
      'demo-notes',
      el(
        'div',
        { class: 'demo-win-body' },
        el('h4', {}, 'Launch checklist'),
        el('p', {}, 'Ship the v1.7 update and tell people about it.'),
        el(
          'ul',
          { class: 'demo-checklist' },
          el('li', { class: 'is-done' }, 'Publish to the Microsoft Store'),
          el('li', { class: 'is-done' }, 'Update the Mac App Store listing'),
          el('li', {}, 'Record a 60-second demo with webcam overlay'),
          el('li', {}, 'Screenshot the new editor and annotate it'),
          el('li', {}, 'Share the GIF in the release thread')
        )
      )
    );

    const cards = CARDS.map(([name, sub, stat]) =>
      el(
        'div',
        { class: 'demo-card' },
        el('div', { class: 'demo-card-icon' }),
        el('div', {}, el('strong', {}, name), el('span', {}, sub)),
        el('span', { class: 'demo-card-stat' }, stat)
      )
    );
    const browser = makeWindow(
      'browser',
      'demo-browser',
      el(
        'div',
        { class: 'demo-browser-bar' },
        el('span', { style: { color: 'var(--desk-text-2)' } }, '‹ ›'),
        el('div', { class: 'demo-urlbar' }, 'tinytooltown.com/apps')
      ),
      el(
        'div',
        { class: 'demo-browser-body' },
        el('div', { class: 'demo-progress' }),
        el('div', { class: 'demo-browser-content' }, ...cards)
      )
    );

    const terminal = makeWindow(
      'terminal',
      'demo-terminal',
      el(
        'div',
        { class: 'demo-win-body' },
        el(
          'div',
          {},
          el('span', { class: 'prompt' }, isMac() ? '% ' : 'PS> '),
          isMac() ? 'brew install --cask tiny-clips' : 'winget install Refractored.TinyClips'
        ),
        el(
          'div',
          { class: 'dim' },
          isMac() ? '==> Installing Cask tiny-clips' : 'Found Tiny Clips [Refractored.TinyClips] Version 1.7.4'
        ),
        el(
          'div',
          { class: 'dim' },
          isMac() ? '==> Moving App Tiny Clips.app to /Applications' : 'Successfully installed'
        ),
        el('div', {}, el('span', { class: 'prompt' }, isMac() ? '% ' : 'PS> '), el('span', { class: 'cursor' }))
      )
    );

    const pointer = el('div', { class: 'demo-pointer', style: { left: '620px', top: '300px' } });
    pointer.innerHTML =
      '<svg viewBox="0 0 16 20"><path d="M1 1l13 9.5-5.6.9 3.2 6.4-2.3 1.2-3.3-6.4L1 16.8z" fill="#fff" stroke="#111" stroke-width="1.2" stroke-linejoin="round"/></svg>';

    desktop.append(browser, notes, terminal, pointer);

    const trayBtn = el(
      'button',
      {
        class: 'demo-tray-btn',
        type: 'button',
        'aria-label': 'Tiny Clips',
        'aria-haspopup': 'menu',
        'aria-expanded': 'false',
        onclick: toggleTrayMenu,
      },
      icon('tinyclips')
    );
    if (state.clips.length === 0 && state.mode === 'idle') trayBtn.append(el('span', { class: 'demo-tray-pulse' }));

    if (isMac()) {
      const bar = el(
        'div',
        { class: 'demo-menubar' },
        el(
          'div',
          { class: 'demo-menubar-left' },
          icon('apple', 'demo-apple'),
          el('strong', {}, 'Notes'),
          el('span', {}, 'File'),
          el('span', {}, 'Edit'),
          el('span', {}, 'View'),
          el('span', {}, 'Window'),
          el('span', {}, 'Help')
        ),
        el(
          'div',
          { class: 'demo-menubar-right' },
          trayBtn,
          icon('wifi'),
          icon('battery'),
          el('span', { class: 'demo-clock' }, clockText())
        )
      );
      desktop.append(bar);
    } else {
      const startIcon = el('span', { style: { background: 'transparent' } });
      startIcon.innerHTML =
        '<svg viewBox="0 0 24 24"><path fill="#2b7cff" d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z"/></svg>';
      const searchIcon = el('span', {}, icon('search'));
      searchIcon.querySelector('svg').style.stroke = 'var(--desk-text)';
      searchIcon.querySelector('svg').style.fill = 'none';
      const powerToysBtn = el(
        'button',
        {
          class: 'demo-powertoys-btn',
          type: 'button',
          title: 'PowerToys',
          'aria-label': 'Open the PowerToys easter egg',
          onclick: openPowerToysEgg,
        },
        powerToysIcon()
      );
      const bar = el(
        'div',
        { class: 'demo-taskbar' },
        el('div', {}),
        el(
          'div',
          { class: 'demo-taskbar-center' },
          startIcon,
          searchIcon,
          el('span', {
            style: {
              background: 'linear-gradient(135deg,#3d8bff,#6a4ff0)',
              width: '22px',
              height: '22px',
              margin: '6px',
              borderRadius: '6px',
            },
          }),
          el('span', {
            style: {
              background: 'linear-gradient(135deg,#22c1c3,#3ddc97)',
              width: '22px',
              height: '22px',
              margin: '6px',
              borderRadius: '6px',
            },
          })
        ),
        el(
          'div',
          { class: 'demo-taskbar-right' },
          icon('chevronUp'),
          powerToysBtn,
          trayBtn,
          icon('wifi'),
          icon('speaker'),
          icon('battery'),
          el('div', { class: 'demo-taskbar-clock' }, el('div', {}, clockText()), el('div', {}, dateText()))
        )
      );
      desktop.append(bar);
    }
  };

  const windowRect = (key) => {
    const spec = WINDOWS[key];
    return { x: spec.x, y: spec.y, w: spec.w, h: spec.h };
  };

  /* ---------------------------------------------------------------------
     Overlay helpers
     --------------------------------------------------------------------- */
  let overlayNodes = [];
  const showOverlay = (node) => {
    node.classList.add('demo-panel-enter');
    overlay.append(node);
    overlayNodes.push(node);
    return node;
  };
  const clearOverlay = () => {
    overlayNodes.forEach((node) => node.remove());
    overlayNodes = [];
    desktop.querySelectorAll('.is-hover-target').forEach((n) => n.classList.remove('is-hover-target'));
  };

  let appWindow = null;
  const closeAppWindow = () => {
    if (appWindow) {
      appWindow.remove();
      appWindow = null;
    }
  };
  const showAppWindow = (node) => {
    closeAppWindow();
    appWindow = node;
    stage.append(node);
    const focusable = node.querySelector('button, input, select, [tabindex]');
    if (focusable) focusable.focus({ preventScroll: true });
    return node;
  };

  const toast = (title, detail, opts = {}) => {
    const node = el(
      'div',
      { class: 'demo-toast' },
      el('img', { src: './assets/app-icon-128.png', alt: '' }),
      el('div', {}, el('strong', {}, title), detail ? el('span', {}, detail) : null)
    );
    if (opts.action) {
      node.append(
        el(
          'button',
          {
            class: 'demo-btn',
            type: 'button',
            onclick: () => {
              opts.action.onClick();
              dismiss();
            },
          },
          opts.action.label
        )
      );
    }
    toasts.append(node);
    let dismissed = false;
    const dismiss = () => {
      if (dismissed) return;
      dismissed = true;
      node.classList.add('is-leaving');
      window.setTimeout(() => node.remove(), 220);
    };
    later(dismiss, opts.duration || 3800);
    return node;
  };

  const setTrayState = (recording) => {
    const btn = desktop.querySelector('.demo-tray-btn');
    if (!btn) return;
    btn.classList.toggle('is-recording', recording);
    btn.querySelector('.demo-tray-pulse')?.remove();
  };

  const setMode = (mode) => {
    state.mode = mode;
  };

  const cancelFlow = (message) => {
    clearTimers();
    clearOverlay();
    setTrayState(false);
    desktop.querySelector('.demo-tray-btn')?.setAttribute('aria-expanded', 'false');
    setMode('idle');
    if (message) setStatus(message);
    else idleStatus();
  };

  const idleStatus = () => {
    const where = isMac() ? 'menu bar (top right)' : 'system tray (bottom right)';
    const hotkey = isMac()
      ? '<kbd>⌃</kbd><kbd>⌥</kbd><kbd>⌘</kbd><kbd>5</kbd> in the real app, <kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>5</kbd> here'
      : '<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>5</kbd>';
    setStatus(
      `<strong>Ready.</strong> Click the Tiny Clips icon in the ${where}, or press ${hotkey} to take a screenshot.`
    );
  };

  function openPowerToysEgg() {
    if (state.mode !== 'idle') return;
    clearOverlay();
    toasts.replaceChildren();
    setMode('powertoys');

    const panel = el(
      'div',
      { class: 'demo-panel demo-powertoys-panel', role: 'dialog', 'aria-label': 'PowerToys' },
      el(
        'div',
        { class: 'demo-powertoys-head' },
        powerToysIcon(),
        el('strong', {}, 'PowerToys'),
        el('span', {}, 'Nice catch!')
      ),
      el('p', {}, 'Tiny Clips captures the moment. PowerToys keeps the rest of your Windows desk delightfully extra.'),
      el(
        'div',
        { class: 'demo-powertoys-actions' },
        el(
          'a',
          {
            class: 'demo-btn',
            href: 'https://learn.microsoft.com/windows/powertoys/',
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          'Explore PowerToys'
        ),
        el(
          'button',
          { class: 'demo-btn is-primary', type: 'button', onclick: () => cancelFlow() },
          'Back to Tiny Clips'
        )
      )
    );
    showOverlay(panel);
    panel.querySelector('button')?.focus({ preventScroll: true });
    setStatus(
      '<strong>PowerToys spotted.</strong> A little Windows utility appreciation, from one tray icon to another.'
    );
  }

  /* ---------------------------------------------------------------------
     Tray flyout (Windows) / menu-bar menu (macOS)
     --------------------------------------------------------------------- */
  function toggleTrayMenu() {
    const btn = desktop.querySelector('.demo-tray-btn');
    if (state.mode === 'menu') {
      cancelFlow();
      return;
    }
    if (state.mode === 'recording' || state.mode === 'paused') {
      stopRecording();
      return;
    }
    if (appWindow) {
      closeAppWindow();
      setMode('idle');
    }
    if (state.mode !== 'idle') return;
    clearOverlay();
    toasts.replaceChildren();
    setMode('menu');
    btn?.setAttribute('aria-expanded', 'true');
    btn?.querySelector('.demo-tray-pulse')?.remove();

    if (isMac()) {
      const item = (name, label, shortcut, onclick) =>
        el(
          'button',
          { class: 'demo-macmenu-item', type: 'button', role: 'menuitem', onclick },
          icon(name),
          el('span', { class: 'label' }, label),
          shortcut ? el('span', { class: 'shortcut' }, shortcut) : null
        );
      const menu = el(
        'div',
        { class: 'demo-panel demo-macmenu', role: 'menu', 'aria-label': 'Tiny Clips menu' },
        item('camera', 'Screenshot', '⌃⌥⌘5', () => openPicker('screenshot')),
        item('video', 'Record Video', '⌃⌥⌘6', () => openPicker('video')),
        item('gif', 'Record GIF', '⌃⌥⌘7', () => openPicker('gif')),
        item('text', 'Copy Text from Region', '', () => startSelection('ocr')),
        el('div', { class: 'demo-macmenu-sep' }),
        item('library', 'Clips Library…', '', () => {
          cancelFlow();
          openLibrary();
        }),
        item('folder', 'Open Capture Folder', '', () => {
          cancelFlow();
          toast('Opened in Finder', folderFor('screenshot'));
        }),
        el('div', { class: 'demo-macmenu-sep' }),
        item('settings', 'Settings…', '⌘,', () => {
          cancelFlow();
          openSettings();
        }),
        item('bug', 'File a Bug…', '', () => {
          cancelFlow();
          toast('File a Bug', 'Opens a pre-filled GitHub issue in the real app.');
        }),
        el('div', { class: 'demo-macmenu-sep' }),
        item('power', 'Quit Tiny Clips', '⌘Q', () => {
          cancelFlow();
          toast('Not today', 'Tiny Clips keeps running in the demo.');
        })
      );
      showOverlay(menu);
      menu.querySelector('button')?.focus({ preventScroll: true });
      setStatus(
        '<strong>Menu bar menu.</strong> Choose Screenshot, Record Video, Record GIF, or Copy Text from Region.'
      );
    } else {
      const tile = (name, label, onclick) =>
        el('button', { class: 'demo-tile', type: 'button', onclick }, icon(name), label);
      const ib = (name, label, onclick, square = false) =>
        el(
          'button',
          {
            class: `demo-iconbtn${square ? ' is-square' : ''}`,
            type: 'button',
            title: label,
            'aria-label': label,
            onclick,
          },
          icon(name),
          square ? null : label
        );
      const flyout = el(
        'div',
        { class: 'demo-panel demo-flyout', role: 'menu', 'aria-label': 'Tiny Clips' },
        el('div', { class: 'demo-flyout-title' }, 'Tiny Clips'),
        el(
          'div',
          { class: 'demo-tiles' },
          tile('camera', 'Screenshot', () => openPicker('screenshot')),
          tile('video', 'Video', () => openPicker('video')),
          tile('gif', 'GIF', () => openPicker('gif'))
        ),
        el(
          'div',
          { class: 'demo-flyout-row' },
          ib('library', 'Clips Library', () => {
            cancelFlow();
            openLibrary();
          }),
          ib('text', 'Capture Text', () => startSelection('ocr'), true),
          el('span', { class: 'spacer' }),
          ib(
            'settings',
            'Settings',
            () => {
              cancelFlow();
              openSettings();
            },
            true
          ),
          ib(
            'help',
            'Guide',
            () => {
              cancelFlow();
              toast('Guide', 'The in-app guide covers every capture flow and shortcut.');
            },
            true
          ),
          ib(
            'bug',
            'File a Bug',
            () => {
              cancelFlow();
              toast('File a Bug', 'Opens a pre-filled GitHub issue in the real app.');
            },
            true
          ),
          ib(
            'power',
            'Exit',
            () => {
              cancelFlow();
              toast('Not today', 'Tiny Clips keeps running in the demo.');
            },
            true
          )
        )
      );
      showOverlay(flyout);
      flyout.querySelector('button')?.focus({ preventScroll: true });
      setStatus(
        '<strong>Tray flyout.</strong> Pick Screenshot, Video, or GIF — or try Capture Text (OCR) and the Clips Library.'
      );
    }
  }

  /* ---------------------------------------------------------------------
     Capture picker: Region / Screen / Window (+ Scroll, Recognize Text)
     --------------------------------------------------------------------- */
  let pendingOptions = { countdown: 3, limit: 0 };

  function openPicker(kind) {
    clearOverlay();
    desktop.querySelector('.demo-tray-btn')?.setAttribute('aria-expanded', 'false');
    pendingOptions = { countdown: kind === 'screenshot' ? 0 : state.settings.countdown, limit: 0 };
    setMode('picker');

    const title = kind === 'screenshot' ? 'Screenshot' : kind === 'video' ? 'Record Video' : 'Record GIF';
    const target = (name, label, key, onclick) =>
      el(
        'button',
        { class: 'demo-target', type: 'button', dataset: { key }, onclick },
        icon(name),
        label,
        el('kbd', {}, key)
      );

    const targets = [
      target('region', 'Region', 'R', () => startSelection(kind)),
      target('screen', 'Screen', 'S', () => captureScreen(kind)),
      target('window', 'Window', 'W', () => startSelection(kind, 'window')),
    ];
    if (kind === 'screenshot') {
      targets.push(target('scroll', 'Scroll', 'P', () => startSelection('scroll')));
      targets.push(target('text', 'Text', 'T', () => startSelection('ocr')));
    }

    const countdownSel = el(
      'select',
      {
        class: 'demo-select',
        'aria-label': 'Countdown',
        onchange: (e) => (pendingOptions.countdown = Number(e.target.value)),
      },
      ...[0, 3, 5, 10].map((n) =>
        el('option', { value: n, selected: n === pendingOptions.countdown }, n === 0 ? 'Off' : `${n}s`)
      )
    );

    const options = el('div', { class: 'demo-picker-options' }, el('label', {}, 'Countdown', countdownSel));
    if (kind === 'video') {
      options.append(
        el(
          'label',
          {},
          'Time limit',
          el(
            'select',
            {
              class: 'demo-select',
              'aria-label': 'Time limit',
              onchange: (e) => (pendingOptions.limit = Number(e.target.value)),
            },
            el('option', { value: 0 }, 'Unlimited'),
            el('option', { value: 1 }, '1 min'),
            el('option', { value: 5 }, '5 min'),
            el('option', { value: 15 }, '15 min')
          )
        )
      );
    }
    options.append(
      el(
        'button',
        { class: 'demo-btn demo-picker-cancel', type: 'button', onclick: () => cancelFlow('Capture cancelled.') },
        'Cancel',
        el('kbd', { style: { marginLeft: '4px' } }, 'Esc')
      )
    );

    const picker = el(
      'div',
      { class: 'demo-panel demo-picker', role: 'dialog', 'aria-label': `${title} — choose what to capture` },
      el('div', { class: 'demo-picker-head' }, el('h4', {}, title), el('span', {}, 'What do you want to capture?')),
      el('div', { class: 'demo-picker-targets' }, ...targets),
      options
    );
    showOverlay(picker);
    picker.querySelector('.demo-target')?.focus({ preventScroll: true });
    setStatus(
      `<strong>${title}.</strong> Choose <kbd>R</kbd> Region, <kbd>S</kbd> Screen, or <kbd>W</kbd> Window${kind === 'screenshot' ? ' — or <kbd>P</kbd> Scroll and <kbd>T</kbd> Text' : ''}. Countdown is optional.`
    );
  }

  /* ---------------------------------------------------------------------
     Region / window selection
     --------------------------------------------------------------------- */
  let selection = null;

  function startSelection(kind, mode = 'region') {
    clearOverlay();
    desktop.querySelector('.demo-tray-btn')?.setAttribute('aria-expanded', 'false');
    if (kind === 'scroll' || kind === 'ocr') pendingOptions.countdown = 0;
    setMode('selecting');

    const layer = el('div', { class: `demo-select-layer${mode === 'window' ? ' is-window-mode' : ''}` });
    const dim = el('div', { class: 'demo-dim' });
    const region = el('div', { class: 'demo-region', hidden: true });
    layer.append(dim, region);

    const hint = el('div', { class: 'demo-panel demo-hintbar' });
    if (mode === 'window') {
      hint.append(el('span', {}, 'Click a window to capture it'), el('kbd', {}, 'Esc'), el('span', {}, 'cancel'));
    } else {
      const what = kind === 'ocr' ? 'the text you want to copy' : kind === 'scroll' ? 'the scrolling area' : 'a region';
      hint.append(el('span', {}, `Drag to select ${what}`), el('kbd', {}, 'Esc'), el('span', {}, 'cancel'));
    }
    showOverlay(layer);
    showOverlay(hint);

    if (mode === 'window') {
      setStatus('<strong>Window capture.</strong> Hover a window and click it.');
      const wins = Array.from(desktop.querySelectorAll('.demo-win'));
      layer.addEventListener('pointermove', (event) => {
        const p = stagePoint(event);
        let hit = null;
        for (const win of wins.slice().reverse()) {
          const r = windowRect(win.dataset.win);
          if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
            hit = win;
            break;
          }
        }
        wins.forEach((w) => w.classList.toggle('is-hover-target', w === hit));
        dim.style.opacity = hit ? '0' : '1';
        if (hit) {
          const r = windowRect(hit.dataset.win);
          region.hidden = false;
          Object.assign(region.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
          region.dataset.size = `${r.w} × ${r.h}`;
        } else region.hidden = true;
      });
      layer.addEventListener('click', (event) => {
        const p = stagePoint(event);
        for (const win of wins.slice().reverse()) {
          const r = windowRect(win.dataset.win);
          if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
            wins.forEach((w) => w.classList.remove('is-hover-target'));
            finishSelection(r, kind);
            return;
          }
        }
      });
      return;
    }

    setStatus(
      `<strong>Select a region.</strong> Drag anywhere on the desktop${kind === 'ocr' ? ' — try the Notes window text' : kind === 'scroll' ? ' — try the browser window' : ''}.`
    );
    let start = null;
    const update = (p) => {
      const x = Math.min(start.x, p.x),
        y = Math.min(start.y, p.y);
      const w = Math.abs(p.x - start.x),
        h = Math.abs(p.y - start.y);
      Object.assign(region.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
      region.dataset.size = `${Math.round(w)} × ${Math.round(h)}`;
      return { x, y, w, h };
    };
    layer.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      start = stagePoint(event);
      region.hidden = false;
      dim.style.opacity = '0';
      update(start);
      layer.setPointerCapture(event.pointerId);
    });
    layer.addEventListener('pointermove', (event) => {
      if (!start) return;
      update(stagePoint(event));
    });
    layer.addEventListener('pointerup', (event) => {
      if (!start) return;
      const rect = update(stagePoint(event));
      start = null;
      if (rect.w < 12 || rect.h < 12) {
        region.hidden = true;
        dim.style.opacity = '1';
        setStatus('<strong>Too small.</strong> Drag a larger region.');
        return;
      }
      finishSelection(rect, kind);
    });
  }

  function finishSelection(rect, kind) {
    selection = { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.w), h: Math.round(rect.h) };
    clearOverlay();
    if (kind === 'ocr') return runOcr(selection);
    if (kind === 'scroll') return runScrollCapture(selection);
    if (kind === 'screenshot') return runCountdown(() => takeScreenshot(selection));
    return showRecordingSetup(kind, selection);
  }

  function captureScreen(kind) {
    clearOverlay();
    const full = { x: 0, y: 0, w: STAGE_W, h: STAGE_H };
    if (kind === 'screenshot') return runCountdown(() => takeScreenshot(full));
    return showRecordingSetup(kind, full);
  }

  function runCountdown(done) {
    const n = pendingOptions.countdown;
    if (!n) return done();
    setMode('countdown');
    const region = selection && !(selection.w === STAGE_W) ? selection : null;
    if (region) {
      const outline = el('div', {
        class: 'demo-region is-recording',
        style: { left: `${region.x}px`, top: `${region.y}px`, width: `${region.w}px`, height: `${region.h}px` },
      });
      showOverlay(outline);
    }
    const cx = region ? region.x + region.w / 2 : STAGE_W / 2;
    const cy = region ? region.y + region.h / 2 : STAGE_H / 2;
    const badge = el(
      'div',
      { class: 'demo-countdown', style: { left: `${cx - 42}px`, top: `${cy - 42}px` }, 'aria-live': 'assertive' },
      el('span', {}, String(n))
    );
    showOverlay(badge);
    setStatus(`<strong>Countdown.</strong> Capture starts in ${n}… press <kbd>Esc</kbd> to cancel.`);
    let left = n;
    const tick = every(
      () => {
        left -= 1;
        if (left <= 0) {
          cancelTimer(tick);
          clearOverlay();
          done();
          return;
        }
        badge.replaceChildren(el('span', {}, String(left)));
        badge.classList.toggle('is-final', left === 1);
      },
      reduceMotion ? 400 : 1000
    );
  }

  /* ---------------------------------------------------------------------
     Snapshots: clone the desktop so the editor / trimmer / library can show it
     --------------------------------------------------------------------- */
  const snapshotOf = (rect, scale = 1) => {
    const clone = desktop.cloneNode(true);
    clone.querySelectorAll('.demo-pointer, .demo-tray-pulse').forEach((n) => n.remove());
    clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    clone.style.cssText = `position:absolute;left:${-rect.x}px;top:${-rect.y}px;width:${STAGE_W}px;height:${STAGE_H}px;`;
    const wrap = el(
      'div',
      { class: 'demo-snapshot', style: { width: `${rect.w}px`, height: `${rect.h}px`, transform: `scale(${scale})` } },
      clone
    );
    return wrap;
  };

  /* ---------------------------------------------------------------------
     Screenshot → editor
     --------------------------------------------------------------------- */
  function takeScreenshot(rect) {
    setMode('processing');
    const flash = el('div', {
      style: {
        position: 'absolute',
        inset: 0,
        background: '#fff',
        opacity: '0.85',
        transition: 'opacity 260ms ease-out',
        pointerEvents: 'none',
      },
    });
    showOverlay(flash);
    requestAnimationFrame(() => (flash.style.opacity = '0'));
    later(() => {
      clearOverlay();
      const clip = addClip('screenshot', rect, { name: fileName('png') });
      if (state.settings.openEditor) openEditor(clip);
      else {
        setMode('idle');
        savedToast(clip);
        idleStatus();
      }
    }, 300);
  }

  function addClip(type, rect, extra = {}) {
    const clip = {
      id: state.clipSeq++,
      type,
      rect: { ...rect },
      created: new Date(),
      tags: [],
      fav: false,
      duration: 0,
      ...extra,
    };
    state.clips.unshift(clip);
    libraryBtn.textContent = `Library (${state.clips.length})`;
    return clip;
  }

  const savedToast = (clip, extra) => {
    const where = clip.type === 'screenshot' ? folderFor('screenshot') : folderFor('video');
    toast(
      `${clip.type === 'screenshot' ? 'Screenshot' : clip.type === 'video' ? 'Video' : 'GIF'} saved`,
      `${where} · ${extra || (state.settings.clipboard ? 'copied to clipboard' : clip.name)}`,
      {
        action: { label: 'Open', onClick: () => openLibrary(clip.id) },
      }
    );
  };

  const EDITOR_COLORS = ['#ff3b30', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#bf5af2', '#ffffff', '#111111'];
  const BACKGROUNDS = [
    ['None', 'transparent'],
    ['Ocean', 'linear-gradient(135deg,#3d8bff,#6a4ff0)'],
    ['Sunset', 'linear-gradient(135deg,#ff8a5b,#ff3d77)'],
    ['Mint', 'linear-gradient(135deg,#22c1c3,#3ddc97)'],
    ['Graphite', 'linear-gradient(135deg,#2b2f3a,#5a6170)'],
    ['Cream', '#f4efe6'],
  ];
  const FRAMES = [
    ['Original', 0],
    ['1:1', 1],
    ['4:3', 4 / 3],
    ['16:9', 16 / 9],
    ['3:4', 3 / 4],
    ['9:16', 9 / 16],
  ];

  function openEditor(clip) {
    setMode('editor');
    const ed = {
      tool: 'arrow',
      color: '#ff3b30',
      stroke: 4,
      fill: false,
      redactStyle: 'blur',
      bg: BACKGROUNDS[1][1],
      padding: 28,
      radius: 12,
      shadow: true,
      frame: 0,
      align: 4,
      zoom: 1,
      annos: clip.annos ? clip.annos.map((a) => ({ ...a })) : [],
      redactions: clip.redactions ? clip.redactions.map((r) => ({ ...r })) : [],
      selected: null,
      counter: 1,
      crop: null,
      dirty: false,
    };
    if (clip.editorState)
      Object.assign(ed, clip.editorState, { annos: ed.annos, redactions: ed.redactions, selected: null, crop: null });

    const rect = clip.rect;

    /* --- canvas --- */
    const cardExport = el('div', { class: 'demo-card-export' });
    const snapshot = snapshotOf(rect);
    const redactLayer = el('div', { class: 'demo-redactions' });
    const annoLayer = svgEl('svg', {
      class: 'demo-anno-layer',
      viewBox: `0 0 ${rect.w} ${rect.h}`,
      width: rect.w,
      height: rect.h,
    });
    const watermark = el('div', { class: 'demo-watermark' }, 'Captured on Tiny Clips');
    cardExport.append(snapshot, redactLayer, annoLayer, watermark);
    const frameBg = el('div', { class: 'demo-frame-bg' });
    const frame = el('div', { class: 'demo-frame' }, frameBg, cardExport);
    const canvasWrap = el('div', { class: 'demo-canvas-wrap' }, frame);

    const status = el('div', { class: 'demo-editor-status' });

    const layoutFrame = () => {
      const pad = ed.bg === 'transparent' ? 0 : ed.padding;
      let fw = rect.w + pad * 2,
        fh = rect.h + pad * 2;
      if (ed.frame) {
        if (fw / fh > ed.frame) fh = fw / ed.frame;
        else fw = fh * ed.frame;
      }
      fw = Math.round(fw);
      fh = Math.round(fh);
      const col = ed.align % 3,
        row = Math.floor(ed.align / 3);
      const freeX = fw - rect.w - pad * 2,
        freeY = fh - rect.h - pad * 2;
      const ox = Math.round(pad + (freeX * col) / 2),
        oy = Math.round(pad + (freeY * row) / 2);
      frame.style.width = `${fw}px`;
      frame.style.height = `${fh}px`;
      frame.style.transform = `scale(${ed.zoom})`;
      frame.style.margin = `${Math.max(0, (fh * ed.zoom - fh) / 2)}px ${Math.max(0, (fw * ed.zoom - fw) / 2)}px`;
      frameBg.style.background = ed.bg;
      Object.assign(cardExport.style, {
        position: 'absolute',
        left: `${ox}px`,
        top: `${oy}px`,
        width: `${rect.w}px`,
        height: `${rect.h}px`,
        borderRadius: `${ed.bg === 'transparent' ? 0 : ed.radius}px`,
      });
      cardExport.classList.toggle('has-shadow', ed.shadow && ed.bg !== 'transparent');
      watermark.hidden = !state.settings.watermark;
      status.replaceChildren(
        el('span', {}, `${rect.w} × ${rect.h} px · export ${fw} × ${fh}`),
        el(
          'span',
          {},
          `${Math.round(ed.zoom * 100)}% · ${ed.annos.length} annotation${ed.annos.length === 1 ? '' : 's'}`
        )
      );
    };

    const fitZoom = () => {
      const availW = canvasWrap.clientWidth - 40,
        availH = canvasWrap.clientHeight - 40;
      const fw = parseFloat(frame.style.width) || rect.w,
        fh = parseFloat(frame.style.height) || rect.h;
      ed.zoom = clamp(Math.min(availW / fw, availH / fh, 1), 0.25, 4);
      layoutFrame();
    };

    /* --- annotations --- */
    const renderRedactions = () => {
      redactLayer.replaceChildren(
        ...ed.redactions.map((r) =>
          el('div', {
            class: 'demo-redact',
            dataset: { style: r.style },
            style: { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` },
          })
        )
      );
    };

    const renderAnnos = () => {
      annoLayer.replaceChildren();
      const defs = svgEl('defs');
      annoLayer.append(defs);
      ed.annos.forEach((a, i) => {
        const g = svgEl('g', { class: `anno${ed.selected === i ? ' is-selected' : ''}`, 'data-index': i });
        const common = {
          stroke: a.color,
          'stroke-width': a.stroke,
          fill: 'none',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
        };
        if (a.kind === 'rect') {
          g.append(
            svgEl('rect', {
              x: Math.min(a.x1, a.x2),
              y: Math.min(a.y1, a.y2),
              width: Math.abs(a.x2 - a.x1),
              height: Math.abs(a.y2 - a.y1),
              rx: 3,
              ...common,
              fill: a.fill ? a.color + '33' : 'none',
            })
          );
        } else if (a.kind === 'ellipse') {
          g.append(
            svgEl('ellipse', {
              cx: (a.x1 + a.x2) / 2,
              cy: (a.y1 + a.y2) / 2,
              rx: Math.abs(a.x2 - a.x1) / 2,
              ry: Math.abs(a.y2 - a.y1) / 2,
              ...common,
              fill: a.fill ? a.color + '33' : 'none',
            })
          );
        } else if (a.kind === 'line' || a.kind === 'arrow') {
          const markerId = `arrow-${clip.id}-${i}`;
          if (a.kind === 'arrow') {
            const marker = svgEl('marker', {
              id: markerId,
              viewBox: '0 0 10 10',
              refX: 8,
              refY: 5,
              markerWidth: 4,
              markerHeight: 4,
              orient: 'auto-start-reverse',
            });
            marker.append(svgEl('path', { d: 'M0 0 L10 5 L0 10 z', fill: a.color }));
            defs.append(marker);
          }
          let d = `M${a.x1} ${a.y1} L${a.x2} ${a.y2}`;
          if (a.kind === 'arrow' && a.curved) {
            const mx = (a.x1 + a.x2) / 2,
              my = (a.y1 + a.y2) / 2;
            const dx = a.x2 - a.x1,
              dy = a.y2 - a.y1;
            d = `M${a.x1} ${a.y1} Q${mx - dy * 0.25} ${my + dx * 0.25} ${a.x2} ${a.y2}`;
          }
          g.append(svgEl('path', { d, class: 'anno-hit' }));
          g.append(svgEl('path', { d, ...common, 'marker-end': a.kind === 'arrow' ? `url(#${markerId})` : null }));
        } else if (a.kind === 'pen') {
          const d = a.points.map((p, k) => `${k ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
          g.append(svgEl('path', { d, class: 'anno-hit' }));
          g.append(svgEl('path', { d, ...common }));
        } else if (a.kind === 'number') {
          const r = 10 + a.stroke * 1.5;
          g.append(svgEl('circle', { cx: a.x1, cy: a.y1, r, fill: a.color, stroke: '#fff', 'stroke-width': 2 }));
          const t = svgEl('text', {
            x: a.x1,
            y: a.y1,
            'text-anchor': 'middle',
            'dominant-baseline': 'central',
            fill: '#fff',
            'font-size': r * 1.1,
            'font-weight': 700,
            'font-family': 'Inter, sans-serif',
          });
          t.textContent = a.n;
          g.append(t);
        } else if (a.kind === 'text') {
          const t = svgEl('text', {
            x: a.x1,
            y: a.y1,
            fill: a.color,
            'font-size': 14 + a.stroke * 2,
            class: 'demo-anno-text',
            'dominant-baseline': 'hanging',
          });
          t.textContent = a.text;
          g.append(t);
        }
        annoLayer.append(g);
      });
      annoLayer.classList.toggle('is-drawing', ed.tool !== 'select' && ed.tool !== 'crop');
      annoLayer.classList.toggle('is-select', ed.tool === 'select');
    };

    const commit = () => {
      ed.dirty = true;
      clip.annos = ed.annos;
      clip.redactions = ed.redactions;
      renderAnnos();
      renderRedactions();
      layoutFrame();
    };

    const layerPoint = (event) => {
      const r = annoLayer.getBoundingClientRect();
      return {
        x: clamp(((event.clientX - r.left) / r.width) * rect.w, 0, rect.w),
        y: clamp(((event.clientY - r.top) / r.height) * rect.h, 0, rect.h),
      };
    };

    let draft = null;
    let textInput = null;
    const cropBox = el('div', { class: 'demo-crop-box', hidden: true });
    cardExport.append(cropBox);

    annoLayer.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      if (textInput) return;
      const p = layerPoint(event);
      const tool = ed.tool;

      if (tool === 'select') {
        const hit = event.target.closest('.anno');
        ed.selected = hit ? Number(hit.dataset.index) : null;
        if (ed.selected !== null) {
          const a = ed.annos[ed.selected];
          draft = { move: true, start: p, orig: JSON.parse(JSON.stringify(a)) };
          annoLayer.setPointerCapture(event.pointerId);
        }
        renderAnnos();
        return;
      }
      if (tool === 'text') {
        placeText(p);
        return;
      }
      if (tool === 'number') {
        ed.annos.push({ kind: 'number', x1: p.x, y1: p.y, color: ed.color, stroke: ed.stroke, n: ed.counter++ });
        commit();
        return;
      }
      annoLayer.setPointerCapture(event.pointerId);
      if (tool === 'pen') {
        draft = { kind: 'pen', points: [p], color: ed.color, stroke: ed.stroke };
        ed.annos.push(draft);
      } else if (tool === 'redact') {
        draft = { redact: true, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
      } else if (tool === 'crop') {
        draft = { crop: true, x1: p.x, y1: p.y, x2: p.x, y2: p.y };
        cropBox.hidden = false;
      } else {
        draft = {
          kind: tool,
          x1: p.x,
          y1: p.y,
          x2: p.x,
          y2: p.y,
          color: ed.color,
          stroke: ed.stroke,
          fill: ed.fill,
          curved: ed.curved,
        };
        ed.annos.push(draft);
      }
      renderAnnos();
    });

    annoLayer.addEventListener('pointermove', (event) => {
      if (!draft) return;
      const p = layerPoint(event);
      if (draft.move) {
        const a = ed.annos[ed.selected];
        const dx = p.x - draft.start.x,
          dy = p.y - draft.start.y;
        const o = draft.orig;
        if (a.points) a.points = o.points.map((q) => ({ x: q.x + dx, y: q.y + dy }));
        else {
          a.x1 = o.x1 + dx;
          a.y1 = o.y1 + dy;
          if (o.x2 !== undefined) {
            a.x2 = o.x2 + dx;
            a.y2 = o.y2 + dy;
          }
        }
        renderAnnos();
        return;
      }
      if (draft.kind === 'pen') {
        draft.points.push(p);
      } else {
        draft.x2 = p.x;
        draft.y2 = p.y;
        if (event.shiftKey && (draft.kind === 'rect' || draft.kind === 'ellipse')) {
          const s = Math.max(Math.abs(draft.x2 - draft.x1), Math.abs(draft.y2 - draft.y1));
          draft.x2 = draft.x1 + Math.sign(draft.x2 - draft.x1 || 1) * s;
          draft.y2 = draft.y1 + Math.sign(draft.y2 - draft.y1 || 1) * s;
        }
      }
      if (draft.redact) {
        redactLayer.replaceChildren(
          ...ed.redactions.map((r) =>
            el('div', {
              class: 'demo-redact',
              dataset: { style: r.style },
              style: { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` },
            })
          ),
          el('div', {
            class: 'demo-redact',
            dataset: { style: ed.redactStyle },
            style: {
              left: `${Math.min(draft.x1, draft.x2)}px`,
              top: `${Math.min(draft.y1, draft.y2)}px`,
              width: `${Math.abs(draft.x2 - draft.x1)}px`,
              height: `${Math.abs(draft.y2 - draft.y1)}px`,
            },
          })
        );
        return;
      }
      if (draft.crop) {
        Object.assign(cropBox.style, {
          left: `${Math.min(draft.x1, draft.x2)}px`,
          top: `${Math.min(draft.y1, draft.y2)}px`,
          width: `${Math.abs(draft.x2 - draft.x1)}px`,
          height: `${Math.abs(draft.y2 - draft.y1)}px`,
        });
        return;
      }
      renderAnnos();
    });

    const endDraft = () => {
      if (!draft) return;
      const d = draft;
      draft = null;
      if (d.move) {
        commit();
        return;
      }
      if (d.redact) {
        const w = Math.abs(d.x2 - d.x1),
          h = Math.abs(d.y2 - d.y1);
        if (w > 4 && h > 4)
          ed.redactions.push({ x: Math.min(d.x1, d.x2), y: Math.min(d.y1, d.y2), w, h, style: ed.redactStyle });
        commit();
        return;
      }
      if (d.crop) {
        const w = Math.abs(d.x2 - d.x1),
          h = Math.abs(d.y2 - d.y1);
        cropBox.hidden = true;
        if (w > 20 && h > 20) ed.crop = { x: Math.min(d.x1, d.x2), y: Math.min(d.y1, d.y2), w, h };
        else ed.crop = null;
        toolbarCrop.hidden = !ed.crop;
        return;
      }
      if (d.kind !== 'pen' && d.x2 !== undefined && Math.abs(d.x2 - d.x1) < 3 && Math.abs(d.y2 - d.y1) < 3) {
        ed.annos.pop();
      }
      if (d.kind === 'pen' && d.points.length < 2) ed.annos.pop();
      commit();
    };
    annoLayer.addEventListener('pointerup', endDraft);
    annoLayer.addEventListener('pointercancel', endDraft);

    const placeText = (p) => {
      textInput = el('input', {
        class: 'demo-text-input',
        type: 'text',
        placeholder: 'Type, then Enter',
        style: { left: `${p.x}px`, top: `${p.y}px`, color: ed.color },
      });
      cardExport.append(textInput);
      textInput.focus();
      const finish = (save) => {
        if (!textInput) return;
        const value = textInput.value.trim();
        textInput.remove();
        textInput = null;
        if (save && value)
          ed.annos.push({ kind: 'text', x1: p.x, y1: p.y, text: value, color: ed.color, stroke: ed.stroke });
        commit();
      };
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
        e.stopPropagation();
      });
      textInput.addEventListener('blur', () => finish(true));
    };

    const applyCrop = () => {
      if (!ed.crop) return;
      const c = ed.crop;
      // Flatten: new clip rect, shift annotations into the new origin.
      clip.rect = { x: rect.x + c.x, y: rect.y + c.y, w: Math.round(c.w), h: Math.round(c.h) };
      clip.annos = ed.annos.map((a) => {
        const b = { ...a };
        if (b.points) b.points = b.points.map((q) => ({ x: q.x - c.x, y: q.y - c.y }));
        else {
          b.x1 -= c.x;
          b.y1 -= c.y;
          if (b.x2 !== undefined) {
            b.x2 -= c.x;
            b.y2 -= c.y;
          }
        }
        return b;
      });
      clip.redactions = ed.redactions.map((r) => ({ ...r, x: r.x - c.x, y: r.y - c.y }));
      clip.editorState = {
        bg: ed.bg,
        padding: ed.padding,
        radius: ed.radius,
        shadow: ed.shadow,
        frame: ed.frame,
        align: ed.align,
        tool: 'select',
        color: ed.color,
        stroke: ed.stroke,
      };
      openEditor(clip);
      toast('Cropped', `${clip.rect.w} × ${clip.rect.h} px`);
    };

    /* --- tool rail --- */
    const tools = [
      ['select', 'Select / move', 'select'],
      ['crop', 'Crop', 'crop'],
      ['rect', 'Rectangle', 'rect'],
      ['ellipse', 'Ellipse', 'ellipse'],
      ['arrow', 'Arrow', 'arrow'],
      ['line', 'Line', 'line'],
      ['pen', 'Freehand', 'pen'],
      ['text', 'Text', 'text'],
      ['number', 'Number badge', 'number'],
      ['redact', 'Redact', 'redact'],
    ];
    const toolRail = el('div', {
      class: 'demo-tools',
      role: 'toolbar',
      'aria-label': 'Tools',
      'aria-orientation': 'vertical',
    });
    const toolButtons = tools.map(([id, label, ic]) =>
      el(
        'button',
        {
          class: 'demo-tool',
          type: 'button',
          title: label,
          'aria-label': label,
          'aria-pressed': String(ed.tool === id),
          onclick: () => setTool(id),
        },
        icon(ic)
      )
    );
    toolRail.append(...toolButtons);
    const setTool = (id) => {
      ed.tool = id;
      ed.selected = null;
      cropBox.hidden = true;
      ed.crop = null;
      toolbarCrop.hidden = true;
      toolButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(tools[i][0] === id)));
      renderInspector();
      renderAnnos();
      const hints = {
        select: 'Click an annotation to select it, then drag to move. Delete removes it.',
        crop: 'Drag a crop rectangle, then press Apply crop. Annotations are flattened, like the real app.',
        rect: 'Drag to draw. Hold Shift for a square.',
        ellipse: 'Drag to draw. Hold Shift for a circle.',
        arrow: 'Drag from tail to head. Toggle curved arrows in the inspector.',
        line: 'Drag to draw a straight line.',
        pen: 'Draw freehand.',
        text: 'Click to place text, type, press Enter.',
        number: 'Click to drop numbered badges — 1, 2, 3…',
        redact: 'Drag over anything private. Choose blur, pixelate, or solid.',
      };
      setStatus(`<strong>Editor · ${tools.find((t) => t[0] === id)[1]}.</strong> ${hints[id]}`);
    };

    /* --- inspector --- */
    const inspector = el('div', { class: 'demo-inspector' });
    let bgOpen = true;
    const renderInspector = () => {
      inspector.replaceChildren();
      const toolLabel = tools.find((t) => t[0] === ed.tool)[1];
      inspector.append(el('h5', {}, toolLabel));

      if (ed.tool === 'redact') {
        inspector.append(
          el(
            'div',
            { class: 'demo-field' },
            el('span', {}, 'Style'),
            el(
              'div',
              { class: 'demo-chips' },
              ...['blur', 'pixelate', 'solid'].map((s) =>
                el(
                  'button',
                  {
                    class: 'demo-chip',
                    type: 'button',
                    'aria-pressed': String(ed.redactStyle === s),
                    onclick: () => {
                      ed.redactStyle = s;
                      renderInspector();
                    },
                  },
                  s[0].toUpperCase() + s.slice(1)
                )
              )
            )
          )
        );
      } else if (ed.tool === 'crop') {
        inspector.append(el('p', { class: 'hint' }, 'Drag on the image to choose the crop area.'));
      } else if (ed.tool !== 'select') {
        inspector.append(
          el(
            'div',
            { class: 'demo-field' },
            el('span', {}, 'Color'),
            el(
              'div',
              { class: 'demo-swatches' },
              ...EDITOR_COLORS.map((c) =>
                el('button', {
                  class: 'demo-swatch',
                  type: 'button',
                  'aria-label': c,
                  'aria-pressed': String(ed.color === c),
                  style: { '--swatch': c },
                  onclick: () => {
                    ed.color = c;
                    renderInspector();
                  },
                })
              )
            )
          ),
          el(
            'label',
            { class: 'demo-field' },
            el('span', {}, el('span', {}, ed.tool === 'text' ? 'Size' : 'Stroke'), el('span', {}, `${ed.stroke}`)),
            el('input', {
              type: 'range',
              min: 1,
              max: 14,
              value: ed.stroke,
              oninput: (e) => {
                ed.stroke = Number(e.target.value);
                e.target.parentElement.querySelector('span span:last-child').textContent = ed.stroke;
              },
            })
          )
        );
        if (ed.tool === 'rect' || ed.tool === 'ellipse') {
          inspector.append(
            el(
              'div',
              { class: 'demo-field' },
              el('span', {}, 'Fill'),
              el(
                'div',
                { class: 'demo-chips' },
                el(
                  'button',
                  {
                    class: 'demo-chip',
                    type: 'button',
                    'aria-pressed': String(!ed.fill),
                    onclick: () => {
                      ed.fill = false;
                      renderInspector();
                    },
                  },
                  'None'
                ),
                el(
                  'button',
                  {
                    class: 'demo-chip',
                    type: 'button',
                    'aria-pressed': String(ed.fill),
                    onclick: () => {
                      ed.fill = true;
                      renderInspector();
                    },
                  },
                  'Tinted'
                )
              )
            )
          );
        }
        if (ed.tool === 'arrow') {
          inspector.append(
            el(
              'div',
              { class: 'demo-field' },
              el('span', {}, 'Arrow'),
              el(
                'div',
                { class: 'demo-chips' },
                el(
                  'button',
                  {
                    class: 'demo-chip',
                    type: 'button',
                    'aria-pressed': String(!ed.curved),
                    onclick: () => {
                      ed.curved = false;
                      renderInspector();
                    },
                  },
                  'Straight'
                ),
                el(
                  'button',
                  {
                    class: 'demo-chip',
                    type: 'button',
                    'aria-pressed': String(!!ed.curved),
                    onclick: () => {
                      ed.curved = true;
                      renderInspector();
                    },
                  },
                  'Curved'
                )
              )
            )
          );
        }
      } else {
        inspector.append(
          el(
            'p',
            { class: 'hint' },
            ed.selected === null
              ? 'Nothing selected. Click an annotation on the image.'
              : 'Drag to move. Press Delete to remove.'
          )
        );
        if (ed.selected !== null)
          inspector.append(
            el(
              'button',
              {
                class: 'demo-btn',
                type: 'button',
                onclick: () => {
                  ed.annos.splice(ed.selected, 1);
                  ed.selected = null;
                  commit();
                  renderInspector();
                },
              },
              icon('trash'),
              'Delete'
            )
          );
      }

      const bgToggle = el(
        'button',
        {
          class: 'demo-section-toggle',
          type: 'button',
          'aria-expanded': String(bgOpen),
          onclick: () => {
            bgOpen = !bgOpen;
            renderInspector();
          },
        },
        'Background & export',
        el('span', {}, bgOpen ? '▾' : '▸')
      );
      inspector.append(bgToggle);
      if (bgOpen) {
        inspector.append(
          el(
            'div',
            { class: 'demo-field' },
            el('span', {}, 'Background'),
            el(
              'div',
              { class: 'demo-swatches' },
              ...BACKGROUNDS.map(([name, css]) =>
                el('button', {
                  class: 'demo-swatch',
                  type: 'button',
                  title: name,
                  'aria-label': name,
                  'aria-pressed': String(ed.bg === css),
                  style: {
                    '--swatch':
                      css === 'transparent' ? 'repeating-conic-gradient(#ccc 0 25%, #fff 0 50%) 0 0 / 8px 8px' : css,
                  },
                  onclick: () => {
                    ed.bg = css;
                    layoutFrame();
                    renderInspector();
                  },
                })
              )
            )
          ),
          el(
            'label',
            { class: 'demo-field' },
            el('span', {}, el('span', {}, 'Padding'), el('span', {}, `${ed.padding}`)),
            el('input', {
              type: 'range',
              min: 0,
              max: 80,
              value: ed.padding,
              oninput: (e) => {
                ed.padding = Number(e.target.value);
                e.target.parentElement.querySelector('span span:last-child').textContent = ed.padding;
                layoutFrame();
              },
            })
          ),
          el(
            'label',
            { class: 'demo-field' },
            el('span', {}, el('span', {}, 'Image corners'), el('span', {}, `${ed.radius}`)),
            el('input', {
              type: 'range',
              min: 0,
              max: 32,
              value: ed.radius,
              oninput: (e) => {
                ed.radius = Number(e.target.value);
                e.target.parentElement.querySelector('span span:last-child').textContent = ed.radius;
                layoutFrame();
              },
            })
          ),
          el(
            'div',
            { class: 'demo-field' },
            el('span', {}, 'Shadow'),
            el(
              'div',
              { class: 'demo-chips' },
              el(
                'button',
                {
                  class: 'demo-chip',
                  type: 'button',
                  'aria-pressed': String(ed.shadow),
                  onclick: () => {
                    ed.shadow = true;
                    layoutFrame();
                    renderInspector();
                  },
                },
                'On'
              ),
              el(
                'button',
                {
                  class: 'demo-chip',
                  type: 'button',
                  'aria-pressed': String(!ed.shadow),
                  onclick: () => {
                    ed.shadow = false;
                    layoutFrame();
                    renderInspector();
                  },
                },
                'Off'
              )
            )
          ),
          el(
            'div',
            { class: 'demo-field' },
            el('span', {}, 'Export frame'),
            el(
              'div',
              { class: 'demo-chips' },
              ...FRAMES.map(([name, ratio]) =>
                el(
                  'button',
                  {
                    class: 'demo-chip',
                    type: 'button',
                    'aria-pressed': String(ed.frame === ratio),
                    onclick: () => {
                      ed.frame = ratio;
                      layoutFrame();
                      renderInspector();
                    },
                  },
                  name
                )
              )
            )
          ),
          el(
            'div',
            { class: 'demo-field' },
            el('span', {}, 'Alignment'),
            el(
              'div',
              { class: 'demo-align-grid', role: 'group', 'aria-label': 'Image alignment' },
              ...Array.from({ length: 9 }, (_, i) =>
                el('button', {
                  type: 'button',
                  'aria-label': `Align ${['top', 'middle', 'bottom'][Math.floor(i / 3)]} ${['left', 'center', 'right'][i % 3]}`,
                  'aria-pressed': String(ed.align === i),
                  onclick: () => {
                    ed.align = i;
                    layoutFrame();
                    renderInspector();
                  },
                })
              )
            )
          )
        );
      }
    };

    /* --- top toolbar --- */
    const zoom = (factor) => {
      ed.zoom = clamp(factor ? ed.zoom * factor : 1, 0.25, 4);
      layoutFrame();
    };
    const undo = () => {
      if (ed.annos.length) {
        ed.annos.pop();
        ed.selected = null;
        commit();
      } else if (ed.redactions.length) {
        ed.redactions.pop();
        commit();
      }
    };
    const toolbarCrop = el(
      'button',
      { class: 'demo-btn is-primary', type: 'button', hidden: true, onclick: applyCrop },
      icon('crop'),
      'Apply crop'
    );

    const finishEdit = (how) => {
      clip.annos = ed.annos;
      clip.redactions = ed.redactions;
      clip.editorState = {
        bg: ed.bg,
        padding: ed.padding,
        radius: ed.radius,
        shadow: ed.shadow,
        frame: ed.frame,
        align: ed.align,
      };
      closeAppWindow();
      setMode('idle');
      if (how === 'copy')
        toast(
          'Copied to clipboard',
          `${rect.w} × ${rect.h} PNG with ${ed.annos.length} annotation${ed.annos.length === 1 ? '' : 's'}`
        );
      else if (how === 'saveas') {
        const copy = addClip('screenshot', clip.rect, {
          name: fileName('png', ' (edited)'),
          annos: clip.annos,
          redactions: clip.redactions,
          editorState: clip.editorState,
        });
        savedToast(copy, copy.name);
      } else if (how === 'save')
        savedToast(clip, state.settings.clipboard ? 'saved and copied to clipboard' : clip.name);
      idleStatus();
    };

    const topbar = el(
      'div',
      { class: 'demo-editor-toolbar' },
      el(
        'button',
        { class: 'demo-btn is-icon', type: 'button', title: 'Undo (Ctrl+Z)', 'aria-label': 'Undo', onclick: undo },
        icon('undo')
      ),
      toolbarCrop,
      el('span', { class: 'grow' }),
      el(
        'button',
        {
          class: 'demo-btn is-icon',
          type: 'button',
          title: 'Zoom out',
          'aria-label': 'Zoom out',
          onclick: () => zoom(1 / 1.25),
        },
        icon('zoomOut')
      ),
      el(
        'button',
        {
          class: 'demo-btn is-icon',
          type: 'button',
          title: 'Zoom in',
          'aria-label': 'Zoom in',
          onclick: () => zoom(1.25),
        },
        icon('zoomIn')
      ),
      el(
        'button',
        {
          class: 'demo-btn is-icon',
          type: 'button',
          title: 'Fit to window',
          'aria-label': 'Fit to window',
          onclick: fitZoom,
        },
        icon('fit')
      ),
      el('span', { class: 'grow' }),
      el('button', { class: 'demo-btn', type: 'button', onclick: () => finishEdit('copy') }, icon('copy'), 'Copy'),
      el(
        'button',
        { class: 'demo-btn', type: 'button', onclick: () => finishEdit('saveas') },
        icon('saveCopy'),
        'Save as'
      ),
      el(
        'button',
        { class: 'demo-btn is-primary', type: 'button', onclick: () => finishEdit('save') },
        icon('save'),
        'Save'
      )
    );

    const win = el(
      'div',
      { class: 'demo-appwin demo-editor', role: 'dialog', 'aria-label': 'Tiny Clips screenshot editor' },
      el(
        'div',
        { class: 'demo-appwin-title' },
        el('img', { src: './assets/app-icon-128.png', alt: '', width: 16, height: 16, style: { borderRadius: '4px' } }),
        el('span', {}, 'Screenshot Editor'),
        el('span', { class: 'meta' }, clip.name),
        el('span', { class: 'grow' }),
        el(
          'button',
          {
            class: 'demo-appwin-close',
            type: 'button',
            'aria-label': 'Close editor',
            onclick: () => {
              closeAppWindow();
              setMode('idle');
              savedToast(clip, clip.name);
              idleStatus();
            },
          },
          '✕'
        )
      ),
      topbar,
      el('div', { class: 'demo-editor-body' }, toolRail, inspector, canvasWrap),
      status
    );

    win.addEventListener('keydown', (event) => {
      if (textInput) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '=') {
        event.preventDefault();
        zoom(1.25);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        zoom(1 / 1.25);
      }
      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        zoom(0);
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && ed.selected !== null) {
        ed.annos.splice(ed.selected, 1);
        ed.selected = null;
        commit();
        renderInspector();
      }
      const map = {
        v: 'select',
        c: 'crop',
        r: 'rect',
        e: 'ellipse',
        a: 'arrow',
        l: 'line',
        p: 'pen',
        t: 'text',
        n: 'number',
        x: 'redact',
      };
      if (!event.ctrlKey && !event.metaKey && map[event.key.toLowerCase()]) setTool(map[event.key.toLowerCase()]);
    });

    showAppWindow(win);
    renderRedactions();
    renderAnnos();
    layoutFrame();
    requestAnimationFrame(fitZoom);
    renderInspector();
    setTool(ed.tool);
  }

  /* ---------------------------------------------------------------------
     Recording setup → countdown → recording indicator → trimmer
     --------------------------------------------------------------------- */
  const rec = {
    kind: 'video',
    region: null,
    options: {},
    elapsed: 0,
    paused: false,
    tick: null,
    pointerTick: null,
    limitTimer: null,
  };

  function showRecordingSetup(kind, region) {
    setMode('setup');
    rec.kind = kind;
    rec.region = region;
    rec.options = {
      mic: kind === 'video',
      system: false,
      webcam: state.settings.webcam && kind === 'video',
      clicks: state.settings.clicks,
      prompter: false,
      shape: 'circle',
      corner: 'br',
      fps: kind === 'gif' ? 10 : 30,
    };

    const outline = el('div', {
      class: 'demo-region is-recording',
      style: { left: `${region.x}px`, top: `${region.y}px`, width: `${region.w}px`, height: `${region.h}px` },
    });
    showOverlay(outline);

    const toggle = (key, name, label, sub) => {
      const btn = el(
        'button',
        {
          class: 'demo-toggle',
          type: 'button',
          'aria-pressed': String(!!rec.options[key]),
          onclick: () => {
            rec.options[key] = !rec.options[key];
            if (key === 'webcam' && rec.options.webcam) rec.options.mic = true;
            render();
          },
        },
        el('span', { class: 'demo-switch', 'aria-hidden': 'true' }),
        icon(name),
        label,
        sub ? el('span', { class: 'sub' }, sub) : null
      );
      return btn;
    };

    const panel = el('div', {
      class: 'demo-panel demo-setup',
      role: 'dialog',
      'aria-label': `${kind === 'video' ? 'Video' : 'GIF'} recording setup`,
    });
    const render = () => {
      panel.replaceChildren(
        el(
          'div',
          { class: 'demo-setup-head' },
          kind === 'video' ? 'Record video' : 'Record GIF',
          el('span', {}, `${region.w} × ${region.h}`)
        ),
        el(
          'div',
          { class: 'demo-setup-grid' },
          kind === 'video' ? toggle('mic', 'mic', 'Microphone', 'Built-in') : null,
          kind === 'video' ? toggle('system', 'speaker', 'System audio') : null,
          kind === 'video'
            ? toggle(
                'webcam',
                'webcam',
                'Webcam overlay',
                rec.options.webcam ? `${rec.options.shape} · ${rec.options.corner.toUpperCase()}` : ''
              )
            : null,
          kind === 'video' ? toggle('prompter', 'prompter', 'Teleprompter') : null,
          toggle('clicks', 'pointer', 'Mouse-click highlights')
        ),
        el(
          'div',
          { class: 'demo-setup-row' },
          kind === 'video' && rec.options.webcam
            ? el(
                'select',
                {
                  class: 'demo-select',
                  'aria-label': 'Webcam shape',
                  onchange: (e) => {
                    rec.options.shape = e.target.value;
                    render();
                  },
                },
                ...['circle', 'rounded', 'square'].map((s) =>
                  el('option', { value: s, selected: rec.options.shape === s }, s[0].toUpperCase() + s.slice(1))
                )
              )
            : null,
          kind === 'video' && rec.options.webcam
            ? el(
                'select',
                {
                  class: 'demo-select',
                  'aria-label': 'Webcam corner',
                  onchange: (e) => {
                    rec.options.corner = e.target.value;
                    render();
                  },
                },
                ...[
                  ['tl', 'Top left'],
                  ['tr', 'Top right'],
                  ['bl', 'Bottom left'],
                  ['br', 'Bottom right'],
                ].map(([v, l]) => el('option', { value: v, selected: rec.options.corner === v }, l))
              )
            : null,
          el(
            'select',
            {
              class: 'demo-select',
              'aria-label': 'Frame rate',
              onchange: (e) => (rec.options.fps = Number(e.target.value)),
            },
            ...(kind === 'gif' ? [5, 10, 15, 20, 30] : [24, 30, 60]).map((f) =>
              el('option', { value: f, selected: rec.options.fps === f }, `${f} fps`)
            )
          ),
          el('span', { class: 'spacer' }),
          el(
            'button',
            { class: 'demo-btn', type: 'button', onclick: () => cancelFlow('Recording cancelled.') },
            'Cancel'
          ),
          el(
            'button',
            {
              class: 'demo-btn is-rec',
              type: 'button',
              onclick: () => {
                clearOverlay();
                runCountdown(startRecording);
              },
            },
            icon('video'),
            'Record'
          )
        )
      );
    };
    render();
    showOverlay(panel);
    panel.querySelector('.demo-btn.is-rec')?.focus({ preventScroll: true });
    setStatus(
      `<strong>Recording setup.</strong> Toggle mic, system audio${kind === 'video' ? ', webcam overlay, teleprompter' : ''}, and click highlights, then press Record.`
    );
  }

  let recOverlayRefs = {};
  function startRecording() {
    setMode('recording');
    setTrayState(true);
    rec.elapsed = 0;
    rec.paused = false;
    const r = rec.region;
    const full = r.w === STAGE_W;

    const outline = el('div', {
      class: `demo-region is-recording`,
      style: { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` },
    });
    if (full) outline.style.borderWidth = '6px';
    showOverlay(outline);

    const time = el('span', { class: 'demo-rec-time' }, '0:00.0');
    const micBtn =
      rec.kind === 'video'
        ? el(
            'button',
            {
              class: 'demo-btn is-icon',
              type: 'button',
              'aria-label': 'Mute microphone',
              'aria-pressed': String(!rec.options.mic),
              title: 'Mute mic',
              onclick: () => {
                rec.options.mic = !rec.options.mic;
                micBtn.setAttribute('aria-pressed', String(!rec.options.mic));
                micBtn.replaceChildren(icon(rec.options.mic ? 'mic' : 'micOff'));
              },
            },
            icon(rec.options.mic ? 'mic' : 'micOff')
          )
        : null;
    const pauseBtn = el(
      'button',
      { class: 'demo-btn is-icon', type: 'button', 'aria-label': 'Pause', title: 'Pause', onclick: togglePause },
      icon('pause')
    );
    const bar = el(
      'div',
      { class: 'demo-panel demo-recbar', role: 'toolbar', 'aria-label': 'Recording controls' },
      el('span', { class: 'demo-rec-dot', 'aria-hidden': 'true' }),
      time,
      el(
        'span',
        { class: 'demo-rec-label' },
        rec.kind === 'video' ? `MP4 · ${rec.options.fps} fps` : `GIF · ${rec.options.fps} fps`
      ),
      micBtn,
      pauseBtn,
      el(
        'button',
        {
          class: 'demo-btn is-icon',
          type: 'button',
          'aria-label': 'Restart',
          title: 'Restart',
          onclick: () => {
            rec.elapsed = 0;
            toast('Restarted', 'Recording restarted from 0:00.');
          },
        },
        icon('restart')
      ),
      el(
        'button',
        {
          class: 'demo-btn is-icon is-danger',
          type: 'button',
          'aria-label': 'Discard',
          title: 'Discard',
          onclick: () => {
            cancelFlow('Recording discarded.');
            toast('Discarded', 'Nothing was saved.');
          },
        },
        icon('trash')
      ),
      el('button', { class: 'demo-btn is-rec', type: 'button', onclick: stopRecording }, icon('stop'), 'Stop')
    );
    const barTop = r.y > 60 ? r.y - 48 : Math.min(STAGE_H - 100, r.y + r.h + 10);
    Object.assign(bar.style, {
      left: `${clamp(r.x + r.w / 2 - 230, 8, STAGE_W - 470)}px`,
      top: `${full ? 14 : barTop}px`,
    });
    showOverlay(bar);
    recOverlayRefs = { bar, outline, time };

    if (rec.options.webcam) {
      const size = clamp(Math.round(Math.min(r.w, r.h) * 0.28), 60, 160);
      const pos = {
        tl: [r.x + 12, r.y + 12],
        tr: [r.x + r.w - size - 12, r.y + 12],
        bl: [r.x + 12, r.y + r.h - size - 12],
        br: [r.x + r.w - size - 12, r.y + r.h - size - 12],
      }[rec.options.corner];
      const cam = el('div', {
        class: 'demo-webcam',
        dataset: { shape: rec.options.shape },
        style: { left: `${pos[0]}px`, top: `${pos[1]}px`, width: `${size}px`, height: `${size}px` },
      });
      cam.innerHTML =
        '<svg viewBox="0 0 100 100"><circle cx="50" cy="38" r="18" fill="#f1c7a8"/><path d="M18 100c2-24 16-36 32-36s30 12 32 36z" fill="#4fb4ff"/><path d="M32 36c0-14 8-22 18-22s18 8 18 22c-4-6-10-9-18-9s-14 3-18 9z" fill="#3a2a22"/></svg>';
      showOverlay(cam);
      recOverlayRefs.cam = cam;
    }
    if (rec.options.prompter) {
      const tp = el(
        'div',
        { class: 'demo-teleprompter', 'aria-hidden': 'true' },
        el(
          'div',
          { class: 'demo-teleprompter-text' },
          'Hi everyone — today I want to show you Tiny Clips. It lives in your tray, captures a region, a window, or the whole screen, and gives you a real editor and trimmer the moment you stop. This panel is the teleprompter: it scrolls my script at a speed I choose, I can drag it anywhere, and it never shows up in the recording.'
        )
      );
      showOverlay(tp);
      recOverlayRefs.prompter = tp;
    }

    rec.tick = every(() => {
      if (rec.paused) return;
      rec.elapsed += 0.1;
      time.textContent = fmtTime(rec.elapsed);
    }, 100);

    // Animate a fake pointer with click highlights inside the region.
    const pointer = desktop.querySelector('.demo-pointer');
    const movePointer = () => {
      if (rec.paused || !pointer) return;
      const x = r.x + 30 + Math.random() * Math.max(10, r.w - 60),
        y = r.y + 30 + Math.random() * Math.max(10, r.h - 60);
      pointer.style.left = `${x}px`;
      pointer.style.top = `${y}px`;
      if (rec.options.clicks && Math.random() > 0.35) {
        later(
          () => {
            const ripple = el('div', { class: 'demo-click-ripple', style: { left: `${x + 2}px`, top: `${y + 2}px` } });
            desktop.append(ripple);
            later(() => ripple.remove(), 650);
          },
          reduceMotion ? 50 : 900
        );
      }
    };
    movePointer();
    rec.pointerTick = every(movePointer, 1600);

    if (pendingOptions.limit)
      rec.limitTimer = later(
        () => {
          toast('Time limit reached', 'Recording stopped automatically.');
          stopRecording();
        },
        pendingOptions.limit * 60 * 1000
      );

    const stopKey = isMac() ? '<kbd>⌘</kbd><kbd>.</kbd>' : '<kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>S</kbd>';
    setStatus(
      `<strong>Recording${rec.options.webcam ? ' with webcam overlay' : ''}.</strong> Pause, restart, discard, or mute mid-recording. Press Stop or ${stopKey}${rec.options.prompter ? ' — the teleprompter is never captured' : ''}.`
    );
  }

  function togglePause() {
    if (state.mode !== 'recording' && state.mode !== 'paused') return;
    rec.paused = !rec.paused;
    setMode(rec.paused ? 'paused' : 'recording');
    recOverlayRefs.bar?.classList.toggle('is-paused', rec.paused);
    recOverlayRefs.outline?.classList.toggle('is-paused', rec.paused);
    recOverlayRefs.prompter?.classList.toggle('is-paused', rec.paused);
    const btn = recOverlayRefs.bar?.querySelector('[aria-label="Pause"], [aria-label="Resume"]');
    if (btn) {
      btn.setAttribute('aria-label', rec.paused ? 'Resume' : 'Pause');
      btn.title = rec.paused ? 'Resume' : 'Pause';
      btn.replaceChildren(icon(rec.paused ? 'play' : 'pause'));
    }
    setStatus(
      rec.paused
        ? '<strong>Paused.</strong> Audio and video stay in sync when you resume.'
        : '<strong>Recording.</strong> Resumed.'
    );
  }

  function stopRecording() {
    if (state.mode !== 'recording' && state.mode !== 'paused') return;
    cancelTimer(rec.tick);
    cancelTimer(rec.pointerTick);
    if (rec.limitTimer) cancelTimer(rec.limitTimer);
    const duration = Math.max(1.2, rec.elapsed);
    clearOverlay();
    setTrayState(false);
    setMode('processing');
    showOverlay(
      el(
        'div',
        { class: 'demo-panel demo-processing' },
        el('span', { class: 'demo-spinner', 'aria-hidden': 'true' }),
        `Finalizing ${rec.kind === 'video' ? 'MP4' : 'GIF'}…`
      )
    );
    setStatus('<strong>Processing.</strong> Encoding, muxing audio, compositing overlays…');
    later(
      () => {
        clearOverlay();
        const clip = addClip(rec.kind, rec.region, {
          name: fileName(rec.kind === 'video' ? 'mp4' : 'gif'),
          duration,
          fps: rec.options.fps,
          audio: rec.kind === 'video' && (rec.options.mic || rec.options.system),
          webcam: rec.options.webcam,
        });
        if (state.settings.openTrimmer) openTrimmer(clip);
        else {
          setMode('idle');
          savedToast(clip, clip.name);
          idleStatus();
        }
      },
      reduceMotion ? 300 : 1100
    );
  }

  function openTrimmer(clip) {
    setMode('trimmer');
    const total = clip.duration;
    const t = { start: 0, end: total, head: 0, playing: false, speed: 1, removeAudio: false, timer: null };
    const previewRect = clip.rect;
    const previewScale = Math.min(600 / previewRect.w, 280 / previewRect.h, 1);

    const snapshot = snapshotOf(previewRect, previewScale);
    snapshot.style.width = `${previewRect.w * previewScale}px`;
    snapshot.style.height = `${previewRect.h * previewScale}px`;
    snapshot.style.transform = 'none';
    snapshot.firstChild.style.transform = `scale(${previewScale})`;
    snapshot.firstChild.style.transformOrigin = 'top left';
    snapshot.firstChild.style.left = `${-previewRect.x * previewScale}px`;
    snapshot.firstChild.style.top = `${-previewRect.y * previewScale}px`;

    const overlayTime = el('div', { class: 'demo-trimmer-overlay' }, fmtTime(0));
    const preview = el('div', { class: 'demo-trimmer-preview' }, snapshot, overlayTime);

    const rangeEl = el('div', { class: 'demo-trim-range' });
    const playhead = el('div', { class: 'demo-trim-playhead' });
    const startIn = el('input', { type: 'range', min: 0, max: 1000, value: 0, 'aria-label': 'Trim start' });
    const endIn = el('input', { type: 'range', min: 0, max: 1000, value: 1000, 'aria-label': 'Trim end' });
    const trimbar = el('div', { class: 'demo-trimbar' }, rangeEl, playhead, startIn, endIn);

    const times = el('div', { class: 'demo-trim-times' });
    const update = () => {
      const pct = (v) => `${(v / total) * 100}%`;
      rangeEl.style.left = pct(t.start);
      rangeEl.style.width = pct(t.end - t.start);
      playhead.style.left = pct(t.head);
      overlayTime.textContent = fmtTime(t.head);
      times.replaceChildren(
        el('span', {}, `In ${fmtTime(t.start)}`),
        el('strong', {}, `${fmtTime(t.end - t.start)} selected`),
        el('span', {}, `Out ${fmtTime(t.end)}`)
      );
    };
    startIn.addEventListener('input', () => {
      t.start = Math.min((Number(startIn.value) / 1000) * total, t.end - 0.2);
      t.head = t.start;
      update();
    });
    endIn.addEventListener('input', () => {
      t.end = Math.max((Number(endIn.value) / 1000) * total, t.start + 0.2);
      t.head = t.end;
      update();
    });

    const playBtn = el(
      'button',
      { class: 'demo-btn is-icon', type: 'button', 'aria-label': 'Play', onclick: () => togglePlay() },
      icon('play')
    );
    const togglePlay = () => {
      t.playing = !t.playing;
      playBtn.replaceChildren(icon(t.playing ? 'pause' : 'play'));
      playBtn.setAttribute('aria-label', t.playing ? 'Pause' : 'Play');
      if (t.playing) {
        if (t.head >= t.end - 0.05) t.head = t.start;
        t.timer = every(() => {
          t.head += 0.1 * t.speed;
          if (t.head >= t.end) {
            t.head = t.start;
          }
          update();
        }, 100);
      } else cancelTimer(t.timer);
    };
    const step = (dir) => {
      t.head = clamp(t.head + dir / (clip.fps || 30), t.start, t.end);
      update();
    };

    const finish = (how) => {
      cancelTimer(t.timer);
      closeAppWindow();
      setMode('idle');
      if (how === 'frame') {
        const f = addClip('screenshot', clip.rect, { name: fileName('png', ' (frame)') });
        toast('Frame exported', f.name);
        setMode('idle');
        idleStatus();
        return;
      }
      if (how === 'trim') {
        clip.duration = t.end - t.start;
        clip.trimmed = true;
        clip.speed = t.speed;
        if (t.removeAudio) clip.audio = false;
        savedToast(clip, `${fmtTime(clip.duration)} · ${t.speed}× ${clip.audio ? 'with audio' : 'no audio'}`);
      } else savedToast(clip, `${fmtTime(total)} · saved without trimming`);
      idleStatus();
    };

    const win = el(
      'div',
      {
        class: 'demo-appwin demo-trimmer',
        role: 'dialog',
        'aria-label': `${clip.type === 'video' ? 'Video' : 'GIF'} trimmer`,
      },
      el(
        'div',
        { class: 'demo-appwin-title' },
        el('img', { src: './assets/app-icon-128.png', alt: '', width: 16, height: 16, style: { borderRadius: '4px' } }),
        el('span', {}, clip.type === 'video' ? 'Video Trimmer' : 'GIF Trimmer'),
        el(
          'span',
          { class: 'meta' },
          `${clip.rect.w} × ${clip.rect.h} · ${clip.fps} fps${clip.webcam ? ' · webcam' : ''}${clip.audio ? ' · audio' : ''}`
        ),
        el('span', { class: 'grow' }),
        el(
          'button',
          { class: 'demo-appwin-close', type: 'button', 'aria-label': 'Close', onclick: () => finish('none') },
          '✕'
        )
      ),
      preview,
      el(
        'div',
        { class: 'demo-trimmer-body' },
        times,
        trimbar,
        el(
          'div',
          { class: 'demo-trimmer-controls' },
          el(
            'button',
            { class: 'demo-btn is-icon', type: 'button', 'aria-label': 'Previous frame', onclick: () => step(-1) },
            icon('stepBack')
          ),
          playBtn,
          el(
            'button',
            { class: 'demo-btn is-icon', type: 'button', 'aria-label': 'Next frame', onclick: () => step(1) },
            icon('stepFwd')
          ),
          el(
            'label',
            {},
            'Speed',
            el(
              'select',
              { class: 'demo-select', onchange: (e) => (t.speed = Number(e.target.value)) },
              ...[0.5, 0.75, 1, 1.25, 1.5, 2, 3].map((s) => el('option', { value: s, selected: s === 1 }, `${s}×`))
            )
          ),
          el('span', { class: 'grow' }),
          clip.type === 'video'
            ? el(
                'label',
                {},
                el('input', { type: 'checkbox', onchange: (e) => (t.removeAudio = e.target.checked) }),
                'Remove audio'
              )
            : null,
          el(
            'button',
            { class: 'demo-btn', type: 'button', onclick: () => finish('frame') },
            icon('frame'),
            'Export frame'
          )
        )
      ),
      el(
        'div',
        { class: 'demo-trimmer-footer' },
        el('span', { style: { color: 'var(--desk-text-2)', fontSize: '11px' } }, folderFor('video')),
        el('span', { class: 'grow' }),
        el('button', { class: 'demo-btn', type: 'button', onclick: () => finish('none') }, 'Save without trimming'),
        el('button', { class: 'demo-btn is-primary', type: 'button', onclick: () => finish('trim') }, 'Save trimmed')
      )
    );
    win.addEventListener('keydown', (e) => {
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        e.preventDefault();
        togglePlay();
      }
      if (e.key === 'ArrowLeft' && e.target.tagName !== 'INPUT') step(-1);
      if (e.key === 'ArrowRight' && e.target.tagName !== 'INPUT') step(1);
    });
    showAppWindow(win);
    update();
    setStatus(
      '<strong>Trimmer.</strong> Drag the in/out handles, step frames, change speed, or export a single frame as PNG. Then save.'
    );
  }

  /* ---------------------------------------------------------------------
     OCR and scrolling capture
     --------------------------------------------------------------------- */
  function runOcr(region) {
    setMode('processing');
    showOverlay(
      el(
        'div',
        { class: 'demo-panel demo-processing' },
        el('span', { class: 'demo-spinner', 'aria-hidden': 'true' }),
        'Recognizing text…'
      )
    );
    later(
      () => {
        clearOverlay();
        // Collect visible text from desktop nodes that intersect the region.
        const found = [];
        desktop.querySelectorAll('h4, p, li, strong, span, div.dim, .demo-urlbar').forEach((node) => {
          if (node.closest('.demo-taskbar, .demo-menubar, .demo-pointer')) return;
          if (node.children.length && !['LI', 'DIV'].includes(node.tagName)) return;
          const r = node.getBoundingClientRect();
          const s = stage.getBoundingClientRect();
          const x = (r.left - s.left) / stageScale,
            y = (r.top - s.top) / stageScale,
            w = r.width / stageScale,
            h = r.height / stageScale;
          if (x + w < region.x || x > region.x + region.w || y + h < region.y || y > region.y + region.h) return;
          const text = node.textContent.replace(/\s+/g, ' ').trim();
          if (text && !found.includes(text) && text.length > 2) found.push(text);
        });
        const text = found.length
          ? found.join('\n')
          : '(No text recognized in that region — try the Notes or browser window.)';
        const panel = el(
          'div',
          { class: 'demo-panel demo-ocr', role: 'dialog', 'aria-label': 'Recognized text' },
          el('h4', {}, `Recognized ${found.length} line${found.length === 1 ? '' : 's'}`),
          el('pre', {}, text),
          el(
            'div',
            { class: 'demo-ocr-actions' },
            el('button', { class: 'demo-btn', type: 'button', onclick: () => cancelFlow() }, 'Close'),
            el(
              'button',
              {
                class: 'demo-btn is-primary',
                type: 'button',
                onclick: () => {
                  cancelFlow();
                  toast('Text copied', `${found.length} lines on the clipboard`);
                },
              },
              icon('copy'),
              'Copy text'
            )
          )
        );
        setMode('ocr');
        showOverlay(panel);
        panel.querySelector('.is-primary')?.focus({ preventScroll: true });
        setStatus(
          '<strong>Copy Text from Region.</strong> In the real app the text is on your clipboard instantly — this panel just shows what it found.'
        );
      },
      reduceMotion ? 200 : 900
    );
  }

  function runScrollCapture(region) {
    setMode('scrolling');
    const outline = el('div', {
      class: 'demo-region is-recording',
      style: { left: `${region.x}px`, top: `${region.y}px`, width: `${region.w}px`, height: `${region.h}px` },
    });
    showOverlay(outline);
    let frames = 1;
    const count = el('strong', {}, '1 frame');
    const panel = el(
      'div',
      { class: 'demo-panel demo-scrollpanel', role: 'toolbar', 'aria-label': 'Scrolling capture' },
      el('span', { class: 'demo-spinner', 'aria-hidden': 'true' }),
      el('span', {}, 'Scroll the page…'),
      count,
      el(
        'button',
        { class: 'demo-btn is-primary', type: 'button', onclick: done },
        'Done',
        el('kbd', { style: { marginLeft: '4px' } }, '↵')
      ),
      el(
        'button',
        { class: 'demo-btn', type: 'button', onclick: () => cancelFlow('Scrolling capture cancelled.') },
        'Cancel'
      )
    );
    Object.assign(panel.style, {
      left: `${clamp(region.x + region.w / 2 - 200, 8, STAGE_W - 410)}px`,
      top: `${region.y > 60 ? region.y - 50 : region.y + region.h + 10}px`,
    });
    showOverlay(panel);

    const content = desktop.querySelector('.demo-browser-content');
    let offset = 0;
    const scrollTick = every(
      () => {
        offset = Math.min(offset + 62, 310);
        if (content) content.style.transform = `translateY(${-offset}px)`;
        frames += 1;
        count.textContent = `${frames} frames`;
        if (offset >= 310) {
          cancelTimer(scrollTick);
          later(done, 500);
        }
      },
      reduceMotion ? 150 : 550
    );

    function done() {
      if (state.mode !== 'scrolling') return;
      cancelTimer(scrollTick);
      clearOverlay();
      if (content) content.style.transform = '';
      setMode('processing');
      showOverlay(
        el(
          'div',
          { class: 'demo-panel demo-processing' },
          el('span', { class: 'demo-spinner', 'aria-hidden': 'true' }),
          `Stitching ${frames} frames…`
        )
      );
      later(
        () => {
          clearOverlay();
          const tall = { x: region.x, y: region.y, w: region.w, h: Math.min(region.h + offset, STAGE_H - region.y) };
          const clip = addClip('screenshot', tall, { name: fileName('png', ' (scrolling)'), scrolling: true });
          if (state.settings.openEditor) openEditor(clip);
          else {
            setMode('idle');
            savedToast(clip);
            idleStatus();
          }
        },
        reduceMotion ? 200 : 800
      );
    }
    setStatus(
      '<strong>Scrolling capture.</strong> The demo scrolls the browser for you; Tiny Clips stitches each frame into one tall image. Press Done any time.'
    );
  }

  /* ---------------------------------------------------------------------
     Clips Library
     --------------------------------------------------------------------- */
  const TAGS = [
    ['Release', '#8b5cf6'],
    ['Bug', '#ef4444'],
    ['Docs', '#0ea5e9'],
    ['Social', '#f59e0b'],
  ];

  function openLibrary(focusId) {
    cancelFlow();
    setMode('library');
    const lib = { filter: 'all', tag: null, query: '', selected: new Set(focusId ? [focusId] : []), selectMode: false };
    const title = 'Clips Library';

    const main = el('div', { class: 'demo-library-main' });
    const side = el('div', { class: 'demo-library-side' });
    const search = el('input', {
      class: 'demo-library-search',
      type: 'search',
      placeholder: 'Search clips',
      'aria-label': 'Search clips',
      oninput: (e) => {
        lib.query = e.target.value.toLowerCase();
        renderMain();
      },
    });

    const visibleClips = () =>
      state.clips.filter(
        (c) =>
          (lib.filter === 'all' || (lib.filter === 'fav' ? c.fav : c.type === lib.filter)) &&
          (!lib.tag || c.tags.includes(lib.tag)) &&
          (!lib.query ||
            c.name.toLowerCase().includes(lib.query) ||
            c.tags.some((t) => t.toLowerCase().includes(lib.query)))
      );

    const renderSide = () => {
      const item = (label, key, count, color) =>
        el(
          'button',
          {
            class: 'demo-side-item',
            type: 'button',
            'aria-pressed': String(color ? lib.tag === key : lib.filter === key && !lib.tag),
            style: color ? { '--tag': color } : null,
            onclick: () => {
              if (color) lib.tag = lib.tag === key ? null : key;
              else {
                lib.filter = key;
                lib.tag = null;
              }
              renderSide();
              renderMain();
            },
          },
          color ? el('span', { class: 'tagdot' }) : null,
          el('span', { style: { flex: 1 } }, label),
          el('span', { style: { color: 'var(--desk-text-2)', fontSize: '11px' } }, String(count))
        );
      side.replaceChildren(
        ...[
          el('h6', {}, 'Library'),
          item('All clips', 'all', state.clips.length),
          item('Screenshots', 'screenshot', state.clips.filter((c) => c.type === 'screenshot').length),
          item('Videos', 'video', state.clips.filter((c) => c.type === 'video').length),
          item('GIFs', 'gif', state.clips.filter((c) => c.type === 'gif').length),
          item('Favorites', 'fav', state.clips.filter((c) => c.fav).length),
          isMac() ? el('h6', {}, 'Tags') : null,
          ...(isMac()
            ? TAGS.map(([t, color]) => item(t, t, state.clips.filter((c) => c.tags.includes(t)).length, color))
            : []),
        ].filter(Boolean)
      );
    };

    const renderMain = () => {
      const clips = visibleClips();
      main.replaceChildren();
      if (!clips.length) {
        main.append(
          el(
            'div',
            { class: 'demo-empty' },
            el('strong', {}, state.clips.length ? 'No clips match' : 'No clips yet'),
            state.clips.length
              ? 'Try another filter or search.'
              : 'Close this window and take a screenshot or recording — it will show up here.'
          )
        );
        return;
      }
      const grid = el('div', { class: 'demo-clip-grid' });
      clips.forEach((clip) => {
        const thumbW = 170,
          scale = thumbW / clip.rect.w;
        const snap = snapshotOf(clip.rect, scale);
        snap.style.transformOrigin = 'top left';
        const thumb = el(
          'div',
          { class: 'demo-clip-thumb' },
          snap,
          el(
            'span',
            { class: 'demo-clip-badge' },
            clip.type === 'screenshot'
              ? 'PNG'
              : clip.type === 'video'
                ? `MP4 ${fmtTime(clip.duration)}`
                : `GIF ${fmtTime(clip.duration)}`
          ),
          el(
            'button',
            {
              class: 'demo-clip-fav',
              type: 'button',
              'aria-label': clip.fav ? 'Remove from favorites' : 'Add to favorites',
              'aria-pressed': String(clip.fav),
              onclick: (e) => {
                e.stopPropagation();
                clip.fav = !clip.fav;
                renderSide();
                renderMain();
              },
            },
            '★'
          )
        );
        const card = el(
          'div',
          {
            class: `demo-clip${lib.selected.has(clip.id) ? ' is-selected' : ''}`,
            onclick: () => {
              if (!lib.selectMode) return;
              if (lib.selected.has(clip.id)) lib.selected.delete(clip.id);
              else lib.selected.add(clip.id);
              renderMain();
              renderHead();
            },
          },
          thumb,
          el('div', { class: 'demo-clip-name', title: clip.name }, clip.name),
          el(
            'div',
            { class: 'demo-clip-meta' },
            el('span', {}, `${clip.rect.w} × ${clip.rect.h}`),
            ...clip.tags.map((t) => el('span', { class: 'demo-tag' }, t))
          ),
          el(
            'div',
            { class: 'demo-clip-actions' },
            el(
              'button',
              {
                class: 'demo-btn',
                type: 'button',
                onclick: (e) => {
                  e.stopPropagation();
                  closeAppWindow();
                  if (clip.type === 'screenshot') openEditor(clip);
                  else openTrimmer(clip);
                },
              },
              clip.type === 'screenshot' ? 'Edit' : 'Trim'
            ),
            el(
              'button',
              {
                class: 'demo-btn',
                type: 'button',
                onclick: (e) => {
                  e.stopPropagation();
                  toast('Copied', clip.name);
                },
              },
              'Copy'
            ),
            isMac()
              ? el(
                  'button',
                  {
                    class: 'demo-btn',
                    type: 'button',
                    'aria-label': 'Tag',
                    onclick: (e) => {
                      e.stopPropagation();
                      const next = TAGS.map((t) => t[0]).find((t) => !clip.tags.includes(t));
                      if (next) clip.tags.push(next);
                      else clip.tags = [];
                      renderSide();
                      renderMain();
                    },
                  },
                  'Tag'
                )
              : null,
            el(
              'button',
              {
                class: 'demo-btn',
                type: 'button',
                onclick: (e) => {
                  e.stopPropagation();
                  toast('Upload link copied', 'https://ucarecdn.com/…/ — via your own Uploadcare account');
                },
              },
              'Share'
            )
          )
        );
        grid.append(card);
      });
      main.append(grid);
    };

    const head = el('div', { class: 'demo-appwin-title' });
    const renderHead = () => {
      head.replaceChildren(
        ...[
          el('img', {
            src: './assets/app-icon-128.png',
            alt: '',
            width: 16,
            height: 16,
            style: { borderRadius: '4px' },
          }),
          el('span', {}, title),
          el('span', { class: 'meta' }, `${state.clips.length} clip${state.clips.length === 1 ? '' : 's'}`),
          el('span', { class: 'grow' }),
          search,
          isMac()
            ? el(
                'button',
                {
                  class: 'demo-btn',
                  type: 'button',
                  'aria-pressed': String(lib.selectMode),
                  onclick: () => {
                    lib.selectMode = !lib.selectMode;
                    if (!lib.selectMode) lib.selected.clear();
                    renderHead();
                    renderMain();
                  },
                },
                lib.selectMode ? `Selected ${lib.selected.size}` : 'Select'
              )
            : null,
          isMac() && lib.selectMode && lib.selected.size
            ? el(
                'button',
                {
                  class: 'demo-btn',
                  type: 'button',
                  onclick: () => {
                    state.clips.forEach((c) => {
                      if (lib.selected.has(c.id)) c.fav = true;
                    });
                    renderSide();
                    renderMain();
                  },
                },
                icon('star'),
                'Favorite'
              )
            : null,
          isMac() && lib.selectMode && lib.selected.size
            ? el(
                'button',
                {
                  class: 'demo-btn is-danger',
                  type: 'button',
                  onclick: () => {
                    state.clips = state.clips.filter((c) => !lib.selected.has(c.id));
                    lib.selected.clear();
                    libraryBtn.textContent = state.clips.length ? `Library (${state.clips.length})` : 'Library';
                    renderSide();
                    renderMain();
                    renderHead();
                  },
                },
                icon('trash'),
                'Delete'
              )
            : null,
          el(
            'button',
            { class: 'demo-btn', type: 'button', onclick: () => toast('Opened folder', folderFor('screenshot')) },
            icon('folder'),
            isMac() ? 'Finder' : 'Explorer'
          ),
          el(
            'button',
            {
              class: 'demo-appwin-close',
              type: 'button',
              'aria-label': 'Close',
              onclick: () => {
                closeAppWindow();
                setMode('idle');
                idleStatus();
              },
            },
            '✕'
          ),
        ].filter(Boolean)
      );
    };

    const win = el(
      'div',
      { class: 'demo-appwin demo-library', role: 'dialog', 'aria-label': title },
      head,
      el('div', { class: 'demo-library-body' }, side, main)
    );
    showAppWindow(win);
    renderHead();
    renderSide();
    renderMain();
    setStatus(
      '<strong>Clips Library.</strong> Browse every capture, search, organize, reopen it in the editor or trimmer, copy, or share.'
    );
  }

  /* ---------------------------------------------------------------------
     Settings (subset)
     --------------------------------------------------------------------- */
  function openSettings() {
    setMode('settings');
    let section = 'General';
    const side = el('div', { class: 'demo-library-side' });
    const main = el('div', { class: 'demo-settings-main' });
    const sections = ['General', 'Screenshot', 'Video', 'GIF', 'Teleprompter', 'Hotkeys', 'Analytics', 'About'];

    const row = (label, sub, control) =>
      el(
        'div',
        { class: 'demo-card-row' },
        el('div', { class: 'grow' }, label, sub ? el('span', { class: 'sub' }, sub) : null),
        control
      );
    const sw = (key, onchange) =>
      el(
        'button',
        {
          class: 'demo-toggle',
          type: 'button',
          'aria-pressed': String(!!state.settings[key]),
          'aria-label': key,
          onclick: (e) => {
            state.settings[key] = !state.settings[key];
            e.currentTarget.setAttribute('aria-pressed', String(state.settings[key]));
            onchange?.();
          },
        },
        el('span', { class: 'demo-switch', 'aria-hidden': 'true' })
      );

    const renderSide = () =>
      side.replaceChildren(
        ...sections.map((s) =>
          el(
            'button',
            {
              class: 'demo-side-item',
              type: 'button',
              'aria-pressed': String(section === s),
              onclick: () => {
                section = s;
                renderSide();
                renderMain();
              },
            },
            s
          )
        )
      );
    const renderMain = () => {
      main.replaceChildren();
      if (section === 'General')
        main.append(
          el('h5', {}, 'Appearance'),
          row(
            'Theme',
            'Follow system, light, or dark',
            el(
              'select',
              {
                class: 'demo-select',
                onchange: (e) => {
                  state.theme = e.target.value === 'system' ? null : e.target.value;
                  buildDesktop();
                },
              },
              el('option', { value: 'system', selected: !state.theme }, 'System'),
              el('option', { value: 'light', selected: state.theme === 'light' }, 'Light'),
              el('option', { value: 'dark', selected: state.theme === 'dark' }, 'Dark')
            )
          ),
          el('h5', {}, 'Files & saving'),
          row(
            'Screenshots folder',
            folderFor('screenshot'),
            el('button', { class: 'demo-btn', type: 'button' }, 'Change')
          ),
          row(
            'Videos & GIFs folder',
            folderFor('video'),
            el('button', { class: 'demo-btn', type: 'button' }, 'Change')
          ),
          row('Copy to clipboard after save', null, sw('clipboard')),
          row(isMac() ? 'Reveal in Finder' : 'Show in Explorer after save', null, sw('reveal')),
          el('h5', {}, 'Startup'),
          row('Launch at login', null, sw('launchAtLogin'))
        );
      if (section === 'Screenshot')
        main.append(
          row('Open editor after capture', 'Otherwise save straight to disk', sw('openEditor')),
          row(
            'Format',
            'PNG or JPEG with quality',
            el('select', { class: 'demo-select' }, el('option', {}, 'PNG'), el('option', {}, 'JPEG'))
          ),
          row('Branding overlay', '"Captured on Tiny Clips" in the corner', sw('watermark'))
        );
      if (section === 'Video')
        main.append(
          el('h5', {}, 'Video quality'),
          row(
            'Frame rate',
            null,
            el(
              'select',
              { class: 'demo-select' },
              el('option', {}, '24 fps'),
              el('option', { selected: true }, '30 fps'),
              el('option', {}, '60 fps')
            )
          ),
          row(
            'Encoder profile',
            'High (smaller files) or Baseline (max compatibility)',
            el('select', { class: 'demo-select' }, el('option', {}, 'High'), el('option', {}, 'Baseline'))
          ),
          el('h5', {}, 'Audio'),
          row(
            'Microphone limiter',
            'Soft-knee limiter prevents clipping',
            el(
              'button',
              { class: 'demo-toggle', type: 'button', 'aria-pressed': 'true' },
              el('span', { class: 'demo-switch' })
            )
          ),
          row(
            'Audio offset',
            '−500 … +500 ms',
            el('input', { type: 'range', min: -500, max: 500, value: 0, style: { width: '110px' } })
          ),
          el('h5', {}, 'Webcam overlay'),
          row('Webcam on by default', 'Shape, corner, and size are chosen per recording', sw('webcam')),
          el('h5', {}, 'Effects'),
          row('Mouse-click highlights', null, sw('clicks')),
          row('Open trimmer after recording', null, sw('openTrimmer')),
          row('Keep display awake while recording', null, sw('keepAwake'))
        );
      if (section === 'GIF')
        main.append(
          row(
            'Frame rate',
            '5–30 fps',
            el(
              'select',
              { class: 'demo-select' },
              el('option', {}, '5 fps'),
              el('option', { selected: true }, '10 fps'),
              el('option', {}, '15 fps'),
              el('option', {}, '30 fps')
            )
          ),
          row(
            'Max width',
            '320–1920 px',
            el(
              'select',
              { class: 'demo-select' },
              el('option', {}, '480 px'),
              el('option', { selected: true }, '640 px'),
              el('option', {}, '960 px'),
              el('option', {}, '1280 px')
            )
          ),
          row('Open trimmer after recording', null, sw('openTrimmer'))
        );
      if (section === 'Teleprompter')
        main.append(
          row(
            'Enable teleprompter overlay',
            'Shown to you, never captured',
            el(
              'button',
              { class: 'demo-toggle', type: 'button', 'aria-pressed': 'true' },
              el('span', { class: 'demo-switch' })
            )
          ),
          row(
            'Scroll speed',
            '10–200 per second',
            el('input', { type: 'range', min: 10, max: 200, value: 40, style: { width: '110px' } })
          ),
          row(
            'Text size',
            null,
            el(
              'select',
              { class: 'demo-select' },
              el('option', {}, 'Small'),
              el('option', { selected: true }, 'Medium'),
              el('option', {}, 'Large')
            )
          ),
          row(
            'Script',
            'Paste text or import .txt / .md',
            el('button', { class: 'demo-btn', type: 'button' }, 'Import…')
          )
        );
      if (section === 'Hotkeys') {
        const k = (keys) => el('span', {}, ...keys.map((x) => el('kbd', {}, x)));
        main.append(
          row('Screenshot', null, k(isMac() ? ['⌃', '⌥', '⌘', '5'] : ['Ctrl', 'Shift', '5'])),
          row('Record video', null, k(isMac() ? ['⌃', '⌥', '⌘', '6'] : ['Ctrl', 'Shift', '6'])),
          row('Record GIF', null, k(isMac() ? ['⌃', '⌥', '⌘', '7'] : ['Ctrl', 'Shift', '7'])),
          row('Copy text from region', null, k(isMac() ? ['—'] : ['Ctrl', 'Shift', 'T'])),
          row('Screenshot region (skip picker)', 'Optional', k(isMac() ? ['⌃', '⌥', '⌘', '1'] : ['—'])),
          row('Stop recording', null, k(isMac() ? ['⌘', '.'] : ['Ctrl', 'Shift', 'S'])),
          el(
            'p',
            { style: { color: 'var(--desk-text-2)', fontSize: '11px' } },
            'Every shortcut is rebindable. Conflicts with Windows or another app are detected and the previous binding is kept.'
          )
        );
      }
      if (section === 'Analytics') {
        const counts = {
          screenshot: state.clips.filter((c) => c.type === 'screenshot').length,
          video: state.clips.filter((c) => c.type === 'video').length,
          gif: state.clips.filter((c) => c.type === 'gif').length,
        };
        const max = Math.max(1, counts.screenshot, counts.video, counts.gif);
        const bar = (label, n, color) =>
          el(
            'div',
            {
              style: {
                display: 'grid',
                gridTemplateColumns: '80px 1fr 30px',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
              },
            },
            el('span', {}, label),
            el(
              'div',
              { style: { height: '10px', borderRadius: '5px', background: 'var(--desk-border)', overflow: 'hidden' } },
              el('div', { style: { width: `${(n / max) * 100}%`, height: '100%', background: color } })
            ),
            el('strong', {}, String(n))
          );
        main.append(
          el('h5', {}, 'This session'),
          bar('Screenshots', counts.screenshot, '#3d8bff'),
          bar('Videos', counts.video, '#6a4ff0'),
          bar('GIFs', counts.gif, '#3ddc97'),
          el(
            'p',
            { style: { color: 'var(--desk-text-2)', fontSize: '11px' } },
            'Stored only on your device. Tiny Clips has no telemetry.'
          )
        );
      }
      if (section === 'About')
        main.append(
          row(
            'Tiny Clips',
            isMac() ? 'Version 1.7.1 · macOS' : 'Version 1.7.4 · Windows',
            el('img', {
              src: './assets/app-icon-128.png',
              alt: '',
              width: 32,
              height: 32,
              style: { borderRadius: '8px' },
            })
          ),
          row(
            'Updates',
            isMac() ? 'Delivered by the Mac App Store' : 'Delivered by the Microsoft Store',
            el(
              'button',
              { class: 'demo-btn', type: 'button', onclick: () => toast('Up to date', 'You have the latest version.') },
              'Check'
            )
          ),
          row(
            'Open source',
            'MIT license on GitHub',
            el(
              'a',
              {
                class: 'demo-btn',
                href: 'https://github.com/jamesmontemagno/tiny-clips',
                target: '_blank',
                rel: 'noopener noreferrer',
              },
              'GitHub'
            )
          ),
          row(
            'File a bug',
            'Opens a pre-filled GitHub issue',
            el('button', { class: 'demo-btn', type: 'button' }, 'File a Bug…')
          )
        );
    };

    const win = el(
      'div',
      { class: 'demo-appwin demo-settings', role: 'dialog', 'aria-label': 'Tiny Clips settings' },
      el(
        'div',
        { class: 'demo-appwin-title' },
        el('img', { src: './assets/app-icon-128.png', alt: '', width: 16, height: 16, style: { borderRadius: '4px' } }),
        el('span', {}, 'Settings'),
        el('span', { class: 'grow' }),
        el(
          'button',
          {
            class: 'demo-appwin-close',
            type: 'button',
            'aria-label': 'Close settings',
            onclick: () => {
              closeAppWindow();
              setMode('idle');
              idleStatus();
            },
          },
          '✕'
        )
      ),
      el('div', { class: 'demo-settings-body' }, side, main)
    );
    showAppWindow(win);
    renderSide();
    renderMain();
    setStatus(
      '<strong>Settings.</strong> Toggle the editor, trimmer, watermark, webcam default, and theme — the demo respects them.'
    );
  }

  /* ---------------------------------------------------------------------
     Keyboard shortcuts (while the stage has focus)
     --------------------------------------------------------------------- */
  const handleHotkeys = (event) => {
    const tag = event.target.tagName;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
    const key = event.key.toLowerCase();
    const chord = event.ctrlKey && event.shiftKey && !event.altKey;

    if (event.key === 'Escape') {
      if (appWindow) {
        closeAppWindow();
        setMode('idle');
        idleStatus();
        return;
      }
      if (state.mode === 'recording' || state.mode === 'paused') return;
      if (state.mode !== 'idle') {
        event.preventDefault();
        cancelFlow('Cancelled.');
      }
      return;
    }
    if (chord && key === '5' && state.mode === 'idle') {
      event.preventDefault();
      openPicker('screenshot');
      return;
    }
    if (chord && key === '6' && state.mode === 'idle') {
      event.preventDefault();
      openPicker('video');
      return;
    }
    if (chord && key === '7' && state.mode === 'idle') {
      event.preventDefault();
      openPicker('gif');
      return;
    }
    if (chord && key === 't' && state.mode === 'idle') {
      event.preventDefault();
      startSelection('ocr');
      return;
    }
    if ((chord && key === 's') || (event.metaKey && event.key === '.')) {
      if (state.mode === 'recording' || state.mode === 'paused') {
        event.preventDefault();
        stopRecording();
      }
      return;
    }
    if (state.mode === 'picker') {
      const map = {
        r: '[data-key="R"]',
        s: '[data-key="S"]',
        w: '[data-key="W"]',
        p: '[data-key="P"]',
        t: '[data-key="T"]',
      };
      const target = map[key] && overlay.querySelector(map[key]);
      if (target) {
        event.preventDefault();
        target.click();
      }
      return;
    }
    if (state.mode === 'scrolling' && event.key === 'Enter') {
      overlay.querySelector('.demo-scrollpanel .is-primary')?.click();
      return;
    }
    if ((state.mode === 'recording' || state.mode === 'paused') && key === ' ') {
      event.preventDefault();
      togglePause();
    }
  };

  // Hotkeys apply when the demo is in use: focus inside the stage, pointer over it,
  // or any capture flow in progress (focus often lands on <body> after a button disappears).
  document.addEventListener('keydown', (event) => {
    const focusInside = stage.contains(document.activeElement);
    if (focusInside || state.hovering || state.mode !== 'idle') handleHotkeys(event);
  });

  /* ---------------------------------------------------------------------
     Platform switching, reset, init
     --------------------------------------------------------------------- */
  function setPlatform(platform) {
    state.platform = platform;
    platformSeg
      .querySelectorAll('button')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.platform === platform)));
    cancelFlow();
    closeAppWindow();
    buildDesktop();
    idleStatus();
  }

  function resetDemo() {
    cancelFlow();
    closeAppWindow();
    state.clips = [];
    state.clipSeq = 1;
    state.theme = null;
    Object.assign(state.settings, {
      countdown: 3,
      openEditor: true,
      openTrimmer: true,
      watermark: false,
      clicks: true,
      clipboard: true,
      reveal: false,
      webcam: false,
    });
    libraryBtn.textContent = 'Library';
    buildDesktop();
    idleStatus();
    toast('Demo reset', 'Clips cleared and settings restored.');
  }

  // Keep the fake clocks roughly current.
  every(() => {
    desktop
      .querySelectorAll('.demo-clock, .demo-taskbar-clock > div:first-child')
      .forEach((n) => (n.textContent = clockText()));
  }, 30000);

  setPlatform(state.platform);

  // Let the page's platform tabs link into the demo: "Try it" for a given platform.
  window.TinyClipsDemo = { setPlatform, reset: resetDemo, openLibrary };
})();

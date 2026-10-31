/* Tiny Clips site behaviour: platform detection, install tabs, copy buttons,
   mobile nav, active nav tracking, and media previews. */
(() => {
  'use strict';

  const year = document.getElementById('year');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const heroVideo = document.querySelector('.hero-video');
  if (heroVideo) {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    heroVideo.autoplay = !motionPreference.matches;
    motionPreference.addEventListener('change', (event) => {
      if (event.matches) {
        heroVideo.autoplay = false;
        heroVideo.pause();
      }
    });
  }

  const STORE_URLS = {
    windows: 'https://apps.microsoft.com/detail/9ndt5p7lcjwg?cid=DevShareMCLPCS',
    macos: 'https://apps.apple.com/us/app/tiny-clips/id6759208660?mt=12',
  };

  const detectPlatform = () => {
    const ua = navigator.userAgent || '';
    const platform = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase();
    if (platform.includes('win') || /windows/i.test(ua)) {
      return 'windows';
    }
    if (platform.includes('mac') || /macintosh|mac os x/i.test(ua)) {
      return 'macos';
    }
    return null;
  };

  const detected = detectPlatform();
  const preferred = detected || 'windows';
  document.documentElement.dataset.platform = preferred;

  /* ---- Hero CTA ordering: put the visitor's platform first ---- */
  const ctaGroup = document.querySelector('[data-platform-ctas]');
  if (ctaGroup) {
    const ctas = Array.from(ctaGroup.querySelectorAll('[data-platform-cta]'));
    ctas.forEach((cta) => {
      const isPrimary = cta.dataset.platformCta === preferred;
      cta.classList.toggle('is-secondary', !isPrimary);
      if (isPrimary) {
        ctaGroup.prepend(cta);
      }
    });
  }

  document.querySelectorAll('[data-store-link]').forEach((link) => {
    if (detected && STORE_URLS[detected]) {
      link.href = STORE_URLS[detected];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });

  /* ---- Hero download: name the visitor's platform, offer the other one ---- */
  const PLATFORM_NAMES = { windows: 'Windows', macos: 'Mac' };
  const heroDownload = document.querySelector('[data-hero-download]');
  if (heroDownload && detected) {
    heroDownload.dataset.os = detected;
    const label = heroDownload.querySelector('[data-hero-download-label]');
    if (label) label.textContent = `Download for ${PLATFORM_NAMES[detected]}`;

    const other = detected === 'windows' ? 'macos' : 'windows';
    const altLink = document.querySelector('[data-hero-alt]');
    if (altLink) {
      altLink.textContent = `Also on ${PLATFORM_NAMES[other]}`;
      altLink.href = STORE_URLS[other];
      altLink.target = '_blank';
      altLink.rel = 'noopener noreferrer';
    }
  }

  /* ---- Hero product preview tabs ---- */
  const showcase = document.querySelector('[data-showcase]');
  if (showcase) {
    const tablist = showcase.querySelector('[role="tablist"]');
    const showcaseTabs = Array.from(showcase.querySelectorAll('[role="tab"]'));
    const selectShowcase = (selected) => {
      showcaseTabs.forEach((tab) => {
        const isActive = tab === selected;
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) panel.hidden = !isActive;
      });
    };

    if (tablist && showcaseTabs.length) {
      // Tab semantics only apply once JavaScript can switch panels; without it both previews stay visible.
      showcaseTabs.forEach((tab) => {
        const panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (!panel) return;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tab.id);
        panel.tabIndex = 0;
      });
      tablist.hidden = false;
      selectShowcase(showcaseTabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || showcaseTabs[0]);

      showcaseTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => selectShowcase(tab));
        tab.addEventListener('keydown', (event) => {
          let next = null;
          if (event.key === 'ArrowRight') next = (index + 1) % showcaseTabs.length;
          if (event.key === 'ArrowLeft') next = (index - 1 + showcaseTabs.length) % showcaseTabs.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = showcaseTabs.length - 1;
          if (next !== null) {
            event.preventDefault();
            selectShowcase(showcaseTabs[next]);
            showcaseTabs[next].focus();
          }
        });
      });
    }
  }

  /* ---- Install platform tabs ---- */
  const platformTabs = Array.from(document.querySelectorAll('.platform-tab'));
  const platformPanels = Array.from(document.querySelectorAll('.platform-panel'));

  const selectPlatform = (platform) => {
    platformTabs.forEach((tab) => {
      const isActive = tab.dataset.platform === platform;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    platformPanels.forEach((panel) => {
      const isActive = panel.dataset.platform === platform;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  };

  if (platformTabs.length && platformPanels.length) {
    selectPlatform(preferred);

    platformTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectPlatform(tab.dataset.platform));
      tab.addEventListener('keydown', (event) => {
        let next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % platformTabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
          next = (index - 1 + platformTabs.length) % platformTabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = platformTabs.length - 1;
        if (next !== null) {
          event.preventDefault();
          selectPlatform(platformTabs[next].dataset.platform);
          platformTabs[next].focus();
        }
      });
    });

    document.querySelectorAll('[data-select-platform]').forEach((link) => {
      link.addEventListener('click', () => selectPlatform(link.dataset.selectPlatform));
    });
  }

  /* ---- Copy-to-clipboard buttons ---- */
  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.append(helper);
    helper.select();
    document.execCommand('copy');
    helper.remove();
  };

  document.querySelectorAll('.copy-command-btn[data-copy-command]').forEach((button) => {
    const original = button.textContent.trim() || 'Copy';
    let timer = 0;
    button.addEventListener('click', async () => {
      try {
        await copyText(button.dataset.copyCommand || '');
        button.textContent = 'Copied';
        button.classList.add('is-copied');
      } catch {
        button.textContent = 'Select & copy';
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        button.textContent = original;
        button.classList.remove('is-copied');
      }, 1600);
    });
  });

  /* ---- Mobile navigation ---- */
  const navToggle = document.querySelector('.nav-toggle');
  const primaryNav = document.getElementById('primary-nav');
  if (navToggle && primaryNav) {
    const setOpen = (open) => {
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      primaryNav.classList.toggle('is-open', open);
      document.body.classList.toggle('is-nav-open', open);
      if (open) primaryNav.querySelector('a')?.focus();
    };
    navToggle.addEventListener('click', () => setOpen(navToggle.getAttribute('aria-expanded') !== 'true'));
    primaryNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && primaryNav.classList.contains('is-open')) {
        setOpen(false);
        navToggle.focus();
      }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', (event) => {
      if (event.matches) setOpen(false);
    });
  }

  /* ---- Active section highlighting ---- */
  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) =>
            link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`)
          );
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((section) => observer.observe(section));
  }

  /* ---- Studio video preview ---- */
  const studioVideoLink = document.querySelector('[data-studio-video]');
  const studioDialog = document.querySelector('.studio-video-dialog');
  const studioVideo = studioDialog?.querySelector('video');
  if (studioVideoLink && studioVideo && typeof studioDialog.showModal === 'function') {
    studioVideoLink.setAttribute('aria-haspopup', 'dialog');
    studioVideoLink.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      studioVideo.src = studioVideoLink.href;
      studioDialog.showModal();
      document.body.classList.add('is-studio-open');
    });
    studioDialog.addEventListener('close', () => {
      studioVideo.pause();
      studioVideo.removeAttribute('src');
      studioVideo.load();
      document.body.classList.remove('is-studio-open');
      studioVideoLink.focus({ preventScroll: true });
    });
    studioDialog.addEventListener('click', (event) => {
      if (event.target !== studioDialog) return;
      const bounds = studioDialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        studioDialog.close();
      }
    });
  }

  /* ---- Gallery lightbox ---- */
  const galleryGrid = document.querySelector('.gallery-grid');
  if (galleryGrid) {
    let previouslyFocused = null;

    const lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Enlarged screenshot');
    lightbox.hidden = true;

    const closeButton = document.createElement('button');
    closeButton.className = 'gallery-lightbox-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close enlarged image');
    closeButton.textContent = '×';

    const image = document.createElement('img');
    image.className = 'gallery-lightbox-image';
    image.alt = '';

    const caption = document.createElement('p');
    caption.className = 'gallery-lightbox-caption';

    lightbox.append(closeButton, image, caption);
    document.body.append(lightbox);

    const close = () => {
      lightbox.classList.remove('is-open');
      document.body.classList.remove('is-lightbox-open');
      window.setTimeout(() => {
        lightbox.hidden = true;
        image.removeAttribute('src');
      }, 200);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };

    const open = (figure) => {
      const source = figure.querySelector('img');
      if (!source) return;
      previouslyFocused = document.activeElement;
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      caption.textContent = figure.querySelector('figcaption')?.textContent || source.alt;
      lightbox.hidden = false;
      requestAnimationFrame(() => lightbox.classList.add('is-open'));
      document.body.classList.add('is-lightbox-open');
      closeButton.focus();
    };

    galleryGrid.querySelectorAll('.gallery-item').forEach((item) => {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `Enlarge: ${item.querySelector('figcaption')?.textContent || 'screenshot'}`);
      item.addEventListener('click', () => open(item));
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open(item);
        }
      });
    });

    closeButton.addEventListener('click', close);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) close();
    });
    document.addEventListener('keydown', (event) => {
      if (lightbox.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        closeButton.focus();
      }
    });
  }
})();

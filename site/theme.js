/* Apply the saved theme before styles load, then connect the native toggle. */
(() => {
  'use strict';

  const storageKey = 'tiny-clips-theme';
  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#070a14' : '#f8fafc');
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    });
  };

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(storageKey);
  } catch (error) {
    console.warn('Tiny Clips: the browser blocked reading the saved theme.', error);
  }
  applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

  const connectToggle = () => {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.hidden = false;
      button.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
      button.addEventListener('click', () => {
        const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme(theme);
        try {
          localStorage.setItem(storageKey, theme);
        } catch (error) {
          console.warn('Tiny Clips: the browser blocked saving the theme. It applies to this page only.', error);
        }
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectToggle, { once: true });
  } else {
    connectToggle();
  }
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) {
      applyTheme(event.newValue === 'dark' ? 'dark' : 'light');
    }
  });
})();

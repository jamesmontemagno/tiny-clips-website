const year = document.getElementById('year');
if (year) {
  year.textContent = String(new Date().getFullYear());
}

const detectPlatform = () => {
  const platform = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || '').toLowerCase();
  if (platform.includes('win')) {
    return 'windows';
  }
  return 'macos';
};

const platformTabs = document.querySelectorAll('.platform-tab');
const platformPanels = document.querySelectorAll('.platform-panel');
const platformDetectedMessage = document.getElementById('platform-detected-message');

if (platformTabs.length > 0 && platformPanels.length > 0) {
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

  const detectedPlatform = detectPlatform();
  selectPlatform(detectedPlatform);

  if (platformDetectedMessage) {
    platformDetectedMessage.textContent = detectedPlatform === 'windows'
      ? 'Detected platform: Windows. Switch tabs anytime to preview macOS install options.'
      : 'Detected platform: macOS. Switch tabs anytime to preview upcoming Windows installation details.';
  }

  platformTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const platform = tab.dataset.platform || 'macos';
      selectPlatform(platform);
    });
  });
}

const installMethodTabs = document.querySelectorAll('.install-method-tab');
const installMethodPanels = document.querySelectorAll('.install-method-panel');

if (installMethodTabs.length > 0 && installMethodPanels.length > 0) {
  const selectInstallMethod = (method) => {
    installMethodTabs.forEach((tab) => {
      const isActive = tab.dataset.installMethod === method;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    installMethodPanels.forEach((panel) => {
      const isActive = panel.dataset.installMethod === method;
      panel.classList.toggle('is-active', isActive);
      panel.hidden = !isActive;
    });
  };

  selectInstallMethod('app-store');

  installMethodTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const method = tab.dataset.installMethod || 'app-store';
      selectInstallMethod(method);
    });
  });
}


const galleryGrid = document.querySelector('.gallery-grid');

if (galleryGrid) {
  const lightbox = document.createElement('div');
  lightbox.className = 'gallery-lightbox';
  lightbox.setAttribute('aria-hidden', 'true');

  const closeButton = document.createElement('button');
  closeButton.className = 'gallery-lightbox-close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close enlarged image');
  closeButton.textContent = '×';

  const lightboxImage = document.createElement('img');
  lightboxImage.className = 'gallery-lightbox-image';
  lightboxImage.alt = '';

  lightbox.append(closeButton, lightboxImage);
  document.body.append(lightbox);

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImage.removeAttribute('src');
  };

  const openLightbox = (image) => {
    lightboxImage.src = image.getAttribute('src') || '';
    lightboxImage.alt = image.alt;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  };

  const galleryItems = galleryGrid.querySelectorAll('.gallery-item');
  galleryItems.forEach((item) => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', 'Open image in larger view');
  });

  galleryGrid.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const galleryItem = target.closest('.gallery-item');
    if (!galleryItem) {
      return;
    }

    const image = galleryItem.querySelector('img');
    if (image) {
      openLightbox(image);
    }
  });

  galleryGrid.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const galleryItem = target.closest('.gallery-item');
    if (!galleryItem) {
      return;
    }

    const image = galleryItem.querySelector('img');
    if (image) {
      event.preventDefault();
      openLightbox(image);
    }
  });

  closeButton.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });
}

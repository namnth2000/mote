import './features.js';

const MOBILE_MAX = 760;
const RUNTIME_CACHE_PREFIX = 'mote-runtime-';
const CURRENT_CACHE = 'mote-runtime-v5';

function fixGroupDialogCancel() {
  const dialog = document.querySelector('#group-dialog');
  const form = document.querySelector('#group-form');
  const cancel = form?.querySelector('button[value="cancel"]');
  if (!dialog || !cancel) return;

  cancel.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      form.reset();
      dialog.close('cancel');
    },
    { capture: true }
  );
}

function positionToolbarPopover(details) {
  const popover = details.querySelector(':scope > .toolbar-popover');
  const summary = details.querySelector(':scope > summary');
  if (!popover || !summary) return;

  if (!details.open || window.innerWidth > MOBILE_MAX) {
    popover.classList.remove('mobile-toolbar-popover');
    popover.style.removeProperty('left');
    popover.style.removeProperty('top');
    popover.style.removeProperty('right');
    return;
  }

  window.requestAnimationFrame(() => {
    if (!details.open || window.innerWidth > MOBILE_MAX) return;

    popover.classList.add('mobile-toolbar-popover');
    const anchor = summary.getBoundingClientRect();
    const width = popover.offsetWidth || 230;
    const height = popover.offsetHeight || 280;
    const margin = 8;
    let left = details.classList.contains('more-format-menu') ? anchor.right - width : anchor.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    let top = anchor.bottom + 6;
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, anchor.top - height - 6);
    }

    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
    popover.style.right = 'auto';
  });
}

function installToolbarMenuFix() {
  for (const details of document.querySelectorAll('.toolbar-menu')) {
    if (details.dataset.mobilePopoverBound === 'true') continue;
    details.dataset.mobilePopoverBound = 'true';
    details.addEventListener('toggle', () => positionToolbarPopover(details));
  }

  window.addEventListener('resize', () => {
    for (const details of document.querySelectorAll('.toolbar-menu[open]')) {
      positionToolbarPopover(details);
    }
  });
}

async function refreshRuntimeCache() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(RUNTIME_CACHE_PREFIX) && key !== CURRENT_CACHE)
          .map((key) => caches.delete(key))
      );
    }

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    }
  } catch (error) {
    console.warn('Mote cache refresh skipped:', error);
  }
}

fixGroupDialogCancel();
installToolbarMenuFix();
void refreshRuntimeCache();

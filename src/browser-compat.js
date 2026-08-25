import './features.js';
import './task-interactions.js';

const MOBILE_MAX = 760;
const RUNTIME_CACHE_PREFIX = 'mote-runtime-';
const CURRENT_CACHE = 'mote-runtime-v5';
const VIEW_SCROLL_SETTLE_DELAY = 80;
const VIEW_SCROLL_RESTORE_WINDOW = 2000;

let cancelPendingViewScrollRestore = null;

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

function editorViewIsActive(view) {
  const markdownView = document.querySelector('#markdown-view');
  const previewView = document.querySelector('#preview-view');
  if (!markdownView || !previewView) return false;
  return view === 'markdown'
    ? !markdownView.hidden && previewView.hidden
    : !previewView.hidden && markdownView.hidden;
}

function getScrollProgress(scroller) {
  const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  return maxScrollTop > 0 ? scroller.scrollTop / maxScrollTop : 0;
}

function restoreScrollProgress(scroller, progress) {
  const maxScrollTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  scroller.scrollTop = Math.min(1, Math.max(0, progress)) * maxScrollTop;
}

function installEditorViewScrollPreservation() {
  const scroller = document.querySelector('.document-main');
  const viewToggle = document.querySelector('.view-toggle');
  if (!scroller || !viewToggle) return;

  viewToggle.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest('button[data-view]');
      if (!button || !viewToggle.contains(button)) return;

      const targetView = button.dataset.view;
      const currentView = viewToggle.querySelector('button.is-active')?.dataset.view;
      if (!['preview', 'markdown'].includes(targetView) || targetView === currentView) return;

      const progress = getScrollProgress(scroller);
      cancelPendingViewScrollRestore?.();

      let settleTimer = null;
      let firstFrame = null;
      let secondFrame = null;
      let cleanupTimer = null;

      const restore = () => {
        if (editorViewIsActive(targetView)) restoreScrollProgress(scroller, progress);
      };

      const scheduleRestore = () => {
        if (settleTimer != null) window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          firstFrame = window.requestAnimationFrame(() => {
            secondFrame = window.requestAnimationFrame(restore);
          });
        }, VIEW_SCROLL_SETTLE_DELAY);
      };

      const observer = new MutationObserver(scheduleRestore);
      observer.observe(scroller, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['hidden', 'style']
      });

      const cleanup = () => {
        observer.disconnect();
        if (settleTimer != null) window.clearTimeout(settleTimer);
        if (firstFrame != null) window.cancelAnimationFrame(firstFrame);
        if (secondFrame != null) window.cancelAnimationFrame(secondFrame);
        if (cleanupTimer != null) window.clearTimeout(cleanupTimer);
        if (cancelPendingViewScrollRestore === cleanup) cancelPendingViewScrollRestore = null;
      };

      cleanupTimer = window.setTimeout(() => {
        restore();
        cleanup();
      }, VIEW_SCROLL_RESTORE_WINDOW);

      cancelPendingViewScrollRestore = cleanup;
      scheduleRestore();
    },
    { capture: true }
  );
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
installEditorViewScrollPreservation();
void refreshRuntimeCache();

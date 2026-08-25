import './features.js';
import './task-interactions.js';

const MOBILE_MAX = 760;
const RUNTIME_CACHE_PREFIX = 'mote-runtime-';
const CURRENT_CACHE = 'mote-runtime-v5';
const VIEW_SWITCH_MAX_FRAMES = 60;
const GROUP_LONG_PRESS_MS = 500;
const GROUP_LONG_PRESS_MOVE_PX = 10;

let viewSwitchRevision = 0;
let mobileGroupMenu = null;

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

function installSettingsToastTopLayerFix() {
  const dialog = document.querySelector('#settings-dialog');
  const openSettings = document.querySelector('#open-settings');
  const toastRegion = document.querySelector('#toast-region');
  const originalParent = toastRegion?.parentElement;
  if (!dialog || !openSettings || !toastRegion || !originalParent) return;

  const moveIntoDialog = () => {
    if (!dialog.open || toastRegion.parentElement === dialog) return;
    dialog.append(toastRegion);
  };

  const moveBack = () => {
    if (toastRegion.parentElement !== originalParent) originalParent.append(toastRegion);
  };

  openSettings.addEventListener('click', () => queueMicrotask(moveIntoDialog));
  dialog.addEventListener('close', moveBack);
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

function nextFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function sourceLineFromNode(node) {
  const value = Number(node?.dataset?.sourceLine);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function previewSourceLineAtTop(scroller) {
  if (scroller.scrollTop <= 24) return { line: 1, documentTop: true };

  const preview = document.querySelector('#preview-view');
  if (!preview) return { line: 1, documentTop: false };

  const viewportTop = scroller.getBoundingClientRect().top + 1;
  let covering = null;
  let firstAfter = null;

  for (const node of preview.querySelectorAll('[data-source-line]')) {
    const rect = node.getBoundingClientRect();
    if (rect.bottom <= viewportTop) continue;
    if (rect.top <= viewportTop) {
      covering = node;
      continue;
    }
    firstAfter = node;
    break;
  }

  return {
    line: sourceLineFromNode(covering ?? firstAfter) ?? 1,
    documentTop: false
  };
}

function lineStartOffsets(text) {
  const offsets = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') offsets.push(index + 1);
  }
  return offsets;
}

function createTextareaMirror(textarea) {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');
  Object.assign(mirror.style, {
    position: 'fixed',
    zIndex: '-1',
    left: '-10000px',
    top: '0',
    visibility: 'hidden',
    pointerEvents: 'none',
    boxSizing: style.boxSizing,
    width: `${textarea.getBoundingClientRect().width}px`,
    minHeight: '0',
    margin: '0',
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    borderTopWidth: style.borderTopWidth,
    borderRightWidth: style.borderRightWidth,
    borderBottomWidth: style.borderBottomWidth,
    borderLeftWidth: style.borderLeftWidth,
    borderStyle: 'solid',
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    textTransform: style.textTransform,
    textIndent: style.textIndent,
    tabSize: style.tabSize,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
    wordBreak: style.wordBreak
  });
  document.body.append(mirror);
  return mirror;
}

function createMarkdownLineMeasurer(textarea) {
  const text = textarea.value ?? '';
  const offsets = lineStartOffsets(text);
  const mirror = createTextareaMirror(textarea);
  const cache = new Map();

  const yForLine = (line) => {
    const clampedLine = Math.max(1, Math.min(offsets.length, Math.round(line || 1)));
    if (cache.has(clampedLine)) return cache.get(clampedLine);

    const marker = document.createElement('span');
    marker.textContent = '\u200b';
    mirror.replaceChildren(
      document.createTextNode(text.slice(0, offsets[clampedLine - 1])),
      marker
    );
    const y = marker.offsetTop;
    cache.set(clampedLine, y);
    return y;
  };

  return {
    lineCount: offsets.length,
    yForLine,
    destroy: () => mirror.remove()
  };
}

function markdownSourceLineAtTop(scroller, textarea) {
  if (scroller.scrollTop <= 24) return { line: 1, documentTop: true };

  const scrollerTop = scroller.getBoundingClientRect().top;
  const editorTop = textarea.getBoundingClientRect().top;
  const targetY = Math.max(0, scrollerTop - editorTop);
  const measurer = createMarkdownLineMeasurer(textarea);

  let low = 1;
  let high = measurer.lineCount;
  let answer = 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (measurer.yForLine(middle) <= targetY) {
      answer = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  measurer.destroy();
  return { line: answer, documentTop: false };
}

function previewAnchorForLine(preview, sourceLine) {
  let best = null;
  let bestLine = -1;

  for (const node of preview.querySelectorAll('[data-source-line]')) {
    const line = sourceLineFromNode(node);
    if (line == null || line > sourceLine) continue;
    if (line >= bestLine) {
      best = node;
      bestLine = line;
    }
  }

  return best ?? preview.querySelector('[data-source-line]');
}

function scrollSourceLineToTop(scroller, targetView, anchor) {
  if (anchor.documentTop) {
    scroller.scrollTop = 0;
    return;
  }

  const scrollerTop = scroller.getBoundingClientRect().top;

  if (targetView === 'preview') {
    const preview = document.querySelector('#preview-view');
    const node = previewAnchorForLine(preview, anchor.line);
    if (!node) return;
    scroller.scrollTop += node.getBoundingClientRect().top - scrollerTop;
    return;
  }

  const textarea = document.querySelector('#markdown-editor');
  if (!textarea) return;
  const measurer = createMarkdownLineMeasurer(textarea);
  const lineY = measurer.yForLine(anchor.line);
  measurer.destroy();
  scroller.scrollTop += textarea.getBoundingClientRect().top + lineY - scrollerTop;
}

async function restoreSourceLineAfterViewSwitch({ targetView, anchor, previewRevision, revision }) {
  const preview = document.querySelector('#preview-view');
  const scroller = document.querySelector('.document-main');
  if (!preview || !scroller) return;

  for (let frame = 0; frame < VIEW_SWITCH_MAX_FRAMES; frame += 1) {
    if (revision !== viewSwitchRevision) return;

    const active = editorViewIsActive(targetView);
    const previewReady = targetView !== 'preview' ||
      (preview.dataset.renderRevision && preview.dataset.renderRevision !== previewRevision);

    if (active && previewReady) {
      await nextFrame();
      if (targetView === 'markdown') await nextFrame();
      if (revision !== viewSwitchRevision || !editorViewIsActive(targetView)) return;
      scrollSourceLineToTop(scroller, targetView, anchor);
      return;
    }

    await nextFrame();
  }
}

function installEditorViewSourceLineSync() {
  const scroller = document.querySelector('.document-main');
  const viewToggle = document.querySelector('.view-toggle');
  const textarea = document.querySelector('#markdown-editor');
  const preview = document.querySelector('#preview-view');
  if (!scroller || !viewToggle || !textarea || !preview) return;

  const cancelPendingRestore = () => {
    viewSwitchRevision += 1;
  };
  scroller.addEventListener('wheel', cancelPendingRestore, { passive: true });
  scroller.addEventListener('touchstart', cancelPendingRestore, { passive: true });
  scroller.addEventListener('pointerdown', cancelPendingRestore, { passive: true });

  viewToggle.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest('button[data-view]');
      if (!button || !viewToggle.contains(button)) return;

      const targetView = button.dataset.view;
      const currentView = viewToggle.querySelector('button.is-active')?.dataset.view;
      if (!['preview', 'markdown'].includes(targetView) || targetView === currentView) return;

      const anchor = currentView === 'preview'
        ? previewSourceLineAtTop(scroller)
        : markdownSourceLineAtTop(scroller, textarea);
      const previewRevision = preview.dataset.renderRevision ?? '';
      const revision = ++viewSwitchRevision;

      void restoreSourceLineAfterViewSwitch({ targetView, anchor, previewRevision, revision });
    },
    { capture: true }
  );
}

function closeMobileGroupMenu() {
  if (!mobileGroupMenu) return;
  mobileGroupMenu.open = false;
  mobileGroupMenu.classList.remove('mobile-longpress-open');
  mobileGroupMenu = null;
}

function positionMobileGroupMenu(row, details) {
  if (!details.open || !details.classList.contains('mobile-longpress-open')) return;
  const popover = details.querySelector('.group-menu-popover');
  if (!popover) return;

  const rowRect = row.getBoundingClientRect();
  const width = popover.offsetWidth || 210;
  const height = popover.offsetHeight || 180;
  const margin = 8;
  const left = Math.max(margin, Math.min(rowRect.left, window.innerWidth - width - margin));
  let top = rowRect.bottom + 4;
  if (top + height > window.innerHeight - margin) {
    top = Math.max(margin, rowRect.top - height - 4);
  }
  popover.style.left = `${Math.round(left)}px`;
  popover.style.top = `${Math.round(top)}px`;
  popover.style.right = 'auto';
}

function openMobileGroupMenu(row) {
  const details = row.querySelector(':scope > .group-menu');
  if (!details) return;

  closeMobileGroupMenu();
  mobileGroupMenu = details;
  details.classList.add('mobile-longpress-open');
  details.open = true;
  details.addEventListener('toggle', () => {
    if (!details.open && mobileGroupMenu === details) closeMobileGroupMenu();
  }, { once: true });

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => positionMobileGroupMenu(row, details));
  });
}

function installMobileGroupLongPress() {
  const groupList = document.querySelector('#group-list');
  if (!groupList) return;

  let pressTimer = null;
  let pressPointerId = null;
  let startX = 0;
  let startY = 0;
  let suppressClick = false;

  const cancelPress = () => {
    if (pressTimer != null) window.clearTimeout(pressTimer);
    pressTimer = null;
    pressPointerId = null;
  };

  groupList.addEventListener('pointerdown', (event) => {
    if (window.innerWidth > MOBILE_MAX || event.pointerType === 'mouse') return;
    const icon = event.target.closest('.group-row > .icon');
    const row = icon?.closest('.group-row[data-group-id]');
    if (!icon || !row) return;

    cancelPress();
    pressPointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    pressTimer = window.setTimeout(() => {
      pressTimer = null;
      suppressClick = true;
      openMobileGroupMenu(row);
    }, GROUP_LONG_PRESS_MS);
  });

  groupList.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pressPointerId || pressTimer == null) return;
    if (Math.hypot(event.clientX - startX, event.clientY - startY) > GROUP_LONG_PRESS_MOVE_PX) cancelPress();
  });

  groupList.addEventListener('pointerup', (event) => {
    if (event.pointerId === pressPointerId) cancelPress();
  });
  groupList.addEventListener('pointercancel', cancelPress);

  groupList.addEventListener('click', (event) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('pointerdown', (event) => {
    if (!mobileGroupMenu || mobileGroupMenu.contains(event.target)) return;
    closeMobileGroupMenu();
  }, true);

  groupList.addEventListener('scroll', closeMobileGroupMenu, { passive: true });
  window.addEventListener('resize', closeMobileGroupMenu);
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
installSettingsToastTopLayerFix();
installToolbarMenuFix();
installEditorViewSourceLineSync();
installMobileGroupLongPress();
void refreshRuntimeCache();

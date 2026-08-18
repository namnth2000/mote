import spriteMarkup from '../assets/icons/mote-icons.svg?raw';
import baseCss from './styles.css?inline';
import interactionCss from './interactions.css?inline';
import featureCss from './features.css?inline';
import './features.js';

const ICON_MARKER = 'mote-icons.svg#';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const MOBILE_MAX = 760;
const RUNTIME_CACHE_PREFIX = 'mote-runtime-';
const CURRENT_CACHE = 'mote-runtime-v4';

function installCssFallback() {
  if (document.querySelector('#mote-css-fallback')) return;
  const style = document.createElement('style');
  style.id = 'mote-css-fallback';
  style.textContent = `${baseCss}\n${interactionCss}\n${featureCss}`;
  document.head.append(style);
}

function installInlineSprite() {
  if (document.querySelector('#mote-icon-sprite')) return;

  const template = document.createElement('template');
  template.innerHTML = spriteMarkup.trim();
  const sprite = template.content.querySelector('svg');
  if (!sprite) return;

  sprite.id = 'mote-icon-sprite';
  sprite.setAttribute('aria-hidden', 'true');
  sprite.setAttribute('focusable', 'false');
  sprite.style.position = 'absolute';
  sprite.style.width = '0';
  sprite.style.height = '0';
  sprite.style.overflow = 'hidden';
  sprite.style.pointerEvents = 'none';
  document.body.prepend(sprite);
}

function iconId(use) {
  const href = use.getAttribute('href') || use.getAttribute('xlink:href') || use.getAttributeNS?.(XLINK_NS, 'href') || '';
  if (!href) return null;
  if (href.includes(ICON_MARKER)) return href.slice(href.lastIndexOf('#') + 1);
  if (href.startsWith('#')) return href.slice(1);
  return null;
}

function localizeUse(use) {
  if (!use || use.nodeType !== 1 || String(use.tagName).toLowerCase() !== 'use') return;
  const id = iconId(use);
  if (!id) return;
  const localHref = `#${id}`;
  use.setAttribute('href', localHref);
  try {
    use.setAttributeNS(XLINK_NS, 'xlink:href', localHref);
  } catch {
    use.setAttribute('xlink:href', localHref);
  }
}

function localizeIcons(root) {
  if (!root) return;
  if (root.nodeType === 1 && String(root.tagName).toLowerCase() === 'use') localizeUse(root);
  root.querySelectorAll?.('use').forEach(localizeUse);
}

function installIconStyle() {
  if (document.querySelector('#mote-inline-icon-style')) return;
  const style = document.createElement('style');
  style.id = 'mote-inline-icon-style';
  style.textContent = '.icon .i{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}';
  document.head.append(style);
}

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
      form?.reset();
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
    if (top + height > window.innerHeight - margin) top = Math.max(margin, anchor.top - height - 6);
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
    for (const details of document.querySelectorAll('.toolbar-menu[open]')) positionToolbarPopover(details);
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

installCssFallback();
installIconStyle();
installInlineSprite();
localizeIcons(document);
fixGroupDialogCancel();
installToolbarMenuFix();
void refreshRuntimeCache();

const iconObserver = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node?.nodeType === 1) localizeIcons(node);
    }
  }
});

iconObserver.observe(document.body, { childList: true, subtree: true });

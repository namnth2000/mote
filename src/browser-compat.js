import spriteMarkup from '../assets/icons/mote-icons.svg?raw';
import './features.css';
import './features.js';

const ICON_MARKER = 'mote-icons.svg#';
const MOBILE_MAX = 760;
const parser = new DOMParser();
const spriteDocument = parser.parseFromString(spriteMarkup, 'image/svg+xml');
const symbols = new Map(
  [...spriteDocument.querySelectorAll('symbol[id]')].map((symbol) => [symbol.id, symbol])
);

function iconId(use) {
  const href = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
  if (!href) return null;
  if (href.includes(ICON_MARKER)) return href.slice(href.lastIndexOf('#') + 1);
  if (href.startsWith('#')) return href.slice(1);
  return null;
}

function hydrateUse(use) {
  if (!(use instanceof Element) || use.tagName.toLowerCase() !== 'use') return;
  const id = iconId(use);
  const symbol = id ? symbols.get(id) : null;
  const svg = use.closest('svg');
  if (!id || !symbol || !svg || svg.dataset.iconHydrated === id) return;

  const viewBox = symbol.getAttribute('viewBox');
  if (viewBox) svg.setAttribute('viewBox', viewBox);
  const fragment = document.createDocumentFragment();
  for (const child of symbol.children) fragment.append(child.cloneNode(true));
  svg.replaceChildren(fragment);
  svg.dataset.iconHydrated = id;
}

function hydrateIcons(root) {
  if (!(root instanceof Element || root instanceof Document)) return;
  if (root instanceof Element && root.tagName.toLowerCase() === 'use') hydrateUse(root);
  root.querySelectorAll?.('svg use').forEach(hydrateUse);
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
    const width = popover.offsetWidth;
    const height = popover.offsetHeight;
    const margin = 8;
    let left = anchor.left;
    if (details.classList.contains('more-format-menu')) left = anchor.right - width;
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

installIconStyle();
hydrateIcons(document);
fixGroupDialogCancel();
installToolbarMenuFix();

const iconObserver = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node instanceof Element) hydrateIcons(node);
    }
  }
});
iconObserver.observe(document.body, { childList: true, subtree: true });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then((registration) => registration?.update()).catch(() => {});
}

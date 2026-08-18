import spriteMarkup from '../assets/icons/mote-icons.svg?raw';

const XLINK_NS = 'http://www.w3.org/1999/xlink';
const ICON_MARKER = 'mote-icons.svg#';

function localizeUse(use) {
  const href =
    use.getAttribute('href') ||
    use.getAttribute('xlink:href') ||
    use.getAttributeNS(XLINK_NS, 'href');

  if (!href || !href.includes(ICON_MARKER)) return;
  const id = href.slice(href.lastIndexOf('#') + 1);
  if (!id) return;

  const localHref = `#${id}`;
  use.setAttribute('href', localHref);
  use.setAttributeNS(XLINK_NS, 'xlink:href', localHref);
}

function localizeIcons(root) {
  if (root instanceof SVGUseElement) localizeUse(root);
  root.querySelectorAll?.('use').forEach(localizeUse);
}

function installInlineSprite() {
  if (!document.querySelector('#mote-icon-sprite')) {
    const template = document.createElement('template');
    template.innerHTML = spriteMarkup.trim();
    const sprite = template.content.firstElementChild;

    if (sprite instanceof SVGElement) {
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
  }

  localizeIcons(document);
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

installInlineSprite();
fixGroupDialogCancel();

const iconObserver = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node instanceof Element) localizeIcons(node);
    }
  }
});

iconObserver.observe(document.body, { childList: true, subtree: true });

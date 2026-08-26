const toastRegion = document.querySelector('#toast-region');
const settingsDialog = document.querySelector('#settings-dialog');
const openSettings = document.querySelector('#open-settings');

function supportsPopover(element) {
  return Boolean(
    element &&
    typeof element.showPopover === 'function' &&
    typeof element.hidePopover === 'function'
  );
}

function isPopoverOpen(element) {
  try {
    return element.matches(':popover-open');
  } catch {
    return false;
  }
}

function bringToastRegionToTop() {
  if (!supportsPopover(toastRegion)) return;

  try {
    if (isPopoverOpen(toastRegion)) toastRegion.hidePopover();
    toastRegion.showPopover();
  } catch (error) {
    console.warn('Toast top-layer promotion skipped:', error);
  }
}

function configureToastPopover() {
  if (!supportsPopover(toastRegion)) return;

  toastRegion.setAttribute('popover', 'manual');
  Object.assign(toastRegion.style, {
    margin: '0',
    border: '0',
    padding: '0',
    background: 'transparent',
    top: 'auto',
    right: 'auto',
    width: 'max-content',
    height: 'auto',
    overflow: 'visible'
  });

  bringToastRegionToTop();

  openSettings?.addEventListener('click', () => {
    window.requestAnimationFrame(() => {
      if (settingsDialog?.open) bringToastRegionToTop();
    });
  });

  settingsDialog?.addEventListener('close', () => {
    window.requestAnimationFrame(bringToastRegionToTop);
  });
}

configureToastPopover();

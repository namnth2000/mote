import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const keyboardSource = readFileSync(new URL('../src/markdown-keyboard.js', import.meta.url), 'utf8');
const toastLayerSource = readFileSync(new URL('../src/toast-top-layer.js', import.meta.url), 'utf8');

test('toast top-layer compatibility is loaded with the existing UI modules', () => {
  assert.match(keyboardSource, /import '\.\/toast-top-layer\.js';/);
});

test('toast region is promoted as a manual popover above Settings after the modal opens', () => {
  assert.match(toastLayerSource, /setAttribute\('popover', 'manual'\)/);
  assert.match(toastLayerSource, /typeof element\.showPopover === 'function'/);
  assert.match(toastLayerSource, /if \(isPopoverOpen\(toastRegion\)\) toastRegion\.hidePopover\(\)/);
  assert.match(toastLayerSource, /toastRegion\.showPopover\(\)/);
  assert.match(toastLayerSource, /openSettings\?\.addEventListener\('click'/);
  assert.match(toastLayerSource, /requestAnimationFrame\(\(\) => \{[\s\S]*?settingsDialog\?\.open[\s\S]*?bringToastRegionToTop\(\)/);
});

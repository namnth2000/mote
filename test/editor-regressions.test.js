import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const markdownSource = readFileSync(new URL('../src/markdown.js', import.meta.url), 'utf8');
const markdownKeyboardSource = readFileSync(new URL('../src/markdown-keyboard.js', import.meta.url), 'utf8');
const interactionsSource = readFileSync(new URL('../src/interactions.js', import.meta.url), 'utf8');
const browserCompatSource = readFileSync(new URL('../src/browser-compat.js', import.meta.url), 'utf8');
const interactionsCss = readFileSync(new URL('../src/interactions.css', import.meta.url), 'utf8');

test('invalid Mermaid blocks are rejected before render without a global error diagram', () => {
  assert.match(markdownSource, /suppressErrorRendering:\s*true/);
  assert.match(markdownSource, /mermaid\.parse\(source,\s*\{\s*suppressErrors:\s*true\s*\}\)/);
  assert.match(markdownSource, /if \(!parsed\)[\s\S]*?showMermaidFallback\(diagram, source\)/);
});

test('mobile Markdown editor stays grow-only through typing and keyboard resize', () => {
  assert.match(appSource, /function resizeMarkdownEditor\(\{ force = false \} = \{\}\)/);
  assert.match(appSource, /const mobileMarkdown = window\.innerWidth <= MOBILE_MAX && markdownMode/);
  assert.match(appSource, /if \(!force && \(focusedMarkdown \|\| mobileMarkdown\)\)[\s\S]*?return;[\s\S]*?textarea\.style\.height = 'auto'/);
  assert.match(appSource, /textarea\.scrollHeight - textarea\.clientHeight/);
  assert.doesNotMatch(appSource, /markdownEditor\.addEventListener\('blur'/);
  assert.match(appSource, /queueMicrotask\(\(\) => resizeMarkdownEditor\(\{ force: true \}\)\)/);
  assert.match(appSource, /window\.addEventListener\('resize', \(\) => \{\s*resizeMarkdownEditor\(\)/);
  assert.doesNotMatch(interactionsSource, /protectMarkdownEditorHeightDuringInsertion/);
  assert.doesNotMatch(interactionsSource, /stabilizeMarkdownEditorScroll/);
  assert.doesNotMatch(interactionsSource, /scrollTop/);
  assert.match(interactionsCss, /#markdown-editor\s*\{[\s\S]*?overflow-anchor:\s*none/);
});

test('Tab indentation is scoped to the Markdown textarea and feeds the normal input flow', () => {
  assert.match(indexSource, /<script type="module" src="\/src\/markdown-keyboard\.js"><\/script>/);
  assert.match(markdownKeyboardSource, /document\.querySelector\('#markdown-editor'\)/);
  assert.match(markdownKeyboardSource, /event\.key !== 'Tab'/);
  assert.match(markdownKeyboardSource, /event\.preventDefault\(\)/);
  assert.match(markdownKeyboardSource, /event\.shiftKey \? 'outdent' : 'indent'/);
  assert.match(markdownKeyboardSource, /dispatchEvent\(new Event\('input', \{ bubbles: true \}\)\)/);
});

test('Settings keeps the shared toast region inside the modal top layer while open', () => {
  assert.match(browserCompatSource, /function installSettingsToastTopLayerFix\(\)/);
  assert.match(browserCompatSource, /document\.querySelector\('#settings-dialog'\)/);
  assert.match(browserCompatSource, /document\.querySelector\('#toast-region'\)/);
  assert.match(browserCompatSource, /dialog\.append\(toastRegion\)/);
  assert.match(browserCompatSource, /openSettings\.addEventListener\('click', \(\) => queueMicrotask\(moveIntoDialog\)\)/);
  assert.match(browserCompatSource, /dialog\.addEventListener\('close', moveBack\)/);
  assert.match(browserCompatSource, /installSettingsToastTopLayerFix\(\)/);
});

test('Preview exposes source-line anchors including table rows', () => {
  assert.match(markdownSource, /marked\.lexer\(source \|\| ''\)/);
  assert.match(markdownSource, /dataset\.sourceLine\s*=\s*String\(startLine\)/);
  assert.match(markdownSource, /function assignTableSourceLines\(/);
  assert.match(markdownSource, /rows\[index\]\.dataset\.sourceLine/);
  assert.match(markdownSource, /container\.dataset\.renderRevision\s*=\s*revision/);
});

test('view switching restores the source line once instead of continuously correcting scroll', () => {
  assert.match(browserCompatSource, /function installEditorViewSourceLineSync\(\)/);
  assert.match(browserCompatSource, /previewSourceLineAtTop\(scroller\)/);
  assert.match(browserCompatSource, /markdownSourceLineAtTop\(scroller, textarea\)/);
  assert.match(browserCompatSource, /scrollSourceLineToTop\(scroller, targetView, anchor\)/);
  assert.match(browserCompatSource, /preview\.dataset\.renderRevision/);
  assert.doesNotMatch(browserCompatSource, /VIEW_SCROLL_RESTORE_WINDOW/);
  assert.doesNotMatch(browserCompatSource, /new MutationObserver/);
});

test('mobile opens the existing group menu with a long press without showing the ellipsis', () => {
  assert.match(browserCompatSource, /GROUP_LONG_PRESS_MS\s*=\s*500/);
  assert.match(browserCompatSource, /function installMobileGroupLongPress\(\)/);
  assert.match(browserCompatSource, /openMobileGroupMenu\(row\)/);
  assert.match(browserCompatSource, /GROUP_LONG_PRESS_MOVE_PX/);
  assert.match(interactionsCss, /\.group-menu\.mobile-longpress-open\s*\{[\s\S]*?display:\s*block !important/);
  assert.match(interactionsCss, /\.mobile-longpress-open > summary\s*\{[\s\S]*?display:\s*none/);
  assert.doesNotMatch(interactionsCss, /grid-template-columns:\s*minmax\(0, 1fr\) 36px/);
});

test('group dialog uses Save as the implicit Enter action', () => {
  assert.match(indexSource, /<button value="cancel" class="text-button" type="button"[^>]*>Cancel<\/button>/);
  assert.match(indexSource, /<button value="default" class="primary-button" type="submit"[^>]*>Save<\/button>/);
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sprite = readFileSync(new URL('../assets/icons/mote-icons.svg', import.meta.url), 'utf8');
const featureCss = readFileSync(new URL('../src/features.css', import.meta.url), 'utf8');
const syntaxHighlightCss = readFileSync(new URL('../src/syntax-highlighting.css', import.meta.url), 'utf8');

test('SVG sprite does not depend on an internal class stylesheet', () => {
  assert.doesNotMatch(sprite, /<style[\s>]/i);
  assert.doesNotMatch(sprite, /class=["']i["']/i);
  assert.match(sprite, /id="plus"[\s\S]*?stroke="currentColor"/);
  assert.match(sprite, /id="x"[\s\S]*?stroke="currentColor"/);
  assert.match(sprite, /id="settings"[\s\S]*?stroke="currentColor"/);
});

test('PDF print stylesheet covers structured Markdown content', () => {
  assert.match(featureCss, /@page\s*\{/);
  assert.match(featureCss, /@media print\s*\{/);
  assert.match(featureCss, /\.print-note-content table/);
  assert.match(featureCss, /\.print-note-content pre/);
  assert.match(featureCss, /\.print-note-content blockquote/);
  assert.match(featureCss, /break-inside:\s*avoid-page/);
});

test('PDF syntax highlighting keeps the high-contrast light palette', () => {
  assert.match(syntaxHighlightCss, /@media print\s*\{/);
  assert.match(syntaxHighlightCss, /\.print-note-content \[class\*='hljs-'\][\s\S]*?print-color-adjust:\s*exact/);
  assert.match(syntaxHighlightCss, /\.print-note-content \.hljs-string[\s\S]*?color:\s*#7f4a12\s*!important/);
  assert.match(syntaxHighlightCss, /\.print-note-content \.hljs-keyword[\s\S]*?color:\s*#a43236\s*!important/);
});

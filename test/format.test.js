import test from 'node:test';
import assert from 'node:assert/strict';
import { formatSelection } from '../src/format.js';

test('bold wraps selected text and keeps the text selected', () => {
  const result = formatSelection({ text: 'Hello world', start: 6, end: 11 }, 'bold');
  assert.equal(result.text, 'Hello **world**');
  assert.equal(result.text.slice(result.start, result.end), 'world');
});

test('link preserves selected label and selects URL for immediate typing', () => {
  const result = formatSelection({ text: 'Google', start: 0, end: 6 }, 'link');
  assert.equal(result.text, '[Google](https://)');
  assert.equal(result.text.slice(result.start, result.end), 'https://');
});

test('code block wraps multiline selection without changing selected source', () => {
  const source = 'const a = 1;\nconst b = 2;';
  const result = formatSelection({ text: source, start: 0, end: source.length }, 'codeBlock');
  assert.equal(result.text, `\`\`\`\n${source}\n\`\`\``);
  assert.equal(result.text.slice(result.start, result.end), source);
});

test('checkbox prefixes all selected lines', () => {
  const source = 'one\ntwo';
  const result = formatSelection({ text: source, start: 0, end: source.length }, 'checkbox');
  assert.equal(result.text, '- [ ] one\n- [ ] two');
});

test('Tab indent inserts two spaces at the caret', () => {
  const result = formatSelection({ text: 'ab', start: 1, end: 1 }, 'indent');
  assert.equal(result.text, 'a  b');
  assert.equal(result.start, 3);
  assert.equal(result.end, 3);
});

test('Tab indent prefixes selected lines without including the next unselected line', () => {
  const source = 'one\ntwo\nthree';
  const result = formatSelection({ text: source, start: 0, end: 'one\ntwo\n'.length }, 'indent');
  assert.equal(result.text, '  one\n  two\nthree');
  assert.equal(result.text.slice(result.start, result.end), '  one\n  two');
});

test('Shift+Tab removes up to two leading spaces from selected lines', () => {
  const source = '  one\n two\nthree';
  const result = formatSelection({ text: source, start: 0, end: source.length }, 'outdent');
  assert.equal(result.text, 'one\ntwo\nthree');
  assert.equal(result.text.slice(result.start, result.end), 'one\ntwo\nthree');
});

test('Shift+Tab outdents the current line and keeps the caret aligned', () => {
  const result = formatSelection({ text: '  item', start: 6, end: 6 }, 'outdent');
  assert.equal(result.text, 'item');
  assert.equal(result.start, 4);
  assert.equal(result.end, 4);
});

test('mermaid inserts a ready-to-edit fenced diagram block', () => {
  const result = formatSelection({ text: '', start: 0, end: 0 }, 'mermaid');
  assert.match(result.text, /^```mermaid\n/);
  assert.match(result.text, /flowchart LR/);
  assert.match(result.text, /```$/);
});

test('image inserts Markdown image syntax and selects the URL', () => {
  const result = formatSelection({ text: '', start: 0, end: 0 }, 'image');
  assert.equal(result.text, '![Alt text](https://)');
  assert.equal(result.text.slice(result.start, result.end), 'https://');
});

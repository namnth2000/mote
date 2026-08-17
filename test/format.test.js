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

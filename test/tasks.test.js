import assert from 'node:assert/strict';
import test from 'node:test';
import { setTaskChecked } from '../src/tasks.js';

test('checks and unchecks task items by rendered order', () => {
  const markdown = '- [ ] First\n- [x] Second\n- Normal item';
  assert.equal(setTaskChecked(markdown, 0, true), '- [x] First\n- [x] Second\n- Normal item');
  assert.equal(setTaskChecked(markdown, 1, false), '- [ ] First\n- [ ] Second\n- Normal item');
});

test('supports nested and blockquoted task items', () => {
  const markdown = '- Parent\n  - [ ] Nested\n> - [ ] Quoted';
  assert.equal(setTaskChecked(markdown, 1, true), '- Parent\n  - [ ] Nested\n> - [x] Quoted');
});

test('does not treat fenced code examples as interactive tasks', () => {
  const markdown = '```md\n- [ ] Example only\n```\n- [ ] Real task';
  assert.equal(setTaskChecked(markdown, 0, true), '```md\n- [ ] Example only\n```\n- [x] Real task');
});

test('preserves CRLF line endings', () => {
  const markdown = '- [ ] One\r\n- [ ] Two';
  assert.equal(setTaskChecked(markdown, 1, true), '- [ ] One\r\n- [x] Two');
});

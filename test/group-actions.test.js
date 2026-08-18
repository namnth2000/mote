import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dbSource = readFileSync(new URL('../src/db.js', import.meta.url), 'utf8');
const interactionsSource = readFileSync(new URL('../src/interactions.js', import.meta.url), 'utf8');
const interactionsCss = readFileSync(new URL('../src/interactions.css', import.meta.url), 'utf8');

test('group deletion can move contained notes to Trash without orphaning them', () => {
  assert.match(dbSource, /export async function deleteGroupAndMoveNotesToTrash\(groupId\)/);
  assert.match(dbSource, /groupId:\s*null/);
  assert.match(dbSource, /deletedAt:\s*note\.deletedAt \?\? now/);
  assert.match(dbSource, /groupsStore\.delete\(groupId\)/);
});

test('group menu exposes separate delete-only and delete-with-notes actions', () => {
  assert.match(interactionsSource, /deleteGroupOnly:\s*'Xóa nhóm'/);
  assert.match(interactionsSource, /deleteGroupAndNotes:\s*'Xóa nhóm và ghi chú'/);
  assert.match(interactionsSource, /confirmDeleteGroupAndNotes/);
  assert.match(interactionsSource, /await waitForPendingSave\(\)/);
  assert.match(interactionsSource, /await deleteGroupAndMoveNotesToTrash\(groupId\)/);
  assert.match(interactionsCss, /\.group-menu-popover\s*\{[\s\S]*?width:\s*min\(210px/);
});

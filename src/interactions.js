import './interactions.css';
import './browser-compat.js';
import { deleteGroupAndMoveNotesToTrash } from './db.js';

const NOTE_DRAG_TYPE = 'application/x-mote-note-id';
const COMPACT_MAX = 1199;

const TEXT = {
  vi: {
    moreActions: 'Thao tác ghi chú',
    moveTo: 'Chuyển tới',
    inbox: 'Inbox',
    hide: 'Ẩn',
    unhide: 'Bỏ ẩn',
    delete: 'Xóa',
    restore: 'Khôi phục',
    deleteForever: 'Xóa vĩnh viễn',
    deleteGroupOnly: 'Xóa nhóm',
    deleteGroupAndNotes: 'Xóa nhóm và ghi chú',
    confirmDeleteGroupAndNotes: 'Xóa nhóm này và chuyển toàn bộ ghi chú bên trong vào Thùng rác? Bạn có thể khôi phục ghi chú từ Thùng rác trong 30 ngày.',
    saved: 'Đã lưu',
    saving: 'Đang lưu...',
    saveError: 'Lưu thất bại',
    saveBeforeDeleteFailed: 'Không thể lưu ghi chú hiện tại. Hãy thử lại trước khi xóa nhóm.',
    deleteGroupFailed: 'Không thể xóa nhóm. Hãy thử lại.'
  },
  en: {
    moreActions: 'Note actions',
    moveTo: 'Move to',
    inbox: 'Inbox',
    hide: 'Hide',
    unhide: 'Unhide',
    delete: 'Delete',
    restore: 'Restore',
    deleteForever: 'Delete forever',
    deleteGroupOnly: 'Delete group',
    deleteGroupAndNotes: 'Delete group and notes',
    confirmDeleteGroupAndNotes: 'Delete this group and move all notes inside it to Trash? You can restore the notes from Trash for 30 days.',
    saved: 'Saved',
    saving: 'Saving...',
    saveError: 'Save failed',
    saveBeforeDeleteFailed: 'Could not save the current note. Try again before deleting the group.',
    deleteGroupFailed: 'Could not delete the group. Please try again.'
  }
};

let noteMenu = null;

function language() {
  return document.documentElement.lang === 'en' ? 'en' : 'vi';
}

function t(key) {
  return TEXT[language()][key] ?? TEXT.en[key] ?? key;
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', `/assets/icons/mote-icons.svg#${name}`);
  svg.append(use);
  return svg;
}

function activeCollection() {
  return document.querySelector('.nav-item.is-active[data-collection]')?.dataset.collection ??
    (document.querySelector('.group-row.is-active') ? 'group' : 'inbox');
}

function findNoteRow(noteId) {
  return [...document.querySelectorAll('.note-row[data-note-id]')].find((row) => row.dataset.noteId === noteId) ?? null;
}

function closeNoteMenu() {
  noteMenu?.remove();
  noteMenu = null;
}

function placeFloating(element, anchor) {
  document.body.append(element);
  const anchorRect = anchor.getBoundingClientRect();
  const menuRect = element.getBoundingClientRect();
  const margin = 8;
  let left = anchorRect.right - menuRect.width;
  left = Math.max(margin, Math.min(left, window.innerWidth - menuRect.width - margin));
  let top = anchorRect.bottom + 5;
  if (top + menuRect.height > window.innerHeight - margin) {
    top = Math.max(margin, anchorRect.top - menuRect.height - 5);
  }
  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(top)}px`;
}

async function waitForActiveNote(noteId) {
  const current = findNoteRow(noteId);
  if (!current) return false;
  if (!current.classList.contains('is-active')) current.click();

  const deadline = performance.now() + 1600;
  while (performance.now() < deadline) {
    const row = findNoteRow(noteId);
    if (row?.classList.contains('is-active') && !document.querySelector('#document-shell')?.hidden) return true;
    await new Promise((resolve) => window.setTimeout(resolve, 20));
  }
  return false;
}

function returnToListAfterMutation() {
  if (window.innerWidth > COMPACT_MAX) return;
  window.setTimeout(() => document.querySelector('#editor-back')?.click(), 220);
}

async function runNoteAction(noteId, action) {
  closeNoteMenu();
  const ready = await waitForActiveNote(noteId);
  if (!ready) return;
  action();
  returnToListAfterMutation();
}

function moveNote(noteId, groupId) {
  void runNoteAction(noteId, () => {
    const select = document.querySelector('#move-note');
    if (!select) return;
    const value = groupId ?? '';
    if (![...select.options].some((option) => option.value === value)) return;
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function hideNote(noteId) {
  void runNoteAction(noteId, () => document.querySelector('#hide-note')?.click());
}

function deleteNote(noteId) {
  void runNoteAction(noteId, () => document.querySelector('#delete-note')?.click());
}

function restoreNote(noteId) {
  void runNoteAction(noteId, () => document.querySelector('#restore-note')?.click());
}

function menuButton({ label, iconName, danger = false, onClick }) {
  const button = document.createElement('button');
  button.type = 'button';
  if (danger) button.classList.add('danger');
  button.append(icon(iconName), document.createTextNode(label));
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    onClick();
  });
  return button;
}

function groupTargets() {
  return [...document.querySelectorAll('.group-row[data-group-id]')].map((row) => ({
    id: row.dataset.groupId,
    name: row.querySelector('.group-row-label')?.textContent?.trim() || 'Group'
  }));
}

function openNoteMenu(trigger, noteId) {
  closeNoteMenu();
  const menu = document.createElement('div');
  menu.className = 'note-actions-popover floating-popover';
  menu.addEventListener('click', (event) => event.stopPropagation());

  const collection = activeCollection();
  if (collection === 'trash') {
    menu.append(
      menuButton({ label: t('restore'), iconName: 'history', onClick: () => restoreNote(noteId) }),
      menuButton({ label: t('deleteForever'), iconName: 'trash', danger: true, onClick: () => deleteNote(noteId) })
    );
  } else {
    const heading = document.createElement('div');
    heading.className = 'popover-section-label';
    heading.textContent = t('moveTo');
    menu.append(heading);
    menu.append(menuButton({ label: t('inbox'), iconName: 'inbox', onClick: () => moveNote(noteId, null) }));
    for (const group of groupTargets()) {
      menu.append(menuButton({ label: group.name, iconName: 'folder', onClick: () => moveNote(noteId, group.id) }));
    }
    const separator = document.createElement('div');
    separator.className = 'popover-separator';
    menu.append(separator);
    menu.append(
      menuButton({
        label: collection === 'hidden' ? t('unhide') : t('hide'),
        iconName: 'eye-off',
        onClick: () => hideNote(noteId)
      }),
      menuButton({ label: t('delete'), iconName: 'trash', danger: true, onClick: () => deleteNote(noteId) })
    );
  }

  noteMenu = menu;
  placeFloating(menu, trigger);
}

function enhanceNoteRows() {
  for (const row of document.querySelectorAll('#note-list > .note-row[data-note-id]')) {
    if (row.dataset.actionsEnhanced === 'true') continue;
    row.dataset.actionsEnhanced = 'true';
    row.draggable = activeCollection() !== 'trash';

    const wrapper = document.createElement('div');
    wrapper.className = 'note-row-wrap';
    row.before(wrapper);
    wrapper.append(row);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'note-row-actions';
    trigger.title = t('moreActions');
    trigger.setAttribute('aria-label', t('moreActions'));
    trigger.append(icon('more-vertical'));
    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openNoteMenu(trigger, row.dataset.noteId);
    });
    wrapper.append(trigger);

    row.addEventListener('dragstart', (event) => {
      if (!event.dataTransfer || activeCollection() === 'trash') {
        event.preventDefault();
        return;
      }
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(NOTE_DRAG_TYPE, row.dataset.noteId);
      event.dataTransfer.setData('text/plain', row.dataset.noteId);
      wrapper.classList.add('is-dragging-note');
      closeNoteMenu();
    });
    row.addEventListener('dragend', () => {
      wrapper.classList.remove('is-dragging-note');
      clearDropTargets();
    });
  }
}

function draggedNoteId(event) {
  if (!event.dataTransfer) return null;
  return event.dataTransfer.getData(NOTE_DRAG_TYPE) || event.dataTransfer.getData('text/plain') || null;
}

function isMoteDrag(event) {
  const types = [...(event.dataTransfer?.types ?? [])];
  return types.includes(NOTE_DRAG_TYPE) || types.includes('text/plain');
}

function clearDropTargets() {
  for (const node of document.querySelectorAll('.is-drop-target')) node.classList.remove('is-drop-target');
}

function bindDropTarget(node, onDrop) {
  if (!node || node.dataset.dropBound === 'true') return;
  node.dataset.dropBound = 'true';
  node.addEventListener('dragenter', (event) => {
    if (!isMoteDrag(event)) return;
    event.preventDefault();
    node.classList.add('is-drop-target');
  });
  node.addEventListener('dragover', (event) => {
    if (!isMoteDrag(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    node.classList.add('is-drop-target');
  });
  node.addEventListener('dragleave', (event) => {
    if (event.relatedTarget instanceof Node && node.contains(event.relatedTarget)) return;
    node.classList.remove('is-drop-target');
  });
  node.addEventListener('drop', (event) => {
    if (!isMoteDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    const noteId = draggedNoteId(event);
    clearDropTargets();
    if (noteId) onDrop(noteId);
  });
}

function positionGroupPopover(details) {
  if (!details.open) return;
  const summary = details.querySelector(':scope > summary');
  const popover = details.querySelector('.group-menu-popover');
  if (!summary || !popover) return;
  window.requestAnimationFrame(() => {
    if (!details.open) return;
    const rect = summary.getBoundingClientRect();
    const width = popover.offsetWidth || 210;
    const margin = 8;
    const left = Math.max(margin, Math.min(rect.right - width, window.innerWidth - width - margin));
    let top = rect.bottom + 4;
    const height = popover.offsetHeight;
    if (top + height > window.innerHeight - margin) top = Math.max(margin, rect.top - height - 4);
    popover.style.left = `${Math.round(left)}px`;
    popover.style.top = `${Math.round(top)}px`;
  });
}

async function waitForPendingSave() {
  const status = document.querySelector('#save-status');
  const documentShell = document.querySelector('#document-shell');
  if (!status || documentShell?.hidden) return true;

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
  const deadline = performance.now() + 2500;

  while (performance.now() < deadline) {
    const value = status.textContent?.trim();
    if (value === t('saved')) return true;
    if (value === t('saveError')) return false;
    await new Promise((resolve) => window.setTimeout(resolve, 25));
  }

  return status.textContent?.trim() === t('saved');
}

async function deleteGroupWithNotes(row, details) {
  const groupId = row.dataset.groupId;
  if (!groupId || !window.confirm(t('confirmDeleteGroupAndNotes'))) return;
  details.removeAttribute('open');

  if (!(await waitForPendingSave())) {
    window.alert(t('saveBeforeDeleteFailed'));
    return;
  }

  try {
    await deleteGroupAndMoveNotesToTrash(groupId);
    window.location.reload();
  } catch (error) {
    console.error('Delete group with notes failed:', error);
    window.alert(t('deleteGroupFailed'));
  }
}

function enhanceGroups() {
  for (const row of document.querySelectorAll('.group-row[data-group-id]')) {
    bindDropTarget(row, (noteId) => moveNote(noteId, row.dataset.groupId));
    const details = row.querySelector('.group-menu');
    const popover = details?.querySelector('.group-menu-popover');

    if (popover) {
      const deleteOnly = popover.querySelector('button.danger:not([data-delete-group-with-notes])');
      if (deleteOnly) deleteOnly.replaceChildren(icon('trash'), document.createTextNode(t('deleteGroupOnly')));

      if (!popover.querySelector('[data-delete-group-with-notes]')) {
        const deleteWithNotes = menuButton({
          label: t('deleteGroupAndNotes'),
          iconName: 'trash',
          danger: true,
          onClick: () => void deleteGroupWithNotes(row, details)
        });
        deleteWithNotes.dataset.deleteGroupWithNotes = 'true';
        popover.append(deleteWithNotes);
      } else {
        const deleteWithNotes = popover.querySelector('[data-delete-group-with-notes]');
        deleteWithNotes.replaceChildren(icon('trash'), document.createTextNode(t('deleteGroupAndNotes')));
      }
    }

    if (details && details.dataset.portalBound !== 'true') {
      details.dataset.portalBound = 'true';
      details.addEventListener('toggle', () => positionGroupPopover(details));
    }
  }
}

function bindStaticDropTargets() {
  bindDropTarget(document.querySelector('.nav-item[data-collection="trash"]'), (noteId) => deleteNote(noteId));
  bindDropTarget(document.querySelector('.nav-item[data-collection="inbox"]'), (noteId) => moveNote(noteId, null));
}

function enhanceDynamicUi() {
  enhanceNoteRows();
  enhanceGroups();
}

const observer = new MutationObserver(enhanceDynamicUi);
const noteList = document.querySelector('#note-list');
const groupList = document.querySelector('#group-list');
if (noteList) observer.observe(noteList, { childList: true });
if (groupList) observer.observe(groupList, { childList: true });

const languageObserver = new MutationObserver(enhanceGroups);
languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

bindStaticDropTargets();
enhanceDynamicUi();

document.addEventListener('click', (event) => {
  if (noteMenu && !noteMenu.contains(event.target) && !event.target.closest('.note-row-actions')) closeNoteMenu();
});
window.addEventListener('resize', () => {
  closeNoteMenu();
  for (const details of document.querySelectorAll('.group-menu[open]')) positionGroupPopover(details);
});
document.querySelector('.note-list')?.addEventListener('scroll', closeNoteMenu, { passive: true });
document.querySelector('.group-list')?.addEventListener('scroll', () => {
  for (const details of document.querySelectorAll('.group-menu[open]')) positionGroupPopover(details);
}, { passive: true });
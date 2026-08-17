import './styles.css';
import {
  cleanupExpiredTrash,
  createBackupSnapshot,
  createId,
  deleteGroupAndMoveNotesToInbox,
  getGroups,
  getNotes,
  getSettings,
  openDatabase,
  permanentlyDeleteNote,
  replaceAllData,
  saveGroup,
  saveNote,
  setSetting
} from './db.js';
import { formatSelection } from './format.js';
import { renderMarkdown } from './markdown.js';

const DEFAULT_SETTINGS = {
  theme: 'system',
  language: 'vi',
  editor_view: 'preview',
  scrollspy_enabled: 'true'
};

const STRINGS = {
  vi: {
    inbox: 'Inbox',
    favorites: 'Yêu thích',
    hidden: 'Đã ẩn',
    trash: 'Thùng rác',
    groups: 'Nhóm',
    settings: 'Cài đặt',
    notes: 'Ghi chú',
    search: 'Tìm kiếm',
    searchPlaceholder: 'Tìm ghi chú...',
    noNoteSelected: 'Chưa chọn ghi chú',
    chooseOrCreate: 'Chọn một ghi chú hoặc tạo ghi chú mới.',
    groupName: 'Tên nhóm',
    cancel: 'Hủy',
    save: 'Lưu',
    theme: 'Giao diện',
    language: 'Ngôn ngữ',
    showOutline: 'Hiện mục lục trên desktop',
    data: 'Dữ liệu',
    dataHelp: 'Ghi chú được lưu trong trình duyệt này. Hãy export backup trước khi xóa dữ liệu trình duyệt hoặc đổi thiết bị.',
    importMarkdown: 'Import .md',
    exportBackup: 'Export backup',
    importBackup: 'Import backup',
    outline: 'Mục lục',
    hide: 'Ẩn',
    unhide: 'Bỏ ẩn',
    restore: 'Khôi phục',
    delete: 'Xóa',
    deleteForever: 'Xóa vĩnh viễn',
    saved: 'Đã lưu',
    saving: 'Đang lưu...',
    saveError: 'Lưu thất bại',
    noNotes: 'Chưa có ghi chú.',
    untitled: 'Không tiêu đề',
    newGroup: 'Nhóm mới',
    renameGroup: 'Đổi tên nhóm',
    confirmDeleteGroup: 'Xóa nhóm này? Các ghi chú trong nhóm sẽ được chuyển về Inbox.',
    confirmDeleteForever: 'Xóa vĩnh viễn ghi chú này? Thao tác này không thể hoàn tác.',
    copied: 'Đã copy Markdown.',
    copyFailed: 'Không thể copy vào clipboard.',
    exported: 'Đã export ghi chú.',
    backupExported: 'Đã export backup.',
    backupImported: 'Đã import backup.',
    backupInvalid: 'Backup không hợp lệ.',
    markdownImported: 'Đã import Markdown.',
    browserStorageError: 'Không thể mở local database trong trình duyệt này.',
    importConfirm: 'Import backup sẽ thay thế toàn bộ dữ liệu hiện tại. Tiếp tục?',
    moveTo: 'Chuyển tới'
  },
  en: {
    inbox: 'Inbox',
    favorites: 'Favorites',
    hidden: 'Hidden',
    trash: 'Trash',
    groups: 'Groups',
    settings: 'Settings',
    notes: 'Notes',
    search: 'Search',
    searchPlaceholder: 'Search notes...',
    noNoteSelected: 'No note selected',
    chooseOrCreate: 'Choose a note or create a new one.',
    groupName: 'Group name',
    cancel: 'Cancel',
    save: 'Save',
    theme: 'Theme',
    language: 'Language',
    showOutline: 'Show outline on desktop',
    data: 'Data',
    dataHelp: 'Your notes stay in this browser. Export a backup before clearing browser data or changing devices.',
    importMarkdown: 'Import .md',
    exportBackup: 'Export backup',
    importBackup: 'Import backup',
    outline: 'Outline',
    hide: 'Hide',
    unhide: 'Unhide',
    restore: 'Restore',
    delete: 'Delete',
    deleteForever: 'Delete forever',
    saved: 'Saved',
    saving: 'Saving...',
    saveError: 'Save failed',
    noNotes: 'No notes yet.',
    untitled: 'Untitled',
    newGroup: 'New group',
    renameGroup: 'Rename group',
    confirmDeleteGroup: 'Delete this group? Its notes will be moved to Inbox.',
    confirmDeleteForever: 'Delete this note forever? This cannot be undone.',
    copied: 'Markdown copied.',
    copyFailed: 'Could not copy to clipboard.',
    exported: 'Note exported.',
    backupExported: 'Backup exported.',
    backupImported: 'Backup imported.',
    backupInvalid: 'Invalid backup.',
    markdownImported: 'Markdown imported.',
    browserStorageError: 'Could not open the local browser database.',
    importConfirm: 'Importing a backup will replace all current data. Continue?',
    moveTo: 'Move to'
  }
};

const state = {
  groups: [],
  notes: [],
  settings: { ...DEFAULT_SETTINGS },
  collection: { type: 'inbox', groupId: null },
  currentNoteId: null,
  search: '',
  saveTimer: null,
  editRevision: 0,
  savedRevision: 0,
  previewRevision: 0,
  groupDialogMode: 'create',
  groupDialogId: null,
  currentHeadings: []
};

const el = {
  app: document.querySelector('#app'),
  groupList: document.querySelector('#group-list'),
  addGroup: document.querySelector('#add-group'),
  collectionTitle: document.querySelector('#collection-title'),
  searchInput: document.querySelector('#search-input'),
  noteList: document.querySelector('#note-list'),
  newNote: document.querySelector('#new-note'),
  emptyEditor: document.querySelector('#empty-editor'),
  documentShell: document.querySelector('#document-shell'),
  noteTitle: document.querySelector('#note-title'),
  saveStatus: document.querySelector('#save-status'),
  favoriteNote: document.querySelector('#favorite-note'),
  moveNote: document.querySelector('#move-note'),
  hideNote: document.querySelector('#hide-note'),
  restoreNote: document.querySelector('#restore-note'),
  deleteNote: document.querySelector('#delete-note'),
  markdownView: document.querySelector('#markdown-view'),
  markdownEditor: document.querySelector('#markdown-editor'),
  previewView: document.querySelector('#preview-view'),
  formatToolbar: document.querySelector('#format-toolbar'),
  copyNote: document.querySelector('#copy-note'),
  exportNote: document.querySelector('#export-note'),
  viewButtons: [...document.querySelectorAll('[data-view]')],
  navButtons: [...document.querySelectorAll('[data-collection]')],
  countNodes: [...document.querySelectorAll('[data-count]')],
  openSettings: document.querySelector('#open-settings'),
  settingsDialog: document.querySelector('#settings-dialog'),
  themeSetting: document.querySelector('#theme-setting'),
  languageSetting: document.querySelector('#language-setting'),
  outlineSetting: document.querySelector('#outline-setting'),
  importMd: document.querySelector('#import-md'),
  mdFileInput: document.querySelector('#md-file-input'),
  exportBackup: document.querySelector('#export-backup'),
  importBackup: document.querySelector('#import-backup'),
  backupFileInput: document.querySelector('#backup-file-input'),
  groupDialog: document.querySelector('#group-dialog'),
  groupForm: document.querySelector('#group-form'),
  groupDialogTitle: document.querySelector('#group-dialog-title'),
  groupName: document.querySelector('#group-name'),
  mobileBack: document.querySelector('#mobile-back'),
  outline: document.querySelector('#outline'),
  outlineList: document.querySelector('#outline-list'),
  toastRegion: document.querySelector('#toast-region')
};

function t(key) {
  const language = state.settings.language === 'en' ? 'en' : 'vi';
  return STRINGS[language][key] ?? STRINGS.en[key] ?? key;
}

function currentNote() {
  return state.notes.find((note) => note.id === state.currentNoteId) ?? null;
}

function nowIso() {
  return new Date().toISOString();
}

function resolvedTheme() {
  if (state.settings.theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return state.settings.theme === 'dark' ? 'dark' : 'light';
}

function applyTheme() {
  const theme = resolvedTheme();
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#191918' : '#F4C95D');
}

function applyLanguage() {
  document.documentElement.lang = state.settings.language === 'en' ? 'en' : 'vi';
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  el.searchInput.placeholder = t('searchPlaceholder');
  for (const button of el.navButtons) {
    const label = button.querySelector('span:first-child');
    if (label) label.textContent = t(button.dataset.collection);
  }
  renderCollectionTitle();
  renderNoteList();
  renderEditor();
}

function applySettingsToControls() {
  el.themeSetting.value = state.settings.theme;
  el.languageSetting.value = state.settings.language;
  el.outlineSetting.checked = state.settings.scrollspy_enabled !== 'false';
}

function toast(message) {
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  el.toastRegion.append(node);
  window.setTimeout(() => node.remove(), 1800);
}

function plainSnippet(markdown) {
  return (markdown || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function noteTitle(note) {
  return note.title?.trim() || t('untitled');
}

function selectedCollectionNotes() {
  const { type, groupId } = state.collection;
  const query = state.search.trim().toLocaleLowerCase();

  let notes = state.notes.filter((note) => {
    if (type === 'trash') return Boolean(note.deletedAt);
    if (note.deletedAt) return false;
    if (type === 'hidden') return Boolean(note.isHidden);
    if (note.isHidden) return false;
    if (type === 'favorites') return Boolean(note.isFavorite);
    if (type === 'group') return note.groupId === groupId;
    return note.groupId == null;
  });

  if (query) {
    notes = notes.filter((note) => `${note.title}\n${note.contentMarkdown}`.toLocaleLowerCase().includes(query));
  }

  return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function renderCounts() {
  const counts = {
    inbox: state.notes.filter((n) => !n.deletedAt && !n.isHidden && n.groupId == null).length,
    favorites: state.notes.filter((n) => !n.deletedAt && !n.isHidden && n.isFavorite).length,
    hidden: state.notes.filter((n) => !n.deletedAt && n.isHidden).length,
    trash: state.notes.filter((n) => Boolean(n.deletedAt)).length
  };
  for (const node of el.countNodes) node.textContent = counts[node.dataset.count] || '';
}

function renderGroups() {
  el.groupList.replaceChildren();

  for (const group of state.groups) {
    const row = document.createElement('div');
    row.className = `group-row${state.collection.type === 'group' && state.collection.groupId === group.id ? ' is-active' : ''}`;
    row.dataset.groupId = group.id;
    row.tabIndex = 0;
    row.setAttribute('role', 'button');

    const label = document.createElement('span');
    label.className = 'group-row-label';
    label.textContent = group.name;
    label.title = group.name;

    const rename = document.createElement('button');
    rename.type = 'button';
    rename.className = 'mini-action';
    rename.textContent = '✎';
    rename.title = t('renameGroup');
    rename.setAttribute('aria-label', t('renameGroup'));
    rename.addEventListener('click', (event) => {
      event.stopPropagation();
      openGroupDialog('rename', group);
    });

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'mini-action';
    remove.textContent = '×';
    remove.title = t('delete');
    remove.setAttribute('aria-label', t('delete'));
    remove.addEventListener('click', async (event) => {
      event.stopPropagation();
      if (!window.confirm(t('confirmDeleteGroup'))) return;
      await flushSave();
      await deleteGroupAndMoveNotesToInbox(group.id);
      if (state.collection.type === 'group' && state.collection.groupId === group.id) state.collection = { type: 'inbox', groupId: null };
      await reloadData();
      selectFirstVisibleNote();
      renderAll();
    });

    row.append(label, rename, remove);
    row.addEventListener('click', () => selectCollection({ type: 'group', groupId: group.id }));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectCollection({ type: 'group', groupId: group.id });
      }
    });
    el.groupList.append(row);
  }
}

function renderCollectionTitle() {
  const { type, groupId } = state.collection;
  if (type === 'group') {
    el.collectionTitle.textContent = state.groups.find((group) => group.id === groupId)?.name ?? t('groups');
  } else {
    el.collectionTitle.textContent = t(type);
  }
  el.newNote.disabled = type === 'trash';
}

function renderNavSelection() {
  for (const button of el.navButtons) button.classList.toggle('is-active', state.collection.type === button.dataset.collection);
}

function renderNoteList() {
  const notes = selectedCollectionNotes();
  el.noteList.replaceChildren();

  if (!notes.length) {
    const empty = document.createElement('div');
    empty.className = 'list-empty';
    empty.textContent = t('noNotes');
    el.noteList.append(empty);
    return;
  }

  for (const note of notes) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `note-row${note.id === state.currentNoteId ? ' is-active' : ''}`;
    row.dataset.noteId = note.id;

    const title = document.createElement('div');
    title.className = 'note-row-title';
    const titleText = document.createElement('span');
    titleText.textContent = noteTitle(note);
    title.append(titleText);
    if (note.isFavorite && !note.deletedAt) {
      const star = document.createElement('span');
      star.className = 'favorite-dot';
      star.textContent = '★';
      title.append(star);
    }

    const snippet = document.createElement('div');
    snippet.className = 'note-row-snippet';
    snippet.textContent = plainSnippet(note.contentMarkdown) || ' ';

    const time = document.createElement('div');
    time.className = 'note-row-time';
    time.textContent = new Intl.DateTimeFormat(state.settings.language === 'en' ? 'en' : 'vi', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(note.updatedAt));

    row.append(title, snippet, time);
    row.addEventListener('click', async () => {
      await flushSave();
      state.currentNoteId = note.id;
      state.editRevision = 0;
      state.savedRevision = 0;
      renderNoteList();
      renderEditor();
      if (window.innerWidth <= 760) document.body.classList.add('mobile-editor-open');
    });
    el.noteList.append(row);
  }
}

function resizeMarkdownEditor() {
  const textarea = el.markdownEditor;
  textarea.style.height = 'auto';
  const minimum = Math.max(320, Math.round(window.innerHeight * 0.62));
  textarea.style.height = `${Math.max(minimum, textarea.scrollHeight + 4)}px`;
}

function renderMoveOptions(note) {
  el.moveNote.replaceChildren();
  const inbox = document.createElement('option');
  inbox.value = '';
  inbox.textContent = t('inbox');
  el.moveNote.append(inbox);
  for (const group of state.groups) {
    const option = document.createElement('option');
    option.value = group.id;
    option.textContent = group.name;
    el.moveNote.append(option);
  }
  el.moveNote.value = note.groupId ?? '';
  el.moveNote.title = t('moveTo');
}

function setSaveStatus(status) {
  el.saveStatus.classList.toggle('is-error', status === 'error');
  el.saveStatus.textContent = status === 'saving' ? t('saving') : status === 'error' ? t('saveError') : t('saved');
}

function editorIsReadOnly(note) {
  return Boolean(note?.deletedAt);
}

function renderEditor() {
  const note = currentNote();
  const hasNote = Boolean(note);
  el.emptyEditor.hidden = hasNote;
  el.documentShell.hidden = !hasNote;

  if (!note) {
    document.body.classList.remove('mobile-editor-open');
    return;
  }

  el.noteTitle.value = note.title ?? '';
  el.markdownEditor.value = note.contentMarkdown ?? '';
  el.favoriteNote.textContent = note.isFavorite ? '★' : '☆';
  el.favoriteNote.title = t('favorites');
  el.hideNote.textContent = note.isHidden ? t('unhide') : t('hide');
  el.restoreNote.hidden = !note.deletedAt;
  el.deleteNote.textContent = note.deletedAt ? t('deleteForever') : t('delete');
  renderMoveOptions(note);
  setSaveStatus(state.editRevision === state.savedRevision ? 'saved' : 'saving');

  const readOnly = editorIsReadOnly(note);
  el.noteTitle.readOnly = readOnly;
  el.markdownEditor.readOnly = readOnly;
  el.favoriteNote.hidden = readOnly;
  el.moveNote.hidden = readOnly;
  el.hideNote.hidden = readOnly;

  for (const button of el.formatToolbar.querySelectorAll('button')) button.disabled = readOnly || state.settings.editor_view !== 'markdown';

  renderView();
  queueMicrotask(resizeMarkdownEditor);
}

async function renderView() {
  const note = currentNote();
  if (!note) return;

  const isMarkdown = state.settings.editor_view === 'markdown';
  el.markdownView.hidden = !isMarkdown;
  el.previewView.hidden = isMarkdown;
  for (const button of el.viewButtons) button.classList.toggle('is-active', button.dataset.view === state.settings.editor_view);
  for (const button of el.formatToolbar.querySelectorAll('button')) button.disabled = editorIsReadOnly(note) || !isMarkdown;

  if (isMarkdown) {
    el.outline.hidden = true;
    queueMicrotask(resizeMarkdownEditor);
    return;
  }

  const revision = ++state.previewRevision;
  const headings = await renderMarkdown(note.contentMarkdown ?? '', el.previewView, { theme: resolvedTheme() });
  if (revision !== state.previewRevision) return;
  state.currentHeadings = headings;
  renderOutline();
}

function renderOutline() {
  const shouldShow =
    state.settings.scrollspy_enabled !== 'false' &&
    state.settings.editor_view === 'preview' &&
    state.currentHeadings.length >= 2 &&
    window.innerWidth > 1180;

  el.outline.hidden = !shouldShow;
  el.outlineList.replaceChildren();
  if (!shouldShow) return;

  for (const heading of state.currentHeadings) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.headingId = heading.id;
    button.dataset.level = String(heading.level);
    button.textContent = heading.text;
    button.addEventListener('click', () => document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    el.outlineList.append(button);
  }
  updateActiveOutline();
}

function updateActiveOutline() {
  if (el.outline.hidden) return;
  const main = document.querySelector('.document-main');
  const headings = state.currentHeadings.map((item) => document.getElementById(item.id)).filter(Boolean);
  if (!headings.length) return;
  const top = main.getBoundingClientRect().top + 96;
  let active = headings[0];
  for (const heading of headings) {
    if (heading.getBoundingClientRect().top <= top) active = heading;
    else break;
  }
  for (const button of el.outlineList.querySelectorAll('button')) button.classList.toggle('is-active', button.dataset.headingId === active.id);
}

function renderAll() {
  renderCounts();
  renderGroups();
  renderNavSelection();
  renderCollectionTitle();
  renderNoteList();
  renderEditor();
  applySettingsToControls();
}

async function reloadData() {
  [state.groups, state.notes] = await Promise.all([getGroups(), getNotes()]);
}

function selectFirstVisibleNote() {
  const notes = selectedCollectionNotes();
  if (!notes.some((note) => note.id === state.currentNoteId)) state.currentNoteId = notes[0]?.id ?? null;
}

async function selectCollection(collection) {
  await flushSave();
  state.collection = collection;
  state.search = '';
  el.searchInput.value = '';
  selectFirstVisibleNote();
  renderAll();
}

function noteForEdit() {
  const note = currentNote();
  return note && !note.deletedAt ? note : null;
}

function scheduleSave() {
  const note = noteForEdit();
  if (!note) return;
  state.editRevision += 1;
  setSaveStatus('saving');
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(() => void flushSave(), 450);
}

async function flushSave() {
  window.clearTimeout(state.saveTimer);
  state.saveTimer = null;
  const note = noteForEdit();
  if (!note || state.editRevision === state.savedRevision) return;

  const revision = state.editRevision;
  const snapshot = { ...note };
  try {
    await saveNote(snapshot);
    if (revision > state.savedRevision) state.savedRevision = revision;
    if (state.editRevision === revision) setSaveStatus('saved');
    renderNoteList();
    renderCounts();
  } catch (error) {
    console.error(error);
    setSaveStatus('error');
  }
}

function updateCurrentNote(fields) {
  const note = noteForEdit();
  if (!note) return;
  Object.assign(note, fields, { updatedAt: nowIso() });
  scheduleSave();
}

async function createNote() {
  await flushSave();
  if (state.collection.type === 'trash') state.collection = { type: 'inbox', groupId: null };
  const timestamp = nowIso();
  const note = {
    id: createId(),
    groupId: state.collection.type === 'group' ? state.collection.groupId : null,
    title: '',
    contentMarkdown: '',
    isFavorite: state.collection.type === 'favorites',
    isHidden: state.collection.type === 'hidden',
    deletedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  await saveNote(note);
  state.notes.unshift(note);
  state.currentNoteId = note.id;
  state.settings.editor_view = 'markdown';
  await setSetting('editor_view', 'markdown');
  state.editRevision = 0;
  state.savedRevision = 0;
  renderAll();
  document.body.classList.toggle('mobile-editor-open', window.innerWidth <= 760);
  queueMicrotask(() => {
    el.noteTitle.focus();
    el.noteTitle.select();
  });
}

async function mutateCurrentNote(fields) {
  await flushSave();
  const note = currentNote();
  if (!note) return;
  Object.assign(note, fields, { updatedAt: nowIso() });
  await saveNote(note);
  await reloadData();
  selectFirstVisibleNote();
  renderAll();
}

async function softDeleteCurrentNote() {
  const note = currentNote();
  if (!note) return;
  if (note.deletedAt) {
    if (!window.confirm(t('confirmDeleteForever'))) return;
    await permanentlyDeleteNote(note.id);
    state.currentNoteId = null;
    await reloadData();
    selectFirstVisibleNote();
    renderAll();
    return;
  }
  await mutateCurrentNote({ deletedAt: nowIso() });
}

function openGroupDialog(mode, group = null) {
  state.groupDialogMode = mode;
  state.groupDialogId = group?.id ?? null;
  el.groupDialogTitle.textContent = mode === 'rename' ? t('renameGroup') : t('newGroup');
  el.groupName.value = group?.name ?? '';
  el.groupDialog.showModal();
  queueMicrotask(() => {
    el.groupName.focus();
    el.groupName.select();
  });
}

async function submitGroupDialog(event) {
  event.preventDefault();
  const submitter = event.submitter;
  if (submitter?.value === 'cancel') {
    el.groupDialog.close();
    return;
  }
  const name = el.groupName.value.trim();
  if (!name) return;

  const timestamp = nowIso();
  if (state.groupDialogMode === 'rename') {
    const group = state.groups.find((item) => item.id === state.groupDialogId);
    if (group) await saveGroup({ ...group, name, updatedAt: timestamp });
  } else {
    await saveGroup({
      id: createId(),
      name,
      sortOrder: state.groups.length,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }

  el.groupDialog.close();
  await reloadData();
  renderAll();
}

async function setEditorView(view) {
  if (!['preview', 'markdown'].includes(view) || view === state.settings.editor_view) return;
  state.settings.editor_view = view;
  await setSetting('editor_view', view);
  renderView();
}

function applyFormatting(command) {
  const note = noteForEdit();
  if (!note || state.settings.editor_view !== 'markdown') return;
  const result = formatSelection({
    text: el.markdownEditor.value,
    start: el.markdownEditor.selectionStart,
    end: el.markdownEditor.selectionEnd
  }, command);
  el.markdownEditor.value = result.text;
  el.markdownEditor.setSelectionRange(result.start, result.end);
  updateCurrentNote({ contentMarkdown: result.text });
  resizeMarkdownEditor();
  el.markdownEditor.focus({ preventScroll: true });
}

async function copyMarkdown() {
  const note = currentNote();
  if (!note) return;
  try {
    await navigator.clipboard.writeText(note.contentMarkdown ?? '');
    toast(t('copied'));
  } catch {
    toast(t('copyFailed'));
  }
}

function safeFileName(value, fallback = 'mote-note') {
  const cleaned = (value || fallback).trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').replace(/\s+/g, ' ').slice(0, 120);
  return cleaned || fallback;
}

function downloadBlob(content, fileName, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function exportCurrentNote() {
  const note = currentNote();
  if (!note) return;
  downloadBlob(note.contentMarkdown ?? '', `${safeFileName(note.title)}.md`, 'text/markdown;charset=utf-8');
  toast(t('exported'));
}

async function exportBackup() {
  await flushSave();
  const snapshot = await createBackupSnapshot();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadBlob(JSON.stringify(snapshot, null, 2), `mote-backup-${stamp}.json`, 'application/json;charset=utf-8');
  toast(t('backupExported'));
}

function validateBackup(snapshot) {
  if (!snapshot || snapshot.format !== 'mote-backup' || snapshot.version !== 2) throw new Error('Unsupported backup format.');
  if (!Array.isArray(snapshot.groups) || !Array.isArray(snapshot.notes) || typeof snapshot.settings !== 'object') throw new Error('Backup structure is invalid.');

  const groupIds = new Set();
  for (const group of snapshot.groups) {
    if (!group?.id || typeof group.name !== 'string' || groupIds.has(group.id)) throw new Error('Invalid group.');
    groupIds.add(group.id);
  }

  const noteIds = new Set();
  for (const note of snapshot.notes) {
    if (!note?.id || noteIds.has(note.id) || typeof note.contentMarkdown !== 'string') throw new Error('Invalid note.');
    if (note.groupId != null && !groupIds.has(note.groupId)) throw new Error('Broken group relationship.');
    noteIds.add(note.id);
  }
  return snapshot;
}

async function importBackupFile(file) {
  try {
    const snapshot = validateBackup(JSON.parse(await file.text()));
    if (!window.confirm(t('importConfirm'))) return;
    await flushSave();
    await replaceAllData(snapshot);
    state.settings = { ...DEFAULT_SETTINGS, ...await getSettings() };
    applyTheme();
    applyLanguage();
    await reloadData();
    state.collection = { type: 'inbox', groupId: null };
    state.currentNoteId = null;
    selectFirstVisibleNote();
    renderAll();
    toast(t('backupImported'));
  } catch (error) {
    console.error(error);
    toast(t('backupInvalid'));
  }
}

function uniqueImportedTitle(base) {
  const titles = new Set(state.notes.map((note) => note.title));
  if (!titles.has(base)) return base;
  let counter = 2;
  while (titles.has(`${base} (${counter})`)) counter += 1;
  return `${base} (${counter})`;
}

async function importMarkdownFiles(files) {
  const targetGroupId = state.collection.type === 'group' ? state.collection.groupId : null;
  let imported = 0;
  for (const file of files) {
    if (!file.name.toLowerCase().endsWith('.md')) continue;
    const content = await file.text();
    const timestamp = nowIso();
    const baseTitle = file.name.replace(/\.md$/i, '') || t('untitled');
    const note = {
      id: createId(),
      groupId: targetGroupId,
      title: uniqueImportedTitle(baseTitle),
      contentMarkdown: content,
      isFavorite: false,
      isHidden: false,
      deletedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await saveNote(note);
    state.notes.push(note);
    imported += 1;
  }
  if (imported) {
    await reloadData();
    selectFirstVisibleNote();
    renderAll();
    toast(`${t('markdownImported')} (${imported})`);
  }
}

function registerEventHandlers() {
  el.navButtons.forEach((button) => button.addEventListener('click', () => selectCollection({ type: button.dataset.collection, groupId: null })));
  el.addGroup.addEventListener('click', () => openGroupDialog('create'));
  el.groupForm.addEventListener('submit', submitGroupDialog);
  el.newNote.addEventListener('click', createNote);

  el.searchInput.addEventListener('input', () => {
    state.search = el.searchInput.value;
    renderNoteList();
  });

  el.noteTitle.addEventListener('input', () => updateCurrentNote({ title: el.noteTitle.value }));
  el.markdownEditor.addEventListener('input', () => {
    updateCurrentNote({ contentMarkdown: el.markdownEditor.value });
    resizeMarkdownEditor();
  });

  el.formatToolbar.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-format]');
    if (button) applyFormatting(button.dataset.format);
  });

  el.viewButtons.forEach((button) => button.addEventListener('click', () => setEditorView(button.dataset.view)));
  el.copyNote.addEventListener('click', copyMarkdown);
  el.exportNote.addEventListener('click', exportCurrentNote);

  el.favoriteNote.addEventListener('click', () => {
    const note = noteForEdit();
    if (note) void mutateCurrentNote({ isFavorite: !note.isFavorite });
  });
  el.hideNote.addEventListener('click', () => {
    const note = noteForEdit();
    if (note) void mutateCurrentNote({ isHidden: !note.isHidden });
  });
  el.moveNote.addEventListener('change', () => void mutateCurrentNote({ groupId: el.moveNote.value || null }));
  el.restoreNote.addEventListener('click', () => void mutateCurrentNote({ deletedAt: null }));
  el.deleteNote.addEventListener('click', () => void softDeleteCurrentNote());

  el.openSettings.addEventListener('click', () => {
    applySettingsToControls();
    el.settingsDialog.showModal();
  });

  el.themeSetting.addEventListener('change', async () => {
    state.settings.theme = el.themeSetting.value;
    await setSetting('theme', state.settings.theme);
    applyTheme();
    if (state.settings.editor_view === 'preview') renderView();
  });

  el.languageSetting.addEventListener('change', async () => {
    state.settings.language = el.languageSetting.value;
    await setSetting('language', state.settings.language);
    applyLanguage();
  });

  el.outlineSetting.addEventListener('change', async () => {
    state.settings.scrollspy_enabled = String(el.outlineSetting.checked);
    await setSetting('scrollspy_enabled', state.settings.scrollspy_enabled);
    renderOutline();
  });

  el.importMd.addEventListener('click', () => el.mdFileInput.click());
  el.mdFileInput.addEventListener('change', () => {
    const files = [...el.mdFileInput.files];
    el.mdFileInput.value = '';
    void importMarkdownFiles(files);
  });

  el.exportBackup.addEventListener('click', () => void exportBackup());
  el.importBackup.addEventListener('click', () => el.backupFileInput.click());
  el.backupFileInput.addEventListener('change', () => {
    const file = el.backupFileInput.files?.[0];
    el.backupFileInput.value = '';
    if (file) void importBackupFile(file);
  });

  el.mobileBack.addEventListener('click', async () => {
    await flushSave();
    document.body.classList.remove('mobile-editor-open');
  });

  document.querySelector('.document-main')?.addEventListener('scroll', updateActiveOutline, { passive: true });
  window.addEventListener('resize', () => {
    resizeMarkdownEditor();
    renderOutline();
    if (window.innerWidth > 760) document.body.classList.remove('mobile-editor-open');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && state.editRevision !== state.savedRevision) void flushSave();
  });

  window.addEventListener('beforeunload', () => {
    if (state.editRevision !== state.savedRevision) void flushSave();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.settings.theme !== 'system') return;
    applyTheme();
    if (state.settings.editor_view === 'preview') void renderView();
  });

  document.addEventListener('keydown', (event) => {
    const modifier = event.ctrlKey || event.metaKey;
    if (!modifier) return;
    if (event.key.toLowerCase() === 's') {
      event.preventDefault();
      void flushSave();
    }
    if (state.settings.editor_view === 'markdown' && document.activeElement === el.markdownEditor) {
      if (event.key.toLowerCase() === 'b') {
        event.preventDefault();
        applyFormatting('bold');
      } else if (event.key.toLowerCase() === 'i') {
        event.preventDefault();
        applyFormatting('italic');
      } else if (event.key.toLowerCase() === 'k') {
        event.preventDefault();
        applyFormatting('link');
      }
    }
  });
}

async function initialize() {
  try {
    await openDatabase();
    await cleanupExpiredTrash();
    state.settings = { ...DEFAULT_SETTINGS, ...await getSettings() };
    await reloadData();
    applyTheme();
    applySettingsToControls();
    registerEventHandlers();
    applyLanguage();
    selectFirstVisibleNote();
    renderAll();
    el.app.setAttribute('aria-busy', 'false');

    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch((error) => console.warn('Service worker registration failed:', error));
    }
  } catch (error) {
    console.error(error);
    el.app.setAttribute('aria-busy', 'false');
    toast(t('browserStorageError'));
  }
}

void initialize();

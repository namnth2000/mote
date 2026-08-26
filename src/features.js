import { createId, getGroups, getNotes, openDatabase, saveGroup, saveNote } from './db.js';
import { renderMarkdown } from './markdown.js';
import './features.css';
import './syntax-highlighting.css';

const TEXT = {
  vi: {
    importFolder: 'Import folder',
    noMarkdownFiles: 'Không tìm thấy file .md trong folder.',
    importedFolder: 'Đã import folder',
    exportMarkdown: 'Export .md',
    exportText: 'Export .txt',
    exportPdf: 'Export .pdf',
    openingPdf: 'Đang mở bản PDF...',
    exportFailed: 'Export thất bại.'
  },
  en: {
    importFolder: 'Import folder',
    noMarkdownFiles: 'No .md files found in this folder.',
    importedFolder: 'Folder imported',
    exportMarkdown: 'Export .md',
    exportText: 'Export .txt',
    exportPdf: 'Export .pdf',
    openingPdf: 'Opening PDF preview...',
    exportFailed: 'Export failed.'
  }
};

let exportMenu = null;

function language() {
  return document.documentElement.lang === 'en' ? 'en' : 'vi';
}

function t(key) {
  return TEXT[language()][key] ?? TEXT.en[key] ?? key;
}

function toast(message) {
  const region = document.querySelector('#toast-region');
  if (!region) return;
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  region.append(node);
  window.setTimeout(() => node.remove(), 2200);
}

function safeFileName(value, fallback = 'mote-note') {
  const cleaned = (value || fallback)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120);
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
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function currentNoteSnapshot() {
  const shell = document.querySelector('#document-shell');
  if (!shell || shell.hidden) return null;
  return {
    title: document.querySelector('#note-title')?.value?.trim() || 'Untitled',
    markdown: document.querySelector('#markdown-editor')?.value ?? ''
  };
}

function markdownToText(markdown) {
  return (markdown || '')
    .replace(/```[^\n]*\n([\s\S]*?)```/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+\[([ xX])\]\s+/gm, (_, checked) => checked.toLowerCase() === 'x' ? '[x] ' : '[ ] ')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<u>(.*?)<\/u>/gis, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function closeExportMenu() {
  exportMenu?.remove();
  exportMenu = null;
}

function placeMenu(menu, anchor) {
  document.body.append(menu);
  const anchorRect = anchor.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const margin = 8;
  let left = anchorRect.right - menuRect.width;
  left = Math.max(margin, Math.min(left, window.innerWidth - menuRect.width - margin));
  let top = anchorRect.bottom + 6;
  if (top + menuRect.height > window.innerHeight - margin) {
    top = Math.max(margin, anchorRect.top - menuRect.height - 6);
  }
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

function exportMenuButton(label, extension, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  const badge = document.createElement('span');
  badge.className = 'export-format-badge';
  badge.textContent = extension;
  const text = document.createElement('span');
  text.textContent = label;
  button.append(badge, text);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeExportMenu();
    void onClick();
  });
  return button;
}

function ensurePrintRoot() {
  let root = document.querySelector('#mote-print-root');
  if (root) return root;

  root = document.createElement('section');
  root.id = 'mote-print-root';
  root.setAttribute('aria-hidden', 'true');

  const title = document.createElement('h1');
  title.className = 'print-note-title';
  const content = document.createElement('article');
  content.className = 'print-note-content';
  root.append(title, content);
  document.body.append(root);
  return root;
}

function namespacePrintAnchors(content) {
  const idMap = new Map();

  for (const heading of content.querySelectorAll('h1[id], h2[id], h3[id], h4[id]')) {
    const sourceId = heading.id;
    const printId = `mote-print-${sourceId}`;
    idMap.set(sourceId, printId);
    heading.id = printId;
  }

  for (const link of content.querySelectorAll('a[href^="#"]')) {
    const href = link.getAttribute('href');
    if (!href || href === '#') continue;
    const printId = idMap.get(href.slice(1));
    if (printId) link.setAttribute('href', `#${printId}`);
  }
}

async function exportRichPdf(note) {
  const root = ensurePrintRoot();
  const title = root.querySelector('.print-note-title');
  const content = root.querySelector('.print-note-content');
  if (!title || !content) throw new Error('Print root is unavailable.');

  toast(t('openingPdf'));
  title.textContent = note.title;
  content.replaceChildren();
  await renderMarkdown(note.markdown, content, { theme: 'light' });
  namespacePrintAnchors(content);

  const previousTitle = document.title;
  document.title = safeFileName(note.title);
  document.documentElement.classList.add('mote-print-ready');

  const cleanup = () => {
    document.documentElement.classList.remove('mote-print-ready');
    document.title = previousTitle;
  };

  window.addEventListener('afterprint', cleanup, { once: true });

  await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
  window.print();

  // Safari may not always dispatch afterprint when the sheet is dismissed.
  window.setTimeout(() => {
    if (document.documentElement.classList.contains('mote-print-ready')) cleanup();
  }, 60000);
}

function openExportMenu(anchor) {
  closeExportMenu();
  const note = currentNoteSnapshot();
  if (!note) return;

  const menu = document.createElement('div');
  menu.className = 'export-menu floating-feature-menu';
  menu.addEventListener('click', (event) => event.stopPropagation());

  menu.append(
    exportMenuButton(t('exportMarkdown'), '.md', () => {
      downloadBlob(note.markdown, `${safeFileName(note.title)}.md`, 'text/markdown;charset=utf-8');
    }),
    exportMenuButton(t('exportText'), '.txt', () => {
      downloadBlob(markdownToText(note.markdown), `${safeFileName(note.title)}.txt`, 'text/plain;charset=utf-8');
    }),
    exportMenuButton(t('exportPdf'), '.pdf', async () => {
      try {
        await exportRichPdf(note);
      } catch (error) {
        console.error(error);
        toast(t('exportFailed'));
      }
    })
  );

  exportMenu = menu;
  placeMenu(menu, anchor);
}

function uniqueTitle(base, used) {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let counter = 2;
  while (used.has(`${base} (${counter})`)) counter += 1;
  const value = `${base} (${counter})`;
  used.add(value);
  return value;
}

async function importFolder(files) {
  const markdownFiles = files.filter((file) => file.name.toLowerCase().endsWith('.md'));
  if (!markdownFiles.length) {
    toast(t('noMarkdownFiles'));
    return;
  }

  await openDatabase();
  const [groups, notes] = await Promise.all([getGroups(), getNotes()]);
  const relativePath = markdownFiles.find((file) => file.webkitRelativePath)?.webkitRelativePath || '';
  const rootName = relativePath.split('/').filter(Boolean)[0] || 'Imported folder';
  const timestamp = new Date().toISOString();

  let group = groups.find((item) => item.name === rootName);
  if (!group) {
    group = {
      id: createId(),
      name: rootName,
      sortOrder: Math.max(-1, ...groups.map((item) => Number(item.sortOrder) || 0)) + 1,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    await saveGroup(group);
  }

  const usedTitles = new Set(notes.filter((note) => note.groupId === group.id).map((note) => note.title));
  let imported = 0;
  for (const file of markdownFiles) {
    const content = await file.text();
    const baseTitle = file.name.replace(/\.md$/i, '') || 'Untitled';
    await saveNote({
      id: createId(),
      groupId: group.id,
      title: uniqueTitle(baseTitle, usedTitles),
      contentMarkdown: content,
      isFavorite: false,
      isHidden: false,
      deletedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    imported += 1;
  }

  toast(`${t('importedFolder')}: ${rootName} (${imported})`);
  window.setTimeout(() => window.location.reload(), 700);
}

function installFolderImport() {
  const actions = document.querySelector('.settings-actions');
  const importMd = document.querySelector('#import-md');
  if (!actions || !importMd || document.querySelector('#import-folder')) return;

  const button = document.createElement('button');
  button.id = 'import-folder';
  button.type = 'button';
  button.className = 'text-button';
  button.textContent = t('importFolder');

  const input = document.createElement('input');
  input.id = 'folder-file-input';
  input.type = 'file';
  input.multiple = true;
  input.hidden = true;
  input.accept = '.md,text/markdown,text/plain';
  input.setAttribute('webkitdirectory', '');
  input.setAttribute('directory', '');

  button.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    const files = [...(input.files ?? [])];
    input.value = '';
    void importFolder(files);
  });

  importMd.insertAdjacentElement('afterend', button);
  actions.insertAdjacentElement('afterend', input);

  const languageObserver = new MutationObserver(() => {
    button.textContent = t('importFolder');
  });
  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}

function installExportMenu() {
  const exportButton = document.querySelector('#export-note');
  if (!exportButton || exportButton.dataset.exportMenuBound === 'true') return;
  exportButton.dataset.exportMenuBound = 'true';
  exportButton.addEventListener(
    'click',
    (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      openExportMenu(exportButton);
    },
    true
  );
}

installFolderImport();
installExportMenu();

document.addEventListener('click', (event) => {
  if (exportMenu && !exportMenu.contains(event.target) && !event.target.closest('#export-note')) closeExportMenu();
});
window.addEventListener('resize', closeExportMenu);
document.querySelector('.document-main')?.addEventListener('scroll', closeExportMenu, { passive: true });

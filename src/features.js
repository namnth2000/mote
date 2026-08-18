import { createId, getGroups, getNotes, openDatabase, saveGroup, saveNote } from './db.js';

const TEXT = {
  vi: {
    importFolder: 'Import folder',
    noMarkdownFiles: 'Không tìm thấy file .md trong folder.',
    importedFolder: 'Đã import folder',
    exportMarkdown: 'Export .md',
    exportText: 'Export .txt',
    exportPdf: 'Export .pdf',
    creatingPdf: 'Đang tạo PDF...',
    exportFailed: 'Export thất bại.'
  },
  en: {
    importFolder: 'Import folder',
    noMarkdownFiles: 'No .md files found in this folder.',
    importedFolder: 'Folder imported',
    exportMarkdown: 'Export .md',
    exportText: 'Export .txt',
    exportPdf: 'Export .pdf',
    creatingPdf: 'Creating PDF...',
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
        toast(t('creatingPdf'));
        const pdf = await createPdfBlob(note.title, markdownToText(note.markdown));
        downloadBlob(pdf, `${safeFileName(note.title)}.pdf`, 'application/pdf');
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

function wrapText(ctx, text, maxWidth) {
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    if (ctx.measureText(word).width <= maxWidth) {
      line = word;
      continue;
    }

    let piece = '';
    for (const char of word) {
      const next = piece + char;
      if (piece && ctx.measureText(next).width > maxWidth) {
        lines.push(piece);
        piece = char;
      } else {
        piece = next;
      }
    }
    line = piece;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

async function canvasToJpeg(canvas) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Could not encode PDF page.')), 'image/jpeg', 0.9);
  });
  return new Uint8Array(await blob.arrayBuffer());
}

async function createPdfPages(title, body) {
  if (document.fonts?.ready) await document.fonts.ready;

  const width = 1240;
  const height = 1754;
  const marginX = 100;
  const marginTop = 105;
  const marginBottom = 105;
  const maxWidth = width - marginX * 2;
  const bodyFont = "30px Inter, Arial, sans-serif";
  const bodyLineHeight = 44;
  const pages = [];

  let canvas;
  let ctx;
  let y;

  function newPage() {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#171717';
    ctx.textBaseline = 'top';
    y = marginTop;
  }

  async function flushPage() {
    pages.push(await canvasToJpeg(canvas));
  }

  async function ensureSpace(required) {
    if (y + required <= height - marginBottom) return;
    await flushPage();
    newPage();
  }

  newPage();
  ctx.font = "700 50px Inter, Arial, sans-serif";
  for (const line of wrapText(ctx, title || 'Untitled', maxWidth)) {
    await ensureSpace(64);
    ctx.fillText(line, marginX, y);
    y += 64;
  }
  y += 22;

  ctx.font = bodyFont;
  for (const rawLine of (body || '').split('\n')) {
    if (!rawLine.trim()) {
      await ensureSpace(bodyLineHeight);
      y += bodyLineHeight * 0.7;
      continue;
    }
    for (const line of wrapText(ctx, rawLine, maxWidth)) {
      await ensureSpace(bodyLineHeight);
      ctx.fillText(line, marginX, y);
      y += bodyLineHeight;
    }
  }

  await flushPage();
  return { pages, width, height };
}

function ascii(value) {
  return new TextEncoder().encode(value);
}

function byteLength(chunks) {
  return chunks.reduce((sum, chunk) => sum + chunk.length, 0);
}

function createPdfBinary(jpegs, width, height) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const objects = new Map();
  const pageObjectNumbers = [];

  objects.set(1, [ascii('<< /Type /Catalog /Pages 2 0 R >>')]);

  for (let index = 0; index < jpegs.length; index += 1) {
    const imageNumber = 3 + index * 3;
    const contentNumber = imageNumber + 1;
    const pageNumber = imageNumber + 2;
    const jpeg = jpegs[index];
    const content = ascii(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`);

    objects.set(imageNumber, [
      ascii(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
      jpeg,
      ascii('\nendstream')
    ]);
    objects.set(contentNumber, [ascii(`<< /Length ${content.length} >>\nstream\n`), content, ascii('endstream')]);
    objects.set(pageNumber, [ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${imageNumber} 0 R >> >> /Contents ${contentNumber} 0 R >>`)]);
    pageObjectNumbers.push(pageNumber);
  }

  objects.set(2, [ascii(`<< /Type /Pages /Count ${pageObjectNumbers.length} /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(' ')}] >>`)]);

  const maxObject = Math.max(...objects.keys());
  const chunks = [ascii('%PDF-1.4\n%Mote\n')];
  const offsets = new Array(maxObject + 1).fill(0);
  let position = byteLength(chunks);

  for (let number = 1; number <= maxObject; number += 1) {
    offsets[number] = position;
    const objectChunks = [ascii(`${number} 0 obj\n`), ...(objects.get(number) ?? []), ascii('\nendobj\n')];
    chunks.push(...objectChunks);
    position += byteLength(objectChunks);
  }

  const xrefPosition = position;
  let xref = `xref\n0 ${maxObject + 1}\n0000000000 65535 f \n`;
  for (let number = 1; number <= maxObject; number += 1) {
    xref += `${String(offsets[number]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF\n`;
  chunks.push(ascii(xref));

  return new Blob(chunks, { type: 'application/pdf' });
}

async function createPdfBlob(title, body) {
  const { pages, width, height } = await createPdfPages(title, body);
  return createPdfBinary(pages, width, height);
}

installFolderImport();
installExportMenu();

document.addEventListener('click', (event) => {
  if (exportMenu && !exportMenu.contains(event.target) && !event.target.closest('#export-note')) closeExportMenu();
});
window.addEventListener('resize', closeExportMenu);
document.querySelector('.document-main')?.addEventListener('scroll', closeExportMenu, { passive: true });

import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { marked } from 'marked';
import mermaid from 'mermaid';

marked.setOptions({
  gfm: true,
  breaks: false
});

let renderRevision = 0;

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') || 'section';
}

function assignHeadingIds(container) {
  const used = new Map();
  const headings = [];

  for (const heading of container.querySelectorAll('h1, h2, h3, h4')) {
    const base = slugify(heading.textContent ?? 'section');
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    heading.id = count === 0 ? base : `${base}-${count + 1}`;
    headings.push({
      id: heading.id,
      level: Number(heading.tagName.slice(1)),
      text: heading.textContent?.trim() || 'Untitled section'
    });
  }

  return headings;
}

function countNewlines(value) {
  let count = 0;
  for (const character of value) if (character === '\n') count += 1;
  return count;
}

function expectedTagForToken(token) {
  if (token.type === 'heading') return `H${token.depth}`;
  if (token.type === 'paragraph') return 'P';
  if (token.type === 'code') return 'PRE';
  if (token.type === 'table') return 'TABLE';
  if (token.type === 'list') return token.ordered ? 'OL' : 'UL';
  if (token.type === 'blockquote') return 'BLOCKQUOTE';
  if (token.type === 'hr') return 'HR';
  return null;
}

function assignTableSourceLines(table, startLine) {
  const rows = [...table.querySelectorAll('tr')];
  if (!rows.length) return;
  rows[0].dataset.sourceLine = String(startLine);
  for (let index = 1; index < rows.length; index += 1) {
    rows[index].dataset.sourceLine = String(startLine + index + 1);
  }
}

function assignListSourceLines(list, token, startLine) {
  const items = [...list.querySelectorAll(':scope > li')];
  if (!items.length || !Array.isArray(token.items)) return;

  let cursor = 0;
  token.items.forEach((item, index) => {
    const raw = item.raw ?? '';
    const offset = raw ? Math.max(cursor, token.raw.indexOf(raw, cursor)) : cursor;
    const line = startLine + countNewlines(token.raw.slice(0, offset));
    if (items[index]) items[index].dataset.sourceLine = String(line);
    cursor = Math.max(cursor, offset + raw.length);
  });
}

function assignSourceLines(source, container) {
  const tokens = marked.lexer(source || '');
  const children = [...container.children];
  let sourceCursor = 0;
  let sourceLine = 1;
  let childIndex = 0;

  for (const token of tokens) {
    const raw = token.raw ?? '';
    let offset = raw ? source.indexOf(raw, sourceCursor) : sourceCursor;
    if (offset < 0) offset = sourceCursor;
    sourceLine += countNewlines(source.slice(sourceCursor, offset));
    const startLine = sourceLine;

    const expectedTag = expectedTagForToken(token);
    if (expectedTag) {
      while (childIndex < children.length && children[childIndex].tagName !== expectedTag) childIndex += 1;
      const block = children[childIndex];
      if (block) {
        block.dataset.sourceLine = String(startLine);
        if (token.type === 'table') assignTableSourceLines(block, startLine);
        if (token.type === 'list') assignListSourceLines(block, token, startLine);
        childIndex += 1;
      }
    }

    sourceCursor = Math.max(sourceCursor, offset + raw.length);
    sourceLine = startLine + countNewlines(raw);
  }
}

function showMermaidFallback(diagram, source) {
  diagram.classList.add('mermaid-error');
  const fallback = document.createElement('pre');
  const fallbackCode = document.createElement('code');
  fallbackCode.textContent = source;
  fallback.append(fallbackCode);
  diagram.replaceChildren(fallback);
}

async function renderMermaidBlocks(container, theme) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    suppressErrorRendering: true,
    theme: theme === 'dark' ? 'dark' : 'default',
    fontFamily: 'Inter, system-ui, sans-serif'
  });

  const blocks = [...container.querySelectorAll('pre > code.language-mermaid')];

  for (const code of blocks) {
    const pre = code.parentElement;
    if (!pre) continue;

    const source = code.textContent ?? '';
    const sourceLine = pre.dataset.sourceLine;
    const diagram = document.createElement('div');
    diagram.className = 'mermaid-diagram';
    if (sourceLine) diagram.dataset.sourceLine = sourceLine;
    pre.replaceWith(diagram);

    const parsed = await mermaid.parse(source, { suppressErrors: true });
    if (!parsed) {
      showMermaidFallback(diagram, source);
      continue;
    }

    try {
      const id = `mote-mermaid-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
      const { svg } = await mermaid.render(id, source);
      diagram.innerHTML = DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['foreignObject']
      });
    } catch (error) {
      showMermaidFallback(diagram, source);
      console.warn('Mermaid render failed:', error);
    }
  }
}

function highlightCode(container) {
  for (const code of container.querySelectorAll('pre > code')) {
    if (code.classList.contains('language-mermaid')) continue;
    try {
      hljs.highlightElement(code);
    } catch (error) {
      console.warn('Code highlighting failed:', error);
    }
  }
}

function hardenLinks(container) {
  for (const link of container.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href') ?? '';
    if (href.startsWith('#')) continue;
    try {
      const url = new URL(href, window.location.href);
      if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
        link.removeAttribute('href');
        continue;
      }
      if (url.origin !== window.location.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    } catch {
      link.removeAttribute('href');
    }
  }
}

export async function renderMarkdown(source, container, { theme = 'light' } = {}) {
  const revision = String(++renderRevision);
  const html = marked.parse(source || '');
  container.innerHTML = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel']
  });

  hardenLinks(container);
  assignSourceLines(source || '', container);
  const headings = assignHeadingIds(container);
  await renderMermaidBlocks(container, theme);
  highlightCode(container);
  container.dataset.renderRevision = revision;
  return headings;
}

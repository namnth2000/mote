import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/common';
import { marked } from 'marked';
import mermaid from 'mermaid';

marked.setOptions({
  gfm: true,
  breaks: false
});

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

async function renderMermaidBlocks(container, theme) {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: theme === 'dark' ? 'dark' : 'default',
    fontFamily: 'Inter, system-ui, sans-serif'
  });

  const blocks = [...container.querySelectorAll('pre > code.language-mermaid')];

  for (const code of blocks) {
    const pre = code.parentElement;
    if (!pre) continue;

    const source = code.textContent ?? '';
    const diagram = document.createElement('div');
    diagram.className = 'mermaid-diagram';
    pre.replaceWith(diagram);

    try {
      const id = `mote-mermaid-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
      const { svg } = await mermaid.render(id, source);
      diagram.innerHTML = DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_TAGS: ['foreignObject']
      });
    } catch (error) {
      diagram.classList.add('mermaid-error');
      const fallback = document.createElement('pre');
      const fallbackCode = document.createElement('code');
      fallbackCode.textContent = source;
      fallback.append(fallbackCode);
      diagram.replaceChildren(fallback);
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
  const html = marked.parse(source || '');
  container.innerHTML = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel']
  });

  hardenLinks(container);
  const headings = assignHeadingIds(container);
  await renderMermaidBlocks(container, theme);
  highlightCode(container);
  return headings;
}

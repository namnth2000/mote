function normalizeSelection(text, start, end) {
  const safeStart = Math.max(0, Math.min(start ?? text.length, text.length));
  const safeEnd = Math.max(safeStart, Math.min(end ?? safeStart, text.length));
  return { start: safeStart, end: safeEnd };
}

function replaceRange(text, start, end, replacement, selectionStart, selectionEnd) {
  return {
    text: text.slice(0, start) + replacement + text.slice(end),
    start: start + selectionStart,
    end: start + selectionEnd
  };
}

function wrapInline(state, before, after, placeholder = 'text') {
  const { text } = state;
  const { start, end } = normalizeSelection(text, state.start, state.end);
  const selected = text.slice(start, end);
  const content = selected || placeholder;
  const replacement = `${before}${content}${after}`;
  return replaceRange(text, start, end, replacement, before.length, before.length + content.length);
}

function selectedLineRange(text, start, end) {
  const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  const nextLineBreak = text.indexOf('\n', end);
  const lineEnd = nextLineBreak === -1 ? text.length : nextLineBreak;
  return { lineStart, lineEnd };
}

function prefixLines(state, prefixFactory) {
  const { text } = state;
  const { start, end } = normalizeSelection(text, state.start, state.end);
  const { lineStart, lineEnd } = selectedLineRange(text, start, end);
  const block = text.slice(lineStart, lineEnd);
  const transformed = block.split('\n').map((line, index) => `${prefixFactory(index, line)}${line}`).join('\n');
  return replaceRange(text, lineStart, lineEnd, transformed, start - lineStart, transformed.length);
}

function heading(state, level) {
  const { text } = state;
  const { start, end } = normalizeSelection(text, state.start, state.end);
  const { lineStart, lineEnd } = selectedLineRange(text, start, end);
  const block = text.slice(lineStart, lineEnd);
  const prefix = `${'#'.repeat(level)} `;
  const transformed = block.split('\n').map((line) => `${prefix}${line.replace(/^#{1,6}\s+/, '')}`).join('\n');
  return replaceRange(text, lineStart, lineEnd, transformed, prefix.length, transformed.length);
}

function codeBlock(state) {
  const { text } = state;
  const { start, end } = normalizeSelection(text, state.start, state.end);
  const selected = text.slice(start, end) || 'code';
  const leading = start > 0 && text[start - 1] !== '\n' ? '\n' : '';
  const trailing = end < text.length && text[end] !== '\n' ? '\n' : '';
  const open = `${leading}\`\`\`\n`;
  const close = `\n\`\`\`${trailing}`;
  return replaceRange(text, start, end, `${open}${selected}${close}`, open.length, open.length + selected.length);
}

function insertBlock(state, block, selectionOffsetStart = 0, selectionOffsetEnd = block.length) {
  const { text } = state;
  const { start, end } = normalizeSelection(text, state.start, state.end);
  const leading = start > 0 && text[start - 1] !== '\n' ? '\n\n' : '';
  const trailing = end < text.length && text[end] !== '\n' ? '\n\n' : '';
  const replacement = `${leading}${block}${trailing}`;
  return replaceRange(text, start, end, replacement, leading.length + selectionOffsetStart, leading.length + selectionOffsetEnd);
}

function insertTable(state) {
  const table = '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |';
  return insertBlock(state, table, 2, 10);
}

function insertLink(state) {
  const { text } = state;
  const { start, end } = normalizeSelection(text, state.start, state.end);
  const selected = text.slice(start, end) || 'link text';
  const replacement = `[${selected}](https://)`;
  const urlStart = 1 + selected.length + 2;
  return replaceRange(text, start, end, replacement, urlStart, urlStart + 'https://'.length);
}

function insertMermaid(state) {
  const diagram = '```mermaid\nflowchart LR\n    A[Start] --> B[End]\n```';
  const sourceStart = diagram.indexOf('flowchart');
  const sourceEnd = diagram.lastIndexOf('\n```');
  return insertBlock(state, diagram, sourceStart, sourceEnd);
}

function insertImage(state) {
  const { text } = state;
  const { start, end } = normalizeSelection(text, state.start, state.end);
  const selected = text.slice(start, end) || 'Alt text';
  const replacement = `![${selected}](https://)`;
  const urlStart = 2 + selected.length + 2;
  return replaceRange(text, start, end, replacement, urlStart, urlStart + 'https://'.length);
}

export function formatSelection(state, command) {
  switch (command) {
    case 'bold': return wrapInline(state, '**', '**');
    case 'italic': return wrapInline(state, '*', '*');
    case 'underline': return wrapInline(state, '<u>', '</u>');
    case 'strike': return wrapInline(state, '~~', '~~');
    case 'inlineCode': return wrapInline(state, '`', '`', 'code');
    case 'link': return insertLink(state);
    case 'quote': return prefixLines(state, () => '> ');
    case 'bullet': return prefixLines(state, () => '- ');
    case 'numbered': return prefixLines(state, (index) => `${index + 1}. `);
    case 'checkbox': return prefixLines(state, () => '- [ ] ');
    case 'h1': return heading(state, 1);
    case 'h2': return heading(state, 2);
    case 'h3': return heading(state, 3);
    case 'h4': return heading(state, 4);
    case 'codeBlock': return codeBlock(state);
    case 'table': return insertTable(state);
    case 'mermaid': return insertMermaid(state);
    case 'image': return insertImage(state);
    default: return state;
  }
}

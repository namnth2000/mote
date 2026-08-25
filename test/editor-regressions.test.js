import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const markdownSource = readFileSync(new URL('../src/markdown.js', import.meta.url), 'utf8');
const interactionsSource = readFileSync(new URL('../src/interactions.js', import.meta.url), 'utf8');
const browserCompatSource = readFileSync(new URL('../src/browser-compat.js', import.meta.url), 'utf8');
const interactionsCss = readFileSync(new URL('../src/interactions.css', import.meta.url), 'utf8');

test('invalid Mermaid blocks are rejected before render without a global error diagram', () => {
  assert.match(markdownSource, /suppressErrorRendering:\s*true/);
  assert.match(markdownSource, /mermaid\.parse\(source,\s*\{\s*suppressErrors:\s*true\s*\}\)/);
  assert.match(markdownSource, /if \(!parsed\)[\s\S]*?showMermaidFallback\(diagram, source\)/);
});

test('Markdown typing guards against large scroll jumps caused by auto-resize', () => {
  assert.match(interactionsSource, /function stabilizeMarkdownEditorScroll\(\)/);
  assert.match(interactionsSource, /addEventListener\('beforeinput'/);
  assert.match(interactionsSource, /MAX_EDITOR_SCROLL_ADJUSTMENT/);
  assert.match(interactionsSource, /requestAnimationFrame/);
  assert.match(interactionsCss, /#markdown-editor\s*\{[\s\S]*?overflow-anchor:\s*none/);
});

test('view switching preserves normalized document scroll progress after layout settles', () => {
  assert.match(browserCompatSource, /function installEditorViewScrollPreservation\(\)/);
  assert.match(browserCompatSource, /scrollTop\s*\/\s*maxScrollTop/);
  assert.match(browserCompatSource, /new MutationObserver\(scheduleRestore\)/);
  assert.match(browserCompatSource, /attributeFilter:\s*\['hidden', 'style'\]/);
  assert.match(browserCompatSource, /requestAnimationFrame/);
  assert.match(browserCompatSource, /installEditorViewScrollPreservation\(\)/);
});

test('mobile keeps group actions reachable without replacing the existing group menu', () => {
  assert.match(interactionsCss, /@media \(max-width: 760px\)[\s\S]*?\.group-row > \.group-menu\s*\{[\s\S]*?display:\s*block !important/);
  assert.match(interactionsCss, /@media \(max-width: 760px\)[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 36px/);
  assert.match(interactionsCss, /\.group-menu > summary\s*\{[\s\S]*?width:\s*36px;[\s\S]*?height:\s*36px/);
});

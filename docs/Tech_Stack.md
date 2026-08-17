# Mote - Tech Stack

> Keep the product simple enough that the browser does most of the hard interaction work.

## Runtime

### HTML

Defines the application shell, accessible controls and native editing elements.

### CSS

Owns responsive layout, Light/Dark styling, fixed Mote typography and small interaction transitions.

### Vanilla JavaScript

Handles application state, editor transformations, persistence orchestration and UI events.

There is no React, Vue, Flutter or other UI framework in the current MVP.

## Editor

Markdown editing uses a native HTML `<textarea>`.

Reasons:

- native caret behavior
- native desktop and mobile selection
- native copy/paste
- native undo/redo
- native touch selection handles
- direct `selectionStart` / `selectionEnd` support for Markdown formatting

Do not replace this with `contenteditable` or a rich-text editor without a validated requirement.

## Persistence

### IndexedDB

Stores:

- notes
- groups
- settings

Database name:

```text
mote-web-v2
```

No backend or account is required.

## Markdown Preview

### Marked

Parses Markdown into HTML.

### DOMPurify

Sanitizes generated HTML before it enters the Preview DOM.

### highlight.js

Provides syntax highlighting for fenced code blocks in Preview.

### Mermaid

Renders fenced `mermaid` blocks in Preview using strict security settings.

These libraries affect Preview only. They do not own the editing surface.

## Build and delivery

### Vite

Used only for local development and production bundling.

```text
npm run dev
npm run build -> dist/
```

### Cloudflare Pages

Hosts the static production output at `mote.namnth.com`.

### PWA

`manifest.webmanifest` and `sw.js` provide installability and a cached application shell where supported.

## Fonts

Fixed by product design:

- UI and Preview: Inter with system fallbacks
- Markdown editor and code: native monospace stack

There is no user-selectable editor font.

## Testing

### Node built-in test runner

Tests pure Markdown selection transformations without requiring a browser.

### GitHub Actions

Runs:

```text
npm install
npm run check
npm test
npm run build
```

Manual browser smoke testing remains required for selection, clipboard, mobile keyboard and PWA behavior.

## Explicit non-choices for the MVP

- no Flutter
- no React/Vue/Svelte
- no CodeMirror initially
- no Capacitor initially
- no backend
- no cloud database
- no authentication
- no PDF/DOCX generation stack

Each can be reconsidered only when a real product requirement justifies the extra layer.

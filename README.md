# Mote

> **M**arkdown N**ote**

Mote is a minimal, local-first Markdown note app built as a web-first PWA.

The current version is a controlled rewrite of the original Flutter implementation. The goal is simpler: make writing, selecting, copying, pasting and formatting Markdown reliable in the browser before adding more platform-specific features.

## Why a web-first rewrite?

The original Mote targeted Web, Windows, Android and iOS from one Flutter codebase. That made the implementation heavier than the current product needed, especially around text selection, caret behavior, clipboard interactions and mobile editing.

Mote now follows a smaller architecture:

```text
Native <textarea>
      ↓
Markdown source
      ↓
Preview renderer
      ↓
IndexedDB
      ↓
PWA
```

Markdown remains the only source of truth.

## Current features

- Notes and groups
- Inbox, Favorites, Hidden and Trash
- Trash cleanup after 30 days
- Native Markdown editor using `<textarea>`
- Preview mode
- Basic Markdown formatting toolbar
- Tables, fenced code blocks and Mermaid preview
- Syntax highlighting in Preview
- Search
- Auto save
- Copy Markdown
- Import and export `.md`
- Full JSON backup and restore
- Light, Dark and System theme
- Vietnamese and English UI
- Desktop outline for headings
- Local-first IndexedDB storage
- Installable PWA

## Fixed typography

Mote intentionally does not provide an Editor Font setting.

- App UI and Preview use Inter with system fallbacks.
- Markdown editing uses the browser's native monospace stack.
- The editing and Preview typography are part of Mote's product design rather than user preferences.

## Tech stack

- HTML
- CSS
- Vanilla JavaScript
- IndexedDB
- Vite as the build tool
- Marked for Markdown parsing
- DOMPurify for rendered HTML sanitization
- Mermaid for diagrams
- highlight.js for code highlighting

There is no UI framework and no backend in the current MVP.

## Run locally

Requirements: a recent Node.js LTS release.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run check
npm test
npm run build
```

Production output:

```text
dist/
```

## Project structure

```text
mote/
├── index.html
├── manifest.webmanifest
├── sw.js
├── src/
│   ├── app.js
│   ├── db.js
│   ├── format.js
│   ├── markdown.js
│   └── styles.css
├── scripts/
│   └── copy-static.mjs
├── test/
│   └── format.test.js
├── assets/
├── branding/
└── docs/
```

## Documentation

- [Product Spec](docs/Product_Spec.md)
- [Tech Stack](docs/Tech_Stack.md)
- [Architecture Design](docs/Architecture_Design.md)
- [Database Design](docs/Database_Design.md)
- [Data Portability](docs/Data_Portability.md)
- [Deployment](docs/Deployment.md)

`docs/mockup.html` is kept as a visual reference only. The production implementation is the source of truth for current behavior.

## Previous implementation

The previous Flutter implementation is archived at `namnth2000/mote-old`.

The web rewrite uses a separate IndexedDB database named `mote-web-v2`. It does not automatically reinterpret the old Drift/SQLite browser database.

Before replacing a production deployment that contains important notes, export data from the old app first. See [Data Portability](docs/Data_Portability.md).

## Status

Mote 2 is currently an alpha rewrite. The priority is editor reliability and a small, maintainable web MVP rather than feature parity with the Flutter version.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

# Mote

> **M**arkdown N**ote**

Mote is a minimal, local-first Markdown note app for writing and organizing notes without an account or backend.

Current version: **1.0.0**.

## Features

- Notes and groups
- Inbox, Favorites and Recent
- Hidden notes available from Settings
- Trash with 30-day cleanup
- Native Markdown editor using `<textarea>`
- Preview mode
- Markdown formatting toolbar
- Tables, fenced code blocks, Mermaid diagrams and images
- Syntax highlighting in Preview
- Search within the current note list
- Auto save
- Copy Markdown
- Import and export `.md`
- Full JSON backup and restore
- Light, Dark and System themes
- Vietnamese and English UI
- Resizable notes list on desktop
- Resizable, hideable heading outline on large desktop screens
- Compact layout for smaller desktop/tablet widths
- Installable PWA

## Tech stack

Mote intentionally keeps the stack small:

- HTML
- CSS
- Vanilla JavaScript
- IndexedDB
- Vite
- Marked + DOMPurify
- highlight.js
- Mermaid
- PWA hosted on Cloudflare Pages

The Markdown editing surface uses the browser's native `<textarea>`. UI and Preview use Inter; Markdown editing and code use a native monospace stack.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Checks:

```bash
npm run check
npm test
npm run build
```

Production output is generated in `dist/`.

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
├── assets/
│   ├── branding/
│   ├── fonts/
│   └── icons/
├── branding/
├── scripts/
├── test/
└── docs/
```

## Documentation

- [Project Spec](docs/Project_Spec.md)
- [Architecture Design](docs/Architecture_Design.md)
- [Database Design](docs/Database_Design.md)
- [Data Portability](docs/Data_Portability.md)
- [Deployment](docs/Deployment.md)

`docs/mockup.html` is a visual reference. The production implementation is the source of truth for current behavior.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
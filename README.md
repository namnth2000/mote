# Mote

> **M**arkdown N**ote**

Mote is a minimal, local-first Markdown note app for writing and organizing notes without an account or backend.

Current version: **1.1.0** (Windows Desktop + Web/PWA).

- [Download Mote for Windows x64 (.exe)](https://github.com/namnth2000/mote/releases/download/v1.1.0/Mote_1.1.0_x64-setup.exe)
- [View all releases](https://github.com/namnth2000/mote/releases)
- [Use Mote on the web](https://mote.namnth.com)

The Windows installer is currently unsigned; Windows SmartScreen may show an unknown-publisher warning. The Windows app stores notes locally and separately from Web/PWA. Back up important notes periodically.

## Features

- Notes and groups
- Inbox, Favorites and Recent
- Hidden notes available from Settings
- Trash with 30-day cleanup
- Drag and drop notes into groups, Inbox and Trash on supported desktop browsers
- Native Markdown editor using `<textarea>`
- Preview mode with interactive task checkboxes
- Markdown formatting toolbar
- Tables, fenced code blocks, Mermaid diagrams and images
- Syntax highlighting in Preview
- Search within the current note list
- Auto save
- Copy Markdown
- Import individual `.md` files
- Import a folder of Markdown files into a group named after the folder on supported browsers
- Export notes as `.md`, `.txt` and print-ready `.pdf`
- Full JSON backup and restore
- Light, Dark and System themes
- Vietnamese and English UI
- Resizable notes list on desktop
- Resizable, hideable heading outline on large desktop screens
- Compact layout for smaller desktop/tablet widths
- Responsive mobile layout
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
- Tauri 2 wrapper for Windows Desktop (same frontend, separate local data)

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

## Windows Desktop (Tauri)

Mote Desktop runs the same Vite/Vanilla JS frontend in a native Tauri window. The first target is **Windows**; the Web/PWA build and Cloudflare deployment remain unchanged.

Prerequisites: Node.js 20+, Rust, Microsoft C++ Build Tools with *Desktop development with C++*, and Microsoft Edge WebView2.

```bash
npm install
npm run desktop:dev
npm run desktop:build
```

The Windows NSIS `.exe` installer is generated under `src-tauri/target/release/bundle/nsis/`. GitHub Actions automatically publishes the installer and SHA-256 checksum on each prepared release. A separate **Desktop build** workflow validates proposed changes on Windows.

**Data is not shared automatically** between Mote Web/PWA and Mote Desktop. Each has its own local IndexedDB storage. To move notes, use **Settings > Export backup** in the source app and **Import backup** in the destination app (import replaces the destination library).

See [Desktop guide](docs/Desktop.md) for build, release, portability and test notes.

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
│   ├── tasks.js
│   ├── interactions.js
│   ├── task-interactions.js
│   ├── features.js
│   ├── browser-compat.js
│   └── *.css
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
- [Windows Desktop](docs/Desktop.md)

`docs/mockup.html` is a visual reference. The production implementation is the source of truth for current behavior.

## Data

Mote is local-first. Notes are stored in the current browser using IndexedDB. Export a JSON backup before clearing browser/site data or moving to another device.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).

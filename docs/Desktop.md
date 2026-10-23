# Mote Desktop (Tauri 2)

Mote Desktop wraps the existing Web/PWA UI with Tauri 2. The first supported packaging target is Windows x64 (NSIS installer). The Web/PWA on Cloudflare Pages stays independent.

## Prerequisites (Windows)

- Node.js 20 or newer.
- Rust toolchain installed with `rustup` (stable).
- Microsoft C++ Build Tools with the **Desktop development with C++** workload.
- Microsoft Edge WebView2 Runtime (normally installed on Windows 11).

See https://v2.tauri.app/start/prerequisites/ for the current prerequisites.

## Develop and build

From the repository root:

```bash
npm install
npm run desktop:dev
```

Make a local installer:

```bash
npm run check
npm test
npm run desktop:build
```

Installer output: `src-tauri/target/release/bundle/nsis/*-setup.exe`.

The dedicated **Desktop build** GitHub Actions workflow also runs on pull requests touching the desktop build, and can be started manually from **Actions > Desktop build > Run workflow**. On success, download the `mote-windows-installer` artifact. The workflow does **not** publish or sign a GitHub Release.

## Data ownership and migration

Mote Desktop keeps the current `mote-web-v2` IndexedDB schema inside Tauri's app-specific WebView data. Mote Web/PWA keeps its own IndexedDB in the browser profile. **Installing Desktop does not import or synchronize Web notes**.

To move a library:

1. On the source app, open **Settings > Export backup** and save the JSON file.
2. On the destination app, open **Settings > Import backup** and choose that JSON file.
3. Confirm replacing the destination library. The restore operation is destructive to existing notes on the destination.
4. Restart/reopen and verify notes, groups and Markdown content.

Keep a copy of the backup until migration is verified. Uninstalling, clearing WebView data or resetting the OS can remove locally stored notes. No cloud sync or native Markdown-folder sync is provided by this wrapper.

## Smoke test before distributing

On a real Windows 10/11 machine, test the packaged `.exe` (not only `tauri dev`):

- Open Mote, create/edit a note, close and reopen the app: the saved note must remain.
- Markdown formatting, undo/redo, Preview, Mermaid, code highlighting and editor selection.
- Create/rename/delete a group and exercise Trash, Favorites and Hidden.
- Export a note to `.md`, export a full JSON backup and import it into a fresh library.
- Import an individual `.md` file and a folder containing Markdown files.
- Export `.txt` and verify print/PDF from the existing browser print route.
- Resize the window between large/compact breakpoints, and check light/dark themes.
- Confirm Windows UI branding, installer/uninstaller, and app startup while offline.

The current import/export and PDF interfaces still use browser APIs. **They are not yet verified in packaged WebView2**. If any file or print operation fails, implement a focused Tauri-native adapter with narrowly scoped permissions rather than granting unrestricted filesystem access.

## Release

- Keep app version in `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` and `package.json` aligned before a release.
- Complete smoke testing and run the Windows installer workflow.
- Desktop builds are unsigned until code signing is configured. Windows SmartScreen may show a warning.
- Attach the verified installer to the intended GitHub Release manually. Do not overwrite existing tags or assume a GitHub Actions artifact is an official release.
- Do not publish Desktop until the import/export and PDF smoke tests have passed.

## Non-goals for v1

No new editor, filesystem storage backend, accounts, sync engine, updater, custom titlebar, tray icon or auto-start. Preserve Mote's native textarea, IndexedDB model and existing visual design.

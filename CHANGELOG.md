# Changelog

All notable changes to Mote are documented in this file.

## [Unreleased]

No unreleased changes yet.

## [1.0.0] - 2026-08-18

### Added

- Local-first notes and groups stored in IndexedDB.
- Inbox, Favorites and Recent collections.
- Hidden notes accessible from Settings.
- Trash with restore, permanent delete and 30-day cleanup.
- Drag and drop notes into Inbox, groups and Trash on supported desktop browsers.
- Native Markdown editing with Preview mode.
- Formatting for headings, bold, italic, underline, strikethrough, links, quotes, inline code, fenced code blocks, bullet lists, numbered lists, task lists, tables, Mermaid diagrams and images.
- Interactive task checkboxes in Preview that update and autosave the underlying Markdown.
- Syntax highlighting and Mermaid rendering in Preview.
- Auto save and copy Markdown.
- Import individual `.md` files.
- Import a folder of Markdown files into a group named after that folder on supported browsers.
- Export notes as `.md`, `.txt` and print-ready `.pdf`.
- Rich PDF/print layout for headings, lists, task lists, links, tables, code blocks, images and Mermaid diagrams.
- Full JSON backup and restore.
- Light, Dark and System themes.
- Vietnamese and English UI.
- Desktop heading outline with hide/show and resize controls.
- Resizable notes list on large desktop screens.
- Compact desktop/tablet layout that focuses on the editor when a note is open.
- Responsive mobile layout.
- Self-hosted UI icon set, Mote branding assets, favicon and PWA icons.
- Installable PWA and Cloudflare Pages deployment.
- Automated syntax checks, unit tests and production build in CI.

### Fixed

- Safari/iOS rendering of self-hosted SVG icons by removing the icon sprite's dependency on internal SVG styles.
- Floating group, note and formatting menus so they are not clipped by scroll containers.
- Group dialog Cancel behavior so it does not trigger required-field validation.
- Task list Preview styling so checkboxes do not show an extra list bullet.

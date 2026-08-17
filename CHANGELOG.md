# Changelog

All notable changes to Mote are documented in this file.

The project follows semantic versioning where practical while the web rewrite is in alpha.

## [Unreleased]

### Planned

- Production usability testing across desktop and mobile browsers.
- Improve accessibility and keyboard navigation based on real usage.
- Add only the export/import features that prove necessary after validation.

## [2.0.0-alpha.1] - 2026-08-17

### Changed

- Rebuilt Mote as a web-first PWA using HTML, CSS and Vanilla JavaScript.
- Replaced the Flutter editor implementation with a native `<textarea>` Markdown editor.
- Made Markdown the single source of truth and separated editing from Preview rendering.
- Replaced Drift/SQLite application storage with IndexedDB for the web MVP.
- Kept the existing Mote color palette and editor/Preview typography.
- Removed the Editor Font setting. Typography is now fixed by product design.
- Reduced the platform roadmap to Web/PWA first. Native Windows, Android and iOS packages are no longer part of the MVP.

### Added

- Notes and groups stored locally in IndexedDB.
- Inbox, Favorites, Hidden and 30-day Trash collections.
- Markdown formatting based on native selection ranges.
- Markdown Preview with tables, fenced code blocks, syntax highlighting and Mermaid.
- Search, auto save, copy Markdown and `.md` export.
- Markdown import and full JSON backup/restore.
- Light, Dark and System themes.
- Vietnamese and English UI.
- Desktop heading outline.
- PWA manifest and service worker.
- Unit tests for high-risk Markdown selection transformations.

### Removed

- Flutter, Riverpod and Drift runtime architecture.
- User-selectable Sans/Serif/Mono editor fonts.
- Native application packaging from the MVP scope.
- PDF and DOCX export from the MVP scope.

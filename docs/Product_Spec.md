# Mote - Product Spec

> **M**arkdown N**ote**

Mote is a minimal, local-first Markdown note app focused on reliable writing and ownership of the user's notes.

## 1. Product goal

The current goal is not to build four separate native applications.

The goal is to make one small Web/PWA product that:

- opens quickly
- lets the user write Markdown reliably
- behaves naturally for text selection, copy, paste and mobile editing
- stores notes locally without requiring an account
- renders Markdown cleanly for reading
- can be installed as a PWA where the platform supports it

Web/PWA is the product for the current validation phase.

## 2. Product principles

1. Open the app and write immediately.
2. Markdown is the single source of truth.
3. Local-first by default.
4. Native browser text behavior is preferred over custom editor abstractions.
5. Product reliability is more important than platform count.
6. Features are added only when they solve a real use case.
7. A fixed visual language is preferable to unnecessary settings.

## 3. Platforms

### MVP

- Desktop web
- Mobile web
- Installable PWA where supported

This one PWA can serve Windows, Android, iOS and desktop browsers without maintaining separate native UI implementations.

### Not in MVP

- Native Windows executable
- Android APK / Play Store package
- Native iOS / App Store package
- Capacitor wrapper

A native wrapper can be evaluated later only if a proven requirement needs native APIs or store distribution.

## 4. Information structure

```text
Mote
├── Inbox
├── Favorites
├── Groups...
├── Hidden
└── Trash
```

### Groups

- Create group.
- Rename group.
- Delete group.
- Deleting a group moves its active notes to Inbox.

### Inbox

Notes without a group.

### Favorites

A derived collection of active favorite notes.

### Hidden

A derived collection of active hidden notes.

Hidden is only an organization feature. It is not encryption and must not be presented as a security feature.

### Trash

- Deleting a note moves it to Trash.
- Restore is supported.
- Permanent delete is supported.
- Notes older than 30 days in Trash are cleaned up when the app starts.

## 5. Note editor

### Source model

A note has one editable document field:

```text
contentMarkdown: string
```

Mote does not maintain a second rich-text document model.

### Markdown mode

Markdown mode uses a native HTML `<textarea>`.

The product intentionally relies on browser-native behavior for:

- caret movement
- text selection
- double-click / double-tap selection where the platform provides it
- copy and paste
- undo and redo
- keyboard input
- touch selection handles

Mote should not replace these behaviors with a custom text layout engine.

### Preview mode

Preview is a rendered, read-oriented view of the same Markdown source.

Preview is not a WYSIWYG editor.

To edit content, the user switches to Markdown mode. The title remains a normal text field.

### Formatting toolbar

Supported Markdown transformations:

- H1-H4
- Bold
- Italic
- Underline using `<u>`
- Strikethrough
- Link
- Quote
- Inline code
- Fenced code block
- Bullet list
- Numbered list
- Checkbox
- Simple table

Formatting operations must preserve the current selected text and use native `selectionStart` / `selectionEnd` ranges.

## 6. Preview capabilities

The MVP Preview supports:

- headings
- paragraphs
- links
- bold / italic / underline / strikethrough
- lists and checkboxes
- blockquotes
- inline code
- fenced code blocks
- syntax highlighting for common languages
- tables
- images referenced by Markdown URLs
- Mermaid fenced blocks

Mermaid failure must not corrupt the note. The Markdown source remains intact.

## 7. Typography and style

Typography is intentionally fixed.

### App UI and Preview

- Inter
- system font fallbacks
- Preview body approximately 16px / 1.62 line-height

### Markdown editing

- native monospace stack
- approximately 14px / 1.65 line-height

### Removed setting

There is no Editor Font setting.

The previous `Sans / Serif / Mono` preference is removed from both the UI and persisted settings model.

The existing Mote light/dark palette and editing/Preview visual style should be preserved unless a later design decision changes them.

## 8. Core features

MVP features:

- Note CRUD
- Group CRUD
- Inbox
- Favorites
- Hidden
- Trash and restore
- Search title and Markdown content
- Markdown mode
- Preview mode
- Formatting toolbar
- Auto save
- Copy Markdown
- Export current note as `.md`
- Import one or more `.md` files
- Full JSON backup and restore
- Light / Dark / System theme
- Vietnamese / English UI
- Desktop heading outline
- PWA installability and offline shell

## 9. Storage

Mote is local-first.

The web rewrite stores application data in IndexedDB under a separate database namespace:

```text
mote-web-v2
```

No account or server is required.

The application must not send note content to analytics, logs or external APIs by default.

## 10. Data portability

Markdown remains the portable note format.

The MVP provides:

- export one note as `.md`
- import `.md` files
- export all Mote data as a versioned JSON backup
- restore a supported Mote JSON backup after validation and confirmation

The Flutter/Drift backup format is not automatically reinterpreted by the web rewrite. See `Data_Portability.md` for migration guidance.

## 11. Settings

Persisted settings are limited to:

- theme: `system | light | dark`
- language: `vi | en`
- editor view: `preview | markdown`
- desktop outline enabled: `true | false`

Not persisted:

- editor font
- Preview font
- font size presets
- complex layout preferences

## 12. Explicitly out of MVP

- Cloud sync
- Accounts
- Collaboration
- Public sharing
- AI writing features
- Rich-text editing
- Native packages
- PDF export
- DOCX export
- Image asset upload/storage
- Arbitrarily nested groups
- End-to-end encryption
- Plugin system

## 13. Definition of Done - Web MVP

The Web MVP is ready for validation when a user can:

1. Open Mote and create a note.
2. Select, edit, copy and paste Markdown naturally on desktop and mobile web.
3. Apply the supported formats without losing selected text.
4. Switch between Markdown and Preview without changing source content.
5. Create and manage groups.
6. Find notes using search.
7. Favorite, hide, delete and restore notes.
8. Reload the app and keep local data.
9. Import and export Markdown.
10. Create and restore a full backup.
11. Use Light/Dark/System theme and VI/EN UI.
12. Install or use the PWA where supported.
13. Complete the production smoke tests in `Deployment.md` without critical editor bugs.

Feature parity with `mote-old` is not a Definition of Done requirement.

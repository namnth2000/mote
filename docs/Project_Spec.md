# Mote - Project Spec

> **M**arkdown N**ote**

Mote is a minimal, local-first Markdown note app focused on reliable writing, simple organization and ownership of the user's notes.

Current release: **v1.0.0**.

## 1. Goals

Mote should:

- open quickly and let the user write immediately
- keep Markdown as the source of truth
- store notes locally without requiring an account
- make text selection, copy, paste and keyboard editing behave naturally
- provide a clean Preview for reading
- stay small enough to maintain without unnecessary product complexity

## 2. Product principles

1. Open the app and write immediately.
2. Markdown is the single source of truth.
3. Local-first by default.
4. Prefer native browser text behavior over custom editor abstractions.
5. Reliability is more important than adding many features.
6. Add features only when they solve a real use case.
7. Typography and core visual style are part of the product, not settings to customize endlessly.

## 3. Platforms

Mote is a responsive Web/PWA application for:

- desktop browsers
- tablet browsers
- mobile browsers
- installed PWA where supported

## 4. Navigation and collections

Desktop navigation:

```text
Mote
├── Inbox
├── Favorites
├── Recent
├── Groups
│   └── ...
└── Other
    ├── Trash
    └── Settings
        └── Hidden
```

### Inbox

Active, visible notes without a group.

### Favorites

Active, visible notes marked as favorite.

### Recent

Active, visible notes ordered by most recently updated.

### Groups

- Create group.
- Rename group.
- Delete group.
- Deleting a group moves its notes to Inbox.

### Hidden

Hidden is accessed from Settings instead of the main navigation.

It is an organization feature only. It is not encryption or a security feature.

### Trash

- Deleting a note moves it to Trash.
- Restore is supported.
- Permanent delete is supported.
- Notes older than 30 days are permanently cleaned up when Mote starts.

## 5. Note editor

A note stores one document field:

```text
contentMarkdown: string
```

Mote does not maintain a second rich-text document model.

### Markdown mode

Markdown mode uses a native HTML `<textarea>` so the browser owns:

- caret movement
- text selection
- copy and paste
- undo and redo
- keyboard input
- touch selection handles

Formatting uses `selectionStart` and `selectionEnd` to transform the selected Markdown string.

### Preview mode

Preview renders the same Markdown source for reading. It is not a WYSIWYG editor.

Supported Preview content includes:

- headings
- paragraphs
- links
- bold, italic, underline and strikethrough
- lists and task lists
- blockquotes
- inline code
- fenced code blocks
- syntax highlighting
- tables
- images referenced by Markdown URLs
- Mermaid diagrams

## 6. Formatting toolbar

The toolbar keeps common formatting visible and puts less frequent items in compact menus.

Direct controls:

- Bold
- Italic
- Underline
- Strikethrough
- Heading menu: H1-H4

More formatting menu:

- Link
- Quote
- Inline code
- Code block
- Bullet list
- Numbered list
- Task list
- Table
- Mermaid diagram
- Image

The editor toolbar also includes:

- Preview / MD switch
- Copy Markdown
- Download `.md`
- Show outline when the outline is available but hidden

## 7. Desktop layout

Large desktop:

```text
┌─────────────┬──────────────┬──────────────────────────┬───────────┐
│ Navigation  │ Notes        │ Editor / Preview         │ Outline   │
└─────────────┴──────────────┴──────────────────────────┴───────────┘
```

Defaults and limits:

- Navigation: 226px fixed.
- Notes list: 272px default, resizable from 220px to 480px.
- Outline: 205px default, resizable from 160px to 360px.

The outline can be hidden and shown again from the editor toolbar.

### Compact desktop/tablet

From 761px to 1199px:

- Outline is automatically hidden.
- Notes list is shown while browsing a collection.
- When a note is opened, the notes list is hidden and the editor uses the remaining width.
- A Back button returns to the notes list.

This keeps 1024px layouts usable without squeezing the editor into a narrow column.

### Mobile

At 760px and below:

- navigation + note list remain the browsing view
- opening a note brings the editor over the browsing view
- Back returns to the list
- the formatting toolbar stays on one horizontally scrollable row instead of wrapping

## 8. Outline / Scrollspy

Desktop Preview can show a heading outline when:

- the viewport is at least 1200px wide
- Preview mode is active
- the note has at least two headings
- outline is enabled in Settings

Behavior:

- H1-H4 are listed.
- The active heading follows the document scroll position.
- Clicking an item scrolls to that heading.
- The panel can be hidden manually.
- The panel can be shown again from the toolbar.
- Width is resizable from 160px to 360px.

## 9. Typography and visual style

Typography is fixed.

### UI and Preview

- Inter with system fallbacks.

### Markdown editing and code

- Native monospace stack.

There is no Editor Font setting.

The UI uses the existing Mote warm white / dark neutral palette with yellow as the primary accent.

## 10. Core features

- Note CRUD
- Group CRUD
- Inbox
- Favorites
- Recent
- Hidden
- Trash and restore
- Search within the current collection
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
- Resizable notes list
- Desktop outline / scrollspy
- PWA installability and offline app shell

## 11. Storage and privacy

Mote is local-first and stores notes, groups and settings in IndexedDB.

No account or backend is required.

Mote must not send note content to analytics, logs or external APIs by default.

Remote images or links inside a note can contact their own external origins when the browser renders or opens them.

## 12. Data portability

Markdown is the portable note format.

Mote provides:

- export current note as `.md`
- import `.md` files
- export all application data as a versioned JSON backup
- restore a supported backup after validation and confirmation

Backup format versioning is independent from the Mote application version.

## 13. Settings

Persisted settings:

- theme: `system | light | dark`
- language: `vi | en`
- editor view: `preview | markdown`
- outline enabled: `true | false`

Settings also provides entry to the Hidden collection and data import/export actions.

Not configurable:

- editor font
- Preview font
- font size presets

## 14. Tech stack

Keep the implementation simple:

- HTML + CSS + Vanilla JavaScript
- Native `<textarea>` for Markdown editing
- IndexedDB for local persistence
- Marked + DOMPurify for safe Markdown Preview
- highlight.js for code highlighting
- Mermaid for diagrams
- Vite for development/build
- Service Worker + Web App Manifest for PWA behavior
- Cloudflare Pages for static hosting

No backend is required for v1.0.0.

## 15. Out of scope for v1.0.0

- Cloud sync
- Accounts
- Collaboration
- Public sharing
- AI writing features
- Rich-text editing
- PDF export
- DOCX export
- Uploaded image binary storage
- Nested group trees
- End-to-end encryption
- Plugin system

## 16. Definition of Done

Mote v1.0.0 is usable when a user can:

1. Open Mote and create a note.
2. Select, edit, copy and paste Markdown naturally.
3. Apply supported formatting without losing selected text.
4. Switch between Markdown and Preview without changing source content.
5. Create and manage groups.
6. Browse Inbox, Favorites and Recent.
7. Hide, delete and restore notes.
8. Reload the app and keep local data.
9. Import and export Markdown.
10. Create and restore a full backup.
11. Use Light/Dark/System theme and VI/EN UI.
12. Resize desktop note list and outline within allowed limits.
13. Use compact and mobile layouts without horizontal layout breakage.
14. Install/use the PWA where supported.

# Mote - Deployment Guide

Production target: `https://mote.namnth.com`

Mote is a static Vite-built PWA hosted on Cloudflare Pages.

## 1. Production build

```bash
npm install
npm run check
npm test
npm run build
```

Output:

```text
dist/
```

The build also copies the service worker, manifest, fonts, branding and self-hosted icons into the production output.

## 2. Cloudflare Pages

Git repository:

```text
namnth2000/mote
```

Build settings:

```text
Production branch: main
Framework preset: None
Build command: npm run build
Build output directory: dist
Root directory: repository root
```

The current application does not require runtime environment variables.

## 3. Deployment flow

Cloudflare Pages is connected to the Git repository.

```text
merge/push to main
      ↓
Cloudflare build
      ↓
npm run build
      ↓
publish dist/
      ↓
mote.namnth.com
```

Use a feature branch and CI for larger changes before merging to `main`.

## 4. Custom domain

The production Pages project should keep:

```text
mote.namnth.com
```

After changing Pages projects or domain configuration, verify:

- custom domain status is Active
- HTTPS certificate is valid
- the production deployment loads from the expected project

## 5. Service worker and cache

A new deployment can briefly appear stale if an older service worker still controls an open tab/PWA window.

Troubleshooting order:

1. Reload the page.
2. Close all Mote tabs/PWA windows and reopen them.
3. Check the active service worker and Cache Storage in DevTools if necessary.

Do not use Clear site data as the first troubleshooting step because Mote notes are local browser data.

A service-worker update must not delete IndexedDB.

## 6. Production smoke test

### App shell

- Logo uses lowercase `mote` wordmark.
- Favicon loads.
- PWA icon matches Mote branding.
- Self-hosted UI icons load without external icon CDN requests.
- Light/Dark/System themes work.

### Navigation/layout

- Inbox, Favorites and Recent work.
- Groups display with consistent spacing and icons.
- Hidden opens from Settings.
- Trash is available in the bottom navigation area.
- Notes pane resizes between 220px and 480px on large desktop.
- Outline resizes between 160px and 360px.
- Outline can be hidden and shown again.
- Around 1024px, opening a note hides the notes pane and outline; Back returns to notes.

### Editor

- Selecting a note hides the `No note selected` empty state.
- Title/body auto save.
- Text selection, copy/paste and undo/redo behave normally.
- Bold/Italic/Link/Code block formatting preserves expected selection.
- Formatting popup supports list/table/Mermaid/image entries.
- Preview and MD switch correctly.
- Copy and Download actions work.

### Preview

Test:

- headings
- lists/task lists
- links
- blockquotes
- code blocks + syntax highlighting
- table
- Mermaid
- image URL
- outline active state

### Data

- Create/edit a note and reload.
- Create/rename/delete a group.
- Hide/restore/delete notes.
- Export/import `.md`.
- Export and restore a full backup.

### PWA

- manifest loads
- install prompt/menu is available where supported
- installed app launches at `/`
- icon is the intended Mote app icon

## 7. Rollback

If a critical production bug appears:

1. Do not clear local site data.
2. Roll Cloudflare Pages back to the previous known-good deployment.
3. Fix the issue on a branch.
4. Run CI and browser smoke tests.
5. Merge and redeploy only after verification.

# Mote - Deployment Guide

> Target: `https://mote.namnth.com`

Mote 2 is a static Vite-built PWA. Cloudflare Pages only needs to build the repository and publish `dist/`.

## 1. Production build

```bash
npm install
npm run check
npm test
npm run build
```

Production output:

```text
dist/
```

The build copies the PWA service worker, manifest and branding assets into the production output.

## 2. Cloudflare Pages build settings

Use:

```text
Production branch: main
Framework preset: None
Build command: npm run build
Build output directory: dist
Root directory: repository root
```

No environment variables are required by the current Mote MVP.

## 3. Migrating the existing Pages project after the GitHub repo rename

The old GitHub repository was renamed to:

```text
namnth2000/mote-old
```

A new repository now exists at:

```text
namnth2000/mote
```

Treat this as a source-repository migration, not just a normal code update.

### Step 0 - Back up Mote data first

Before changing the production deployment:

1. Open the currently deployed Flutter Mote on every browser/device containing important notes.
2. Export a full backup.
3. Export important notes as `.md` files when practical.
4. Keep these files outside browser storage.

The new app uses a separate `mote-web-v2` IndexedDB database, but backing up first is still mandatory before production replacement.

## 4. Safest rollout

### Phase A - Test the new repo independently

Before moving `mote.namnth.com`, create a temporary Cloudflare Pages project connected to `namnth2000/mote`.

Suggested temporary project name:

```text
mote-v2-preview
```

Settings:

```text
Branch: implementation branch first, then main after merge
Build command: npm run build
Output: dist
```

Use the generated `*.pages.dev` URL for smoke testing.

This avoids changing the current production source while the rewrite is still unverified.

### Phase B - Point production at the new repository

After the preview deployment passes testing, update the existing production Pages project's Git source from the old GitHub repository to the new repository if your Cloudflare dashboard exposes that source change.

Then verify:

```text
Repository: namnth2000/mote
Production branch: main
Build command: npm run build
Output directory: dist
```

If the dashboard only lets you manage GitHub access but not replace the repository source, use the Cloudflare Pages API or create a replacement Pages project and move the custom domain after validation.

### API fallback

Cloudflare's Pages project update API can update project source/build configuration. Use an API token with Pages write permission.

Conceptually update:

```json
{
  "production_branch": "main",
  "build_config": {
    "build_command": "npm run build",
    "destination_dir": "dist",
    "root_dir": ""
  },
  "source": {
    "type": "github",
    "config": {
      "owner": "namnth2000",
      "repo_name": "mote",
      "repo_id": "<NEW_GITHUB_REPO_ID>",
      "production_branch": "main"
    }
  }
}
```

Do not place Cloudflare API tokens in the repository. The Cloudflare GitHub App must have access to the new repository before the source update can build it.

## 5. Custom domain

If you keep the existing Pages project, `mote.namnth.com` should remain attached while only the Git source/build settings change.

If you create a replacement production Pages project instead:

1. Verify its `pages.dev` deployment first.
2. Remove `mote.namnth.com` from the old Pages project when ready to cut over.
3. Add `mote.namnth.com` to the replacement project.
4. Confirm certificate/DNS status becomes active.
5. Smoke test the custom domain.
6. Keep the old project available temporarily until checks are complete.

Avoid deleting the old project before the new project is verified.

## 6. Service worker update behavior

A stale service worker can make a successful deployment look old.

After a major production cutover:

- reload the page
- close/reopen installed PWA windows
- if necessary, verify the active service worker and caches in DevTools

Do not clear site data as the first troubleshooting step because Mote stores notes locally in browser storage.

## 7. Production smoke test

### App shell

- App loads without console errors.
- Inter font and logo load.
- Light/Dark/System theme works.
- VI/EN setting persists.
- Mobile layout has no unwanted horizontal overflow.

### Storage

- Create a note, edit it and reload.
- Create/rename/delete a group.
- Move a note between Inbox and a group.
- Export a full Mote 2 backup.

### Editor

Test with normal text, a link and a fenced code block:

- click/tap caret placement
- drag selection
- double-click/double-tap selection where supported
- copy/paste
- undo/redo
- Bold/Italic selection
- Link formatting
- code block selection/editing
- Preview / MD switching
- mobile keyboard open/close and scrolling

### Preview

Test headings, lists, link, blockquote, table, code block, Mermaid and desktop outline.

### PWA

- manifest loads
- app can be installed where browser support exists
- installed app launches at `/`
- basic shell can reopen after assets have been cached

## 8. Rollback

If a critical production issue appears:

1. Do not clear local site data.
2. Roll production back to the previous known-good Pages deployment when possible.
3. Keep user backup files unchanged.
4. Fix the issue on a branch and re-run preview smoke tests.

The separate `mote-web-v2` database helps isolate the rewrite from the old Drift database, but rollback should still be treated carefully because each version understands different storage formats.

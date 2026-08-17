# Mote - Data Portability

Mote is local-first. The user should be able to leave with their Markdown rather than depend on Mote's internal database format.

## 1. Individual Markdown

### Export

The current note can be downloaded as:

```text
<note-title>.md
```

The exported content is the original Markdown source.

### Import

Mote accepts one or more `.md` files.

For each file:

- UTF-8 file content becomes `contentMarkdown`.
- File name without `.md` becomes the note title.
- Import into the currently selected group when a normal group is selected, otherwise Inbox.
- Duplicate imported titles receive a safe suffix such as `(2)`.

Importing Markdown never replaces existing notes automatically.

## 2. Full backup

The web rewrite uses a JSON backup rather than a database dump.

```json
{
  "format": "mote-backup",
  "version": 2,
  "exportedAt": "2026-08-17T00:00:00.000Z",
  "groups": [],
  "notes": [],
  "settings": {}
}
```

Version `2` identifies the web rewrite backup format. It is not the IndexedDB schema version.

The backup preserves group IDs and names, note IDs, group relationships, title, Markdown source, favorite/hidden state, Trash timestamp, creation/update timestamps and supported settings.

## 3. Full restore

Restore is destructive because it replaces the current Mote library.

Required flow:

1. Read the selected JSON file.
2. Validate `format` and supported `version`.
3. Validate top-level groups, notes and settings shapes.
4. Confirm with the user that current data will be replaced.
5. Replace all persisted stores in one IndexedDB transaction.
6. Reload Mote state.

If parsing or validation fails, current IndexedDB data must not be modified.

## 4. Migrating from `mote-old`

The Flutter implementation and the web rewrite use different storage engines.

Old Flutter web:

```text
Drift + SQLite/WASM
Database name: mote
```

New web rewrite:

```text
Native IndexedDB
Database name: mote-web-v2
```

Mote 2 does not automatically read or mutate the old Drift database.

### Recommended migration before replacing production

While the old app is still live:

1. Open `mote.namnth.com` on each browser/device containing important local notes.
2. Use the old Mote export/backup feature.
3. Keep the full old backup file as an archive.
4. For notes that must be imported immediately into Mote 2, export them as `.md` files where practical.
5. Deploy Mote 2.
6. Import the `.md` files into the new app.
7. Create a new Mote 2 JSON backup after verifying the imported notes.

Do not clear browser site data until the migration has been verified.

### Why not silently migrate browser storage?

The old database is a SQLite/Drift database running through browser-specific storage. Directly rewriting it during a new deployment increases the chance of accidental data loss and ties the new architecture to the old implementation.

If preserving old group/favorite/hidden metadata becomes important for many users, build an explicit one-time importer for the old backup format as a separate migration task. Do not make that compatibility code part of the normal editor path.

## 5. Browser data warning

Local-first means local browser storage can be removed by clearing site data, browser cleanup policies, resetting a browser profile, changing device or using private/incognito sessions.

Users with important notes should export backups periodically.

## 6. Versioning rule

A future breaking backup change must:

1. increase `version`
2. keep an explicit reader/migration path for supported older formats
3. reject unknown newer versions instead of guessing
4. preserve Markdown source exactly

# Mote - Data Portability

Mote is local-first. Users should be able to keep their Markdown independently of Mote's internal storage format.

## 1. Individual Markdown

### Export

The current note can be downloaded as:

```text
<note-title>.md
```

The file contains the original Markdown source.

### Import

Mote accepts one or more `.md` files.

For each file:

- UTF-8 content becomes `contentMarkdown`.
- File name without `.md` becomes the note title.
- If a normal group is selected, the note is imported into that group; otherwise it goes to Inbox.
- Duplicate titles receive a suffix such as `(2)`.

Importing Markdown does not replace existing notes automatically.

## 2. Full backup

Mote exports a JSON snapshot containing:

```json
{
  "format": "mote-backup",
  "version": 2,
  "databaseSchemaVersion": 1,
  "exportedAt": "2026-08-17T00:00:00.000Z",
  "groups": [],
  "notes": [],
  "settings": {}
}
```

The backup `version` is an internal backup-format version and is independent from the Mote application version `1.0.0`.

The backup preserves:

- group IDs, names and ordering
- note IDs and group relationships
- title and Markdown source
- favorite / hidden state
- Trash timestamp
- created / updated timestamps
- supported persisted settings

Layout-only preferences such as pane widths are not required in the backup.

## 3. Full restore

Restore replaces the current Mote library.

Required flow:

1. Read and parse the selected JSON file.
2. Validate format/version and top-level structure.
3. Validate group/note relationships.
4. Ask the user for destructive confirmation.
5. Replace persisted groups, notes and settings in one IndexedDB transaction.
6. Reload application state.

If parsing or validation fails, current data must remain unchanged.

## 4. Browser storage warning

Local-first data can be removed by:

- clearing site data
- browser/profile reset
- private/incognito session cleanup
- changing device or browser profile

Users with important notes should export backups periodically.

A normal application/service-worker update must not delete IndexedDB data.

## 5. Versioning rule

A future breaking backup-format change must:

1. use a new backup `version`
2. keep explicit readers/migrations for supported older formats
3. reject unknown newer versions instead of guessing
4. preserve Markdown source exactly

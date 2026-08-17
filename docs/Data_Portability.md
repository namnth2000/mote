# Mote data portability

Mote remains local-first. Import, backup and restore operate on files selected by the user and do not send data to a server.

## Import Markdown

Open Settings and use **Import .md files** to select one or more files. The file name, without `.md`, becomes the note title. The original UTF-8 Markdown becomes the note content. Choose Inbox or an existing group as the destination.

Duplicate titles are retained safely as `Title (2)`, `Title (3)`, and so on. A malformed file is reported as failed without cancelling valid files in the same selection. Unsupported files found during folder import are skipped.

Use **Import folder** to import a Markdown directory. Mote maps the first folder below the selected root to a group:

```text
Notes/Work/project.md          -> Work / project
Notes/Work/Client/brief.md     -> Work / brief
Notes/root.md                  -> Inbox / root
```

Mote intentionally does not recreate arbitrary nested group trees because the current group model is flat.

### Platform limits

- Chrome and Edge web/PWA use the browser directory input API for folder import.
- Single and multiple file import use the normal browser file picker.
- Folder selection is not consistently available in mobile browsers. The action may return no files when the platform does not expose a directory picker.
- Native desktop builds use the operating system directory picker.

## Full backup

Use **Full backup** in Settings. This is separate from exporting an individual note. The downloaded ZIP is human-readable:

```text
mote-backup-<timestamp>.zip
  metadata.json
  settings.json
  notes/
    <note-id>.md
```

`metadata.json` starts with:

```json
{
  "format": "mote-backup",
  "version": 1,
  "databaseSchemaVersion": 1
}
```

Version 1 preserves note IDs, titles, groups, relationships, favorite and hidden flags, trash timestamps, creation and update timestamps, Markdown content, and all persisted settings. Mote does not currently have a separate archive state.

## Full restore

Use **Full restore** and select a Mote backup ZIP. Mote first decodes and validates the complete archive, including its format/version, JSON structure, IDs, relationships, timestamps, and every referenced Markdown payload. Current data is not touched during validation.

After validation, Mote shows the note and group counts and asks for destructive confirmation. The database replacement runs in one Drift transaction. If any write fails, SQLite rolls the transaction back instead of leaving a partial restore.

Backups with malformed ZIP data, missing metadata/settings, missing note files, unsafe paths, invalid Unicode, duplicate IDs, broken group relationships, or unsupported versions are rejected.

## Versioning

Backup format changes require a new `version` and an explicit reader/migration path. Never silently reinterpret a newer backup. Database schema changes require an ordered Drift migration and must preserve Markdown source content.

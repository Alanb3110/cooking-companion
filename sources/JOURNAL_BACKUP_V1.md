# Cooking Companion — Journal Backup V1 Source

## Scope
Journal Backup V1 protects the local-first Cook Journal against browser/site-data loss without introducing accounts, cloud sync or a backend.

The feature exports and imports the completed-cook journal only. Active-session state, shopping checkboxes and visual settings remain separate local stores and are not included in this backup format.

## Export format
A backup is UTF-8 JSON with an explicit wrapper:

```json
{
  "kind": "woodfire-companion-journal-backup",
  "version": 1,
  "exportedAt": "2026-08-30T20:00:00.000Z",
  "journal": {
    "schemaVersion": 2,
    "entries": []
  }
}
```

The wrapper version belongs to the backup transport contract. `journal.schemaVersion` remains the Cook Journal storage schema version. They evolve independently.

## Export behavior
- export the current normalized journal, including ratings, notes, schedule snapshots, observations and temperature samples;
- use a human-identifiable `.json` filename such as `woodfire-journal-YYYY-MM-DD.json`;
- do not upload the file anywhere;
- exporting an empty journal is disabled in the current UI.

## Import behavior
Import is intentionally non-destructive:
1. parse and validate the backup wrapper before touching local storage;
2. reject unknown files, unsupported backup versions and journal schemas newer than the current app;
3. migrate supported older journal data through the normal journal migration path;
4. merge imported entries with the current local journal by stable cook-session id;
5. keep the more recently updated copy when the same cook exists in both datasets;
6. ignore any imported entry marked as a DEV/test session;
7. save the merged journal only after validation succeeds.

For duplicate freshness comparison, feedback update time, general journal update time and service time are considered in that order of availability/recency. The merge therefore avoids overwriting a newer local note with an older backup copy.

## Failure safety
A malformed JSON file, an unrecognized backup type, an unsupported wrapper version, a future journal schema or structurally invalid journal entries must fail before `localStorage` is mutated. Import also aborts if the existing local journal is unreadable/future-version or if the final write hits quota/unavailable storage; the prior raw journal is preserved.

Import is not a destructive "replace journal" operation in V1. Rolling back intentionally to an older journal snapshot is out of scope.

## UI
Cook Journal exposes two small mobile-friendly actions:
- `Exporter JSON`;
- `Importer JSON`.

Import uses the native file picker restricted to JSON files. After import the journal is rerendered immediately and reports how many entries were added or updated and the resulting total.

## Privacy / storage model
The exported file contains the user's cook history and notes. It is created locally by the browser and remains under the user's control. The application still has no server-side journal storage and no automatic synchronization.

## Future work
A broader application backup may later include active sessions, shopping state and settings, but only with explicit schema/version boundaries for each store. Cloud or iCloud synchronization remains a separate product decision.

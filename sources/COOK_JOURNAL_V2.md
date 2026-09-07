# Cooking Companion — Cook Journal V2 Source

## Scope
Cook Journal V2 extends the local completed-cook history with lightweight feedback for the next cook while preserving all V1 timing/temperature/history data.

The storage namespace remains:

`woodfire-companion-journal-v1`

The stored object uses `schemaVersion: 2`.

## Migration
Journal V1 data and legacy root arrays remain readable. Migration adds per entry:
- `rating: null` when no rating exists;
- `notes: ""` when no note exists;
- `feedbackUpdatedAt: null` when feedback has never been saved.

No existing timing, measurements, observations or schedule snapshots are discarded.

## Feedback fields
A completed cook may store:
- `rating`: integer 1–5 or `null`;
- `notes`: free text, maximum 2000 characters;
- `feedbackUpdatedAt`: timestamp of the last saved feedback.

The feedback is deliberately meal-level rather than step-level in V2. It is intended for useful next-cook observations such as:
- larger meat pieces;
- less uncovered/caramelisation time;
- more sauce;
- seasoning adjustment;
- side-dish texture or timing observations.

## UI
Each expanded journal card exposes:
- five tappable stars;
- `Notes pour la prochaine fois` textarea;
- explicit Save action and status.

When a rating is saved it is also visible in the collapsed journal summary.

The journal also exposes local JSON export/import controls. Backup transport semantics are defined separately in `sources/JOURNAL_BACKUP_V1.md`; they do not change the Journal V2 storage schema.

## Resynchronisation rule
A served active session may be re-upserted into the journal after later state changes such as an added temperature measurement. Such automatic cook-data synchronisation must never erase feedback previously entered by the user when the new cook snapshot does not explicitly contain feedback fields.

## Test sessions
DEV/test sessions remain excluded from journal persistence and therefore cannot create or overwrite real feedback. Journal backup import also ignores entries explicitly marked as test sessions.

## Local backup
Journal data remains local-first but can now be exported to a versioned JSON file and restored later.

Import is a validated merge rather than a destructive replace:
- unknown/future backup formats are rejected before local data changes;
- new cook-session ids are added;
- duplicate ids keep the freshest copy;
- existing non-conflicting local history is preserved.

This protects completed-cook history against Safari/site-data loss without adding a backend or cloud account.

## Persistence failure safety
Journal reads distinguish empty, valid, unavailable and preserved-incompatible storage. Mutating operations require a valid or empty current journal; corrupt JSON and future schemas are rendered as an empty fallback with a visible warning but cannot be silently overwritten by upsert, feedback, removal, clear or import operations.

Quota and unavailable-storage failures use the same actionable error contract as the active session. Automated tests assert that the pre-existing raw journal remains byte-for-byte unchanged after each failure class.

## Non-goals
Journal V2 does not yet add:
- photos;
- structured ingredient substitutions;
- per-step notes;
- search/filter;
- cloud sync;
- automatic learning or ETA adjustment from ratings/notes.

Feedback is stored now so later recipe refinement/history features can use explicit cook experience without changing the planner prematurely.

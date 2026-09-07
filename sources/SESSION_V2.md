# Cooking Companion — Active Session V2

## Purpose
Session V2 separates **an action starting** from **an action finishing**. This is required for an active-cook copilot: long phases such as smoking, roasting, resting or baking must be able to remain `active` while the user performs parallel work.

The existing localStorage namespace remains:

`woodfire-companion-v1`

The record itself now contains:

`schemaVersion: 2`

Keeping the namespace preserves existing local data while explicit schema migrations replace ad-hoc compatibility logic.

## Step lifecycle
Each recipe step has one of three runtime states:
- `upcoming` — no actual start or completion timestamp;
- `active` — `started[stepId]` exists and `completed[stepId]` does not;
- `done` — `completed[stepId]` exists.

For a timed step, the normal interaction is:
1. first tap records `started[stepId]`;
2. the step remains active;
3. second tap records `completed[stepId]`.

For a zero-duration/manual milestone, one tap may record start and completion at the same timestamp.

Observation controls may implicitly start a step if the cook reaches the checkpoint without using the lifecycle control first. A not-ready observation keeps the step active and creates a recheck expectation; a ready observation completes it.

## Planner contract
Session V2 sends three different runtime timestamp maps to the meal planner:
- `actualStartTimes` — historical fact that a phase began;
- `actualCompletionTimes` — historical fact that a phase ended;
- `expectedCompletionTimes` — temporary runtime expectation such as a pending recheck.

Historical starts and completions are never moved to make the schedule look tidy. Planner propagation moves only work that is still feasible to move.

A started Woodfire phase therefore reserves the Woodfire from its real start until its expected/planned end, or until a later real completion/recheck extends it.

## Current-action UX
The planning screen exposes a distinct `EN COURS` card above `PROCHAINE ÉTAPE`.

When a Woodfire step is active, it is prioritised in that card and the exact structured Woodfire state is shown: mode, setpoint/range, smoke, pellets, support and covered/uncovered state.

Parallel non-Woodfire work may remain active at the same time. The current-action card indicates when additional tasks are also active.

The normal next-action selector excludes a timed step that is already active. A pending observation recheck remains actionable and may therefore become the next action.

## Recipe snapshot
A new cook stores `recipeSnapshot`, a detached copy of the validated executable recipe used to start that session.

Resuming a cook uses this snapshot first. A later repository update from recipe v4 to v5 must not silently change dependencies, durations, step ids or instructions in a cook that already started on v4.

Legacy active sessions without a snapshot fall back to the currently available recipe once, then persist that validated recipe as their snapshot for future resumes.

## Migration from legacy session records
A record with no `schemaVersion` is treated as legacy schema v1 and migrated to v2.

Migration rules:
- preserve all existing completed timestamps;
- preserve observations, rechecks, measurements and serving metadata;
- initialise `started` as an empty map rather than inventing historical start timestamps;
- initialise `recipeSnapshot` as null when unavailable;
- retain the old active-cook view when legacy progress exists.

Existing midnight/service-date repair continues to run after schema migration.

## Journal compatibility
Cook Journal V1 remains readable. New journal entries add an optional `started` map so later analysis can compare actual phase start/end durations. Old journal entries without `started` remain valid.

## Non-goals
Session V2 does not add:
- automatic completion from timers;
- push/background notifications;
- predictive ETA;
- automatic temperature-driven completion;
- multiple simultaneous cook sessions.

Those can build on the lifecycle timestamps later.

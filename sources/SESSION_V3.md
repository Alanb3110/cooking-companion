# Cooking Companion — Active Session V3

## Purpose
Session V3 extends the start/finish lifecycle introduced by Session V2 with two practical recovery/testing concepts:
- actual step timestamps may be corrected after the fact when the cook forgot to tap at the exact moment;
- DEV builds may create a synthetic test cook that exercises the real active-cook UI without waiting several hours.

The localStorage namespace remains `woodfire-companion-v1`; the record contains `schemaVersion: 3`.

## Runtime lifecycle
Each step remains `upcoming`, `active` or `done` using separate `started[stepId]` and `completed[stepId]` maps.

The planner consumes corrected timestamps exactly like timestamps recorded live. Editing an actual time therefore triggers the same dependency-aware replanning after reload; historical facts are not represented as generic +5/+10/+15 delays.

## Correcting actual timestamps
The expanded task detail exposes the actual start and, when present, actual completion time using local date/time inputs.

Use this only to correct what really happened, for example when a step was started at 18:05 but the cook only remembered to tap at 18:17.

Observation-driven steps also expose `Dernier contrôle / observation`. This is distinct from the lifecycle start timestamp. If a not-ready observation has a pending recheck, correcting the control time shifts the associated recheck by the same delta. The planner then propagates that updated expected completion when it exceeds any remaining planning buffer.

For example, Pork Belly intentionally has a 35 min planning buffer between the first tenderness checkpoint and uncovered finishing. A corrected control/recheck that still fits inside that buffer may leave the finishing time unchanged; once the updated recheck exceeds the buffer, the pork finishing chain moves downstream.

Rules:
- a corrected completion cannot precede the corrected start;
- correcting a timestamp never rewrites unrelated completed steps;
- correcting a linked ready observation also updates its matching completion timestamp;
- correcting a linked not-ready observation shifts its pending recheck by the same amount;
- the earliest known progress timestamp is updated when a corrected start predates the previously recorded cook start;
- after saving, the application reloads the persisted session and the planner recalculates downstream work from the corrected facts.

## Test sessions
Session V3 adds `isTest: boolean`, default `false`.

The DEV-only `Cuisson test` tool:
- selects an executable recipe (preferring the Pork Belly reference because it exercises observations/rechecks);
- positions the synthetic meal around the current clock time;
- seeds coherent completed/active steps, a pending recheck and sample temperatures;
- deliberately places the Pork Belly tenderness checkpoint late enough that its pending recheck exceeds the built-in buffer, so downstream propagation is visible without waiting in real time;
- stores the same recipe snapshot and session structure as a real cook;
- reloads the normal application so the real planner, active-cook UI and timestamp editor are exercised.

A real active session is backed up before entering test mode and can be restored when leaving it.

Test sessions must never pollute the real Cook Journal. Journal entries carry `isTest`, and journal persistence ignores them.

## Migration
Schema v2 records migrate to v3 by adding `isTest: false`. Legacy v1 records still migrate through v2 first; existing completed timestamps are preserved and missing historical starts are never fabricated.

## Persistence failure safety
`readSessionState()` distinguishes empty, valid, unavailable and preserved-incompatible storage. Corrupt JSON and schemas newer than V3 return an in-memory default only for safe rendering, together with a user-facing warning; their raw stored bytes remain untouched.

Before every session write, the existing payload is decoded/migrated again. If it is corrupt or from a future schema, the write aborts instead of replacing it. Unavailable storage and quota exhaustion also raise actionable errors; `localStorage.setItem` failure leaves the previous record intact.

## Offline behavior
The timestamp editor is part of normal app behavior. DEV test tooling is loaded only when a visible DEV build badge is present. Both modules are cached in the PWA shell so development validation also works after the app has been loaded once.

## Non-goals
Session V3 does not add automatic timers, background notifications, ETA prediction, automatic completion from temperature, or multiple simultaneous real cook sessions.

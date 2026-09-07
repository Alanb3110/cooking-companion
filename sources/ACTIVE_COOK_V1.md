# Cooking Companion — Active Cook V1 Source

## Scope
The active-cooking UI is connected to Planner V1 and exposes explicit step lifecycle plus structured observation/recheck controls.

The objective is behavioral: actual starts/completions become planner facts, temporary rechecks remain expectations, and only future work that truly depends on those facts is moved.

## Architecture boundary
`js/active-cook-controller.js` owns active-cook state orchestration without owning DOM rendering. It is the single coordinator for:
- schedule recomputation from the current session facts;
- planner feedback from actual starts/completions and expected rechecks;
- step lifecycle transitions;
- structured observation application;
- +5/+10/+15 next-action delays;
- planning reset;
- cook-journal synchronization.

`app.js` remains the top-level UI/bootstrap owner and renders task cards, the current-action card and the next-action countdown from the controller's current schedule. UI events delegate state transitions back to the controller rather than reproducing planner/session mutation logic in the DOM layer.

The controller deliberately has no DOM dependency. Its state callbacks make the orchestration path directly testable without a browser or framework.

## Step lifecycle
Session V2 distinguishes:
- `upcoming`;
- `active`;
- `done`.

Timed steps use two actions through the checklist control:
1. first tap records the actual start;
2. the checkbox becomes indeterminate and the step is `EN COURS`;
3. second tap records actual completion.

Zero-duration/manual milestones may start and complete in one tap.

Actual starts and completions are historical facts. They must not be rewritten simply to tidy the schedule.

See `sources/SESSION_V2.md`.

## Current action
The planning header exposes an `EN COURS` card separate from `PROCHAINE ÉTAPE`.

If one or more tasks are active, the Woodfire task is prioritised when present. Its exact structured configuration is shown together with actual start and indicative end. Parallel work may remain active simultaneously.

The next-action selector excludes timed tasks already in progress. A pending recheck remains actionable and may therefore become the next action.

## Absolute serving date
An active cook stores `targetServingAt` as an absolute date/time, not only a clock string such as `05:30`.

The session start is also absolute. A service occurrence is never allowed to predate `sessionStartedAt`. Older persisted sessions are repaired when loaded/resumed, and editing the meal clock keeps the intended nearby calendar occurrence subject to the same lower bound.

## Structured observations
A step declaring `recheck.notReadyMin` receives observation controls in its expanded detail.

Derived labels currently include:
- tenderness: `Encore ferme / Presque prêt / Très tendre`;
- target-temperature/combined completion: `Sous X °C / Presque X °C / X °C atteint`;
- generic fallback: `Pas prêt / Presque prêt / Prêt`.

If a checkpoint had not already been started, the first observation records its actual start.

Choosing a not-ready state stores the observation and a future recheck timestamp. The step remains active/incomplete. The recheck is passed to Planner V1 as an expected completion time, so existing buffer may absorb the delay before downstream work moves.

Choosing a ready state stores the real completion timestamp and clears the pending expectation.

See `sources/OBSERVATIONS_V1.md`.

## Delay controls
The +5 / +10 / +15 minute controls remain for fast one-handed recovery.

Normal meaning:

**The next actionable upcoming step is delayed by this amount.**

Already-active timed work is not selected as a normal upcoming action. If the next action is an observation recheck, the buttons move only that deadline.

## Propagation rules
After an actual start, completion, recheck expectation or explicit delay:
- historical starts/completions remain fixed;
- hard dependencies remain satisfied for movable future work;
- planning buffers may absorb delay;
- unrelated parallel work remains where feasible;
- an exclusive Woodfire conflict moves only work that has not already happened;
- service may move if the target can no longer be met without compromising the cook.

## Recipe version during a cook
A new session stores a validated recipe snapshot. Resume uses that snapshot rather than silently switching to a newer repository recipe version.

This keeps step ids, dependencies, timings and instructions stable for the lifetime of one cook.

## Expanded details
Expanded task cards show:
- exact Woodfire state when applicable;
- completion criterion;
- observation buttons when applicable;
- pending recheck time;
- recent observation history;
- actual start timestamp;
- actual completion timestamp.

## Temperature logging
Temperature logging remains independent and low-friction. A logged temperature does not automatically complete a step; the cook still confirms readiness.

Temperature persistence can request journal synchronization through the same active-cook controller, so the journal is not maintained through a second orchestration path.

## Current limitations / next work
- Active-cook DOM rendering still lives in `app.js`; extract it only as a cohesive UI controller if the file continues to grow materially.
- No background/push notification fires when an active phase or recheck becomes due.
- No temperature sample automatically chooses an observation outcome.
- Observation labels remain derived rather than curated per recipe.
- Predictive ETA remains later work and must expose uncertainty.

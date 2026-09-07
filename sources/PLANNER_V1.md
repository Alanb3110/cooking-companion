# Cooking Companion — Planner V1 Source

## Scope
Planner V1 replaces direct fixed-offset placement as the primary scheduling mechanism. It is a pure/testable scheduling layer: recipe data defines durations, dependencies, serving anchors and resources; the engine produces timestamps around the desired serving time.

The active-cook UI feeds real progress and pending rechecks back into the same planner rather than maintaining a second timing model.

## Primary anchor
The desired serving time is represented by a step with:

```json
"plan": { "anchor": "serve" }
```

Optional `anchorOffsetMin` may place an anchored step relative to service.

Planner V1 works backwards from anchored steps to place their prerequisites as late as practical while respecting durations and declared planning gaps.

The active session stores `targetServingAt` as an absolute timestamp. Editing only the meal clock time chooses the closest calendar-day occurrence to the previous target, so a change such as 20:00 → 05:00 near midnight does not silently jump to 05:00 on the wrong day. A newly started cook targets the next future occurrence of the selected clock time.

## Dependencies
Supported relations remain:
- `after_finish` — successor starts after predecessor finishes;
- `after_start` — successor starts after predecessor starts.

`lagMin` is a hard relationship and remains active during real replanning.

Example:

```json
{
  "stepId": "smoke",
  "relation": "after_finish",
  "lagMin": 0
}
```

## Planning buffers
A dependency may additionally contain:

```json
"planningBufferMin": 20
```

A planning buffer is deliberately different from a hard lag:
- baseline scheduling reserves the buffer;
- a real delay may consume the buffer;
- downstream tasks move only after the buffer has been exhausted.

This is the mechanism for protecting uncertain checkpoints without blindly moving unrelated work.

For example, the Pork Belly meal has 35 minutes of margin after its first tenderness check. An `Encore ferme` observation that requests a 20 minute recheck can therefore be absorbed without changing later timestamps when the cook is otherwise on plan. A later recheck that exceeds the remaining margin propagates through dependent work and may move service.

## Migration from fixed offsets
`preferredStartOffsetMin` remains accepted during migration, but it is no longer the primary placement algorithm.

When a serve anchor exists:
1. dependencies/durations derive the backwards schedule;
2. a legacy preferred offset acts only as a soft `not later than` hint;
3. the hint may preserve an existing buffer or parallel placement while content data is migrated to explicit semantics.

New recipes should prefer anchors, dependencies, planning buffers and resource rules. A recipe with no serve anchor may still use complete legacy offsets for backwards compatibility, but that path is transitional.

## Earliest placement
A step may use:

```json
"plan": { "placement": "earliest" }
```

This is useful for parallel work that should begin as soon as its prerequisites allow rather than being packed against service time.

Default placement is effectively latest-feasible within the dependency graph.

## Woodfire resource
The Woodfire is an exclusive resource in V1.

If independent Woodfire reservations overlap in the baseline plan, the engine resolves the collision backwards: the earlier reservation and its prerequisite chain are moved earlier so the target serving time remains unchanged.

A planned resource conflict must not silently move the desired serving time.

## Runtime delays
Runtime adjustment is intentionally asymmetric with baseline planning.

Baseline:
- protect desired service time;
- schedule backwards;
- consume available flexibility upstream.

Real cook:
- completed timestamps are historical facts and are never rewritten;
- explicit delays move the affected task;
- pending rechecks extend the expected finish of the affected step until the next observation deadline;
- hard dependencies propagate only when violated;
- planning buffers may absorb delay;
- Woodfire conflicts push unfinished work later when necessary;
- serving time may slip if required to preserve feasible execution/food quality.

This follows the project rule that food quality must not be sacrificed solely to preserve the planned clock time.

## Actual vs expected completion timestamps
`buildSchedule()` accepts two distinct runtime maps:

- `actualCompletionTimes` — historical facts for completed steps;
- `expectedCompletionTimes` — temporary not-before finish expectations, currently used by pending observation rechecks.

For a completed step, its actual end time replaces its planned end for downstream constraint evaluation.

For a pending recheck, the planned end is extended to the recheck deadline when that deadline is later. The step remains incomplete. This lets downstream dependencies react to continued cooking without pretending that the food is already done.

`buildMealSchedule(recipe, context)` forwards both maps so UI code does not bypass the stable meal-planner facade.

## Next-action ordering
The schedule remains chronologically sorted by actual planner timestamps. The active-cook next-action selector may additionally receive `nextActionTimes`, such as pending recheck deadlines.

This matters for parallel work: a checkpoint that started earlier but is waiting until 18:35 must not hide an independent task genuinely due at 18:20.

## Validation/tests
Planner V1 tests cover:
- current reference-meal baseline compatibility;
- recipes with no preferred offsets;
- schedules crossing midnight;
- dependency correctness;
- baseline Woodfire conflict resolution;
- planning-buffer absorption;
- service slippage once a buffer is exhausted;
- actual completion propagation;
- pending recheck propagation beyond remaining buffer;
- pending recheck absorption inside remaining buffer;
- cross-midnight meal-time edits;
- next-action ordering with recheck deadlines.

## Not yet in V1
Deferred to subsequent increments:
- temperature-slope ETA;
- historical-session learning;
- multiple capacity-limited resources beyond the single exclusive Woodfire;
- advanced user-attention/workspace scheduling.

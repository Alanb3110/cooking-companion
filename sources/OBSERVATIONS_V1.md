# Cooking Companion — Active observations / rechecks V1

## Purpose
Observation controls turn uncertain cooking checkpoints into explicit active-cook actions without pretending that estimated durations are exact.

The feature uses the existing Recipe Schema V1 fields:
- `completion.type` + `completion.description` define what "done" means;
- `recheck.notReadyMin` defines a positive delay or `[min, max]` recheck range.

No new recipe-schema field is required for V1.

## UI behavior
A step with `recheck.notReadyMin` receives observation buttons in its expanded active-cook detail.

Current derived labels:
- tenderness completion: `Encore ferme / Presque prêt / Très tendre`;
- temperature or combined completion with a recipe temperature target: `Sous X °C / Presque X °C / X °C atteint`;
- generic fallback: `Pas prêt / Presque prêt / Prêt`.

The longest declared recheck delay is used for clearly not-ready states. The shorter control uses the earliest declared delay or a shorter midpoint-derived interval for broad ranges. A ready observation completes the step immediately with the actual observation timestamp.

## Recheck semantics
A not-ready observation does **not** move the historical start time of the cooking step.

Instead it stores:
- the observation timestamp;
- the selected label/outcome;
- a `recheckDueAt` timestamp in active-session state.

The step remains incomplete. The active "next action" card points to the recheck deadline. When the user eventually marks the step ready, the actual completion timestamp is sent to Planner V1.

This is deliberate: existing planning buffers may absorb the additional cook time. Downstream work moves only when the actual completion time makes that necessary.

## Active-session state
The existing `woodfire-companion-v1` record gains additive fields:
- `observations`: ordered observation records;
- `rechecks`: map of `stepId -> pending recheck ISO timestamp`.

Older local records remain readable because missing fields default to `[]` and `{}`.

A new cook or checklist reset clears observations and pending rechecks. Manually checking/unchecking a step clears any pending recheck for that step.

## Observation record
A record contains:
- `stepId`;
- `observationId`;
- user-facing `label`;
- `outcome`: `recheck` or `complete`;
- `timestamp`;
- optional `recheckDueAt`.

## Delay controls
If the next unfinished step already has a pending recheck, the existing +5/+10/+15 delay buttons move the recheck deadline rather than shifting the whole cooking step.

Otherwise they retain their Planner V1 behavior and attach explicit delay to the next unfinished step.

## Journal
Cook Journal V1 snapshots observations as additive entry data. The journal schema version remains 1 because this is backward-compatible optional data; older journal entries simply have no observation array.

## Current recipe coverage
- Pork Belly `first-check`: tenderness control using the existing 15–20 min recheck range.
- Turkey `finish-turkey`: 74 °C temperature-driven control using the existing 5–10 min recheck range.

No recipe-specific branch is present in `app.js`; labels are derived from generic completion/recheck semantics.

## Limitations / next iteration
- No push/background notification is generated when a recheck becomes due; the active screen countdown updates while the PWA is open.
- V1 does not automatically infer an observation from a temperature sample.
- V1 does not change Woodfire settings automatically.
- A future schema extension may support curated observation labels only if a real recipe cannot be represented clearly by the derived labels.
- Later ETA logic may use observation history, but must retain uncertainty and never override food-quality/safety completion criteria.

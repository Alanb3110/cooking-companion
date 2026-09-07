# Cooking Companion — Recipe expansion 2026-08-31

## Goal
Expand the curated library with meals chosen primarily to exercise distinct planning behaviours rather than to maximise recipe count.

The four meals below are executable Recipe Schema V1 datasets and are promoted to `available` with local illustrated WebP covers. Promotion means the content/schema/planner/offline contracts pass; it does **not** mean the meals have already been physically cooked and taste-qualified. Real-cook feedback remains the authority for later culinary refinements.

## 1. Saumon laqué soja-miel, asperges & riz citronné

**Product pattern:** short, temperature-driven meal with meaningful parallel work.

- short total horizon compared with the long-cook recipes;
- fish completion driven by core temperature rather than a long fixed duration;
- stovetop rice can run in parallel with Woodfire work;
- the Woodfire changes from `SMOKER` to `GRILL` for the asparagus;
- a short recheck interval exercises active-cook observation/replan behaviour on a fast meal;
- critical glaze, rice and asparagus quantities are materialised directly in active-cook steps for the selected serving count.

## 2. Poulet shawarma fumé, pommes de terre épicées & sauce yaourt

**Product pattern:** advance preparation plus multi-mode same-evening execution.

- marinade is represented as `advancePrep`, ideally 4–12 h in advance;
- the active cook begins with already-marinated chicken rather than stretching the live timeline across the whole day;
- chicken moves from `SMOKER` to `GRILL` and is temperature-driven;
- potatoes use `AIR_FRY` after the chicken releases the Woodfire;
- yogurt sauce and fresh garnishes run in parallel using fridge/no exclusive resource;
- advance-prep guidance gives an actionable 4-person baseline, while active potato/sauce/garnish/bread quantities scale in the step detail.

## 3. Bœuf reverse-sear, grenailles croustillantes & sauce poivre

**Product pattern:** intermediate thermal checkpoint, resource hand-off and final temperature criterion.

- low-temperature `SMOKER` phase reaches an intermediate 52–55 °C checkpoint only;
- that intermediate checkpoint is explicitly **not** the final serving criterion;
- Woodfire is released for `AIR_FRY` potatoes, then reconfigured to very hot `GRILL` for the final sear;
- the final step is temperature-driven at 63 °C and is followed by a 5 min rest;
- alcohol-free pepper sauce runs on the stovetop in parallel;
- beef seasoning, potatoes and pepper-sauce quantities are exposed directly in active-cook detail and scale with servings.

This meal intentionally exercises the manual temperature log and a mode/accessory sequence without adding temperature-slope ETA logic.

## 4. Wings miel-soja fumées, potatoes croustillantes & coleslaw

**Product pattern:** genuine exclusive-resource conflict.

`cook-wings` and `cook-potatoes` are independent dependency branches and both reserve `woodfire`. The recipe deliberately does not add a fake dependency between them. Planner V1 chooses a non-overlapping baseline schedule using the existing exclusive-Woodfire conflict solver.

The wings then return to the Woodfire for a short `GRILL` caramelisation after glazing, while coleslaw can be prepared in parallel and held cold. Wings seasoning, potatoes, coleslaw and glaze all expose serving-scaled quantities inside their active steps.

This remains the most important regression recipe for detecting whether the current resource solver works beyond the original curated meals.

## Food-safety references

Fixed safety-critical temperatures in these recipes were checked against authoritative guidance before being encoded and rechecked during promotion:

- poultry: 74 °C, corresponding to USDA FSIS guidance of 165 °F;
- intact beef steak/roast final criterion: 63 °C, corresponding to USDA FSIS guidance of 145 °F followed by at least 3 min rest; this recipe uses 5 min rest;
- fish: 63 °C, corresponding to FDA guidance of 145 °F.

References:
- USDA FSIS — chicken cooking temperature: https://ask.fsis.usda.gov/article/What-are-cooking-times-for-chicken
- USDA FSIS — beef cooking temperature and rest: https://ask.fsis.usda.gov/article/To-what-temperature-should-I-cook-beef
- FDA Food Code 2022: https://www.fda.gov/media/184685/download?attachment=

## Promotion quality gate

A recipe may be `available` when:

1. it has a truthful local WebP cover satisfying the illustrated-library contract;
2. Recipe Schema V1 and step-ingredient usage validation pass;
3. min/reference/max serving schedules build with no unresolved quantity tokens;
4. dependency checks and exclusive-Woodfire conflict checks pass;
5. appliance changes and completion criteria have been reviewed for a sensible execution order;
6. safety-critical fixed temperatures are backed by current authoritative guidance;
7. the service worker can cache the available recipe JSON and cover for offline use.

For these four recipes, that gate is covered by the promotion branch/CI plus the planner-pattern regression suite. No Planner V1 algorithm change was required.

## Real-cook qualification

`available` is not the final culinary-quality label. Before treating a candidate as beta-quality cooking content, run at least one representative meal on the installed iPhone PWA and record real-cook feedback in the journal. Subsequent recipe versions should adjust durations, quantities or completion guidance from those observations rather than hiding real-world variation to preserve the planned clock.

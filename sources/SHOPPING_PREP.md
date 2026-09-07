# Cooking Companion — Shopping & Pre-cook Source

## Scope
This source defines the reusable shopping-list and pre-cook preparation behavior. It complements `PRODUCT_SPEC.md`, `RECIPE_MODEL.md` and `RECIPE_SCHEMA_V1.md` without changing planner semantics.

## Ingredients & shopping behavior
The recipe page uses one combined `Ingrédients & courses` checklist rather than displaying a read-only ingredient list and a second duplicate shopping list.

The checklist is generated from the selected recipe and serving count.

Requirements:
- use the same scaled ingredient quantities as the recipe content layer;
- preserve optional markers;
- group items into practical categories;
- put a checkbox directly on each ingredient row;
- include recipe-specific consumables such as Woodfire pellets when declared;
- provide checkboxes suitable for one-handed mobile use;
- persist checked items locally across reloads;
- keep shopping state separate from cook-session completion state;
- expose checked/total progress;
- allow the checklist to be reset explicitly.

Current category vocabulary:
- viande;
- fruits & légumes;
- produits frais;
- épicerie;
- boissons & épicerie;
- consommables.

The current recipe model uses one canonical top-level ingredient entry per ingredient id, so duplicate use across embedded components is consolidated before display. Future external component composition may require additional aggregation in the content/shopping layer, not in UI code.

## Consumables
Non-food consumables may be declared in recipe `equipment` with:
- stable `id`;
- `name`;
- `consumable: true`;
- optional `displayQuantity`;
- optional flag where relevant.

Consumables are appended to the combined ingredients/shopping checklist under their own category and excluded from the reusable equipment checklist.

## Equipment checklist
Before cooking, show required equipment/accessories separately from ingredients and consumables.

## Advance preparation
Recipes may declare an `advancePrep` array for work that should be visible before the active timeline begins.

Each entry may contain:
- stable `id`;
- short `title`;
- `timing` display guidance;
- `details`;
- optional flag;
- optional `ingredientUsage` when its quantities depend on selected servings.

When `ingredientUsage` is present, `getAdvancePrep(recipe, servings)` materializes `{{use:...}}` tokens using the same serving/scaling semantics as active-cook step quantities. `prep-ui.js` always passes the currently selected serving count, so a marinade or other advance instruction cannot remain silently fixed at reference servings while the shopping list changes.

Advance preparation remains informational rather than a planner node. Serving-aware text substitution does not add dependencies, resources or duration scaling. If an advance-prep item later needs formal scheduling/replanning, migrate it into planner semantics rather than duplicating schedule logic in the UI.

See `sources/STEP_INGREDIENT_USAGE_V1.md`.

## Persistence
Shopping check state uses its own local-storage namespace rather than active cook state:

`woodfire-companion-shopping-v1`

Checklist state is scoped by:

`recipeId@recipeVersion`

and then shopping-item id.

This prevents a newly deployed recipe version from silently inheriting checked rows from older content whose ingredients/consumables may have changed. Legacy id-only state is migrated once when that recipe is next rendered.

Serving changes within the same recipe version update quantities and advance-prep instructions while retaining checked identities because ingredient ids remain stable.

## Recommended start
The user-facing `Début conseillé` value is operational timing and must come from the same generated meal plan used by active cooking. Broad metadata such as `timing.elapsedRangeMin` may describe a recipe card but must not act as a second scheduling source of truth.

## UX
Before pressing Start, the user should be able to answer:
- what ingredients/consumables do I need?;
- which do I already have?;
- what equipment/accessories do I need?;
- what should be prepared in advance, **for the selected serving count**?;
- when should I begin according to the generated plan?;
- what exactly is in the meal?

Keep this pre-cook view compact and scannable on iPhone. The active-cook interface remains focused on next/current actions rather than shopping controls.

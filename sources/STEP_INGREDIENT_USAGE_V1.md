# Cooking Companion — Ingredient Usage V1

## Goal
Keep both active-cook instructions **and advance preparation** consistent with the selected serving count without duplicating hard-coded reference quantities inside prose.

Top-level `ingredients` remain authoritative for the ingredient/shopping view. Local `ingredientUsage` records describe how much of those ingredients a particular step or advance-prep instruction uses.

## Supported locations
`ingredientUsage` may currently be declared on:
- an executable `step`;
- an `advancePrep` item.

The same token syntax and scaling semantics apply in both locations.

Example:

```json
{
  "id": "marinate-ahead",
  "ingredientUsage": [
    {
      "id": "marinade-meat",
      "ingredientId": "meat",
      "quantity": 2,
      "unit": "kg",
      "scale": { "type": "linear" }
    }
  ],
  "details": "Mariner {{use:marinade-meat}} de viande."
}
```

The token is materialized at the selected serving count before display.

## Inheritance
Each usage references one top-level ingredient through `ingredientId`.

Unless overridden, it inherits:
- `quantity`;
- `unit`;
- `scale`.

A local override is interpreted at the recipe's `servings.reference` count before scaling.

Typical uses:
- inherit a full top-level quantity for a step;
- use only the subset of salt/oil/sauce needed in one phase;
- inherit a whole-fruit `step` scale;
- override quantity/unit where prose needs juice mass/volume instead of fruit count;
- keep an advance marinade consistent when the user changes servings before the cook begins.

## Validation
`validateRecipeIngredientUsage()` validates both executable steps and `advancePrep` items.

It enforces:
- `ingredientUsage` is an array when present;
- local usage ids are unique inside one item;
- each `ingredientId` exists in the top-level ingredient list;
- quantities are valid non-negative numbers/ranges/null;
- units are non-empty strings when supplied;
- changing a top-level unit requires an explicit converted quantity;
- `displayUnit` is boolean when supplied;
- scale types use the same vocabulary as top-level ingredients;
- usage-local `step` breakpoints are strictly increasing and cover `servings.max`;
- every `{{use:id}}` token resolves to a declared usage;
- every declared usage is referenced in that item's text.

`validateStepIngredientUsage()` remains available for step-only validation. `validateAdvancePrepIngredientUsage()` provides the equivalent advance-prep check. Recipe loading uses the whole-recipe validator.

## Materialization
`materializeRecipeForServings(recipe, servings)` returns a non-mutating serving-specific view in which:
- step summaries/details are materialized;
- advance-prep details are materialized.

`materializeAdvancePrepForServings()` is also used by the pre-cook layer directly.

`buildMealSchedule()` continues to materialize recipe step text before low-level scheduling, while shopping/prep rendering materializes advance-prep text for the same selected serving count.

This does not change planner semantics:
- no duration scaling;
- no automatic batching;
- no dependency/resource change.

## Formatting
Current display formatting:
- French decimal comma;
- up to two decimal places;
- ranges use an en dash;
- existing application unit labels such as `g`, `kg`, `mL`, `c. à soupe`, `c. à café`;
- `displayUnit: false` suppresses the unit where prose provides the noun itself.

## Relationship to shopping totals
V1 does not sum local `ingredientUsage` records to build the shopping list. Top-level ingredient quantities remain authoritative.

This is deliberate because exact conservation is not always meaningful: one ingredient can be represented in multiple ways, usages may be optional and finishing quantities can remain flexible. Curated content must nevertheless keep shopping totals and local instructions sensibly consistent.

## Reference migrations
Pork Belly content version 6 established serving-aware active-step quantities.

Barbacoa content version 2 extends the same mechanism to advance preparation so the marinade shown before cooking follows the selected 6–8 serving configuration instead of remaining hard-coded to the 8-person reference. Its salsa, braise, toppings and shell quantities are also serving-aware in active-cook text while the established execution timeline remains unchanged.

## Future work
Only if real meals justify it:
- usage-aware shopping aggregation/conservation checks;
- capacity/batch rules tied to servings;
- richer structured preparation actions beyond textual substitution.

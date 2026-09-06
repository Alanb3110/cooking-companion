# Food Safety Traceability V1

## Scope and decision rule

This register covers fixed internal-temperature, storage, reheating and raw-marinade statements encoded in executable recipe data. It does not convert culinary preferences, indicative tenderness temperatures or automated tests into proof of food safety.

Current verification date: **2026-09-05**.

Rules:

- every current executable recipe with `temperature.defaultTargetC` declares a stable `temperature.guidanceId`;
- a target or safety statement may change only after rechecking a current authoritative source;
- historical recipe snapshots without `guidanceId` remain executable so an application update cannot invalidate an active cook;
- the project records the jurisdiction of guidance. USDA/FSIS category-specific minima are used for the temperature rules below; ANSES also publishes a broader French consumer default of 70 °C at the centre, which is more conservative than the USDA whole-cut/fish rule;
- people at elevated medical risk should follow their clinician and local public-health guidance rather than treating this personal cooking app as individualized safety advice.

## Traceability matrix

| Guidance ID | Encoded rule | Current recipe coverage | Authority and rationale | Limits |
|---|---|---|---|---|
| `FS-USDA-POULTRY-74C` | Chicken, turkey and duck reach at least 74 °C at the thickest/coldest measured point. | `chicken-satay-coconut-rice`, `glazed-chicken-skewers-rice`, `glazed-duck-sweet-potato-citrus`, `gochujang-honey-soy-chicken-rice`, `mild-jerk-chicken-rice-peas`, `smoked-chicken-shawarma-potatoes`, `smoked-honey-garlic-chicken-couscous`, `smoky-honey-soy-wings-potatoes-slaw`, `sweet-savory-turkey-zucchini-gratin`, `tandoori-chicken-basmati-raita`, `woodfire-chicken-fajitas` | USDA/FSIS specifies 165 °F = 73.9 °C for all poultry, including duck. The application rounds upward to 74 °C. | Probe placement and cold-spot selection remain operator-dependent. |
| `FS-USDA-WHOLE-CUT-63C-3MIN` | Intact beef or pork reaches at least 63 °C, followed by at least 3 min rest. | `bulgogi-bavette-udon`, `char-siu-pork-rice-cucumber`, `galbi-short-ribs-rice-cucumber`, `korean-grilled-pork-rice-slaw`, `maple-mustard-soy-pork-tenderloin`, `maple-paprika-pork-steaks-potatoes`, `reverse-sear-beef-potatoes-pepper-sauce`, `teriyaki-beef-skewers-rice-edamame` | USDA/FSIS specifies 145 °F = 62.8 °C plus a 3 min rest for whole beef/pork cuts. Each covered execution graph contains an explicit rest step of at least 3 min. | Thin strips, flanken ribs and skewered cubes can be difficult to probe accurately. Use the thickest reliably measurable meat section and keep the explicit rest. ANSES's general 70 °C advice is the more conservative alternative. |
| `FS-USDA-FISH-63C` | Fish reaches at least 63 °C at the thickest point. | `honey-soy-salmon-rice-asparagus`, `miso-honey-salmon-soba` | USDA/FSIS specifies 145 °F = 62.8 °C for fin fish; the application rounds upward to 63 °C. | This is a safety-oriented endpoint, not a restaurant-style lower doneness target. |
| `CULINARY-COLLAGEN-TENDERNESS` | Targets from 92 to 95 °C are indicative tenderness endpoints; sensory/probe tenderness remains the completion criterion. | `korean-pulled-pork-woodfire`, `pork-belly-burnt-ends-meal`, `smoked-beef-barbacoa`, `smoky-bbq-ribs-mac-slaw` | These temperatures are culinary process targets and already exceed the applicable minimum-temperature guidance. They are not presented as universal food-safety minima. | Time-to-tender varies with cut, collagen and geometry. Temperature alone cannot qualify tenderness. |
| `FS-FSA-RICE-COOL-REHEAT` | Cooked rice is cooled rapidly, ideally within 1 h; refrigerated; used within 24 h; reheated once only; served steaming hot throughout. | `egg-fried-rice` | UK Food Standards Agency guidance gives these rice-specific controls. The recipe encodes them in advance preparation and final reheating criteria. | This source applies to England, Wales and Northern Ireland. No equally specific current French consumer rule was identified in this audit. |
| `FS-USDA-CLEAN-MARINADE` | Sauce used after cooking is reserved before contact with raw meat/poultry, or prepared in a clean bowl; raw marinade is discarded rather than brushed directly onto cooked food. | Cross-cutting recipe instructions where a glaze follows raw marination, including the quick overnight-prep recipes. | USDA/FSIS grilling guidance explicitly recommends reserving the sauce portion before raw meat/poultry is added. | This register does not claim that every possible cross-contamination path is controlled by recipe text alone. |

## Interpretation details

- `reverse-sear-beef-potatoes-pepper-sauce` uses 52–55 °C only as an intermediate smoking checkpoint. Its final step requires 63 °C and its graph then enforces a 5 min rest.
- `galbi-short-ribs-rice-cucumber` uses thin flanken-cut ribs; temperature should be measured in the thickest reliable meat section away from the bone, followed by the explicit 3 min rest.
- `teriyaki-beef-skewers-rice-edamame` uses whole-cut beef cubes; the thickest cube is the measurement point, followed by the explicit 3 min rest.
- Targets of 92–95 °C for collagen-rich cuts are not substituted for the recipe's tenderness observation.
- Automated validation checks target/source linkage and execution-graph consistency. It does not measure probe calibration, actual cold spots, refrigerator temperature or user technique.

## Authoritative references

1. USDA Food Safety and Inspection Service, [Safe Minimum Internal Temperature Chart](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/safe-temperature-chart).
2. USDA Food Safety and Inspection Service, [Grilling and Food Safety](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/grilling-and-food-safety).
3. UK Food Standards Agency, [Home food fact checker — cooked rice](https://www.gov.uk/government/publications/home-food-fact-checker/home-food-fact-checker#rice).
4. ANSES, [Éviter les toxi-infections alimentaires : les bonnes pratiques](https://www.anses.fr/fr/content/eviter-les-toxi-infections-alimentaires-en-confinement-les-bonnes-pratiques).

## Reverification triggers

Recheck the relevant authority before merging any change that:

- adds or changes `temperature.defaultTargetC`;
- changes a mandatory rest time linked to a whole-cut minimum;
- adds a cooling, refrigeration, thawing, hot-holding or reheating limit;
- changes the reuse/disposal rule for a raw marinade;
- promotes the application beyond personal household use.

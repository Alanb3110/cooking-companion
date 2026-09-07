# Cooking Companion — Korean pulled pork + Egg Fried Rice

## Status
Two separate executable recipes are maintained:
- `recipes/korean-pulled-pork-woodfire.json`;
- `recipes/egg-fried-rice.json`.

Both enter the library with `qualification: untested` and should be refined from real-cook evidence.

## Source basis
The initial content is based on the two user-provided recipe cards supplied on 2026-09-01.

The pork card defines:
- boneless pork neck/shoulder, about 1.5–2 kg;
- overnight Korean marinade with soy sauce, gochujang, honey, brown sugar, garlic, ginger, sesame oil, rice vinegar and pepper;
- optional 30–45 min smoke;
- high-temperature browning;
- covered slow cooking at 120–130 °C for roughly 4.5–6 h;
- 94–95 °C core temperature plus tenderness-to-probe as the finish criterion;
- 30–45 min covered rest;
- shredding and mixing with cooking juices;
- optional high-heat caramelizing finish.

The fried-rice card defines a 2-person gochujang version based on:
- 300–350 g cold cooked rice;
- 2 eggs;
- carrot/onion and spring onion;
- neutral oil;
- soy sauce, rice vinegar/lime and sesame oil;
- gochujang sauce;
- 150–250 g Korean pulled pork;
- bacon as an additional optional suggestion on the original card.

Cooking Companion deliberately omits bacon from the V1 recipe, shopping list and instructions so the generic fried-rice path stays focused on the core egg/rice/vegetable method plus the two options explicitly retained in the app: gochujang and Korean pulled pork.

## Product modeling decision
The two dishes are **not** encoded as one meal recipe.

### Korean pulled pork
The pork is a standalone long-cook recipe because it can be served in buns, tacos, rice bowls or lettuce and can produce leftovers for later meals.

The source card describes the smoke phase as optional/cold smoking. Recipe Schema V1 does not model optional executable branches and Woodfire tasks require an explicit appliance state. The app therefore adapts this into a short **SMOKER 120 °C** phase with smoke ON and pellets loaded. This is an implementation adaptation, not a claim that the source card specified 120 °C for the smoke phase.

The slow-cook completion remains state-driven: 94–95 °C is useful guidance, but probe tenderness remains important. A 20 min recheck is scheduled when it is not ready.

### Generic Egg Fried Rice
The fried rice is encoded as one generic recipe rather than separate classic and gochujang recipes.

Base sauce:
- soy sauce;
- rice vinegar or lime;
- sesame oil;
- pepper to taste.

Optional gochujang version:
- add gochujang to that same sauce;
- add only enough water to loosen the paste if needed.

This means the user’s recollection is essentially correct: the gochujang variant is the same fried-rice method with gochujang added to the sauce. The only practical adjustment is that water is useful mainly to loosen gochujang and is not required in the classic version.

Optional protein:
- 150–250 g Korean pulled pork for the 2-person reference serving;
- added near the end only to reheat, ideally with a small amount of cooking juice;
- no bacon option in the application.

The fried rice remains fully executable without either optional ingredient.

## V1 limitation
Options are represented as optional ingredients plus conditional prose. Planner V1 does not yet expose interactive ingredient-option toggles that alter step graphs or durations. This is acceptable here because:
- gochujang does not change the execution sequence;
- adding pre-cooked pork only adds about one minute of reheating inside an existing stovetop step;
- no exclusive Woodfire-resource conflict depends on either option.

If option selection later needs to change shopping totals or generate materially different timelines, that should become explicit configuration data rather than hidden recipe logic.

## Qualification targets
For the pork, record:
- actual weight and cut;
- marinade time;
- smoke duration/intensity;
- time to 94–95 °C;
- probe tenderness at each recheck;
- rest duration;
- amount of cooking juice retained;
- whether the optional caramelized finish improves the result.

For the Egg Fried Rice, record:
- rice age/moisture;
- classic vs gochujang sauce;
- optional pork quantity;
- wok/pan capacity;
- seasoning balance and whether the rice stays separated rather than wet.

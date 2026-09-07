# Cooking Companion

Mobile-first static PWA for planning and executing complete meals across multiple cooking resources.

Current product flow:

**illustrated recipe library → servings + desired serving time → scaled ingredients/shopping + prep → generated meal plan → active cook → local cook journal**

No server, runtime API or account is required. Active state, shopping checks, settings and journal entries are stored locally in the browser. The application is designed for GitHub Pages and installed iPhone/Safari PWA use, including offline operation after the relevant assets have been cached.

## Current maturity

Cooking Companion has moved beyond the original single-meal POC.

Implemented today:
- manifest-driven illustrated multi-recipe library;
- one-tap app sharing through the native system share sheet with clipboard fallback;
- serving configuration and planner-derived recommended start time;
- scaled ingredients and categorized shopping/prep checklist;
- serving-aware advance preparation for night-before marinades/prep;
- dependency-aware serving-time planner;
- Woodfire exclusive-resource conflict resolution, plus accurately declared non-Woodfire resources and dependency sequencing;
- buffers, actual timestamps, explicit delays and observation-driven rechecks;
- active-cook `upcoming / active / done` lifecycle;
- fast optional temperature logging;
- versioned active-session migration and frozen recipe snapshots;
- local Cook Journal with rating/notes and JSON backup/restore;
- explicit local-storage failure warnings that preserve corrupt/future/quota-blocked data instead of silently replacing it;
- conservative service-worker update lifecycle for long cooks;
- traceable fixed temperature/storage guidance;
- automated CI acceptance for every executable recipe.

The main remaining product risk is **real-cook qualification**, not basic planner construction.

## Recipe library

`recipes/index.json` is the authoritative inventory; every entry marked `available` is executable through the generic application pipeline.

### Validated after a documented real-cook refinement loop
- **Pork Belly Burnt Ends** + smashed grenaille potatoes + fresh lemon-yogurt sauce.

### Real-cooked baseline, not yet fully validated
- **Roulé de dinde sucré-salé & gratin de courgettes**;
- **Tacos barbacoa de bœuf fumée** + salsa fumée + garnitures fraîches.

### Technically executable, real-cook qualification still required
- **Saumon laqué soja-miel, asperges & riz citronné**;
- **Poulet shawarma fumé, pommes de terre épicées & sauce yaourt**;
- **Bœuf reverse-sear, grenailles croustillantes & sauce poivre**;
- **Wings miel-soja fumées, potatoes croustillantes & coleslaw**;
- **Magret de canard laqué miel-soja-orange, patate douce & sauce agrumes**;
- **Ribs BBQ fumées, mac & cheese crémeux & coleslaw**;
- **Halloumi grillé, légumes méditerranéens & couscous citronné**;
- **Brochettes de poulet teriyaki, légumes grillés & riz**;
- **Poulet gochujang miel-soja, riz jasmin & concombre au sésame**;
- **Bavette bulgogi express, udon au sésame & concombre-carotte**;
- **Filet mignon érable-moutarde-soja, couscous citronné & haricots verts**;
- **Saumon miso-miel, soba au sésame & pak choï**;
- **Porc coréen effiloché au Woodfire**;
- **Egg Fried Rice** — gochujang et porc coréen disponibles comme options indépendantes.

The four quick overnight-prep meals have dedicated local food renders and keep most flavor preparation on the previous evening. See `sources/QUICK_OVERNIGHT_RECIPES_2026-09-01.md`.

The Korean pulled-pork / fried-rice pair is deliberately modular: the pork is a standalone long cook, while Egg Fried Rice remains a generic rapid recipe that can optionally reuse the pork as leftovers and optionally add gochujang to the sauce. See `sources/KOREAN_PORK_EGG_FRIED_RICE.md`.

Availability and culinary maturity are intentionally separate. `status: available` means the recipe is executable through the generic application pipeline; `qualification` is `untested`, `test_cooked` or `validated`. See `sources/RECIPE_QUALIFICATION_V1.md`.

## Sharing

The library exposes **Partager l’app**. On iPhone/Safari/PWA it uses the Web Share API to open the native share sheet. Other browsers fall back to copying the canonical public app URL and showing a short confirmation toast.

The shared URL keeps the GitHub Pages application subpath but removes transient query parameters/fragments. Sharing does not include Cook Journal, shopping, settings, temperatures or active-session data. V1 deliberately shares the application rather than introducing recipe-specific deep-link routing. See `sources/SHARING_V1.md`.

## User flow

1. Open the illustrated recipe library.
2. Optionally share the public app with another cook.
3. Select an executable meal.
4. Review its real-cook qualification.
5. Choose servings and desired serving time.
6. Review scaled ingredients, shopping/prep and equipment.
7. Complete any advance preparation when relevant.
8. Start the cook.
9. Follow the generated dependency/resource-aware schedule.
10. Start/complete phases, record observations/rechecks and log temperatures where useful.
11. Correct actual timestamps if a tap was late.
12. Serve the meal and retain the completed session in the local Cook Journal.

DEV builds expose a **Cuisson test** tool that exercises the real active-cook UI around the current clock without waiting through a multi-hour meal. Test sessions do not pollute the real journal.

## Run locally

Do not open `index.html` through `file://`; recipe/library loading and service-worker behavior require HTTP.

```powershell
npx http-server . -p 8000 -c-1
```

Then open `http://localhost:8000`.

`-c-1` disables HTTP caching during development. If localhost still serves stale PWA assets, unregister the localhost service worker in browser developer tools and reload.

## Tests

The application has no runtime package dependency. Development uses Node's built-in test runner plus Playwright for the Mobile WebKit integration smoke path.

```bash
npm ci
npm test
```

GitHub Actions runs the suite on pull requests and supported branch pushes. The generic `available`-recipe contract verifies schema/content validation, qualification metadata, min/reference/max scaling, shopping/prep generation, serving-aware advance-prep materialization, schedule generation, structured active-step quantities, dependencies, service milestone resolution, Woodfire conflict freedom and local illustrated covers.

Additional regression tests cover planner/replanning behavior, midnight handling, buffers/rechecks, session migrations, recipe snapshots, timestamp correction, journal backup/merge, storage failure preservation, food-safety traceability, optional temperature capability, PWA/offline contracts, dedicated quick-recipe covers, app sharing, the quick overnight-prep recipe batch, Korean pork/fried-rice option semantics and static UI/module wiring.

The deterministic planner matrix currently executes 15,082 all-library scenarios. CI also installs WebKit and runs the mobile critical path:

```bash
npm run test:e2e
```

This browser test covers reload, service-worker cached reads under emulated offline mode and core controls; installed-iPhone offline relaunch, suspension, screen locking and real multi-hour ergonomics remain field tests.

## Architecture

```text
woodfire-companion/
├── index.html
├── styles.css
├── prep.css
├── journal.css
├── observations.css
├── share.css
├── app.js                       # top-level view/render wiring
├── service-worker.js
├── manifest.webmanifest
├── package.json
├── js/
│   ├── planner.js               # pure low-level scheduling solver
│   ├── meal-planner.js          # stable recipe-facing planning facade
│   ├── active-cook-controller.js# DOM-free active-cook orchestration
│   ├── recipe.js                # recipe validation/scaling
│   ├── step-details.js          # serving-aware step + advance-prep quantities
│   ├── recipe-loader.js
│   ├── library.js               # manifest + qualification semantics
│   ├── share.js                 # native share + clipboard fallback
│   ├── shopping.js
│   ├── prep-ui.js
│   ├── session.js               # versioned session state/migrations
│   ├── observations.js
│   ├── storage.js               # guarded local-storage access/errors
│   ├── temperature.js
│   ├── temperature-ui.js
│   ├── journal.js
│   ├── journal-ui.js
│   ├── timestamp-editor.js
│   ├── dev-tools.js
│   └── settings.js
├── assets/recipes/              # local WebP recipe covers
├── recipes/
│   ├── index.json
│   └── *.json                   # structured executable meals
├── tests/                        # Node/domain/contract tests
├── e2e/                          # Mobile WebKit critical-flow smoke
├── playwright.config.js
├── sources/                     # product/technical source of truth
└── icons/
```

Conceptual layers remain:
1. recipe/content data;
2. pure/testable planning engine;
3. session/persistence/orchestration state;
4. UI rendering/interactions.

Do not re-couple recipe-specific timing or quantities into `app.js`.

## Planner status

Planner V1 builds schedules primarily from:
- desired serving timestamp;
- step durations/ranges;
- dependencies;
- planning buffers;
- Woodfire resource reservations/conflicts;
- actual starts and completions;
- expected completion from pending observation rechecks;
- explicit user delays.

The Woodfire is currently the only automatically conflict-resolved exclusive resource. Other declared resources, including a wok, can run in parallel unless the recipe expresses their order through dependencies; broader conflict solving remains deferred until real cooks demonstrate the need.

Serving count scales ingredients, advance-prep guidance and structured active-cook quantities, but Planner V1 does not synthesize extra batches or automatically alter duration from serving count. Recipe serving ranges must therefore stay within one credible declared execution structure.

## Persistence

Active cook state remains under the compatibility key `woodfire-companion-v1`, with explicit schema migration. Current sessions store separate actual starts/completions and a detached recipe snapshot so a deployed recipe update cannot silently mutate a cook already in progress.

Shopping, settings and Cook Journal use separate stores because their lifecycles differ. The journal supports local JSON backup/restore; active session/settings/shopping remain outside that backup by design.

## PWA / update contract

The service worker uses a separate cache generation and the normal waiting lifecycle. A newly deployed worker must not force activation over an already-open cook. It activates after controlled clients close, then the next launch uses the new generation.

Available recipe JSON and covers are discovered from `recipes/index.json` and preloaded automatically for offline use. Sharing JS/CSS are also part of the static offline shell.

## Current priorities

1. Keep source documentation synchronized with `main`.
2. Qualify the executable library progressively through real cooks; record feedback in Cook Journal and promote durable findings into recipe/source revisions.
3. Use quick overnight-prep meals and Egg Fried Rice as low-friction real-use cases while retaining planner-pattern tests for fast temperature work, Woodfire conflicts and long tenderness/rechecks.
4. Continue small `app.js` extractions only when UI/orchestration responsibility becomes materially hard to reason about; do not introduce a framework for its own sake.
5. Complete repository hygiene: inventory stale branches and protect `main` with CI when repository settings allow it.
6. Extend planning windows, non-Woodfire conflict handling, reusable components, explicit option toggles or batching only when a real meal demonstrates the need.
7. Defer predictive ETA until enough clean real-cook history exists to express uncertainty honestly.

## Key sources

- `sources/PRODUCT_SPEC.md`
- `sources/RECIPE_MODEL.md`
- `sources/RECIPE_SCHEMA_V1.md`
- `sources/RECIPE_QUALIFICATION_V1.md`
- `sources/IPHONE_PWA_QUALIFICATION_V1.md`
- `sources/FOOD_SAFETY_TRACEABILITY_V1.md`
- `sources/QUICK_OVERNIGHT_RECIPES_2026-09-01.md`
- `sources/KOREAN_PORK_EGG_FRIED_RICE.md`
- `sources/SHARING_V1.md`
- `sources/MULTI_RECIPE_CONTRACT.md`
- `sources/PLANNER_V1.md`
- `sources/ACTIVE_COOK_V1.md`
- `sources/SESSION_V3.md`
- `sources/COOK_JOURNAL_V2.md`
- `sources/TECHNICAL_CONTEXT.md`

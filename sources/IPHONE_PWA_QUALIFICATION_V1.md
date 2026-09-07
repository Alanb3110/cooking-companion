# Cooking Companion — iPhone PWA Qualification V1

## Purpose

This protocol qualifies behavior that deterministic Node tests and Playwright WebKit cannot prove:

- an installed Home Screen PWA on a physical iPhone;
- lifecycle behavior across screen lock, backgrounding and process suspension;
- Safari storage and service-worker behavior over a real long cook;
- readability and interaction under kitchen conditions;
- continuity while connectivity or the deployed application version changes.

Playwright's mobile presets emulate properties such as viewport, user agent and touch behavior. They are valuable regression coverage, but they are not a physical iPhone or an installed iOS web app. A recipe must not be promoted on Playwright evidence alone.

The automated Mobile WebKit smoke test verifies the critical UI flow, persistence across reload and that the service worker has populated CacheStorage with the recipe manifest. It deliberately does not treat `browserContext.setOffline()` as proof that WebKit service-worker fallback works: Playwright's service-worker instrumentation is Chromium-specific, so physical Q5 remains authoritative for actual installed-iPhone offline behavior.

## Preconditions

Record before each run:

- date and tester;
- iPhone model and iOS version;
- installed app version shown in the UI;
- recipe ID/version, servings and target serving time;
- network state at start;
- whether the install is fresh or already used;
- approximate battery level and Low Power Mode state.

Use the deployed HTTPS application added to the Home Screen. Do not run the qualification solely in a normal Safari tab.

## Evidence to preserve

The Cook Journal is the primary record. Add a concise issue or recipe-source summary when a finding changes durable product behavior.

For each run, preserve:

- target and actual serving timestamps;
- planned and actual timestamps for materially early/late steps;
- number and outcome of rechecks;
- actions ignored, postponed or corrected after a late tap;
- any storage, offline or update warning shown;
- ambiguous instructions or appliance state;
- keyboard, scrolling, touch-target or readability friction;
- final food-quality observations;
- exact reproduction steps for any failure.

Primary timing measure:

`service delta = actual serving time - target serving time`

The delta is diagnostic evidence, not a pass/fail score by itself: food state remains authoritative.

## Qualification matrix

Run Q1 before the next real cook. Run Q2 during a short representative cook and Q3 during a long representative cook. Q4 is a controlled deployment exercise and must never be improvised if it could endanger an active cook record.

| ID | Scenario | Required observations | Pass condition |
|---|---|---|---|
| Q1 | Fresh install and warm reopen | Install, launch, load the recipe library, close and reopen from Home Screen | App launches without network-only or stale-shell failure; library and current version are visible |
| Q2 | Short cook | Start, complete steps, enter a temperature, trigger a recheck where available, background/foreground, lock for at least 5 minutes | Session, measurements, observations and step states survive every return |
| Q3 | Long cook | Keep a real session for at least 60 minutes; lock for at least 30 minutes; repeat after temporary network loss | No silent reset or data loss; due/recheck state is coherent after resume |
| Q4 | Version change during session | Keep the old installed PWA open, deploy a newer cache revision, continue once, then fully close/reopen | Active session remains on its frozen recipe snapshot; update never destroys progress; new shell activates on a controlled reopen |
| Q5 | Offline cached use | After online warm-up, enable airplane mode, reopen the installed PWA, inspect recipe and active cook, add a local action | Required shell/recipe assets load and the action remains after another reopen |
| Q6 | Network transition | Switch Wi-Fi to cellular and back while the session is active | No duplicate action, reset or blocking error; current state remains usable |
| Q7 | Input ergonomics | Enter/edit temperature and notes with the iOS keyboard; operate core controls one-handed | Focus, viewport and controls remain usable; no required control is obscured |
| Q8 | Journal recovery | Finish/quit, confirm the journal entry, export backup, import into a clean or explicitly disposable test state | Export is valid, import reports the expected count, restored entry matches the source |

## Failure classes

### Blocker

Any of the following blocks release qualification:

- active session or journal data is silently overwritten, reset or made unreachable;
- the installed app cannot resume offline after successful cache warm-up;
- an update changes the recipe snapshot of a cook already in progress;
- a safety-critical instruction or completion criterion is hidden or materially ambiguous;
- storage failure occurs without a visible, actionable warning.

### Major

- a recheck or actual timestamp is lost;
- background/resume produces stale or contradictory next-action guidance;
- keyboard or layout prevents a core action;
- cache/update recovery requires deleting data without prior export.

### Minor

- non-blocking visual shift;
- wording or touch friction with a clear workaround;
- delayed refresh that does not alter stored facts.

Record all classes. A blocker must be reproduced or bounded before release; unresolved major failures require an explicit release decision and mitigation.

## Completion rule

The iPhone PWA baseline is qualified when:

1. Q1, Q5, Q7 and Q8 pass on a physical supported iPhone;
2. Q2 passes on a short representative cook;
3. Q3 passes on a long representative cook;
4. Q4 passes once for the release line;
5. no blocker remains open;
6. evidence is recorded with the application and iOS versions.

Passing the automated `mobile-webkit` smoke test is required in CI, but remains only a prerequisite for this manual baseline.

## Debugging support

If a failure reproduces, enable Web Inspector on the iPhone and inspect the installed web app from Safari on a connected Mac where available. Capture console output only after preserving the user-visible symptoms and timestamps; the qualification evidence must not depend on developer tooling being attached during the cook.

## Authoritative platform references

Verified 2026-09-02:

- Apple, **Inspecting iOS and iPadOS**: https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios
- Playwright, **Emulation**: https://playwright.dev/docs/emulation
- Playwright, **Browsers**: https://playwright.dev/docs/browsers
- Playwright, **Service Workers**: https://playwright.dev/docs/service-workers

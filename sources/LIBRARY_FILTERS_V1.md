# Library Quick Filters V1

## Purpose

The illustrated library is now large enough that scrolling the full catalogue is no longer the fastest way to answer a practical cooking question such as “what can I cook after work?” or “what is worth starting for a long weekend cook?”.

Quick filters are therefore a one-tap browsing aid on top of the existing recipe manifest. They do not alter recipe content, planner behavior, serving scaling or qualification.

## Interaction

On the library screen, filters are presented as a horizontally scrollable row of mobile-friendly chips. Only one quick filter is active at a time.

V1 filters:

| Filter | Rule | Product intent |
| --- | --- | --- |
| `Toutes` | no filtering | full catalogue |
| `Semaine` | `status=available`, `activePrepMin <= 30`, `elapsedRangeMin.max <= 60` | realistic quick meal after work |
| `Prépa J-1` | explicit manifest tag `Prépa la veille` or `Prépa en avance` | shift work to the previous evening |
| `Cuisson longue` | `status=available`, `elapsedRangeMin.max >= 180` | long/passive cooks worth planning around |
| `Fumé` | explicit `Fumé` tag or `SMOKER` in the card mode eyebrow | meals with a real smoking phase |
| `Testées` | qualification is `test_cooked` or `validated` | recipes already cooked in real conditions |

The active chip shows the result count and a short definition underneath the chips so the threshold is visible rather than implicit.

## Data model decision

V1 deliberately derives these contexts from metadata already present in `recipes/index.json` rather than adding a second recipe taxonomy.

Reasons:

- one source of truth for timing and qualification;
- no duplicated `weeknight=true` / `longCook=true` flags to become stale;
- easy automated testing of boundary conditions;
- future filters can be added when a genuine browsing need appears.

If future user testing shows that elapsed time alone is insufficient — for example a 55 min meal with 10 min active work feels more practical than a 35 min meal with 30 min active work — the thresholds can evolve here without changing Recipe Schema V1.

## Persistence

The selected quick filter is intentionally ephemeral in V1. Reloading the application returns to `Toutes`.

This keeps library browsing state separate from cook-session persistence and avoids migrating local user data for a low-value preference.

## Offline behavior

The filter controller and stylesheet are part of the PWA application shell. Filtering itself is local and requires no network access.

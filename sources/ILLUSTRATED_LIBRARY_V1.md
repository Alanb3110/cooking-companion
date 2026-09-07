# Cooking Companion — Illustrated Library V1

## Goal
The recipe library should feel like a cooking product rather than a text catalogue while remaining fully local-first and GitHub Pages compatible.

V1 adds one local food cover to every executable recipe. Visual metadata belongs to the library manifest because it is discovery/UI metadata, not cooking semantics.

## Manifest contract
Each `available` entry in `recipes/index.json` requires:

```json
"visual": {
  "theme": "...",
  "symbol": "...",
  "eyebrow": "...",
  "imageUrl": "./assets/recipes/example.webp"
}
```

`visual.imageUrl` must be a local relative asset URL. Runtime external image URLs are not allowed for executable recipes because offline availability is a product requirement.

`theme`, `symbol` and `eyebrow` remain useful fallback/decorative metadata. The image is the primary cover when present; the symbol remains the fallback if an image is absent in future non-executable/coming-soon content.

## Asset strategy
V1 uses local WebP food covers:
- realistic, appetizing food presentation rather than diagram/clipart artwork;
- small repository/cache footprint through compressed WebP;
- no third-party host or CORS dependency;
- safe GitHub Pages subpath behavior through relative URLs;
- the same source asset can be cropped responsively for compact cards and the larger recipe hero.

Current covers:
- `assets/recipes/pork-belly-burnt-ends-v2.webp`;
- `assets/recipes/sweet-savory-turkey-zucchini-gratin.webp`;
- `assets/recipes/smoked-beef-barbacoa.webp`.

The assets intentionally contain no recipe title or UI text. Titles, status, timing and tags remain accessible HTML rather than baked into artwork.

The display contract does not depend on exact raster dimensions. Covers are composed as landscape food photography and cropped responsively, so replacement assets can be upgraded later without changing planner/content semantics.

## UI behavior
Library card:
- cover fills the existing artwork area using `object-fit: cover`;
- existing eyebrow remains over the image with a dark gradient for legibility;
- fallback theme/symbol still works if the cover is unavailable;
- mobile cards keep the current compact horizontal layout; desktop keeps the existing grid.

Recipe detail:
- the same local cover is reused as the large hero;
- the hero keeps its eyebrow overlay;
- the emoji/symbol is hidden when a real image is present and remains the fallback otherwise;
- the detail cover is painted as a CSS background rather than as a visible absolutely-positioned `<img>` layer. The hidden image element remains only as a stable app DOM hook. This avoids a WebKit/iOS PWA compositing/touch regression observed during real iPhone testing.

Images are decorative because the recipe title and description immediately follow them; the library-card image uses `alt=""` to prevent duplicate screen-reader content.

## Offline behavior
The service worker still discovers content through `recipes/index.json`.

For every `available` recipe it preloads both:
1. `recipeUrl`;
2. `visual.imageUrl` when present.

The PWA therefore keeps recipe covers available after installation/offline use without hard-coding individual recipe filenames in `service-worker.js`.

After the iOS detail regression, the service worker also carries an explicit cache revision and fetches same-origin requests with `cache: "no-store"` before updating the app cache. This prevents an installed PWA from combining stale shell/modules with newer illustrated-library assets while preserving offline fallback.

## Acceptance
CI should protect the following:
- every available recipe has a local `visual.imageUrl`;
- each declared cover exists in the repository and is a valid non-empty WebP asset;
- service-worker preloading remains manifest-driven and includes `visual.imageUrl`;
- the app contains both library-card and detail-hero image paths while retaining fallbacks;
- the detail hero keeps its backing `<img>` unpainted/non-interactive and mirrors its local `src` to the hero background;
- cache revisioning can force a fresh shell after a PWA-specific hotfix.

Visual acceptance on iPhone checks:
- food remains recognizable in the compact horizontal crop;
- hero crop does not hide the main subject;
- eyebrow remains readable over the image;
- recipe detail remains scrollable and all controls remain tappable after opening a recipe;
- no overflow or layout regression on long recipe titles.

## Non-goals
V1 does not add:
- remote/CDN images;
- user-uploaded recipe imagery;
- per-step illustrations;
- image editing inside the app;
- runtime AI/image generation;
- a new recipe schema field.

Those should only be considered if a real product need appears.

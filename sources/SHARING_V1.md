# Cooking Companion — Sharing V1

## Goal
Let a cook share the public Cooking Companion PWA with friends in one tap, without adding accounts, a backend, analytics or runtime services.

## V1 scope
The recipe-library view exposes a **Partager l’app** action.

On browsers that implement the Web Share API, the action opens the native system share sheet. This is the primary path on iPhone/Safari/PWA.

When native sharing is unavailable or fails before a share sheet can be completed, the app falls back to copying the canonical application URL to the clipboard and displays a short confirmation toast.

Cancelling the native share sheet is treated as a user cancellation and must not trigger a clipboard write or an error toast.

## Shared URL
`js/share.js` derives the URL from the current page so deployment remains compatible with GitHub Pages subpaths.

The canonical shared URL:
- preserves the site origin and application path;
- removes query parameters and fragments;
- normalizes a trailing `index.html` to the application directory URL.

Example:

`https://example.github.io/woodfire-companion/index.html?debug=1#x`

becomes:

`https://example.github.io/woodfire-companion/`

V1 shares the application itself rather than recipe-specific deep links. This keeps routing unchanged and avoids introducing recipe URL state before it is needed.

## UX placement
Sharing is intentionally available from the library, not from the active-cook controls. During a cook, next/current actions, appliance state and completion controls remain higher priority than promotional or social actions.

## Offline/PWA contract
`share.css` and `js/share.js` are part of the static service-worker shell. The application can therefore render and operate the share control after an offline launch; actual native sharing/clipboard behavior still depends on browser/platform capability at the moment of use.

The feature does not use `skipWaiting()` and does not change the conservative worker lifecycle used to protect an already-open cook.

## Privacy
Sharing sends only the public application title, short description and canonical public URL to the browser/platform share mechanism selected by the user. Cooking Companion itself does not upload cook data, journal entries, settings, temperatures or shopping state.

## Tests
Automated tests protect:
- canonical GitHub Pages URL handling;
- native Web Share payload;
- clipboard fallback;
- cancellation semantics;
- library button/toast wiring;
- service-worker inclusion of sharing assets.

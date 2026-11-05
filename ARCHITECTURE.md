# Architecture and reliability boundaries

## Extension lifecycle

The MV3 background service worker handles the browser action. A user click grants `activeTab` and triggers injection of the prebuilt `dist/content.js` into that tab. The content script toggles its own page-local workspace. The Shadow DOM root isolates the tool UI from ordinary page selectors. Closing the tool removes all listeners, observers, canvases, styles, and the injected host, then restores session CSS patches where the page has not independently overwritten them.

The background handles only user-triggered tab capture and controlled window-sizing requests. It does not poll sites or record a user history.

## Inspection model

A bounded, idle-time DOM traversal records element IDs, measured rectangles and computed CSS; open Shadow Roots are traversed. IDs remain stable in an active session for a given element. The node list is virtualized to avoid rendering thousands of simultaneous DOM-tree rows. Removed elements are pruned from the lookup map. Scans are debounced following observed mutations, scroll and resize.

`getBoundingClientRect` returns a viewport-relative axis-aligned box. CSS transforms, non-rectangular clips, pseudo-elements and browser compositor surfaces cannot all be represented exactly using that box. The overlay labels such geometry accordingly.

## Diagnosis model

Rule results include confidence, computed geometry, related element references and suggested experiments. Document horizontal scroll is confirmed by comparing scroll width and CSS viewport width. Potentially intentional clipping, fixed overlays and floating overlaps are marked as possible. Cause hypotheses are drawn from current measured CSS/layout constraints, not guessed source-code locations.

## Spatial rendering

The native WebGL2 path uses instanced rectangles, not a separate object for each DOM element. A projected Canvas2D renderer with the same geometry model is the fallback for browsers without WebGL2. The DOM mode uses actual node depth. The stacking-context mode derives an approximate context tree from documented CSS triggers and uses context ancestors for its graph edges; it **does not** claim to render native compositor layers or exact paint order.

## Patches and comparisons

Changes are restricted to a fixed property allowlist and validated before application. History records the previous inline value, initial computed value, priority and before/after rectangles. Snapshot capture remeasures live CSS and geometry to avoid relying on stale background scans. A/B comparison aligns elements by session ID, reporting geometry, display/visibility/Flex/Grid changes, new findings and resolved findings. Two snapshots should be taken in one inspection session. Browser resizing is not device emulation.

## Known constraints

- Cross-origin iframe internals, closed Shadow Roots, browser-internal pages: inaccessible under minimum permissions.
- CSS transforms and complex clipping: axis-aligned approximation.
- Very large pages: bounded scanning and geometry rendering; nodes outside the configured cap are not analyzed.
- Full native WebGL2 support and `captureVisibleTab` require browser/GPU validation; both are unverified in the supplied execution environment.
- Popup window sizes refer to window bounds, not an exact CSS viewport. Use A/B measured `window.innerWidth` when comparing responsive layouts.
- Browser content scripts cannot reliably read the native compositor layer tree without privileged DevTools integrations.

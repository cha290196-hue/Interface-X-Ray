# Interface X-Ray 1.0.0 — verification record

**Run:** 2026-11-05. **Environment:** Linux headless Chromium with Playwright, no available WebGL 1/2 context. Build is offline and dependency-free; Playwright is used only by developer tests.

| Verification | Observed result | Evidence |
|---|---|---|
| All source and background syntax | PASS | `npm run check` |
| Core engine unit checks | 5/5 PASS | `npm test` |
| Real DOM/CSS layout fixture suite | 13/13 PASS | `python tests/scenarios.py`, `tests/scenario-results.json` |
| End-to-end inspector selection → diagnosis → trace → CSS patch → undo/redo → 3D → export → exit | PASS | `python tests/e2e.py`, `screenshots/01` to `12` |
| Additional release-gate checks, including 3-step undo, virtual tree, Shadow DOM update, A/B export, locale and palette | 24/24 PASS | `python tests/release_qa.py`, `tests/release-qa-results.json` |
| Two-element geometric spacing and clipping/scroll overlay | PASS | `python tests/measure_qa.py`, `screenshots/16`, `17` |
| Real 1440→390 CSS viewport A/B; compare measured changes | PASS — 103 changed nodes in fixture | `python tests/responsive_qa.py`, `tests/responsive-ab-result.json` |
| Layout bounds / icon centering at 390, 768, 1440 CSS pixels | 4/4 PASS | `python tests/visual_qa.py`, `tests/visual-qa-results.json` |
| Canvas at 2× DPR | PASS — 2880×1800 backing pixels at 1440×900 CSS viewport | `tests/visual-qa-results.json` |
| Actual Chromium interaction recording | PASS | `media/interface-xray-final.webm`, `.mp4`, `.gif` |
| Native MV3 toolbar activation on public HTTPS websites | NOT VERIFIED | System Chromium extension service worker did not start in this environment |
| Browser-owned `captureVisibleTab` screenshot | NOT VERIFIED | Content-script injection harness cannot substitute for extension-owned API |
| Microsoft Edge on Windows | NOT VERIFIED | No Edge/Windows browser in test environment |
| GPU WebGL2 shader execution | NOT VERIFIED | Multiple Chromium flags still returned `getContext('webgl2') === null`; projected Canvas2D was tested |

## Layout scenarios

Ordinary article; Flex constraint; Grid layout; nested scrolling; document overflow; clipping; fixed overlay; 5,400-child DOM; dynamic single-page update; mobile viewport; CSS transform plus open Shadow DOM; independently positioned overlap; unusually small control. These scenarios verify narrow rules rather than arbitrary-site detector precision/recall.

## Visual review

Real screenshots cover initial inspector, box geometry, diagnosis overview, cause trace, patch editing, 3D DOM, inferred stacking-context view, settings, light appearance, A/B, export, narrow viewport, two-element measurement, clipped region, large DOM virtualization and 2×DPI.

The release visual QA uses actual browser geometry to test toolbar and panel containment, absence of horizontal scroll within the inspector and icon-button center differences below 2 CSS pixels. This does not replace a manual check on different browser/OS font rasterizers.

## Browser compatibility and unverified cases

Native activation, screenshot privileges and Edge/Windows DPI must be re-tested on the intended browser installation before declaring browser-store publication readiness. Do not interpret test fixture success as a guarantee of no diagnostic false positives on all third-party sites. Closed Shadow Roots, cross-origin iframe content, complex transforms and compositor layers remain known scope limits.

# Master integration observation

Actual cloud Chromium observations on 2026-11-13 preserved the same guest and authentication chooser composition across the fast-forward to master. The recorded DOM values match exactly before and after at both viewports. This covers branch integration only; it does not certify publication, native packages, authentication completion, purchases, or the planned v2 release.

## Identity and method

- Before: `feat/immersive-stitch-ui`, commit `1b4b65c8badf6c5e079fc346bc33de789dd8ecf4`, captured at 11:33:26 UTC.
- After: `master`, the same commit, captured at 11:35:04 UTC. Root performed and verified the integration and push; this observer made no Git mutations.
- Existing development server: `http://127.0.0.1:5173/app.html`.
- Cloud `/usr/bin/chromium` through the installed managed Playwright runtime, with real 1440×900 and 390×844 viewports and the Save-Data preference. The Browser app's JavaScript tool was unavailable in this session.
- `observe-browser.cjs` held the same browser contexts across integration, then reloaded each page. The real interaction was guest → **Cast my chart** → **Save your chart** chooser → **Close**. No identity, account, credit, purchase, or provider response was fabricated or submitted.
- The visible existing badge remained `v1.32.09425`; root's later v2 release metadata work is outside this observation.

## Observed composition

| Viewport | Header | Stage | Rail width | Guest rail height | Chooser rail height |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | 1440×52 | 1016×730 | 352 | 229.296875 | 287 |
| 390×844 | 390×48 | 358×371.359375 | 358 | 221.296875 | 279 |

Both guest and chooser recorded DOM objects—including position, size, copy, title, badge, scene count, overflow and Vite overlay status—match exactly across integration. Each has one scene, no horizontal overflow, and no framework error overlay. The same actual scene node remains connected across the chooser transition at each viewport. `comparison.json` records these comparisons; `before.json` and `after.json` preserve the measurements.

The eight PNGs show the actual guest and chooser at each viewport before and after. Live chart rendering, character animation and voice preparation are dynamic bindings, so no screenshot raster identity claim is made. An existing CTA gesture initiated real voice preparation; the after phone chooser screenshot shows the actual download at 85%. Screenshots contain no audio and do not demonstrate completed speech.

## Runtime exceptions retained

`before.json` recorded zero page exceptions at capture time. By `after.json`, each held context had accumulated two `document is not defined` exceptions. The first runner captured messages cumulatively without stacks or event timestamps, so their timing and origin cannot be attributed to the reload or branch switch. They remain unresolved observations; this report does not claim an exception-free held session.

A single bounded supplementary guest load, without gestures, is preserved in `observe-error-stack.cjs` and `error-stack.json`: zero page exceptions, workers, or remote requests during its observation; the existing service-worker script MIME console rejection remained. No speculative product fix, unit test, release build, or new download was initiated for that diagnostic.

## Files

- `before.json`, `after.json`, `comparison.json`: source identity and actual DOM results.
- `before-*.png`, `after-*.png`: eight representative screenshots.
- `observe-browser.cjs`: the executed held-context integration runner.
- `observe-error-stack.cjs`, `error-stack.json`: bounded follow-up provenance and raw exception/console receipt.
- `sha256.json`: hashes of these evidence files (excluding the hash inventory itself).

The generated repository `.codegraph/.gitignore` is also ready for root's coordinated commit. Its local SQLite database and graph runtime files must remain excluded.

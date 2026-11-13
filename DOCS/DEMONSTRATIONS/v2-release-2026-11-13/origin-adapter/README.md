# V2 origin adapter browser observation

The actual cloud guest → authentication chooser → email → Back → Close path passed at four viewports on master. Guest and email copy and dimensions match the frozen reference in all eight comparisons, and the same actual scene survives every rail transition. This is pre-build development evidence, not publication or native/provider acceptance.

## Environment and identity

- Observed 2026-11-13, 11:42:44–11:44:24 UTC, at `http://127.0.0.1:5173`.
- Actual HEAD at observation startup: `10205a4906fbec00717ee33e880d476dca9d6469` on `master`, including the announced origin adapter `980ac7f` and configuration helper `9a7f6f8`.
- Cloud `/usr/bin/chromium` through installed managed Playwright. The associated Browser app `js` tool was absent from the available tools; cloud Playwright was explicitly authorized. No local computer/browser was used.
- One real page/context was resized through 1440×900, 1280×720, 390×844 and 360×640, retaining the real voice preparation across viewport changes. A separate no-gesture Save-Data context loaded the aliases and invalid native utility.
- Existing badge `v1.32.09425` remained visible. The later canonical v2 build and live host checks are separate work.

## Findings

No guest/email copy or dimension mismatch and no page exception was observed. The earlier held integration sessions' `document is not defined` messages did not recur during this run, including real voice preparation and a 45-second bounded watch. The earlier messages remain unresolved historical evidence; this result does not identify their cause or claim a fix.

The existing development service-worker probe still failed with an HTML/MIME console rejection and `ERR_ABORTED` at `/sw.js` on each atelier load. Four GPU readback performance warnings were recorded. These are preserved separately from zero uncaught page exceptions; no product behavior was changed to silence them.

## Checks

| Check | Actual result |
| --- | --- |
| Page identity / nonblank | Correct atelier title and meaningful guest content at all four sizes |
| Guest / email frozen copy and dimensions | Exact in 8/8 cases; comparison uses the preserved reference measurements |
| Geometry stress case | At 360×640, email first shows scrollY 4. After Tab/Back the chooser shows 153, and after Close the guest shows 95. Header/stage/rail retain dimensions and move with document scroll; initial guest starts at 0. All other sizes stay at 0 |
| Scene continuity | Same connected scene node across chooser/email/Back/Close at every viewport; scene count 1 throughout |
| Overlay / horizontal overflow | None in all 20 measured rail states |
| Keyboard | Email receives focus; Tab moves to password at each viewport |
| Entry aliases | `/`, `/app.html`, `/landing.html` return HTTP 200 and the same canonical phone guest frame |
| Native invalid link | Actual `/auth/native.html` with no handoff parameters returns HTTP 200 and **Sign-in request expired**, with no overflow/overlay at desktop and phone |
| Runtime capture | Timestamped error and stack collection enabled; 0 page exceptions |
| Real voice | Actual download/preparation and authored welcome playback/karaoke events observed |

The native observation exercises the missing/invalid-link guard. It does not establish a successful v2-origin handoff or provider return. Those require the later live host and a real authorized sign-in operation. No Google request, email credential submission, SMS request, password reset, account creation, credit or paid flow was performed.

The narrow final voice screenshots preserve scrollY 95 from the real form/keyboard sequence, so the header and part of the stage lie above the viewport. This is an observed scroll state, not a different frame geometry. The complete scroll timeline is preserved in `comparison.json` and was reported to root and the form owner; no corrective source behavior was invented by this observer.

## Actual voice evidence

The passive HUD timeline records 0.0/262.8MB0% at 11:42:48.800 UTC, then 262.8/262.8MB100% at 11:43:06.499, followed by **Preparing speech**. The real guest CTA gesture occurred during this existing preparation sequence; the report does not attribute the initial download to the gesture.

There are 101 actual passive observations: 47 HUD changes, 28 voice-performance events and 26 karaoke events. Performance events include 1 started, 26 word and 1 ended. The rendered welcome caption and speaking character state were visible during the form flow. This is the existing authored guest welcome, not a generated personal reading. Screenshots contain no audio; no audible-recording claim is made. No voice/progress/provider events were synthesized.

## Evidence and limits

`observations.json` contains actual states, geometry, route responses, console entries, request failures, worker URL and passive voice events with timestamps. `comparison.json` records the reference source/hash and measured comparisons. `summary.json` provides counts and the first/last performance receipts. `observe.cjs` is the executed runner. Twelve PNGs cover guest/email at four sizes, two voice states and the native invalid link at two sizes. `sha256.json` hashes the evidence.

The immutable master reference is SHA-256 `58b11534f01da85c2aca9a73aa2dfccf13411274a70509ce65e4ff9090afc0bc`. The comparison uses the previous reference measurements from `immersive-stitch-2026-11-13/product/static-comparison.json`; no immutable export or product source was edited. Live art/chart/caption/voice/progress/version bindings are not flattened-image match targets.

No unit tests, canonical build, deployment, provider contact, fake customer state, native package launch or Git mutation was performed by this observer. Root owns the coordinated evidence commit. Live v2 TLS, routing/badge and actual artifact inventory remain pending the canonical build operator.

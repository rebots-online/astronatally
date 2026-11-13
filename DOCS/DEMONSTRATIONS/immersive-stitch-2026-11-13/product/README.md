# Implemented UI observations

Repository: `rebots-online/astronatally`. These are actual cloud development
observations, not a release inventory, paid-service certification or claim of
market success. The canonical build is a separate delivery gate.

## Findings and corrections

Two concrete deviations were found and returned to the frame coder:

1. The focused miniature room initially showed an oversized table sign instead
   of Natally's face and crystal ball. Whole-scene containment corrected this;
   desktop and phone after-images show the complete character. The before-image
   is preserved only as mismatch history.
2. Guest chart focus lacked the existing exported demonstration-context rail.
   The corrected binding presents the frozen S01-chart wording. A subsequent
   six-section sweep found that this derivation overrode explicit Reading aloud;
   the final navigation observation confirms the bounded correction at `4fbbe0a`.

No unrelated service rewrite was requested to make these checks pass. The
existing `/sw.js` probe receives the Vite HTML fallback and logs an unsupported
service-worker MIME error/ERR_ABORTED. That console error remains recorded;
it is distinct from the zero observed page exceptions/framework error overlays.

## Actual product walkthrough

The flow under test was: `/app.html` → live guest room → real chart hover/click
→ authored explanation/view swap → sign-in method forms/Back/keyboard → phone
menu/Prices → canonical entry aliases and short/narrow viewports.

- Real pointer movement found the live WebGL Virgo target and its actual
  tooltip. A genuine click changed the stage and started the existing authored
  explanation. No canvas hit, chart fact, speech event or provider was mocked.
- The local voice download visibly progressed from19.6/262.8MB7% through29.5MB11%
  and later262.8/262.8MB100%. Actual playback/karaoke events were observed, with
  the current word visibly highlighted. Subsequent real idle stories also ran.
- 453 distinct passive events are preserved:235 voice-performance and218 karaoke
  events. They include actual started/word/ended receipts. The selected Virgo
  explanation was followed by navigation; this is not claimed as an uninterrupted
  complete personal reading. Recordings contain video only, not audible audio.
- Guest Cast my chart opened the real method chooser. Email, registration,
  password-reset and SMS forms rendered using actual existing components. Back
  actions worked; initial email focus, Tab→password and Shift+Tab→Back were
  observed. No credentials, SMS number, reset address or purchase were submitted.
- Phone Menu→Prices showed the exact real prices. All three entry aliases
  `/`, `/app.html` and `/landing.html` mounted the canonical atelier.

The initial continuous session began at source31519da. Focused-room/context
corrections were observed through HMR and committed asabf52ff. The actual
before/after screenshots and observations distinguish those states.

## Comparison with the immutable design

Master SHA-256:
`58b11534f01da85c2aca9a73aa2dfccf13411274a70509ce65e4ff9090afc0bc`.
Shared CSS and imported implementation CSS both have SHA-256:
`3d8dcfc54ce9243685c26960894ab31ba1ca97892eb59ebdc49233e674287c32`.
The immutable exports were not changed. See the
[declared adapters](../../../IMPLEMENTATION-ADAPTERS-2026-11-13.md).

A final actual-versus-reference comparison exercised guest and email views at
1440×900,1280×720,390×844 and360×640. Exact rail copy and dimensions matched in
all eight cases. One live Scene DOM node remained connected and identical across
the real auth-rail transitions in every viewport. No horizontal overflow, modal
layer or page exception appeared. The narrow email form's autofocus caused a4px
document scroll; all regions shifted together, without covering the scene or
changing their dimensions. This is the declared real focus binding, not a
different composition.

| Viewport | Guest card size | Email card size | Result |
| --- | --- | --- | --- |
|1440×900 |352×229.296875 |352×463 |Actual/reference exact |
|1280×720 |352×229.296875 |352×463 |Actual/reference exact |
|390×844 |358×221.296875 |358×455 |Actual/reference exact |
|360×640 |328×221.296875 |328×455 |Actual/reference size/copy exact;4px focus scroll |

Live room objects/animation, three-dimensional chart contents, real captions,
version text, progress and actionable error text are declared data/rendering
bindings. They are not compared to a flattened static scene raster.

## Coverage and limits

| Screen family | Evidence scope |
| --- | --- |
|S01 guest/six sections/chart focus |Actual guest navigation, live target selection, view swaps and final section mapping |
|S02 choose/email/register/reset/phone |Actual rendered forms, Back and keyboard; no contact operation or authenticated result |
|S02 verified code |Blocked: requires an authorized real SMS challenge; no fake challenge/widget |
|S03/S04/S05 first visit/intake/casting |Source-backed only: inspected actual four-step validated fields/calendar/gazetteer/unknown-time and unchanged real `natalChart` callback; no signed-in runtime acceptance |
|S06 personal transcript/composer |Source-backed wiring and voice-controller regression only; actual guest authored speech observed separately |
|S07 guest menu |Actual runtime; signed-in identity/account allowance requires real authorization |
|S08/S09 credit/redemption/paid keepsake/retained report/PDF |Source-backed frozen bindings; no invented balance, grant, purchase receipt or retained customer record; runtime acceptance blocked |
|S10 native handoff |Existing18 native-auth regressions passed in the owning coder's integration work; actual invalid-link desktop/phone observations exist separately; no real native provider return claimed |
|S11 voice/status |Actual download/preparation/playback/karaoke and stable stage geometry; service-worker console failure retained |

This is not all52 authenticated/customer states certified by prototype preview.
The separate design report covers all52 reference templates; inaccessible product
states are not replaced by their static reference and called functional success.
No isolated-component runtime harness was used in this product report.

The final TypeScript gate passed. The existing voice regression suite passed
11/11 once after source integration, covering completion, cancellation,
supersession and display/speech offsets. That suite uses an isolated playback
harness; it is not presented as a real customer reading. Native18/version12
results were not repeated because their already-tested source contracts were
unchanged by these UI observations.

## Evidence and execution

- `walkthrough-observations.json`: normalized actual steps, geometry, focus,
  console and failed-request evidence. Duplicate inspect records were removed;
  repeated event timelines are extracted into `voice-events.json`.
- `static-comparison.json`: measured actual/reference guest/email data at all
  four viewports and actual Scene identity checks.
- `section-navigation-before-fix.json`: concrete Reading aloud mapping failure;
  `section-navigation-final.json` confirms all six exact destinations after correction.
- `guest-auth-continuous.webm`: unmodified actual final desktop walkthrough.
- `focused-voice-continuous.mp4`: continuous100-second segment after the focused
  room correction; actual caption activity, responsive focus and aliases. It
  has no audio track. `video-provenance.json` records source hashes/timing.
- Representative final images show guest, email, SMS and focused desktop/phone;
  `before-focused-inset.png` is explicitly a corrected failure, not final proof.

The Browser plugin was listed but its required JavaScript runtime tool was not
available. Explicit cloud-workspace evidence authorization permitted installed
Playwright and managed `/usr/bin/chromium`; no local computer/browser was used.
Temporary observer scripts remain under `/workspace/scratch/`. Main commands:
`product-session.cjs`, `final-product-comparison.cjs`,
`section-navigation-check.cjs`, `npm run lint`, and
`node --experimental-vm-modules --test src/voice/index.test.mjs`.

Actual external authentication, sending SMS/reset mail, spending money, granting
credits, provider return, release signing and deployment remain separate
operations requiring their real authorized inputs. None was fabricated here.

## Canonical compiled-web follow-up

The canonical build later produced the real web bundle with display version
`1.32.09425` at build stamp `beed399`, then stopped at an actual Surge permission
rejection. A separate [compiled-web smoke](compiled-web/README.md) checked that
unchanged artifact once at desktop/phone, including all entry aliases, baked
version and native invalid-link page. This adds compiled-web evidence only;
it does not convert the earlier UI report into publication/native certification.

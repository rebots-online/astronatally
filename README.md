# Natally — astrologer companion

Astronatally is a separate derivative of Natally-Ai-studio, publishing this
lineage at **https://v2.astronatally.com** with versions above2.0. The parent's
1.32 deployment at astronatally.com is preserved.

Natally is an astrologer who lives in an atelier. A customer signs
in with Google, email or SMS, casts their natal chart, and talks with her: she reads
the chart aloud, explains its parts, and points at what she is talking about on
a live 3D chart beside her.

- **Landing** (`/`): the atelier scene with Natally, an example chart to explore,
  what she offers and the prices.
- **App** (`/app.html`): the atelier, the customer's own natal chart, and the
  conversation with Natally (streamed text, optional voice), plus account and
  top-up.
- **Souvenir**: a US$30 keepsake natal report, as a PDF plus an interactive
  viewer that stays available.

Conversation is paid for with credit packs of US$5, US$10 and US$25. Nothing in
the product is a placeholder: anything not configured or not yet working fails
visibly and names what is missing.

[DOCS/PRD.md](DOCS/PRD.md) defines the immersive screen revision.
[DOCS/ARCHITECTURE.md](DOCS/ARCHITECTURE.md) §23 defines build identity and §24
translates the complete PRD into screen and service contracts, with an entity
allow-list. §25 defines the separate v2 lineage and release adapters. Its earlier snapshot sections remain historical context; the newer
authority takes precedence. [LIBS/UI/STITCH/](LIBS/UI/STITCH/) contains the frozen
actual Stitch exports and design system; [DOCS/DESIGN.md](DOCS/DESIGN.md) is its
read-through historical link. It specifies the Stitch
system. [CHECKLIST.md](CHECKLIST.md) translates that architecture into tasks;
[DOCS/TODO-LEDGER.md](DOCS/TODO-LEDGER.md) retains historical citations.

## How the two trees fit together (read this first)

The repository deliberately contains **three preserved trees next to the
clean-room rewrite**, and the running product is a composition of all of them:

| Tree | Status | What the running product uses it for |
| --- | --- | --- |
| `src/app/`, `src/astro/`, `src/chart/`, `src/commerce/`, `src/platform/`, `src/voice/`, `src/souvenir/`, `src/content/`, `src/services/`, `src/shared/` | **Active rewrite** | App shell, stage + inset card, chat + inference client, billing client, platform, voice adapter, keepsake, authored content |
| `src/landing-original/` | **Preserved historical port (v1.42)** | Retained source/reference only; public entries now resolve to the frozen AppShell frame and do not mount the retired marketing interface |
| `src/atelier-original/` | **Verbatim copies, still live** | The 3D wheel (`Astrolabe3D.tsx`), the atelier scene components, the supertonic TTS worker, the original ephemeris pipeline (`services/ephemeris.ts`) that feeds the renderer |
| `src/onboarding-original/` | **Verbatim copy, still live** | The first-light intake questionnaire (`FirstLight.tsx`) wrapped by `src/app/onboarding/` |

Because of this, **two astrology pipelines coexist by design**: the clean-room
`src/astro/chart.ts` (which produces the frozen `NatalChart` type used by chat,
souvenir and persistence) and the original
`src/atelier-original/services/ephemeris.ts` (which produces `NatalChartResult`
for the 3D renderer). `src/chart/astrolabeInput.ts` is the bridge: the same
persisted `BirthInput` feeds both.

## The stage: two views, one card

The stage always shows both Natally and her chart — one view fills the stage,
the other lives in `src/app/stage/Inset.tsx`, a draggable, dockable,
corner-resizable card persisted per account (per guest on the landing):

- **Click swaps** the two views (a click acts on whatever hover highlighted; a
  drag only ever moves the card).
- **Initial compact size** matches the frozen prototype: 260 px on desktop,
  132 px on phones, with a 96 px minimum and existing manual geometry preserved.
  Detailed chart annotations appear on focus/selection. Other noncompact callers
  retain the existing usefulness-derived floor.
- **Layout by range:** dock beside the scene when there is room (the scene
  re-zooms), float clear of her face when roomy, least-overlap when tight, and
  invert (chart focused, Natally inset) when the floor cannot fit.
- Her replies carry hidden cues (`[[view:chart]]`, `[[chart:Sun;Moon]]`) parsed
  by `src/app/presentation/` and applied **as her voice reaches each passage**,
  so she drives focus, highlights and view swaps herself.

## Stack

Vite 8 · React 19 · TypeScript (strict, `tsc --noEmit` is the gate) · three.js
chart · Swiss Ephemeris WASM (vendored `public/vendor/swisseph/` +
`swisseph-wasm` server-side) with a bundled 108-place gazetteer · Firebase Auth
(Google) + Firestore · Chargebee one-time checkout · OpenRouter inference on a
per-customer managed key (free-tier model chain) · Supertonic local voice TTS ·
jsPDF keepsake export · Tauri 2 native matrix.

## Develop

Requires Node.js 24 and npm.

```bash
npm ci
npm run dev    # Vite dev server
npm run lint   # tsc --noEmit type gate
```

`.env` holds pointers only (`kstore://…`); real values are resolved at runtime
from KStore / Admin-Manual and never committed. Public settings the browser
needs: `VITE_BILLING_API_URL`, `VITE_CHARGEBEE_SITE`, `VITE_FIREBASE_CONFIG`,
`VITE_CREDIT_DISPLAY_PER_USD`.

## Build and deploy

From the repository root, run the single supported build-and-deploy command:

```bash
./build_all.sh
```

The script reads release policy from `config/product-release.json`, resolves
the Astronatally/shared Manual credentials, automatically initializes an older
source lineage at2.1, and stamps the current source MAJOR.MINOR with
`floor(epochMilliseconds / 60000) % 10000`, synchronizes and pushes that release
identity, validates source, builds/publishes v2.astronatally.com, and
packages Linux, Windows and Android. It publishes and verifies the actual
complete package set at that same v2 host. Only after the complete matrix succeeds
does it advance the source MINOR and clear source `builtAt` for the next build.
The artifacts retain the built version. Human badges show the build field with
five digits; native/npm/Cargo manifests use its equivalent unpadded integer to
remain valid SemVer. No day stamp or incremented build counter. Use this entry
for every attempt. Native namespace: `mba.robin.astronatally`.

### Surge deployment account and domain

Use the existing shared Surge context from the private Admin Manual's
`CREDENTIALS/global-infrastructure/`, mirrored with provenance in
`CREDENTIALS/Astronatally/`. The Manual's `DOCS/APP_INVENTORY.md` registers this
fork separately from the parent. Keep credentials outside this public repository.

| Public destination | Purpose | Expected DNS target |
| --- | --- | --- |
| `v2.astronatally.com` | This separate fork's immersive app and release artifacts | `geo.surge.sh` |

Namecheap's API replaces all hosts: the complete live zone must be backed up
and committed to the private Manual before adding the v2 CNAME, and the complete
resulting zone is preserved there too. Existing parent records are unchanged.
Surge manages custom-domain certificates; publication evidence includes actual
DNS routing and valid HTTPS.

### Outputs and verification

The web bundle includes the app, preserved landing entry and
`/auth/native.html` browser handoff. Web publication must succeed before native
packaging starts. Native outputs are staged under `dist/natally-v<version>/`
with a SHA-256 inventory and per-target logs: Linux AppImage/deb/rpm, Windows
x64 executable/NSIS/MSI/MSIX, and production-signed Android arm64 APK/AAB plus
native symbols. The exact web bundle is archived too. Generated versioned
manifests and `releases/current.json` identify actual local/public artifacts;
MSIX signature status is stated independently of Store publication.
A failed or incomplete target remains recorded in the inventory; it is not a
complete platform set. Verify the actual version badge on the v2 deployment
and report the produced artifacts and any failed targets. Build success and
functional sign-in/reading acceptance are recorded separately in CHECKLIST.md.

## Billing and inference (server)

**Legacy implementation reference:** the Netlify routing below is deprecated
by the operator's direct per-user OpenRouter-key decision. It describes the
remaining source wiring, not an instruction to deploy another Netlify service.
The current migration and functional verification status is in CHECKLIST.md.

The Netlify function `netlify/functions/chargebee.mjs` (site
`natally-hosted-chat`, locally hostable via `billing/server.mjs`) serves:

| Route | What it does |
| --- | --- |
| `GET /billing/access` | Bearer Firebase ID token → allowance + managed-key state |
| `POST /billing/checkout` | `{kind, amountUsdMicros, requestId}` → Chargebee hosted page |
| `POST /billing/redeem` | grant-code redemption |
| `POST /billing/webhook` | HMAC/Basic-verified Chargebee webhook → idempotent grant + key-limit raise |
| `GET /billing/history` | grants + posted usage |
| `GET /billing/invoices/:id` | owner-checked Chargebee invoice |
| `POST /billing/chat` | SSE passthrough on the customer's managed OpenRouter key; actual spend posted to the ledger |

Allowance = grants − posted usage, integer USD-micros in Firestore
(`natallyCreditGrants` − `events`), with managed keys encrypted at rest
(AES-256-GCM). When a turn has no allowance left, Natally asks in her own
voice and the top-up sheet opens. A second function,
`netlify/functions/ephemeris.mjs`, serves signed swisseph positions/houses.

## Process

`DOCS/ARCHITECTURE.md` (snapshot + registry allow-list) → `CHECKLIST.md` →
coder agents → `build_all.sh` → version badge verified on the v2 host. Coders
read the architecture, the checklist, the TODO ledger and the files they edit.
Work is recorded in the ledger and acted on only when Robin says go.

## License

AGPL-3.0-only.

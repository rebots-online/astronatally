# Compiled web smoke — v1.32.09425

This validates the actual local `dist-web` produced by the canonical build,
not a deployed site or native package. Build stamp: `beed399`; numeric package
version `1.32.9425`, displayed version `1.32.09425`, builtAt
`2026-11-13T10:25:34.557Z`. Vite succeeded; the subsequent real Surge permission
rejection stopped the pipeline before native packaging.

One bounded production smoke served the unchanged bundle at
`http://127.0.0.1:5180` using a local static server. It loaded `/`, `/app.html`,
`/landing.html` and the invalid-link `/auth/native.html` at1440×900 and390×844.
All eight document requests returned200, with no page exception or horizontal
overflow. The six guest-entry views displayed the baked **v1.32.09425** badge
and one live Scene. The native utility truthfully rejected the missing/invalid
sign-in link; no native provider return is claimed.

| Guest frame | Desktop | Phone |
| --- | --- | --- |
| Header |1440×52 |390×48 |
| Stage |1016×730 at24,76 |358×371.359375 at16,64 |
| Task card |352×229.296875 at1064,76 |358×221.296875 at16,531.359375 |

These match the frozen frame. Real room/chart rendering and used local
Playfair Display/Outfit faces loaded. There were no script, style, image or font
HTTP failures. Unused font weights remain unloaded normally.

The observer enabled the real Save-Data preference and made no gestures.
**Zero remote responses** were recorded: no new voice-model download, provider
contact, SMS/reset operation, credential submission or purchase occurred.
No application services or data were mocked.

Production-only console differences are preserved: optional `HEAD /sw.js`
returns404 under the static server instead of the development HTML/MIME fallback;
some pages emit an AudioContext user-gesture warning; headless WebGL readback
warnings remain nonfatal. These are distinct from the zero page exceptions.
The frozen PWA/voice behavior was not changed to hide those messages.

`observations.json` contains actual requests, statuses, console, fonts and
geometry. `summary.json` records scope and any observation normalization.
`bundle-inventory.json` lists actual compiled files, byte sizes and SHA-256
hashes. Three screenshots show the desktop/phone guest views and native error.
Managed cloud Chromium/Playwright was used because the Browser plugin's
associated JavaScript tool remained unavailable. The temporary observer script
is `/workspace/scratch/production-web-smoke.cjs`.

No publication, TLS-host verification, signed Android, Linux/Windows packaging,
authenticated account or paid-operation success follows from this web smoke.

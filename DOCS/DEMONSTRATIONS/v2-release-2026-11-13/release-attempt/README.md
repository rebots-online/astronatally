# Astronatally v2: failed web-first attempt

The actual `./build_all.sh` attempt stamped **2.1.09519** (numeric `2.1.9519`), passed TypeScript and compiled the web bundle. Surge then rejected the first publication:

> Aborted - you do not have permission to publish to v2.astronatally.com

Exit code: **1**. Linux, Windows and Android packaging **did not start**. No final artifact publication/readback or successful-build source advancement ran; source MINOR remains **1**. The original apex/www were untouched. This is an unpublished web artifact, not a completed platform release.

| Observed step | Actual result |
| --- | --- |
| Stamp | `2.1.09519` at `2026-11-13T11:59:28.574Z` |
| TypeScript | Passed |
| Vite | Built (1.34s) |
| First Surge publication | Permission rejected |
| Every native group | NOT STARTED |
| Public HTTPS readback | TLS valid; HTTP404, “project not found”; new version absent |
| Source MINOR advancement | NOT RUN |

Source before stamp: `1dd0623427dae6e85a70c23feaed81e3202e5dc6`. Stamp commit: `fd4e5ca3365f203fa815b7db2689c3dbd5b9e38f`. BUILD was computed once with `Math.floor(epochMilliseconds / 60000) % 10000`; `1794571168574`ms → `29909519`minutes → `9519`, displayed as `09519`.

Exact invocation from `/workspace/astronatally`:

```bash
. /workspace/tools/natally-build-env.sh
node /workspace/private/with-natally-manual-env.mjs ./build_all.sh > /workspace/private/Admin-Manual/.staging/Astronatally/canonical-v2-build-all.log 2>&1
```

[`canonical-attempt.json`](canonical-attempt.json) records actual stages, source/stamp identity, normal TLS/HTTP observations and raw private-log digest. [`web-files.json`](web-files.json) hashes the 76 actual compiled files. No credentials or raw private logs are included.

The ignored archive `dist/astronatally-v2.1.9519-web-only-unpublished.zip` contains only `dist-web/` (20,581,264bytes), explicitly **web-only and unpublished**. SHA-256: `dcaa1eb77bab219636f46b847b07eb7ab0d8e4c4a383615c74e6d29ed5b2f0b8`.

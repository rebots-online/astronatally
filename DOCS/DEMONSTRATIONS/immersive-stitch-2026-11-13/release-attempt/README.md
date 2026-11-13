# Canonical attempt: unpublished web output only

The unchanged `./build_all.sh` stopped with exit **1** when Surge rejected publication to `astronatally.com`:

> Aborted - you do not have permission to publish to astronatally.com

This record covers one actual canonical attempt and its compiled web files. It is not a completed platform release or a native release inventory.

| Stage | Actual result |
| --- | --- |
| Shared version stamp | Numeric `1.32.9425`; display `1.32.09425` |
| TypeScript gate | Passed (`npm run lint` → `tsc --noEmit`) |
| Vite web bundle | Built in 1.21s under `dist-web/` |
| Publish `astronatally.com` | Rejected by Surge; exit 1 |
| Publish `asknatally.online` | NOT STARTED |
| Linux AppImage/deb/rpm | NOT STARTED |
| Windows executable/NSIS/MSI | NOT STARTED |
| Production Android APK/AAB/native symbols | NOT STARTED |
| Successful-build source advancement | NOT RUN; MINOR remains 32 |

The stamp used `2026-11-13T10:25:34.557Z`: `1794565534557` epoch milliseconds → `29909425` whole epoch minutes → BUILD `9425` with `Math.floor(epochMilliseconds / 60000) % 10000`. Padding only the visible build field produces `1.32.09425`. Package versions retain equivalent numeric SemVer.

Source before stamping: `aad9dac1c30848e40ad469a74f302883fa651bd9`. The canonical script committed and pushed stamp `beed3991107b344e8121ae454f534a6599b1c4c9` before compilation. The failed attempt did not execute source-MINOR advancement.

The exact invocation, with working directory `/workspace/astronatally`, was:

```bash
. /workspace/tools/natally-build-env.sh
node /workspace/private/with-natally-manual-env.mjs ./build_all.sh > /workspace/private/canonical-build-single-attempt.log 2>&1
```

The private loader passed the existing Manual inputs into the canonical entry. No provider rejection was bypassed and no repeat attempt followed.

[`canonical-attempt.json`](canonical-attempt.json) records the stage results, commits, formulas, archive digest and private raw-log path/digest. [`web-files.json`](web-files.json) hashes the **76 actual web files** (44,495,280 bytes).

The ignored archive `dist/natally-v1.32.9425-web-only-unpublished.zip` contains only those `dist-web/` files. It is explicitly a **web-only, unpublished** artifact. SHA-256: `bc76017c9abd89f4c1099797ec8192cfe32551e7d543e2e4f386fd4fb3a9dd9c`. No credentials, private logs, environment files, Manual files or native packages are included.

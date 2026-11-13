# Frozen Stitch UI source

This directory is the canonical UI design source for
`rebots-online/astronatally`, as required by Admin Manual TC12 and product
[ARCHITECTURE §25](../../../DOCS/ARCHITECTURE.md). The relocation on
13 November 2026 changed no existing artifact bytes, screen, copy, function or
provider identity. The revised interface remains frozen under architecture §24.

[DESIGN.md](DESIGN.md) is the frozen design system. Exported screens, code,
images, assets, provenance and provider responses live under `screens/`:

| Screen | Project and intent | Working artifacts | Checklist tasks |
| --- | --- | --- | --- |
| `6e69d41b4a4e418b97b5c83ac901f264` | [6919345441915622012](https://stitch.withgoogle.com/projects/6919345441915622012): reproduce the original blocking welcome UI as the baseline, preserving evidence of the problem | [Baseline source/provenance](screens/6e69d41b4a4e418b97b5c83ac901f264/SOURCE.md), [HTML](screens/6e69d41b4a4e418b97b5c83ac901f264/current-first-light.html), [PNG](screens/6e69d41b4a4e418b97b5c83ac901f264/current-first-light.png) | UI-BASELINE |
| `d69e9b3247ff40fa90415cc2ca24abe4` | [16384422545803483395](https://stitch.withgoogle.com/projects/16384422545803483395): keep the live atelier visible and interactive while the adjacent task rail carries the complete existing user journeys | [Master HTML](screens/d69e9b3247ff40fa90415cc2ca24abe4/master.html), [CSS](screens/d69e9b3247ff40fa90415cc2ca24abe4/shared.css), [state/binding manifest](screens/d69e9b3247ff40fa90415cc2ca24abe4/state-manifest.json), [artifact hashes](screens/d69e9b3247ff40fa90415cc2ca24abe4/SHA256.json), [source/provenance](screens/d69e9b3247ff40fa90415cc2ca24abe4/SOURCE.md) | UI-SPECIFICATION; UI-FRAME; UI-FORMS; UI-COMMERCE; UI-OBSERVATION |

The revised master contains **52 states**, with exact templates and individual
hashes in its state manifest. Its families are S01 guest/sections, S02 provider
choice and authentication, S03 first visit, S04 birth details/calendar/place,
S05 casting/recovery, S06 reading/chart focus, S07 menu/account, S08 credits/
redemption/checkout, S09 keepsake/report, S10 native browser bridge and S11
status/recovery/legal utilities. The manifest defines every state-to-component,
service and observation binding; this README does not replace that registry.

The task mapping follows the frozen architecture: UI-FRAME integrates shared
geometry, the persistent scene, guest sections, reading and account/navigation;
UI-FORMS integrates authentication and birth intake/casting; UI-COMMERCE
integrates actual purchases, keepsakes and native utility views. UI-OBSERVATION
compares the implementation with these exact exports. No coder invents an
alternative interface while wiring the existing functions.

These SHA-256 values remain unchanged:

| Artifact | SHA-256 |
| --- | --- |
| Revised `master.html` | `58b11534f01da85c2aca9a73aa2dfccf13411274a70509ce65e4ff9090afc0bc` |
| Revised `shared.css` | `3d8dcfc54ce9243685c26960894ab31ba1ca97892eb59ebdc49233e674287c32` |
| `DESIGN.md` | `e016e064ce830f38ce48fb991ef4a2871531f129a47eb760cde3fe9cb4d46541` |

The relocation compared every regular file before and after: all 9 baseline
files, all 88 revised files and DESIGN.md were byte-identical. All 52 template
hashes matched the frozen state manifest. This verifies preservation during
relocation; product operation and release acceptance have separate evidence.

Historical paths remain **relative read-through symlinks** to this sole source:

- `DOCS/STITCH/2026-11-13/baseline` → the baseline screen directory above.
- `DOCS/STITCH/2026-11-13/revised` → the revised screen directory above.
- `DOCS/DESIGN.md` → this directory's DESIGN.md.

They preserve historical references without creating independently editable
copies. Existing export provenance remains unchanged, including its original
paths and timestamps. The v2 release adapter changes the host and release
lineage; it does not change this UI freeze or create a replacement Stitch
project.

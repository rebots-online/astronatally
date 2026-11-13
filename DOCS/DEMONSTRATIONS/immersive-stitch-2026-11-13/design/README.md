# Frozen design-reference observations

**Scope: design review only.** No implemented-product conformance, deployed
authentication/payment, native-package or release acceptance is claimed here.
Repository: `rebots-online/astronatally`. Freeze commit: `8842cd5`.

The authoritative [master prototype](../../../STITCH/2026-11-13/revised/master.html)
has SHA-256 `58b11534f01da85c2aca9a73aa2dfccf13411274a70509ce65e4ff9090afc0bc`.
Its [shared CSS](../../../STITCH/2026-11-13/revised/shared.css) has SHA-256
`3d8dcfc54ce9243685c26960894ab31ba1ca97892eb59ebdc49233e674287c32`.
The provider screen is
`projects/16384422545803483395/screens/d69e9b3247ff40fa90415cc2ca24abe4`.
The immutable [state manifest](../../../STITCH/2026-11-13/revised/state-manifest.json)
provides each template hash and its planned existing component/service binding.

## What was observed

An initial design pass rendered all52 states at1440×900 and390×844:104 DOM
observations, with14 representative screenshots retained temporarily. This
earlier source hash was `7a4f99ea…567bee`, not the final frozen master.
No horizontal overflow, rail/stage overlap, visible modal/inert layer, visible
image failure or page error was observed. Narrow/short stress cases exposed
40px sound/pause buttons and footer links narrower than44px; those failures
were reported and corrected before freeze.

The final bounded pass used the exact frozen master, at six changed-area cases:
360×640 guest;390×844 place suggestions and confirmed place;1440×900 date/calendar;
and1440×900 plus390×844 retained report. It confirmed:

- All visible controls in the360px guest case, including header/stage/footer,
  have at least44×44px targets.
- Inset outer geometry is132×132px phone and260×260px desktop; idle caption
  surface is transparent and contains no text.
- Birthplace includes the actual native datalist structure and source-backed
  Toronto option; confirmed place has a concrete chip, coordinates and timezone.
- Typed `YYYY/MM/DD` plus the existing calendar matches the reconciled PRD.
- Retained report has a cover and16 report articles:17 sections total, with
  real public demonstration-chart facts and captured existing renderer output.
- No horizontal overflow or visible image failure appears in these final cases.

This was a targeted final recheck, not a second104-state pass. Raw observations
and their exact source provenance are preserved in JSON; three representative
final images show confirmed place and report structure. Primary desktop/phone
reference images already exist beside the immutable exports and are not duplicated.

| Family | States assessed in the initial desktop/phone pass |
| --- | --- |
| S01 | guest, meet, chart, aloud, personal, prices, learn |
| S02 | choose, email, register, reset, phone, code |
| S03 | first-visit |
| S04 | name, date, date-calendar, date-year, place, place-suggestions, place-confirmed, time, time-unknown |
| S05 | casting, error |
| S06 | reading, chart-focus |
| S07 | menu, account |
| S08 | topup, checkout, cancelled, error, redeem-result |
| S09 | offer, preparing, done, retained |
| S10 | google, phone, code, return, error |
| S11 | signing-in, voice-loading, voice-error, art-error, network-error, no-allowance, rate-limited, privacy, terms |

## Execution and evidence limits

The Browser plugin was listed, but its required JavaScript runtime tool was
absent from the available tool inventory. The user explicitly required cloud
workspace evidence, so the observer used installed Playwright with managed
`/usr/bin/chromium`, not a local computer/browser. Screens were selected through
the prototype's explicit `?screen=` preview query; no product state was replaced.

The actual commands were temporary observer scripts outside product source:
`qa-prefreeze.cjs`, `qa-prefreeze-stress.cjs` and `qa-final-design.cjs` under
`/workspace/scratch/`. They recorded DOM geometry, text/data bindings, visible
image load state and controls, plus screenshots. No fake customer account,
verification widget, allowance, paid grant, payment or real-service success was
created. Actual existing `public/privacy.html` and `public/terms.html` were found;
the prototype links reference those documents rather than invented legal text.

Prototype Toronto/report values are documented public demonstration references,
not customer or purchase evidence. Production must bind real service data.
Blank or honest pending bindings do not establish functional acceptance.

Final product comparison must use this frozen master/CSS, preserve actual live
renderer slots, and distinguish guest walkthroughs, explicitly labelled isolated
component observations, and genuine authorized external-service operations.

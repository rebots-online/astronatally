# Firebase sign-in observation rubric — 2026-11-11

Authority: Robin requires Firebase email and SMS login alongside Google in
`rebots-online/astronatally`. This rubric precedes the auth amendment and code.
The other session's visual/build work must survive integration unchanged.

Record browser walkthroughs under
`DOCS/DEMONSTRATIONS/firebase-auth-2026-11-11/`. For each row record the
observed result and artifact; an unexercised journey remains unverified.
Automated source tests certify wiring and lifecycle only, never real login.

| ID | Action | Required observation |
| --- | --- | --- |
| A1 | Open Sign in from the header, mobile menu and landing card CTA | Each opens the same existing-style account sheet with labelled Google, Email and SMS choices. No generic button silently chooses Google. |
| A2 | Choose Google | The labelled Google button starts the existing popup synchronously from the click; cancellation and errors remain visible. Existing redirect and Google fragment handoff remain functional. |
| A3 | Choose Email on the landing host | Navigate to `https://asknatally.online/?auth=email` before collecting credentials; open the email form automatically and remove the method query. No password or token in a URL or storage. |
| A4 | Use Email on the app host | Email/password sign-in, explicit Create account with password confirmation, and Forgot password are available. Invalid input produces a visible error; Enter submits the active form. |
| A5 | Complete real email registration/sign-in/reset with an authorized account | Firebase supplies the actual user and normal auth observer enters the app; reloading retains the Firebase session; sign-out returns to the signed-out page. Actual reset delivery and account login are independently recorded. |
| A6 | Choose SMS on landing and app hosts | Landing navigates to `?auth=phone` on the app host before collecting a number. App presents country-code guidance, a telephone input, SMS consent/rates notice, and Firebase reCAPTCHA. |
| A7 | Request and confirm a real SMS code with an authorized number | Only successful Firebase sending shows the six-digit code form. Successful confirmation enters the app through the same auth observer. Invalid/expired code and SMS quota/provider failures are visible; resend/new number works without duplicate pending requests. |
| A8 | Switch method, close, reopen, resend, or interrupt a pending phone request | Old challenge/verifier is cleared, late results do not update an abandoned form, passwords and codes are not persisted, and the next attempt remains usable. |
| A9 | Disable/unconfigure auth in a controlled local configuration | Missing config and disabled Email/Phone produce truthful method-specific errors. SMS sending is never reported successful on rejection. No dummy session, test phone number or invented customer data in the product. |
| A10 | Exercise 390x844 and 1440x900 with keyboard and scrolling | Labels, focus, Close/Back, submit and errors are reachable, no horizontal clipping, and long forms scroll inside the existing account-sheet layout. Review screenshots visually. |
| A11 | Choose native Email and Google | Email uses the Firebase SDK in the app; Google preserves the existing system-browser bridge, nonce, expiry and cancellation. Real native runtime completion is recorded separately from source tests. |
| A12 | Choose native SMS | The system browser receives the existing `provider=phone` flow, collects the number through real reCAPTCHA, and returns only verification ID/code through the validated loopback form. Firebase verification occurs in the native app; invalid credentials/cancellation remain visible there. No Google redirect starts for a phone flow. |
| A13 | Inspect Git integration and provider configuration | Published auth changes retain the other session's latest commits; no force push or manual version stamp. Record actual Email/Phone provider settings when authenticated admin access permits. Unobserved provider settings remain unverified. |

Observation status at authorship: all rows pending. Build/deployment and real
email/SMS/native acceptance require observed results; local UI recordings and
SDK contract tests must be labelled with their actual scope.

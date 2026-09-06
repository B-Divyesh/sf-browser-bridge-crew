# Bridge Crew repair 4 handoff — PASS

## Outcome

Repair 4 fixes verification finding V6-1. A fresh application route now leaves
browser focus untouched. The first Tab reaches **Skip to main content**, and
Enter moves focus to the `main` landmark. In-app route changes and browser
history navigation still focus the new route heading.

The deployed implementation is `2457defb9f1e23c5062769b4680845c9a58a1702`.
The repair started from documentation SHA
`c29c0675702fee3aa7c4c320f2c39c7cbbdc0719`; subsequent handoff changes are
report-only.

## Changes

- `renderRoute()` moves focus only when called by in-app or history navigation.
  Initial and online-triggered renders do not move focus.
- Each rendered `main` landmark is programmatically focusable. Activating the
  skip link updates the fragment, scrolls to main, and focuses it.
- Browser regressions cover fresh home, demo, legal, and missing routes in both
  configured projects. A second regression preserves heading focus after an
  in-app route change and Back navigation.
- No game, room-service, storage, copy, billing, or visual behavior changed.

## Local verification

Clean setup used `npm ci` with Playwright 1.58.2.

- Every exact command in `.factory/claims.json`: 23 of 23 passed. Each claim ID
  occurs once in test source, with no extra claim tags.
- `npm test`: 15 unit/integration tests and 44 browser checks passed; two
  project-specific checks were intentionally skipped.
- `npm run build`: passed and produced `dist/`.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Browser Axe checks: zero serious or critical findings on all application
  routes in desktop and phone projects.
- `/opt/fleet/lib/verify-url.sh` passed against the production candidate with
  one h1, `lang=en`, a main landmark, complete image alternatives, labelled
  buttons, and no console errors.
- Production output: 34,049-byte JavaScript (11,357 bytes gzip) and 21,531-byte
  CSS (5,491 bytes gzip). The mobile scene remains 23,132 bytes.
- The measured phone claim reported 60.0 fps and 60.0 fixed updates per second
  at 360 by 640 CSS pixels, touch input, and 4× CPU slowdown.

## Deployment and cold live verification

`dist/` was deployed to the existing product-owned Static Web App
`sf-browser-bridge-crew`. The realtime service was not redeployed or restarted;
this repair does not change it. The live application JavaScript and the built
artifact share SHA-256
`0b5a9d81cf5b895ba6bff837de63e9cbaf6dbc09a76316db7265aa6756101872`.

- The live URL verifier passed with no console errors.
- Fresh Chromium, Firefox, and WebKit contexts at 1440 by 1000 and 390 by 664
  all began on `BODY`; first Tab reached the skip link; Enter focused `main`;
  Privacy navigation focused its h1.
- Both first screens showed the job, audience, sample action, and playable
  fault before scrolling, without horizontal overflow.
- The one-click demo showed its persistent sample label, 07:48, 76% integrity,
  three repairs, and 342 points. Reset removed demo settings and left a seeded
  real-data value unchanged.
- Visible station controls repaired the sample. Seven visible incorrect repairs
  reached **The ship needs another crew**. Replay restored 12:00 and 100%
  integrity. Phone touch changed the Helm bearing.
- Live Axe reported zero serious or critical findings on home, demo, Privacy,
  Terms, and the designed HTTP 404. Reduced motion, 200% text, invalid input,
  missing-room recovery, route titles, internal links, and offline reload
  passed.
- Two independent live browser contexts created room `NE33E`. Signals scanned
  the fault, the host changed from **Scanning required** to **navigation**, and
  reload restored the Signals station and room connection.
- The product-owned room service returned health 200, invalid state 400,
  foreign Origin 403, and an unknown route 404. In a new request bucket,
  requests 1–90 were allowed and request 91 returned 429 with
  `Retry-After: 60`.
- The full local suite re-proved file-backed SQLite restart persistence,
  cross-room token isolation, eight-player capacity, exact 20-minute expiry,
  and the stored-field inventory.

Evidence is under `/work/.evidence/browser-bridge-crew-repair-4/`. The required
catalog description was copied to `/work/.evidence/catalog-description.txt`.

## Earlier findings and remaining gaps

All earlier findings in review 1 and verification 1–6 were read. The prior
multiplayer, persistence, claims, 404, performance, wording, and 44-pixel target
repairs remain covered by the passing claims and full suite. V6-1 is now fixed
locally and live.

No known product gap remains for this work order. The separate path
`factory-evidence/browser-bridge-crew-verify-6/qa-report.md` was not present in
the supplied filesystem; the complete repository report
`.factory/verification-6.md` was available and was used as the authoritative
finding record.

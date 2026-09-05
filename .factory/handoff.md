# Bridge Crew repair 3 handoff — PASS

## Result

Implementation `496681bdfef9154b30e6c7210d74492c372b9874` is deployed to
<https://browser-bridge-crew.sociobot.in>. It repairs V4-1: every header,
footer, and static-404 navigation link now has a rendered clickable box at
least 44 by 44 CSS pixels.

The preceding implementation commit was
`60c0dc06c59d890739f58717a409a37f5b790719`. This handoff is committed later
as documentation only, so it does not require another product image.

## What changed

- Added 44 px minimum width and height to the app wordmark, app header links,
  app footer links, and their static `404.html` counterparts. Existing nav
  gaps and the 3 px Beacon focus outline remain intact.
- Added a browser regression check that measures every visible header/footer
  link on `/`, `/demo`, `/privacy`, `/terms`, and `/404.html` in desktop and
  phone projects.
- A fresh iPhone 13 check found the sample action ending one pixel below its
  664 px viewport. Moved the mobile action plate up 2 px and added a rendered
  phone first-screen regression check. The job, audience, and first action are
  now all visible without scrolling.
- Kept the catalog description verb-first and copied it unchanged to
  `/work/.evidence/catalog-description.txt` (77 bytes).

## Verification

From a clean dependency install (`npm ci`), all 23 exact commands in
`.factory/claims.json` passed. `npm test` then passed 15 unit/integration
tests and 42 Playwright checks; the desktop duplicates of the two phone-only
checks are intentional skips. `npm run build` produced `dist/`, and
`npm audit --audit-level=high` reported zero vulnerabilities.

The final build is 33.76 KB JavaScript (11.33 KB gzip) and 21.53 KB CSS
(5.50 KB gzip). The final asset hashes are:

- `assets/app.js`: `e39c731aef2257d75d7b03c5c7a6d7e76e8cbb19901b5bf0c06d7ebc44c5645c`
- `assets/app.css`: `181046ae1aee0bf5904f9a4cc19b51d486093482ef3de15efb01015910d16115`

The factory static deployment completed successfully against the existing
`sf-browser-bridge-crew` application. The HTTPS CSS hash matches the final
build exactly. No room-service deployment, restart, volume, environment, or
replica setting was changed.

Fresh live browser checks used a 1440 by 1000 desktop viewport and a 390 by
664 iPhone 13 viewport. Before scrolling, both stated the job as “Run a
browser-tab spaceship repair game,” named teachers and group hosts sharing a
display, and showed **Try it with sample data**. The first action opened the
populated demo with its persistent sample label and 76% integrity. Reset kept
a separately seeded real-storage value unchanged. There were no console or
page errors and no horizontal overflow.

Live target measurements found every visible app-shell and static-404 link at
least 44 by 44 pixels; the smallest measured targets were the 44 by 44 Demo
and Terms links. The designed missing route returned HTTP 404 with the correct
title and h1. The URL verifier found a title, `lang=en`, one h1, a main
landmark, complete image alt text, labelled buttons, and no console errors.
Playwright Axe passed the serious/critical check on all public routes and the
404. Live Lighthouse scored 100 for Performance, Accessibility, Best
Practices, and SEO.

Evidence is in `/work/.evidence/browser-bridge-crew-repair-3/`, including the
final live browser audit, URL verifier output, first-screen screenshots, and
final Lighthouse JSON.

## Earlier findings

- Verification 1’s cross-device, claim-command, full-suite, end-screen, and
  playable-first-screen findings remain fixed: their matching claims passed
  again in this clean run.
- Review findings F-1-1 through F-1-23 remain fixed: file-backed room-service
  behavior, exact expiry and FPS tests, genuine HTTP 404, claim completeness,
  demo isolation, capacity, privacy, storage, no-tracking, all stations,
  successful run, Assist, keyboard/touch, and plain visitor copy are covered
  by the passing 23-claim manifest.
- Verification 3’s measured phone frame-rate claim remains present and passed
  in its configured phone project.
- Verification 4’s only finding, V4-1 navigation target size, is fixed and
  now has direct rendered-size coverage on application and static-404 routes.

## Run locally

```sh
npm ci
npm test
npm run build
npm audit --audit-level=high
```

## Known gaps and next steps

No known product defects remain. The realtime service was deliberately left
unchanged for this static accessibility repair; its existing SQLite,
multiplayer, persistence, isolation, health, and rate-limit coverage passed
as part of the declared claim suite.

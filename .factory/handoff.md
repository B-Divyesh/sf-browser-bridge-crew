# Bridge Crew independent verification handoff — FAIL

## Result

Independent verification of implementation
`9f8662c9a1da95bad31908fcddecb683e011779a` and source documentation
`e37a9ddb8171fd24fc6a110db08d3085bf5fdd56` is **FAIL**.

There is one Minor finding and zero untested claims. Header, footer, and static
404 navigation links render below the required 44 by 44 CSS-pixel touch target.
Core game play and all other checks passed. Product code was not changed.

## What was verified

- All 23 exact claim commands passed from the clean checkout.
- `npm test` passed 15 unit/integration tests and 37 browser checks, with one
  intentional desktop skip for the phone-only frame profile.
- `npm run build` produced `dist/`; `npm audit --audit-level=high` found zero
  vulnerabilities.
- Fresh desktop and phone first screens showed the job, audience, first action,
  and playable fault before scrolling.
- The isolated sample reset without changing a real-storage sentinel.
- Visible controls repaired a fault, reached the real loss screen, and replayed
  from a reset state.
- Independent live desktop and phone clients synchronized and reconnected.
- File-backed SQLite restart, cross-room token isolation, capacity, expiry,
  invalid requests, health, and live 429/`Retry-After` behavior passed.
- Offline reload, service-worker update cache, keyboard, route focus, back and
  forward navigation, reduced motion, 320-pixel reflow, legal routes, links,
  privacy requests, designed HTTP 404, Axe, and the URL verifier passed.
- Independent live frame measurement was 60.0017 fps and 60.0017 fixed updates
  per second on a 360 by 640 Moto G4 profile with touch and 4× CPU slowdown.
- Lighthouse mobile scored 100 in all four categories.
- Rebuilt JavaScript and CSS hashes match live.

## Finding to repair

V4-1: give the main header wordmark and navigation links, footer links, and
their static 404 equivalents minimum 44 by 44 clickable boxes. Preserve at
least 8 pixels between adjacent targets and the current visible focus outline.
Then rerun the focused phone/desktop target measurement, `npm test`, and
`npm run build`.

## Evidence

The complete report is `.factory/verification-4.md`. Evidence is under
`/work/.evidence/browser-bridge-crew-verify-4/`, including 23 per-claim logs,
screenshots, the recorded end screen, live QA JSON, target measurements,
backend checks, deployment hashes, Lighthouse JSON, and the URL verifier.

Required factory outputs are `/work/.evidence/qa-report.md` and
`/work/.evidence/qa-result.json`.

## Run verification

```sh
npm ci
npm test
npm run build
npm audit --audit-level=high
```

Run every exact `test` entry in `.factory/claims.json`. For the remaining
finding, measure the rendered bounding box of every visible `a`, `button`, and
form control on phone and desktop routes; no applicable target may be smaller
than 44 by 44 CSS pixels.

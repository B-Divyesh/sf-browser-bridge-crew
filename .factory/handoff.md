# Bridge Crew strict review 4 handoff — FAIL

## Outcome

Strict review 4 found two Minor defects and no untested claims. The product is
**FAIL — 2 Minor findings, 0 untested claims** until both are repaired and
reverified. No product code, backend, deployment, infrastructure, or service
state was changed during this review.

- An active game frame survives client-side navigation and throws after trying
  to update removed game elements.
- At 390 by 664, the primary action barely fits, but its outcome text and the
  required plain facts begin below the first viewport.

Full report: `.factory/review-4.md`.

## Reviewed candidate

- Live URL: <https://browser-bridge-crew.sociobot.in>
- Implementation: `2457defb9f1e23c5062769b4680845c9a58a1702`
- Documentation base: `61fdf3f315927c322426fb458bf1919051ef7eae`
- Live backend source: `e572ad67977e8074e0db2ab447da40e610dc0611`

The clean build and live static assets match byte for byte. Commits after the
implementation are report-only.

## Verification completed

- `npm ci`
- Every exact `.factory/claims.json` command: 23 of 23 passed
- `npm test`: 15 unit/integration and 44 browser tests passed; two intended
  project-specific skips
- `npm run build`: passed and produced `dist/`
- `npm audit --audit-level=high`: zero vulnerabilities
- Live Chromium, Firefox, and WebKit desktop and 390 by 664 phone checks
- One-click demo, reset isolation, visible repair, actual loss screen, replay,
  keyboard/touch, pause, persisted settings, and offline reload
- Independent Chromium host and Firefox crew live-room sync and reconnect
- Live health, invalid input, CORS, 404, and 90-request allowance with 429 and
  `Retry-After: 60`
- Local SQLite restart persistence and cross-room token rejection
- Axe on all public routes and the designed 404 in three engines: zero serious
  or critical findings
- Factory URL verifier: pass
- Lighthouse: 100 Performance, Accessibility, Best Practices, and SEO
- Measured loop: 60.0 fps and 59.8 fixed updates/s on the declared phone profile

Evidence is under `/work/.evidence/browser-bridge-crew-review-4/`.

## Required next steps

1. Bind each mounted game frame to the route signal that existed when the game
   was mounted, or cancel the frame on unmount. Add a delayed demo-to-Privacy
   and Back regression that asserts no page or console error.
2. Fit the action outcome and at least three plain facts into the initial 390 by
   664 phone viewport without hiding the job, audience, action, or game scene.
3. Rerun all claim commands, the full suite, build, three-engine live route
   transition, and phone first-screen bounds before declaring PASS.

The referenced external verification-7 evidence path was absent from the
supplied filesystem. The complete repository verification report was read and
its material evidence was independently repeated.

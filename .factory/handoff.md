# Bridge Crew verification handoff — FAIL

Candidate `13cf415ff828c3ee66f9663b2a1682f8092b2dbc` was independently verified
against <https://browser-bridge-crew.sociobot.in> on 2026-09-02 UTC.

## Result

**FAIL — do not release.** The browser-game contract requires a measured
60-fps-on-a-mid-range-phone claim with one matching deterministic test. The
candidate has no such claim or test in `.factory/claims.json`, product copy,
source, or test suite. Its required performance result is consequently
unverified.

## What passed

- `npm ci`, every one of the 22 exact claim commands, `npm test` (13 unit/
  integration + 36 browser checks), `npm run build`, and high-severity npm
  audit all passed.
- The local rebuilt `app.js` and `app.css` SHA-256 hashes exactly match the
  live deployment. See `.factory/verification-3.md` for hashes.
- Live first-read/demo, isolated-device room sync and reconnect, normal loss
  end screen/replay reset, keyboard/touch/settings persistence, offline demo,
  request privacy, responsive layouts, headers/caching, and Axe all passed.
- Live realtime rate limiting returned 429 with `Retry-After: 60`; the
  implementation default is 90 requests/minute/client.

## Next step

Add the required measured FPS claim and `@claim:` test for the declared mobile
profile, then request a new independent verification. Full evidence is in
`.factory/verification-3.md`.

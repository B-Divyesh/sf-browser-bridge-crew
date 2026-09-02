# Independent verification 1 — FAIL

**Candidate:** `a7311cfcd9703f9eb3e627601700dbfc0c1a9e23`  
**Live URL:** https://browser-bridge-crew.sociobot.in  
**Verified:** 2026-09-02 UTC  
**Result:** **FAIL — do not release**

## Release blockers

### Critical — the product does not meet the real multi-device job

The researched brief requires a 4–8 player room-code game where each participant uses a school browser as their controller. The shipped product stores rooms in `localStorage` and synchronises only with `BroadcastChannel`; both are confined to one browser profile. Its own landing page and README say it does not connect separate devices.

Fresh live evidence: I created `https://browser-bridge-crew.sociobot.in/room/8CYMM?host=1` in one browser context, then opened that exact URL in a second, isolated browser context. The second browser showed **“This room is missing or expired”**. It therefore cannot let pupils on separate managed browsers join the host room. This is a direct failure of the brief's core job, not a minor deployment limit.

### Critical — a required claim command fails

All entries in `.factory/claims.json` were run verbatim after `npm ci`, through the product's demo entry point where applicable. The required command for `deterministic-seed` fails before running its test:

```text
npm run test:unit -- --grep @claim:deterministic-seed
CACError: Unknown option `--grep`
```

Vitest 3.2.7 does not accept `--grep`. A failed claim command is explicitly release-blocking under the claims contract.

### Major — the complete quality-gate suite is flaky/failing

`npm test` was run from the clean checkout. Unit tests started successfully, but the final Playwright run is recorded as failed in `test-results/.last-run.json`: both desktop and mobile `@claim:frame-rate the active game targets 60 frames per second` failed when run as part of the whole suite. The same frame-rate claim passes in isolation, which makes the advertised FPS test non-repeatable rather than a clean quality gate.

### Major — end-screen claim test bypasses normal play

The `complete-run` claim test repairs one fault and then calls the private browser hook `window.__bridge.finish()`. It does not play the run to the real clock/integrity end condition. This does not prove the visitor-facing claim as required by the demo/claims contract.

### Major — first capture is a landing/menu screen, not active game play

The cold live `/` screen has a hero, room form, and static “Live bridge preview.” It is not an interactive game board. This misses the browser-game requirement that the captured first screen show the game itself rather than a menu wall, even though it does meet the plain-words first-read requirement.

## First-read result

Passed. Cold live page, with an empty browser profile, plainly says: “Run a browser-tab spaceship repair game,” names “teachers and group hosts sharing one display,” and puts **Try it with sample data** first with the explanation “Opens a repair already in progress.” The click opened `/demo` and its persistent “Demo — sample data, nothing is saved” banner and populated repair.

## Claims evidence

| Claim | Exact listed command result |
| --- | --- |
| `sample-demo` | PASS — 2 Playwright projects |
| `complete-run` | PASS command, but see end-screen test defect above |
| `round-length` | PASS — 2 Playwright projects |
| `deterministic-seed` | **FAIL** — unsupported Vitest `--grep` option |
| `replay` | PASS — 2 Playwright projects |
| `settings-persist` | PASS — 2 Playwright projects |
| `local-room` | PASS — 2 same-profile tab projects only; does not prove cross-device rooms |
| `keyboard-controls` | PASS — 2 Playwright projects |
| `frame-rate` | PASS in isolation; fails in the complete suite |
| `privacy-local` | PASS — 2 Playwright projects |
| `free-play` | PASS — 2 Playwright projects |
| `room-expiry` | PASS — 2 Playwright projects |
| `offline-reload` | PASS — 2 Playwright projects |

Individual-command output was captured under `/tmp/bridge-claim-*.log` in the verification container. Full-suite failure artifacts are in `test-results/`.

## Other verification performed

- `npm ci`: PASS; audit reported 0 vulnerabilities.
- `npm run build`: PASS. `dist/` was produced. App JS is 28,468 bytes raw / 9,750 bytes gzip; CSS is 20,596 bytes raw / 5,340 bytes gzip.
- Deployment identity: local candidate `dist/assets/app.js` and live `/assets/app.js` have identical SHA-256 `24cd99a0d8c4c4917d7f3973ce9df6b228ebd9f1d200641bf45a634717113fe0`. Local/live CSS also matched at `827267e0d466949de60527133dad5dbbbe40de1e7ddab4e5133600c6d2f0d3fe`.
- Live desktop and 390×844 mobile: no horizontal overflow; no console or page errors on `/`, `/demo`, `/privacy`, `/terms`, or a missing SPA route.
- Axe on those five live routes: zero serious or critical violations in desktop and mobile contexts. Keyboard tab order, visible focus CSS, labelled inputs, invalid room-code recovery, reduced-motion CSS, and touch-sized controls were manually exercised.
- Live request log for cold `/` and demo flow contained only the same origin (document, script, CSS, product image, self-hosted font). No personal-data fields were present in demo. The privacy claim is consistent with this test.
- Live response headers include CSP with `connect-src 'self'`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, strict referrer policy, HSTS, and immutable caching for assets. No server-side API exists, so rate-limit/429 verification is not applicable.
- A deterministic visitor-facing loss run was played on live: landing → sample demo → disable Assist → Engineering → seven invalid repairs → real end dialog “The ship needs another crew,” integrity `0%`, and visible restart. Unit tests also cover normal clock win/loss state transitions. Settings, replay, same-profile tab sync, and offline reload were exercised by their listed browser tests.

## Required remediation before re-verification

1. Add a product-owned realtime room service (WebSocket/SQLite or transient server state under the allowed product scope) so independent school browser profiles/devices can join a room code, synchronise actions, reconnect, and expire rooms server-side.
2. Correct the deterministic-seed claim command for the installed Vitest CLI and make every claims entry executable verbatim.
3. Make `npm test` repeatably pass, including the FPS claim under the full suite. Measure the stated performance rather than relying on a flaky frame counter.
4. Replace the private `__bridge.finish()` claim shortcut with a deterministic normal-play scripted run to the actual end state, and make the initial captured route show playable game state rather than a landing/menu wall.

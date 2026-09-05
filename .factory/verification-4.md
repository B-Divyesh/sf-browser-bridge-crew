# Verify the browser-tab spaceship repair game — FAIL

**Verdict:** **FAIL — 1 finding, 0 untested claims**

**Implementation reviewed:** `9f8662c9a1da95bad31908fcddecb683e011779a`

**Documentation reviewed:** `e37a9ddb8171fd24fc6a110db08d3085bf5fdd56`

**Live URL:** <https://browser-bridge-crew.sociobot.in>

**Verified:** 2026-09-05 UTC

The implementation and documentation SHAs differ only by report and copy-audit
files. Rebuilt application assets match the deployed assets byte for byte. This
independent verification fails because interactive navigation targets are
smaller than the required 44 by 44 CSS pixels. Core game play, all 23 declared
claims, and every other check below passed.

## First screen

Fresh 1440 by 1000 desktop and 390 by 844 phone browsers started at the top of
the live home page without saved state.

- **Job:** Run a browser-tab spaceship repair game.
- **Audience:** Teachers and group hosts sharing one display while players use
  four station panels.
- **First action:** **Try it with sample data**. The adjacent text says it opens
  a repair already in progress.

All three answers and the working **Scan sample fault** control appeared before
scrolling in both browsers. Neither layout overflowed horizontally and neither
logged a console or page error. Evidence:
`first-screen-desktop.png`, `first-screen-phone.png`, and `live-qa.json` under
`/work/.evidence/browser-bridge-crew-verify-4/`.

## Current finding

### V4-1 — Minor — navigation touch targets are smaller than 44 pixels

The required accessibility and design baseline says touch targets are at least
44 by 44 CSS pixels. The live header and footer links do not meet it.

Measured on the 390-pixel phone:

| Target | Rendered size |
| --- | ---: |
| Header wordmark | 128.0 × 30.0 px |
| Header Demo | 42.8 × 22.3 px |
| Header Privacy | 52.1 × 22.3 px |
| Footer Privacy | 47.5 × 20.3 px |
| Footer Terms | 38.6 × 20.3 px |

The same targets are under 44 pixels high on desktop. The separate static 404
header and footer repeat the problem, with header links about 24.8 to 26.3
pixels high. This affects `/`, `/demo`, `/privacy`, `/terms`, and the designed
404. Core game buttons meet the target size, the links remain spaced and
operable, and keyboard focus is visible, so the impact is Minor. It is still a
finding under the explicit 44-pixel contract and therefore blocks PASS.

Evidence: `touch-targets.json` and the phone screenshots. Repair by giving the
wordmark, header links, footer links, and static 404 navigation a minimum 44 by
44 clickable box while preserving their spacing and visible focus treatment.

## Claim commands

From the clean checkout at documentation SHA `e37a9dd`, after `npm ci`, every
exact `test` command in `.factory/claims.json` ran verbatim. All 23 passed. Each
manifest ID occurs exactly once in test source and there are no extra claim
tags.

| Claim | Result | Evidence |
| --- | --- | --- |
| `sample-demo` | PASS | `claims/sample-demo.log` |
| `playable-first-screen` | PASS | `claims/playable-first-screen.log` |
| `demo-isolation` | PASS | `claims/demo-isolation.log` |
| `demo-stations` | PASS | `claims/demo-stations.log` |
| `complete-run` | PASS | `claims/complete-run.log` |
| `successful-run` | PASS | `claims/successful-run.log` |
| `round-length` | PASS | `claims/round-length.log` |
| `deterministic-seed` | PASS | `claims/deterministic-seed.log` |
| `replay` | PASS | `claims/replay.log` |
| `settings-persist` | PASS | `claims/settings-persist.log` |
| `assist-behavior` | PASS | `claims/assist-behavior.log` |
| `cross-device-room` | PASS | `claims/cross-device-room.log` |
| `room-reconnect` | PASS | `claims/room-reconnect.log` |
| `player-capacity` | PASS | `claims/player-capacity.log` |
| `keyboard-controls` | PASS | `claims/keyboard-controls.log` |
| `mobile-frame-rate` | PASS | `claims/mobile-frame-rate.log` |
| `privacy-local` | PASS | `claims/privacy-local.log` |
| `no-personal-data` | PASS | `claims/no-personal-data.log` |
| `room-storage` | PASS | `claims/room-storage.log` |
| `no-tracking` | PASS | `claims/no-tracking.log` |
| `free-play` | PASS | `claims/free-play.log` |
| `room-expiry` | PASS | `claims/room-expiry.log` |
| `offline-reload` | PASS | `claims/offline-reload.log` |

The live landing page, game, legal pages, and README were cross-checked against
the manifest. No unlisted or untested public claim was found.

## Game and demo run

One click loaded the persistent **Demo — sample data, nothing is saved** label
with 07:48 remaining, 76% integrity, three repairs, 342 points, and a current
fault. Changing demo settings created only a `demo:` key. **Reset demo**
restored the sample values, removed demo keys, and left a separately seeded
real-storage sentinel unchanged. **Start for real** also removed demo keys.

The recorded deterministic run used the visible clue `+30°`, Navigation, and
Kite · Ring · Kite. The visible Helm, Power, and Engineering controls repaired
the fault, raising repairs from three to four and score from 342 to 502. With
Assist disabled, seven visible incorrect Engineering repairs reduced integrity
to zero and opened the real loss screen. It reported score 502, four repairs,
50% accuracy, and numbered game 57231. **Play this seed again** reset integrity
to 100%, repairs to zero, and time to 12:00. Focus moved into the end dialog.

The exact 720,000 ms deterministic unit claim separately reached the successful
end state with positive integrity. Pause held the clock and Resume restarted
it. Assist and sound settings survived reload. Evidence:
`end-screen-loss.png`, `live-qa.json`, and `navigation-recovery.json`.

## Live multiplayer and backend

A fresh desktop host created and started a real room. An independent phone
browser joined Signals, scanned the fault, and changed the host from
**Scanning required** to **Engines**. Reloading the phone restored **Control the
Signals station** and the connected room state. Neither client logged an error.

The local file-backed restart test created a room and player, stopped the room
service, opened the same SQLite file in a new service process, restored the
game, and reconnected the same station token. A separate isolation check proved
that a token for one room cannot open another room's socket. Capacity coverage
joined all four roles, shared them through eight players, operated every role,
and received the ninth-player error.

The live health endpoint returned 200, version 1.1.0, and backend source
`e572ad67977e8074e0db2ab447da40e610dc0611`. Invalid state returned 400, a
foreign origin returned 403, and an unknown API route returned the expected
404. After two earlier counted requests, requests 1–87 in the recorded burst
returned 200 and burst request 88 returned 429, which is consistent with the
90-request allowance. The 429 included `Retry-After: 60`.

Evidence: `live-room-host.png`, `live-room-phone.png`,
`restart-persistence.log`, `tenant-isolation.log`, `backend-http.log`, and
`rate-limit.tsv`.

## Invalid input and recovery

Submitting an empty or short room code announced **Enter the five-character
code shown on the host screen** in a `role=alert` region and returned focus to
the input. A valid-format missing code announced that the room was missing or
expired and told the visitor what to do. The live room path then succeeded in a
fresh context.

The demo reloaded offline under the controlling product service worker and
displayed **This tab is offline**. Cache `bridge-crew-v4` was active. Returning
online restored normal rendering. Known links all returned 200. Back and
forward navigation restored the correct route title, top position, focused h1,
and polite route announcement.

## Accessibility and site structure

- Playwright Axe found no serious or critical violations on `/`, `/demo`,
  `/privacy`, `/terms`, or the designed 404.
- The URL verifier found a title, `lang=en`, one h1, a main landmark, complete
  image alt text, labelled buttons, and no console errors.
- Every checked route has one h1 and ordered headings. Route titles are
  product-specific and correct.
- Keyboard controls operated the stations. Checked controls were keyboard
  reachable, and the complete home-page Tab cycle reached the skip link. Focus
  uses a 3-pixel Beacon outline. The skip link targets main content.
- The end dialog received focus. Form errors are announced. At 320 CSS pixels,
  all main routes reflowed without horizontal overflow.
- Reduced-motion mode matched the media query, removed running animations, and
  changed smooth scrolling to `auto`.
- The missing document returned an intentional HTTP 404 with **Page not found**,
  one h1, one main landmark, a return action, and no serious or critical Axe
  issue. The 404 itself is expected behavior, not a defect.

V4-1 is the one remaining accessibility failure.

## Privacy, security, and deployment identity

The demo requested only `browser-bridge-crew.sociobot.in`, opened no WebSocket,
loaded scripts only from that origin, contained no personal-data field, and
made no camera or microphone call. The separate live-room check used only the
product static and realtime origins. No analytics or third-party runtime file
was observed.

Static responses include CSP with the product realtime HTTPS/WSS origins,
`frame-ancestors 'none'`, HSTS, `nosniff`, strict referrer policy, and disabled
camera, microphone, and geolocation. Application assets are immutable for one
year; HTML revalidates after 30 seconds.

Rebuilt and live SHA-256 values match:

- JavaScript: `e39c731aef2257d75d7b03c5c7a6d7e76e8cbb19901b5bf0c06d7ebc44c5645c`
- CSS: `ebcf78d99c3cf118e4213be6f47d39d1d4b40c3954166d8d6f63a678d808a0fb`

## Quality and performance

- `npm test`: 15 unit/integration tests passed; 37 browser checks passed; the
  duplicate desktop run of the phone-only frame claim was intentionally
  skipped.
- `npm run build`: passed and produced `dist/`.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Build output: 33,755-byte JavaScript, 21,369-byte CSS, and 23,132-byte mobile
  hero. Gzip output is 11.33 KB JavaScript and 5.49 KB CSS.
- Independent live Moto G4 profile at 360 by 640 with touch and 4× CPU slowdown:
  60.0017 fps and 60.0017 fixed updates per second; the visible clock advanced
  seven seconds.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.1 s, LCP 1.1 s, CLS 0, and TBT 40 ms.

Lighthouse does not replace the explicit 44-pixel target audit in V4-1.

## Earlier finding disposition

| Earlier finding | Current evidence | Disposition |
| --- | --- | --- |
| F-1-1 durable SQLite | File-backed restart passed; image defaults to `/data/bridge-crew.sqlite`; live backend source is unchanged. | Fixed |
| F-1-2 privacy headline | Live privacy h1 names browser and room-service storage. | Fixed |
| F-1-3 exact expiry | Claim asserts 1,200,000 ms and actual deletion. | Fixed |
| F-1-4 invalid FPS test | Real active-loop phone instrumentation measured 60.0017 fps and 60.0017 updates/s. | Fixed |
| F-1-5 soft 404 | Unknown live document returned designed HTTP 404. | Fixed |
| F-1-6 duplicate claim tags | All 23 IDs occur exactly once. | Fixed |
| F-1-7 demo isolation | Live sentinel, reset, and exit checks passed. | Fixed |
| F-1-8 player capacity | Four roles, sharing through eight, actions, and ninth-player rejection passed. | Fixed |
| F-1-9 personal data | Full room and demo flows use no account, name, chat, camera, microphone, or recording. | Fixed |
| F-1-10 stored fields | SQLite schema inventory claim passed. | Fixed |
| F-1-11 tracking | Public, demo, and room flows used only product origins. | Fixed |
| F-1-12 all demo stations | All four stations opened and operated. | Fixed |
| F-1-13 success path | Exact 12-minute deterministic success passed. | Fixed |
| F-1-14 Assist behavior | Added time and removed penalties passed. | Fixed |
| F-1-15 keyboard map | Arrow, S, number, R, and touch paths passed. | Fixed |
| F-1-16 terms safety copy | Live terms describe supervised use without a broad guarantee. | Fixed |
| F-1-17 privacy heading | Live heading is **Privacy and room data**. | Fixed |
| F-1-18 WebSocket jargon | Visitor copy uses **room service**. | Fixed |
| F-1-19 realtime jargon | Audience copy describes separate devices and accounts plainly. | Fixed |
| F-1-20 unexplained seed | Visitor copy says **numbered game**. | Fixed |
| F-1-21 reconnect token jargon | Visitor copy says **random code**. | Fixed |
| F-1-22 vague request limit | Vague public wording is absent; exact backend behavior is tested. | Fixed |
| F-1-23 transient jargon | Copy says rooms are deleted after 20 minutes. | Fixed |
| Verification 1: no cross-device game | Independent live desktop and phone clients synchronized. | Fixed |
| Verification 1: bad Vitest command | Every current manifest command passed verbatim. | Fixed |
| Verification 1: flaky frame check | Real-loop check passed alone and in the full suite. | Fixed |
| Verification 1: private end shortcut | Visible controls reached the real loss dialog. | Fixed |
| Verification 1: menu-only first capture | Working sample fault appears before scrolling. | Fixed |
| Verification 3: missing measured phone FPS | Visitor claim, manifest entry, unit support, and independent live measurement are present. | Fixed |

Verification 2 reported no findings. The repair worker's prior verification 4
also reported none, but it did not detect V4-1.

## Final result

**FAIL — 1 Minor finding and 0 untested claims.** Repair V4-1 and repeat the
focused touch-target audit plus normal quality gates before declaring PASS.

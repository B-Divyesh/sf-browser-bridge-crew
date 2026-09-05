# Verify the browser-tab spaceship repair game — PASS

**Verdict:** **PASS — 0 findings, 0 untested claims**

**Implementation reviewed:** `496681bdfef9154b30e6c7210d74492c372b9874`

**Documentation reviewed:** `58ee7ed2da6377a018bd40c03910f762eb55817d`, then `54c51118f69fed5901a9ebad1855a308aebaba71`

**Live URL:** <https://browser-bridge-crew.sociobot.in>

**Verified:** 2026-09-05 UTC

The later documentation commits change only `.factory/handoff.md`. A clean
diff from the implementation to the documentation base confirms that no
product file changed. Rebuilt JavaScript and CSS match the live files byte for
byte.

## First screen

Fresh 1440 by 1000 desktop and 390 by 664 phone browsers opened the live home
page at scroll position zero.

- **Job:** Run a browser-tab spaceship repair game.
- **Audience:** Teachers and group hosts sharing one display while players use
  four station panels.
- **First action:** **Try it with sample data**. The adjacent text says it opens
  a repair already in progress.

All three answers and the playable **Scan sample fault** control were visible
before scrolling. The phone sample action ended at 663.2 px in the 664 px
viewport, remained fully visible, and measured 277.7 by 48 px. Neither layout
had horizontal overflow.

## Demo and complete game run

The one-click sample opened `/?demo=1` with the persistent **Demo — sample
data, nothing is saved** label. The populated state showed 07:48 remaining,
76% integrity, three repairs, 342 points, numbered game 57231, and an active
Navigation fault.

I stored a separate real-data sentinel before entering the demo. Changing
Assist and sound created only `demo:` settings. **Reset demo** restored 07:48,
76%, three repairs, and 342 points, removed the demo settings, kept the banner,
and did not change the real-data sentinel. **Start for real** removed all demo
keys and also left the sentinel unchanged.

The recorded deterministic run used the visible clue **+30° · Navigation ·
Kite, Ring, Kite**. Helm, Power, and Engineering repaired the fault and raised
the repair count from three to four. With Assist off, seven visible incorrect
repairs reduced integrity to zero and opened the actual loss screen. It showed
**The ship needs another crew**, score 500, four repairs, 50% accuracy, and
numbered game 57231. Focus moved to **Play this seed again**. Replay reset the
clock to 12:00, integrity to 100%, and repairs to zero. The exact 720,000 ms
unit claim separately reached the successful end state with positive
integrity.

Pause held the visible clock at 07:48 and Resume advanced it. Assist and sound
survived reload. Keyboard actions covered S, Arrow, number, and R controls;
the phone run used touch. Evidence includes `end-screen-loss.png` and
`live-qa.json`.

## Live multiplayer and backend

A fresh desktop host created and started room `S2DRC`. An independent phone
browser joined Signals and scanned the fault. The host changed from
**Scanning Required** to **Engines**. Reloading the phone restored **Control
the Signals station** and **Connected to room S2DRC.** No account or shared
browser state was used.

The product room service returned health 200, status `ok`, version 1.1.0, and
backend source `e572ad67977e8074e0db2ab447da40e610dc0611`. Invalid state
returned 400, a foreign origin returned 403, and an unknown API route returned
the expected 404. In an isolated request bucket, requests 1–90 returned 200;
request 91 returned 429 with `Retry-After: 60`.

A local file-backed authority check created two rooms, rejected a room A token
against room B, restarted the service against the same SQLite file, restored
room A with its saved game state, and reconnected its Helm token. The full
suite also passed four-role actions, sharing through eight players, the ninth-
player limit, exact expiry, stored-field inventory, and restart persistence.

## Invalid, boundary, and recovery paths

- Empty and short room codes announced **Enter the five-character code shown
  on the host screen** and returned focus to the input.
- A valid-format missing code announced that the room was missing or expired
  and told the user to check the code or ask the host for a new room.
- The player boundary accepted shared stations through eight and rejected the
  ninth player with a clear room-full response.
- A disconnected demo reloaded under the active `bridge-crew-v4` service
  worker and displayed **This tab is offline**. Returning online restored the
  normal page.
- Browser back navigation restored the Privacy title and h1. Pause, resume,
  reload reconnect, reset, replay, and offline reload all recovered correctly.

## Accessibility and site structure

- `/`, `/demo`, `/privacy`, and `/terms` returned 200 with distinct titles,
  `lang=en`, one h1, one main landmark, ordered headings, labelled controls,
  and no missing image alt text.
- An unknown document returned a deliberate HTTP 404 with **Page not found**,
  one h1, a main landmark, standard navigation, and **Return home**. The 404
  response and a missing-room API response produced only their expected 404
  console messages; successful paths had no console or page errors.
- Playwright Axe found zero serious or critical issues on every public route
  and the designed 404. The factory URL verifier also passed.
- The skip link was keyboard focusable, targeted `#main`, and showed a 3 px
  Beacon outline. Station controls worked from the keyboard, errors returned
  focus to their input, and the end dialog received focus.
- Every visible header and footer link on application routes and `404.html`
  measured at least 44 by 44 CSS px. The minimum was exactly 44 by 44 px.
- At 200% root text size on the phone, the h1 and demo banner remained visible
  with no document-level horizontal overflow.
- Reduced-motion mode matched and reduced transitions and animations to
  0.01 ms while changing smooth scrolling to `auto`.
- Every discovered internal link returned 200. Route titles, canonical links,
  legal pages, robots, sitemap, Open Graph data, and the original generated
  image disclosure are present.

## Privacy and security

The live demo requested only `browser-bridge-crew.sociobot.in` and opened no
WebSocket. Public pages and a live room used only that origin and the
product-owned `browser-bridge-crew-realtime.sociobot.in` service. There were no
analytics, third-party runtime files, account/name/email/chat fields, or media
API calls.

Static responses include a matching CSP, `frame-ancestors 'none'`, HSTS,
`nosniff`, strict referrer policy, and disabled camera, microphone, and
geolocation. Hashed assets use one-year immutable caching; HTML and the service
worker revalidate after 30 seconds.

## Claims

From a clean clone at documentation SHA `54c5111`, I ran `npm ci` and then each
exact `test` command in `.factory/claims.json`. All 23 passed. Each manifest ID
appears exactly once in test source, no extra claim tag exists, and the live
copy plus README contain no unlisted public claim.

| Claim | Result |
| --- | --- |
| `sample-demo` | PASS |
| `playable-first-screen` | PASS |
| `demo-isolation` | PASS |
| `demo-stations` | PASS |
| `complete-run` | PASS |
| `successful-run` | PASS |
| `round-length` | PASS |
| `deterministic-seed` | PASS |
| `replay` | PASS |
| `settings-persist` | PASS |
| `assist-behavior` | PASS |
| `cross-device-room` | PASS |
| `room-reconnect` | PASS |
| `player-capacity` | PASS |
| `keyboard-controls` | PASS |
| `mobile-frame-rate` | PASS |
| `privacy-local` | PASS |
| `no-personal-data` | PASS |
| `room-storage` | PASS |
| `no-tracking` | PASS |
| `free-play` | PASS |
| `room-expiry` | PASS |
| `offline-reload` | PASS |

## Build and performance

- `npm test`: 15 unit/integration tests passed; 40 browser tests passed; two
  desktop duplicates of phone-only checks were intentionally skipped.
- `npm run build`: passed and produced `dist/`.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Build output: 33,755-byte JavaScript (11,263 bytes gzip), 21,531-byte CSS
  (5,491 bytes gzip), and a 23,132-byte mobile hero image.
- Rebuilt/live SHA-256: JavaScript
  `e39c731aef2257d75d7b03c5c7a6d7e76e8cbb19901b5bf0c06d7ebc44c5645c`;
  CSS `181046ae1aee0bf5904f9a4cc19b51d486093482ef3de15efb01015910d16115`.
- Three isolated live Moto G4 runs at 360 by 640, touch, and 4× CPU slowdown
  measured 60.003, 60.003, and 59.837 fps. The final recorded run measured
  60.002 fps and 60.002 fixed updates/s.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.1 s, LCP 1.1 s, TBT 0 ms, CLS 0.

## Earlier finding disposition

| Earlier finding | Current proof | Disposition |
| --- | --- | --- |
| F-1-1 durable SQLite | Container defaults to `/data/bridge-crew.sqlite`; file-backed restart and reconnect passed. | Fixed |
| F-1-2 privacy headline | Live h1 names browser and room-service storage. | Fixed |
| F-1-3 exact expiry | Claim asserts 1,200,000 ms and deletion behavior. | Fixed |
| F-1-4 invalid FPS test | Real active-loop phone instrumentation measured about 60 fps and 60 updates/s. | Fixed |
| F-1-5 soft 404 | Unknown live document returned the designed page with HTTP 404. | Fixed |
| F-1-6 duplicate claim tags | All 23 IDs occur exactly once; no extras exist. | Fixed |
| F-1-7 demo isolation | Live sentinel, reset, and exit checks passed. | Fixed |
| F-1-8 player capacity | Four roles, shared stations through eight, actions, and ninth-player rejection passed. | Fixed |
| F-1-9 personal data | Demo and room flows used no account, name, chat, media, or recording input. | Fixed |
| F-1-10 stored fields | SQLite schema and row inventory claim passed. | Fixed |
| F-1-11 tracking | Public, demo, and room flows used only product-owned origins. | Fixed |
| F-1-12 all demo stations | All four stations opened and operated. | Fixed |
| F-1-13 success path | Exact 12-minute deterministic success passed. | Fixed |
| F-1-14 Assist behavior | Added time and removed penalties passed. | Fixed |
| F-1-15 keyboard map | Arrow, S, number, R, and touch paths passed. | Fixed |
| F-1-16 terms safety copy | Terms describe supervised use without a broad guarantee. | Fixed |
| F-1-17 privacy heading | The live section is **Privacy and room data**. | Fixed |
| F-1-18 WebSocket jargon | Visitor copy uses **room service**. | Fixed |
| F-1-19 realtime jargon | Audience copy describes separate devices and accounts plainly. | Fixed |
| F-1-20 unexplained seed | Visitor copy says **numbered game**. | Fixed |
| F-1-21 reconnect token jargon | Visitor copy says **random code**. | Fixed |
| F-1-22 vague request limit | Vague public wording is absent; exact backend behavior is tested. | Fixed |
| F-1-23 transient jargon | Copy says rooms are deleted after 20 minutes. | Fixed |
| Verification 1: no cross-device game | Independent live desktop and phone clients synchronized and reconnected. | Fixed |
| Verification 1: bad Vitest command | Every current manifest command passed verbatim. | Fixed |
| Verification 1: flaky frame check | Measured claim passed alone, in the full suite, and in three isolated live runs. | Fixed |
| Verification 1: private end shortcut | Visible controls reached the real loss dialog. | Fixed |
| Verification 1: menu-only first capture | The playable sample fault is on the first screen. | Fixed |
| Verification 3: missing measured phone FPS | Public claim, one tagged test, and repeatable live measurement are present. | Fixed |
| Verification 4: navigation targets below 44 px | All application and static-404 navigation links measured at least 44 by 44 px. | Fixed |

Verification 2 had no findings. The repair and polish reports contain no
unresolved item beyond those listed above.

## Evidence and final result

Evidence is under `/work/.evidence/browser-bridge-crew-verify-5/`: per-claim
logs, full-suite/build/audit logs, first-screen and end-screen images, live QA
JSON, backend checks, link/network checks, asset hashes, URL-verifier output,
and Lighthouse JSON.

**PASS — 0 findings of any severity and 0 untested claims.**

# Adversarial first-read review 1 — FAIL

Reviewed 2026-09-02 UTC against candidate `c545dbb178f46069f91dd4d3025903df8c094ba2`
and the live site at <https://browser-bridge-crew.sociobot.in>.

## Verdict

**FAIL.** The first screen and demo are clear and usable, but five blocking
findings remain. The production image does not use the required persistent
SQLite path, a privacy headline contradicts live-room behavior, two numeric
claims are not tested at the stated value, and unknown document URLs return a
soft 404. There are also unlisted claims and plain-language defects. A PASS
requires zero findings and no untested claim.

## 30-second cold read

Both checks used a fresh Chromium context at scroll position zero.

| View | What it does | For whom | What to click first | Result |
| --- | --- | --- | --- | --- |
| 390 × 844 | A browser-tab spaceship repair game | “teachers and group hosts” sharing a display | **Try it with sample data**; it says “Opens a repair already in progress.” | Clear |
| 1440 × 1000 | A browser-tab spaceship repair game | “teachers and group hosts” sharing a display | **Try it with sample data**; the playable **Scan sample fault** control is also visible | Clear |

The exact first-screen copy was “Run a browser-tab spaceship repair game” and
“For teachers and group hosts sharing one display while players control four
station panels.” All three required answers were available without scrolling.
There was no first-read blocker, horizontal overflow, console error, page
error, or third-party request.

## Findings

### Blocking

#### F-1-1 — Production room state is in memory, not SQLite under `/data`

- **Location/quote:** `Dockerfile.realtime:7` sets
  `DB_PATH=:memory:`. The earlier `.factory/handoff.md` also says, “production
  uses the honest in-memory path” and “A container revision restart expires
  active rooms early.” The landing page and README say, “Rooms expire after
  20 minutes.”
- **Why this fails:** This work order requires state in SQLite under
  `/data`. A restart can delete a live class game before 20 minutes, so the
  advertised expiry is not reliable. This is the known handoff gap, still
  present in code. Deployment settings were not inspected because the work
  order forbids reading service configuration.
- **Concrete fix:** Set the production image to
  `DB_PATH=/data/rooms.sqlite`, attach product-scoped durable storage at
  `/data`, and add a restart test that creates a room, restarts the authority,
  and reconnects before the 20-minute expiry. If persistence cannot be
  provided, remove the 20-minute guarantee and disclose restart loss before a
  host creates a room.

#### F-1-2 — The privacy headline contradicts live-room behavior

- **Location/quote:** `/privacy` h1: “Your game stays in your browser.” The
  same page later says, “Room codes, station roles, and game state go to the
  Bridge Crew room service.”
- **Why this fails:** A first-time visitor can reasonably read the headline as
  a local-only claim. Real rooms send state to another origin. The later
  qualification does not make the headline true.
- **Concrete fix:** Replace the h1 with **“What your browser and the room
  service store”**. Keep the local-only statement specifically for `/demo` and
  list/test every live-room payload.

#### F-1-3 — The 20-minute expiry test never tests 20 minutes

- **Location/quote:** `.factory/claims.json` says, “Room state expires after
  20 minutes.” `tests/unit/realtime.test.ts:98-101` starts the server with
  `roomTtlMs: 20`, waits 35 milliseconds, and checks for 404.
- **Why this fails:** The test proves configurable expiry, not the stated
  1,200,000 ms default. The production in-memory setting in F-1-1 also permits
  earlier loss. This numeric claim remains unproved even though its command
  exits successfully.
- **Concrete fix:** Assert that the production default is exactly
  `20 * 60_000`, assert the returned `expiresAt` is 20 minutes from creation
  within a small clock margin, and retain a short-TTL integration check for
  deletion behavior.

#### F-1-4 — The 60 fps test accepts 45 fps and does not measure the game loop

- **Location/quote:** README: “The active loop targets 60 frames per second.”
  `tests/e2e/bridge.spec.ts:127-139` counts page
  `requestAnimationFrame` callbacks for two seconds and accepts 90 frames.
- **Why this fails:** Ninety frames in two seconds is 45 fps. The callback is
  the browser compositor clock, not evidence that Bridge Crew’s state-update
  loop runs at 60 fps. The number in the claim is not asserted.
- **Concrete fix:** Prefer deleting the user-facing FPS claim because it does
  not help a host decide whether to play. If retained, instrument the actual
  update loop, state the allowed margin, and assert a result consistent with
  60 fps.

#### F-1-5 — Unknown document routes are soft 404s and the fallback breaks the site skeleton

- **Location/quote:** `GET /definitely-missing-review` returned HTTP 200 with
  “This station is not on the bridge” and **Return to the bridge**.
  `public/staticwebapp.config.json:2-4` rewrites every unknown document to the
  SPA, so its 404 response override never applies to those URLs.
  `public/404.html` lacks the standard skip link/navigation, OG/Twitter tags,
  favicon links, and apple-touch icon.
- **Why this fails:** Crawlers receive a successful response for a missing
  page. The h1 and action are bridge metaphors instead of plain results, and
  the actual static 404 does not use the consistent route skeleton.
- **Concrete fix:** Rewrite only the known SPA routes (`/`, `/demo`,
  `/privacy`, `/terms`, and `/room/*`) to `index.html`; let all other paths
  reach the 404 response override with status 404. Give `404.html` the standard
  header/footer and metadata. Use h1 **“Page not found”** and action **“Return
  home.”**

### Major

#### F-1-6 — Two claim IDs have more than one tagged test

- **Location/quote:** `@claim:cross-device-room` and
  `@claim:room-reconnect` each occur in both
  `tests/unit/realtime.test.ts` and `tests/e2e/bridge.spec.ts`.
- **Why this fails:** The claims contract requires exactly one tagged test per
  claim. Passing output is ambiguous because each ID names two different
  tests.
- **Concrete fix:** Keep one end-to-end tagged test per claim. Leave supporting
  unit tests untagged or give separately listed claim IDs to distinct promises.

#### F-1-7 — Demo isolation and reset are advertised but unlisted

- **Location/quote:** README: “The demo opens a repair already in progress and
  keeps sample data separate.” The live banner says, “Demo — sample data,
  nothing is saved,” with **Reset demo** and **Start for real**.
- **Why this fails:** No `.factory/claims.json` entry asserts the separate
  `demo:` namespace, Reset behavior, or that real keys remain untouched. Manual
  review passed, but there is no required regression test.
- **Concrete fix:** Add one `demo-isolation` claim/test. Seed a real-storage
  sentinel, change demo state, confirm only `demo:` keys change, reset to the
  original sample, leave demo, and confirm the sentinel is unchanged.

#### F-1-8 — The 4–8 player capacity and shared controls are unlisted claims

- **Location/quote:** Landing: “4–8 players · 12 minutes” and “Extra players
  share controls.” README: “Run a 12-minute cooperative spaceship repair game
  for 4–8 players.”
- **Why this fails:** The existing cross-device test joins one crew browser.
  It does not prove four roles, shared stations, an eight-player ceiling, or
  the response to a ninth player.
- **Concrete fix:** Add a `player-capacity` claim/test using isolated contexts:
  join all four roles, join additional shared stations up to eight, confirm
  synchronized actions, then confirm the ninth join receives the visible room-
  full error.

#### F-1-9 — Account and personal-input claims are unlisted

- **Location/quote:** Landing: “No accounts or chat” and “No names, chat,
  cameras, or recordings.” README: “It needs no student accounts, names, chat,
  cameras, or microphones.”
- **Why this fails:** `privacy-local` checks the demo for email/name inputs and
  foreign requests only. It does not cover live room creation/join, camera or
  microphone access, chat, or recording behavior.
- **Concrete fix:** Add one precise claim and a full landing → host → crew
  flow test that records forms, permission requests, media APIs, payloads, and
  requests. Assert the exact absence statements retained in copy.

#### F-1-10 — Room-service storage contents are unlisted

- **Location/quote:** Landing: “The room service stores only game state and
  random reconnect tokens.” README: “Live rooms send game state, station
  roles, and random reconnect tokens to the product-owned room service.”
- **Why this fails:** No claim entry inventories stored fields or inspects the
  isolated SQLite database. “Random reconnect tokens” is also technical jargon
  in visitor-facing copy.
- **Concrete fix:** Add a storage-minimization claim/test that creates a room,
  joins stations, inspects the SQLite schema and stored row fields, and checks
  expiry deletion. Rewrite the landing sentence as **“The room service stores
  game progress, station choices, and random codes used to reconnect.”**

#### F-1-11 — No-analytics and no-external-service claims are unlisted

- **Location/quote:** Landing: “The game includes no analytics.” README:
  “Players can use separate school devices without accounts or third-party
  realtime services” and “There are no names, analytics, third-party scripts,
  or runtime CDNs.”
- **Why this fails:** `privacy-local` covers only `/demo` and requires only
  same-origin requests. It does not cover landing/legal pages or a live room’s
  product-owned realtime origin, and it would not detect same-origin analytics.
- **Concrete fix:** Add a `no-tracking` claim/test covering all public routes
  plus a live room. Allow only the static origin and the documented
  product-owned realtime origin; inspect loaded scripts and requests for
  analytics. Rewrite “runtime CDNs” as **“files loaded from another company.”**

#### F-1-12 — “Every station” in the demo is an unlisted claim

- **Location/quote:** Landing: “The full demo includes every station.”
- **Why this fails:** The demo does contain Helm, Power, Signals, and
  Engineering, but no claim entry says so. Existing gameplay happens to touch
  them without listing this promise.
- **Concrete fix:** Expand one listed demo claim to name all four stations and
  make its single tagged test operate one meaningful control in each.

#### F-1-13 — The successful end condition is unlisted

- **Location/quote:** README: “A run succeeds when the 12-minute clock ends
  with integrity above zero.”
- **Why this fails:** `complete-run` ends the demo by repeated failed repairs
  and checks the loss dialog. An untagged unit test covers a shortened win, but
  no claim entry or tagged test proves the stated success path.
- **Concrete fix:** Add a `successful-run` claim with one deterministic test
  that advances the configured clock while integrity stays above zero and
  asserts the success summary.

#### F-1-14 — Assist mode behavior is unlisted

- **Location/quote:** README: “Assist mode adds response time and removes
  integrity penalties.” The game says, “No integrity penalty and more response
  time.”
- **Why this fails:** `settings-persist` proves the checkbox value survives a
  reload, not either gameplay effect.
- **Concrete fix:** Add an `assist-behavior` claim/test that compares fault
  limits and an incorrect repair with Assist on and off.

#### F-1-15 — The documented keyboard map is only partly tested

- **Location/quote:** README: “Arrow keys set Helm, S scans Signals, number
  keys operate Power or Engineering, and R repairs.” The
  `keyboard-controls` test exercises one Arrow key and then clicks a visible
  Helm control.
- **Why this fails:** The test never presses S, a number key, or R, so most of
  the exact control promise is unproved. Its mobile project uses a click but
  does not explicitly exercise a touch gesture.
- **Concrete fix:** Expand the single tagged test to use Arrow, S, number, and
  R keys against their observable station results, and tap a visible control
  in the touch-enabled project. Otherwise narrow the README to the controls
  actually tested.

#### F-1-16 — “Classroom-safe” is an untestable safety claim

- **Location/quote:** `/terms`: “Bridge Crew is free classroom-safe software.”
- **Why this fails:** “Classroom-safe” is broad, undefined, and absent from the
  claims manifest. It can imply a safety guarantee beyond the concrete privacy
  and supervision limits.
- **Concrete fix:** Rewrite as **“Bridge Crew is free software for supervised
  classroom, home, or youth-group play.”**

### Minor copy findings

#### F-1-17 — A landing heading is a slogan rather than a section name

- **Location/quote:** Landing h2: “A game, not a student account.”
- **Why this fails:** Heard alone in a heading list, it does not name the
  section’s privacy and retention content.
- **Concrete fix:** Use **“Privacy and room data.”**

#### F-1-18 — “WebSocket” is unexplained jargon in the audience section

- **Location/quote:** README, Who it is for: “The static game connects to its
  own WebSocket room service.”
- **Why this fails:** Teachers do not need the transport protocol to understand
  the product.
- **Concrete fix:** **“Each browser connects through Bridge Crew’s room
  service.”** Keep “WebSocket” only in developer setup documentation.

#### F-1-19 — “Third-party realtime services” is technical and redundant

- **Location/quote:** README: “Players can use separate school devices without
  accounts or third-party realtime services.”
- **Why this fails:** A host needs the account result, not infrastructure
  terminology.
- **Concrete fix:** **“Players can join from separate school devices without
  creating accounts.”**

#### F-1-20 — “Seed” is not explained in player-facing copy

- **Location/quote:** README: “Each seed creates a repeatable fault sequence.”
- **Why this fails:** A first-time host may not know what a game seed is or why
  it matters.
- **Concrete fix:** **“Replaying the same numbered game repeats its faults.”**

#### F-1-21 — “Random token” is technical implementation language

- **Location/quote:** README: “A station reconnects with a random token stored
  for that browser tab.”
- **Why this fails:** The useful result is reconnection after reload.
- **Concrete fix:** **“Each tab stores a random code so its station reconnects
  after a reload.”**

#### F-1-22 — “Limits rapid requests” is vague and not useful

- **Location/quote:** README: “The service limits rapid requests.”
- **Why this fails:** “Rapid” has no defined threshold and gives a host no
  action to take.
- **Concrete fix:** Delete it from the Play section. Put the exact tested limit
  in developer/security documentation only if visitors need it.

#### F-1-23 — “Transient” is avoidable jargon

- **Location/quote:** README, Deploy: “Rooms are transient and expire after 20
  minutes.”
- **Why this fails:** The next phrase already gives the useful behavior.
- **Concrete fix:** **“Rooms are deleted 20 minutes after their last update.”**

## Copy audit

Counts treat hyphenated terms and numeric ranges as one word. Landing sentences
average 7.6 words and the longest has 14. README sentences average 9.5 words
and the longest has 16. No sentence exceeds 22 words, and no banned word from
the plain-words skill appears. Finding IDs mark other copy or claim problems.

### Landing-page sentences

| Sentence | Words | Result |
| --- | ---: | --- |
| Scan to reveal the crew’s first clue. | 7 | Pass |
| For teachers and group hosts sharing one display while players control four station panels. | 14 | Pass |
| Opens a repair already in progress. | 6 | Pass |
| Project the host screen. | 4 | Pass |
| Players join from their own browsers with the room code. | 10 | Covered by `cross-device-room` |
| Scan this sample fault. | 4 | Pass |
| The full demo includes every station. | 6 | F-1-12 |
| Signals must scan the fault before the repair starts. | 9 | Pass |
| Project the bridge and read the five-character room code aloud. | 10 | Pass |
| Assign Helm, Power, Signals, and Engineering. | 6 | Pass |
| Extra players share controls. | 4 | F-1-8 |
| Call out each clue, align the ship, route power, and enter the repair code. | 14 | Pass |
| No names, chat, cameras, or recordings. | 6 | F-1-9 |
| The room service stores only game state and random reconnect tokens. | 11 | F-1-10 |
| Rooms expire after 20 minutes. | 5 | F-1-1, F-1-3 |
| The game includes no analytics. | 5 | F-1-11 |
| Bridge Crew is a free, 12-minute cooperative browser game. | 9 | Covered by `free-play` and `round-length` |

### Landing headings and actions

| Copy | Words | Type | Result |
| --- | ---: | --- | --- |
| Run a browser-tab spaceship repair game | 6 | h1 | Pass |
| Open a room for your crew | 6 | h2 | Pass |
| One fault needs four stations | 5 | h2 | Pass |
| Navigation relay | 2 | h3 | Pass |
| Get the crew playing in three steps | 7 | h2 | Pass |
| Create a room | 3 | h3/button | Pass |
| Open four stations | 3 | h3 | Pass |
| Repair together | 2 | h3 | Pass |
| A game, not a student account | 6 | h2 | F-1-17 |
| Try it with sample data | 5 | action | Pass |
| Scan sample fault | 3 | action | Pass |
| Join room | 2 | action | Pass |

All landing buttons use verbs that name their result. Short labels and facts
were also checked: “4–8 players · 12 minutes” is F-1-8; “No accounts or chat”
is F-1-9; “Free to play,” “Keyboard and touch controls,” “Start here,”
“Playable bridge preview,” “How it works,” and “Privacy and limits” otherwise
pass.

### README sentences

| Sentence | Words | Result |
| --- | ---: | --- |
| Run a 12-minute cooperative spaceship repair game for 4–8 players. | 10 | F-1-8 |
| A host projects the ship while players operate Helm, Power, Signals, and Engineering. | 13 | Pass |
| Try it with sample data. | 5 | Pass |
| The demo opens a repair already in progress and keeps sample data separate. | 13 | F-1-7 |
| The first screen also includes a sample fault that visitors can scan. | 12 | Covered by `playable-first-screen` |
| Bridge Crew is for teachers and youth-group hosts using managed browsers. | 11 | Pass |
| It needs no student accounts, names, chat, cameras, or microphones. | 10 | F-1-9 |
| The game is free. | 4 | Covered by `free-play` |
| The static game connects to its own WebSocket room service. | 10 | F-1-18 |
| Players can use separate school devices without accounts or third-party realtime services. | 12 | F-1-9, F-1-11, F-1-19 |
| Select Create a room on the home page. | 8 | Pass |
| Project the host tab and share its five-character code. | 9 | Pass |
| Open the site on three or more student devices. | 9 | Covered by `cross-device-room` |
| Join the room and assign Helm, Power, Signals, and Engineering. | 10 | Pass |
| Start the run. | 3 | Pass |
| Players call out clues and repair faults together. | 8 | Pass |
| A run succeeds when the 12-minute clock ends with integrity above zero. | 12 | F-1-13 |
| It ends early when missed or incorrect repairs reduce integrity to zero. | 12 | Covered by `complete-run` |
| Assist mode adds response time and removes integrity penalties. | 9 | F-1-14 |
| Each seed creates a repeatable fault sequence. | 7 | F-1-20; behavior covered by `deterministic-seed` |
| Keyboard and touch controls work throughout the game. | 8 | Covered by `keyboard-controls` |
| Arrow keys set Helm, S scans Signals, number keys operate Power or Engineering, and R repairs. | 16 | F-1-15 |
| Sound and assist settings persist locally. | 6 | Covered by `settings-persist` |
| The active loop targets 60 frames per second. | 8 | F-1-4 |
| Room state expires after 20 minutes. | 6 | F-1-1, F-1-3 |
| A station reconnects with a random token stored for that browser tab. | 12 | F-1-21; behavior covered by `room-reconnect` |
| The service limits rapid requests. | 5 | F-1-22; behavior covered by `rate-limit` |
| The sample demo stays on the device and works offline after its first visit. | 14 | Covered by `offline-reload` and F-1-7 |
| Requires Node.js 20 or later. | 6 | Pass |
| In another terminal, start the room service. | 7 | Pass |
| Open http://localhost:5173 or http://localhost:5173/demo. | 9 | Pass |
| npm test runs deterministic core tests and Playwright tests in desktop and 390-pixel mobile layouts. | 15 | Verified |
| The browser package is pinned to Playwright 1.58.2. | 10 | Verified |
| The build writes the static site to dist/. | 8 | Verified |
| Each product claim and its matching test are listed in .factory/claims.json. | 13 | F-1-6 and unlisted-claim findings |
| Demo behavior is documented in .factory/demo.md. | 8 | Verified |
| Publish dist/ to Azure Static Web Apps. | 7 | Pass |
| Deploy Dockerfile.realtime as the product-owned sf-browser-bridge-crew-realtime container app with one replica. | 12 | Pass |
| Rooms are transient and expire after 20 minutes. | 8 | F-1-1, F-1-3, F-1-23 |
| The production frontend connects only to that service. | 8 | F-1-11 |
| Settings and demo data use browser storage. | 7 | F-1-7 |
| Live rooms send game state, station roles, and random reconnect tokens to the product-owned room service. | 16 | F-1-10 |
| There are no names, analytics, third-party scripts, or runtime CDNs. | 10 | F-1-9, F-1-11 |
| See /privacy and /terms in the running site. | 8 | Verified |
| Bridge Crew is available under the MIT License. | 8 | Verified |
| The original scene was generated for this product; its prompt and review are in assets/src/. | 16 | Verified |

README headings “Bridge Crew,” “Who it is for,” “Play,” “Develop,” “Verify,”
“Deploy,” and “Privacy and license” make sense out of context. Its sample-data
link names the result. No README button/action-label defect was found.

## Demo and sandbox evidence

- One click from `/` opened `/demo` at 07:48, 76% integrity, 3 repairs, 342
  points, and a scanned Navigation fault with bearing/module/code clues.
- The banner, Reset, and Start for real controls remained present.
- Disabling Assist created only `demo:bridge:settings`. Reset removed that key
  and restored the original sample. Start for real removed a seeded
  `demo:bridge:review-change` key.
- A pre-existing `bridge:review-sentinel=real-value` survived demo changes,
  reset, and exit unchanged.
- The live demo opened no WebSocket and requested only
  `https://browser-bridge-crew.sociobot.in`.
- A fresh live context installed the service worker, went offline, reloaded
  `/demo`, and displayed “This tab is offline” with the game still usable.

The behavior passes manual review, but its advertised isolation still needs the
listed regression test in F-1-7.

## Claims execution

Every command in `.factory/claims.json` was run verbatim after `npm ci`. All 16
commands exited successfully; logs were retained during review at
`/tmp/bridge-claim-<id>.log`.

| Claim ID | Command result | Review note |
| --- | --- | --- |
| `sample-demo` | PASS | Observable sample loaded |
| `playable-first-screen` | PASS | Control and clue worked at both sizes |
| `complete-run` | PASS | Normal controls reached the loss summary |
| `round-length` | PASS | New room displayed 12:00 |
| `deterministic-seed` | PASS | Exact listed Vitest filter works |
| `replay` | PASS | Run reset to 100% and 0 repairs |
| `settings-persist` | PASS | Assist and sound survived reload |
| `cross-device-room` | PASS | Duplicate tag: F-1-6 |
| `room-reconnect` | PASS | Duplicate tag: F-1-6 |
| `keyboard-controls` | PASS | Keyboard and visible control changed Helm |
| `frame-rate` | PASS | Assertion does not prove 60 fps: F-1-4 |
| `privacy-local` | PASS | Demo requests were same-origin |
| `free-play` | PASS | Free label and no payment link |
| `room-expiry` | PASS | Does not test 20 minutes: F-1-3 |
| `rate-limit` | PASS | 429 and Retry-After asserted |
| `offline-reload` | PASS | Fresh-context offline reload worked |

Successful commands do not cure unlisted claims or assertions that do not
prove their numeric wording.

## Earlier-history reconciliation

There are no earlier `.factory/review-*.md` or `.factory/polish-*.md` files.
Both verification reports and the earlier handoff were checked from scratch.

| Earlier issue | Live confirmation | Code confirmation | Status |
| --- | --- | --- | --- |
| Separate devices could not join | Live room `G57ZX`: isolated mobile context joined Signals, scanned, synchronized Navigation, and restored Signals after reload | WebSocket authority and separate-context browser test present | Fixed |
| `deterministic-seed` command used unsupported `--grep` | Exact current command passed | Uses Vitest `-t` | Fixed |
| Full suite/FPS check was flaky | Full suite passed after repeated isolated claim runs | Serial workers and two-second sample present | Stability fixed; claim validity remains F-1-4 |
| End test used `window.__bridge.finish()` | Live and local test reached loss through visible failed repairs | No `__bridge` hook; test uses seven repair actions | Fixed |
| First capture lacked playable game state | Scan sample fault is visible and works before scrolling at 390 px and desktop | `playable-first-screen` test asserts clue | Fixed |
| Handoff: restart expires active rooms early | Not forced on live because restarting the service is outside review scope | Dockerfile still uses `:memory:` | **Unfixed: F-1-1** |

## Structure, links, accessibility, and identity

- `/`, `/demo`, `/privacy`, and `/terms` return 200, have route-specific
  titles under 60 characters, descriptions under 155 characters, canonical
  URLs, OG/Twitter metadata, the 1200 × 630 product image, SVG favicon, apple
  icon, one h1, one main, and `lang=en`.
- Internal navigation moved focus to the new h1, announced it through a polite
  live region, restored the prior scroll position on Back, and handled deep
  links. Every discovered link and fragment resolved. F-1-5 covers the unknown
  route exception.
- Playwright axe found zero serious or critical findings on `/`, `/demo`,
  `/privacy`, `/terms`, and an unknown route at desktop and mobile sizes.
  `/opt/fleet/lib/verify-url.sh` reported no console errors, one h1, a main,
  `lang=en`, no missing alt text, and no unnamed buttons.
- The cinematic orbital-repair scene, clipped instrument panels, teal/amber/
  coral palette, station controls, and restrained motion are distinct and
  consistent with `.factory/design.md`. The original image and prompt metadata
  are present under `assets/src/`. The product does not look like a generic
  SaaS template.

## Missed leverage

No additional AI feature, import/export, or external sync is implied by this
12-minute room game. The product already has the valuable missing capability:
cross-device room synchronization. Adding AI would be decorative and would add
privacy and network cost without improving the core game.

## Verification summary

- `npm ci`: PASS; 0 vulnerabilities.
- All 16 exact claim commands: PASS, subject to F-1-3, F-1-4, and F-1-6.
- `npm test`: PASS — 8 unit/integration tests and 30 Playwright checks.
- `npm run build`: PASS; `dist/` produced. App JavaScript is 32.21 KB raw /
  10.90 KB gzip; CSS is 21.37 KB raw / 5.49 KB gzip.
- `npm audit --audit-level=high`: PASS; 0 vulnerabilities.
- Live desktop/mobile cold load, demo reset/isolation, offline reload,
  cross-context room sync/reconnect, metadata, link crawl, history/focus,
  console, request-log, and axe checks: completed.

## What would make this perfect

Resolve every finding above: persist live rooms in SQLite at `/data` and prove
restart recovery; make privacy copy literally accurate; list every retained
claim with one valid tagged test; remove or correctly measure the FPS claim;
serve a standards-correct, plain-language 404; and replace the flagged jargon
and slogan copy. Then rerun every claim command, the full suite, build, live
request/offline checks, route crawl, and this complete review from a fresh
context. Nothing less reaches the required zero-finding standard.

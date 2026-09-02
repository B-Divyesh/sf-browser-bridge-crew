# Polish round 1 — review closure

Candidate repaired from `df0dd3dff996eda3a54c0a4482fbfdc4a5902450`.
Live static release: <https://browser-bridge-crew.sociobot.in>. Live room
authority: <https://browser-bridge-crew-realtime.sociobot.in/health>.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Production image uses `DB_PATH=/data/bridge-crew.sqlite`, `WO_DATA_DIR=/data`, one replica, and mounted-file-share-compatible SQLite `nolock` mode. | `keeps a live room through a product-scoped SQLite authority restart`; live room `XFU9K` survived a revision restart. |
| F-1-2 | Privacy h1 now says what browser and room service store. | Live `/privacy`; `@claim:no-personal-data`. |
| F-1-3 | Claim asserts exact 1,200,000 ms default and returned expiry; short lifetime still tests deletion. | `@claim:room-expiry`. |
| F-1-4 | Removed the nonessential FPS marketing claim and its invalid test. | README and claims manifest audit. |
| F-1-5 | Known SPA rewrites replace broad fallback; unknown URLs serve static 404 with status 404 and full skeleton. | Live `GET /definitely-missing-review -> 404`; `/tmp/bridge-live-404.html`. |
| F-1-6 | Each claim tag occurs exactly once. | `rg -o '@claim:…' tests | sort | uniq -c`; 22 manifest IDs. |
| F-1-7 | Added isolated demo namespace/reset/exit claim. | `@claim:demo-isolation`; live `?demo=1` reset and exit check. |
| F-1-8 | Added capacity claim covering four roles, shared stations through eight, synchronized actions, and ninth-player error. | `@claim:player-capacity`. |
| F-1-9 | Added full live-room personal-data/media/form claim. | `@claim:no-personal-data`. |
| F-1-10 | Added SQLite schema/row inventory claim and plain-language storage copy. | `@claim:room-storage`. |
| F-1-11 | Added all-public-routes plus live-room request/script origin claim. | `@claim:no-tracking`. |
| F-1-12 | Added claim that opens and operates all four demo stations. | `@claim:demo-stations`. |
| F-1-13 | Added deterministic exact-12-minute successful-run claim. | `@claim:successful-run`. |
| F-1-14 | Added a test comparing Assist time and incorrect-repair penalty behavior. | `@claim:assist-behavior`. |
| F-1-15 | Expanded keyboard coverage to Arrow, S, number, R, and a mobile-project tap. | `@claim:keyboard-controls`. |
| F-1-16 | Terms now describes supervised classroom, home, or youth-group play. | Live `/terms`. |
| F-1-17 | Renamed landing section “Privacy and room data.” | Live landing screenshot `/tmp/bridge-live-wiKBBz/screenshot-mobile.png`. |
| F-1-18 | Replaced visitor-facing “WebSocket” with “room service.” | README copy audit. |
| F-1-19 | Removed third-party-realtime jargon from audience copy. | README copy audit. |
| F-1-20 | Replaced unexplained “seed” with “same numbered game.” | README copy audit. |
| F-1-21 | Replaced visitor-facing “token” with “random code.” | README copy audit. |
| F-1-22 | Removed the vague rate-limit visitor claim. | README and claims manifest audit. |
| F-1-23 | Replaced “transient” with concrete 20-minute deletion wording. | README, landing, and privacy copy. |

Additional work: the first-screen sample action now opens `/?demo=1`; `/demo`
remains a direct offline route. The catalog sentence is verb-first and 75
characters. `.factory/copy-audit.md` records public wording and terminology.

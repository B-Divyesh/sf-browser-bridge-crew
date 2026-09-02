# Bridge Crew

Run a 12-minute cooperative spaceship repair game for 4–8 players. A host
projects the ship while players operate Helm, Power, Signals, and Engineering.

[Try it with sample data](https://browser-bridge-crew.sociobot.in/demo). The
demo opens a repair already in progress and keeps sample data separate.

## Who it is for

Bridge Crew is for teachers and youth-group hosts using managed browsers. It
needs no student accounts, names, chat, cameras, or microphones. The game is
free.

This static v1 connects tabs in one browser profile through `BroadcastChannel`.
It does not connect separate devices. That deployment limitation is recorded in
[the handoff](.factory/handoff.md).

## Play

1. Select **Create a room** on the home page.
2. Project the host tab and share its five-character code.
3. Open the site in three or more tabs in the same browser profile.
4. Join the room and assign Helm, Power, Signals, and Engineering.
5. Start the run. Players call out clues and repair faults together.

A run succeeds when the 12-minute clock ends with integrity above zero. It ends
early when missed or incorrect repairs reduce integrity to zero. Assist mode
adds response time and removes integrity penalties. Each seed creates a
repeatable fault sequence.

Keyboard and touch controls work throughout the game. Arrow keys set Helm,
`S` scans Signals, number keys operate Power or Engineering, and `R` repairs.
Sound and assist settings persist locally. The active loop targets 60 frames per
second.

Room state expires after 20 minutes. No game action leaves the browser. The demo
works offline after its first visit.

## Develop

Requires Node.js 20 or later.

```sh
npm ci
npm run dev
```

Open `http://localhost:5173` or `http://localhost:5173/demo`.

## Verify

```sh
npm test
npm run build
```

`npm test` runs deterministic core tests and Playwright tests in desktop and
390-pixel mobile layouts. The browser package is pinned to Playwright 1.58.2.
The build writes the static site to `dist/`.

Each product claim and its matching test are listed in
[`.factory/claims.json`](.factory/claims.json). Demo behavior is documented in
[`.factory/demo.md`](.factory/demo.md).

## Deploy

Publish the contents of `dist/` to Azure Static Web Apps. Keep
`staticwebapp.config.json` at the output root so routing and security headers
apply.

## Privacy and license

Room data and settings use browser storage. There are no analytics, third-party
scripts, or runtime CDNs. See `/privacy` and `/terms` in the running site.

Bridge Crew is available under the [MIT License](LICENSE). The original scene
was generated for this product; its prompt and review are in `assets/src/`.

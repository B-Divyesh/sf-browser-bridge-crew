# Bridge Crew

Run a 12-minute cooperative spaceship repair game for 4–8 players. A host
projects the ship while players operate Helm, Power, Signals, and Engineering.

[Try it with sample data](https://browser-bridge-crew.sociobot.in/?demo=1). The
demo opens a repair already in progress and keeps sample data separate.
The first screen also includes a sample fault that visitors can scan.

## Who it is for

Bridge Crew is for teachers and youth-group hosts using managed browsers. It
needs no student accounts, names, chat, cameras, or microphones. The game is
free.

Each browser connects through Bridge Crew’s room service. Players can join from
separate school devices without creating accounts.

## Play

1. Select **Create a room** on the home page.
2. Project the host tab and share its five-character code.
3. Open the site on three or more student devices.
4. Join the room and assign Helm, Power, Signals, and Engineering.
5. Start the run. Players call out clues and repair faults together.

A run succeeds when the 12-minute clock ends with integrity above zero. It ends
early when missed or incorrect repairs reduce integrity to zero. Assist mode
adds response time and removes integrity penalties. Replaying the same numbered
game repeats its faults.

Keyboard and touch controls work throughout the game. Arrow keys set Helm,
`S` scans Signals, number keys operate Power or Engineering, and `R` repairs.
Sound and assist settings persist locally.

Rooms are deleted 20 minutes after their last update. Each tab stores a random
code so its station reconnects after a reload.
The sample demo stays on the device and works offline after its first visit.

## Develop

Requires Node.js 20 or later.

```sh
npm ci
npm run dev
```

In another terminal, start the room service:

```sh
PORT=8787 DB_PATH=/tmp/bridge-crew.sqlite npm run realtime
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

Publish `dist/` to Azure Static Web Apps. Deploy `Dockerfile.realtime` as the
product-owned `sf-browser-bridge-crew-realtime` container app with one replica.
Rooms are deleted 20 minutes after their last update. The production frontend
connects only to that service.

## Privacy and license

Settings and demo data use browser storage. Live rooms send game progress,
station choices, and random reconnect codes to the product-owned room service.
There are no names, analytics, third-party scripts, or files loaded from another company. See `/privacy` and
`/terms` in the running site.

Bridge Crew is available under the [MIT License](LICENSE). The original scene
was generated for this product; its prompt and review are in `assets/src/`.

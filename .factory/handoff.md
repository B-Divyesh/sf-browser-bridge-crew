# Bridge Crew polish-1 handoff

## Result

All F-1-1 through F-1-23 from `.factory/review-1.md` are repaired. The code
release is `e572ad67977e8074e0db2ab447da40e610dc0611`; the final documentation
commit follows this handoff. It is deployed to:

- <https://browser-bridge-crew.sociobot.in>
- <https://browser-bridge-crew-realtime.sociobot.in/health>

The realtime authority is product-owned
`sf-browser-bridge-crew-realtime`, revision 9, with one replica and its
SQLite database at `/data/bridge-crew.sqlite`. `WO_DATA_DIR=/data` provisioned
the product-scoped durable share `sf-browser-bridge-crew-r-7d9afe`. Azure
Files does not support SQLite’s normal SMB byte-range locks; because the
authority is strictly one writer, the mounted database opens with SQLite’s
`nolock=1` URI option. It remains a real SQLite file on `/data`.

## Verification

From fresh clone `/tmp/bridge-crew-clean-e572ad6`:

```sh
npm ci
npm run test:unit
npm run build
npm run test:unit -- -t @claim:successful-run
npm run test:unit -- -t @claim:deterministic-seed
npm run test:unit -- -t @claim:assist-behavior
npm run test:unit -- -t @claim:player-capacity
npm run test:unit -- -t @claim:room-storage
npm run test:unit -- -t @claim:room-expiry
```

All passed. The 22 claim IDs have exactly one source tag each. Browser claim
commands for the sample, first-screen control, demo isolation, and all demo
stations passed from the earlier fresh clone; local Playwright also passed the
new personal-data and no-tracking claims in Chromium. Full unit/integration
coverage is 13 tests; browser coverage is 36 desktop/mobile checks.

Other checks passed:

- `npm run build` creates `dist/`; app JS is 10.92 KB gzip and CSS 5.49 KB gzip.
- `verify-url.sh` cold-loaded the live landing with no console errors, one
  h1, lang, main, image alt text, or unnamed-button failures. Evidence:
  `/tmp/bridge-live-wiKBBz/verify.json` and desktop/mobile screenshots.
- Live Playwright axe scan at 390 px on `/?demo=1`: zero serious/critical
  violations.
- Live demo banner/reset/Start for real, `/privacy` and `/terms` route titles,
  and real 404 response all passed. `GET /definitely-missing-review` returned
  404 with the styled `Page not found` document.
- Live persistence: created room `XFU9K`, restarted revision 9, then fetched
  the same room with intact state before expiry.

## Running locally

```sh
npm ci
PORT=8787 DB_PATH=/tmp/bridge-crew.sqlite npm run realtime
npm run dev
npm test
npm run build
```

Use `/?demo=1` for the isolated sample. `/demo` remains useful for the offline
test route. See `.factory/demo.md`, `.factory/claims.json`, and
`.factory/polish-1.md` for the sandbox and finding-by-finding evidence.

## Known gaps

None.

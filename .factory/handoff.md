# Bridge Crew verification 6 handoff — FAIL

## Result

Independent cross-browser verification found **1 Minor finding and 0 untested
claims**. The result is **FAIL** because a PASS requires zero findings.

The reviewed implementation is `496681bdfef9154b30e6c7210d74492c372b9874`.
The documentation SHA is `10acc2efe2f80f69520e9e8271c2f90f6d9963cd`; its
diff from the implementation contains only `.factory` reports. Rebuilt static
assets match live assets byte for byte. The live realtime authority reports
`e572ad67977e8074e0db2ab447da40e610dc0611`; its backend source is unchanged
in the reviewed implementation.

## Finding to repair

**V6-1, Minor — initial app render focuses the h1 before the user acts.** The
first Tab on a fresh live route reaches **Try it with sample data**, not the
required **Skip to main content** link. The skip link is present but needs
reverse-Tab to reach it. `renderRoute()` calls `h1.focus()` even on first load.

Repair by preserving initial browser focus. Move focus to a route heading only
after an in-app route change or history navigation. Add a test: initial Tab
must focus `a[href="#main"]`, and Enter must focus `#main`.

## What was verified

- Installed Playwright 1.58.2 Chromium 145.0.7632.6, Firefox 146.0.1, WebKit
  26.0, and the documented Linux browser dependencies.
- Fresh desktop and phone-sized live runs in all three engines showed the job,
  audience, and sample action before scroll. Each entered the labelled sample,
  used keyboard/touch input, reset, reached the actual loss end screen,
  replayed, and reloaded saved sound settings.
- Chromium and Firefox showed no Web Audio start before input and sound after
  a successful visible repair. WebKit completed that repair without a console
  error. Playwright WebKit screenshot style injection is incompatible with the
  strict CSP; no-screenshot loads and play had no product error.
- Each engine used two independent real live clients. A crew Signals scan
  synchronized to the host and reloaded to the same role.
- All 23 declared claim commands, `npm test`, `npm run build`, and high-level
  audit passed. The phone performance claim measured 60.0 fps and 60.0 fixed
  updates/s.
- Live Axe, the URL verifier, route/link checks, invalid room paths, reduced
  motion, 200% text, privacy traffic, live health/invalid/origin behavior,
  and 429 with `Retry-After: 60` passed.

## How to verify

```sh
npm ci
npm test
npm run build
```

Run every exact command in `.factory/claims.json`. For the outstanding issue,
open the live home page in a fresh browser and press Tab once before clicking:
focus currently goes to the sample action instead of the skip link.

## Evidence and next step

Full report: `.factory/verification-6.md`.

Evidence: `/work/.evidence/browser-bridge-crew-verify-6/`.

No product code, deployment, infrastructure, database, or secret was changed.
Fix V6-1 and repeat the focused keyboard check plus the normal quality gates.

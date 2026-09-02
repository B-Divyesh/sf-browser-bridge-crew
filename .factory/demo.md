# Demo sandbox

## Entry point

Open `/?demo=1` or `https://browser-bridge-crew.sociobot.in/?demo=1`.
`/demo` remains a stable direct route for offline verification.

The first demo screen is an active repair with this sample state:

- room code `Q7K4P`;
- seed `57231`;
- 7:48 left in a 12-minute run;
- 76% integrity, three repairs, and 342 points;
- a scanned navigation fault with a deterministic bearing and code.

The station tabs expose Helm, Power, Signals, and Engineering. A verifier can
complete the displayed clues, repair the fault, disable Assist, and reach the
loss screen through seven incorrect repair attempts. Replay starts the same
seed from its normal initial state. There are no private finish controls.

## Isolation and reset

Demo settings use local-storage keys prefixed with `demo:bridge:`. The demo does
not read or write real room keys, which start with `bridge:`. **Reset demo**
removes every `demo:` key and restores the sample. **Start for real** removes
the demo keys before returning home.

The demo never opens the realtime connection. The service worker caches the
demo shell, so it reloads offline after one online visit. The offline claim
test uses a fresh browser context.

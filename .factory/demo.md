# Demo sandbox

## Entry point

Open `/demo` or `https://browser-bridge-crew.sociobot.in/demo`.

The first demo screen is an active repair with this sample state:

- room code `Q7K4P`;
- seed `57231`;
- 7:48 left in a 12-minute run;
- 76% integrity, three repairs, and 342 points;
- a scanned navigation fault with a deterministic bearing and code.

The station tabs expose Helm, Power, Signals, and Engineering. A verifier can
complete the displayed clues, repair the fault, force the deterministic end in
the browser test hook, and replay the same seed.

## Isolation and reset

Demo settings use local-storage keys prefixed with `demo:bridge:`. The demo does
not read or write real room keys, which start with `bridge:`. **Reset demo**
removes every `demo:` key and restores the sample. **Start for real** removes
the demo keys before returning home.

The service worker caches the demo shell. After one online visit, the demo can
reload offline. The offline claim test uses a fresh browser context.

# Bridge Crew visual and game design

## Direction

Bridge Crew uses **cinematic environmental art**. The interface feels like a
school science lab temporarily converted into a starship bridge: practical,
readable controls sit over a wide observation window, with a damaged vessel
outside. This world fits the cooperative task because every panel looks like a
different working station in one shared room. It avoids military imagery,
weapons, branded science-fiction references, and generic neon-dashboard chrome.

The landing page is asymmetrical. A large view of the ship occupies the upper
right while the host controls sit on a dark, opaque plate at left. Product UI
appears immediately below and reuses the same instrument language.

## Palette

The scene supplies the tokens. All text combinations meet WCAG AA.

| Token | Value | Use |
| --- | --- | --- |
| Void | `#07131a` | Page background |
| Hull | `#10252d` | Raised surfaces |
| Glass | `#173641` | Secondary surfaces |
| Chalk | `#f4f1df` | Primary text |
| Mist | `#b8c8c5` | Secondary text |
| Beacon | `#ffd166` | Primary actions and focus |
| Ink | `#111b1e` | Text on Beacon |
| Signal | `#62d6bd` | Success and repaired state |
| Flare | `#ff7b68` | Damage and urgent state |

The product is intentionally single-mode. A dark bridge keeps the projected
status legible in classrooms and belongs to the cinematic direction.

## Type and spacing

Headlines use the self-hosted **Space Grotesk** subset (SIL OFL). Body and
controls use the system sans stack to keep first load small. Numbers use
tabular figures. The scale is 16, 18, 24, 38, and 64 px. Line length stays
below 70 characters.

Spacing follows an 8 px base: 8, 16, 24, 32, 48, 64, and 96. Instrument
corners are clipped with `clip-path` or a 4 px radius; controls are at least
44 px tall. Fine one-pixel rules resemble engraved panel seams.

## Interaction grammar

- Beacon yellow marks the next action. Signal green marks completed work.
- Station tabs change which complementary panel is visible in demo mode.
- Real rooms use one host screen and crew stations on separate browsers.
- Connection status reports connecting, connected, reconnecting, or closed.
- Keyboard actions mirror every pointer action. Arrow keys adjust instruments;
  number keys select station controls; Space performs the named action.
- Fault cards enter from the ship window edge. Repair feedback moves toward
  the ship diagram, giving the state change a physical origin.

## Motion policy

Stars drift at 12 px per minute and repaired modules settle for 220 ms. Damage
uses one short camera nudge, never a repeating shake. Nothing flashes. With
`prefers-reduced-motion: reduce`, drift, nudges, transitions, and smooth scroll
are removed; state changes remain visible through labels, color, and borders.

## Game loop and difficulty

A run lasts 12 minutes and supports 4–8 roles across four stations: Helm,
Power, Signals, and Engineering. Players can share a station when more than
four join. A deterministic seed chooses fault order and repair codes.

Every fault creates a three-part dependency: Signals reveals the bearing and
repair symbol; Helm aligns the ship; Power routes power; Engineering enters
the repair. Correct work repairs integrity and adds score. Wrong work costs
integrity. A run ends early at zero integrity or succeeds when the timer ends.

The first two minutes use one fault at a time. Minutes 3–8 shorten the response
window and alternate modules. Minutes 9–12 can overlap two faults. Assist mode
adds response time and removes penalties. The end screen shows outcome, score,
repairs, accuracy, seed, and a one-action replay.

## Asset plan and provenance

The hero is one original 3:2 environmental painting. It is cropped into a
responsive WebP and an Open Graph image. CSS and authored SVG provide panel
marks and icons so controls remain crisp.

Prompt sheet:

- Subject: one compact civilian research ship being repaired outside a window.
- World: a classroom-friendly orbital repair dock, distant blue planet, no people.
- Materials: weathered ceramic hull, brushed brass struts, thick observation glass.
- Light: low teal ambient light with warm amber work lamps.
- Lens: cinematic wide lens, ship in the right two-thirds, quiet negative space left.
- Palette words: midnight teal, chalk white, oxidized green, amber, coral warning.
- Negative list: no text, watermark, logo, weapons, uniforms, people, recognizable
  franchise shapes, dense UI, illegible markings, stars shaped like symbols.

Generation command: `/opt/fleet/lib/gen-image.sh`, deployment `factory-image`,
generated 2026-09-02. Generated assets are original to this product. Source
prompts live beside the source image in `assets/src/`.

## Responsive decisions

At 390 px the scene becomes a 190 px window behind no text. The action plate
stacks below it. Station controls become one column and the bridge schematic
reduces decorative labels, never control labels. Projector layouts keep the
ship overview and active fault side by side.

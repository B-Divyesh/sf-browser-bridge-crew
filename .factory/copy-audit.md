# Copy audit — repair 1

## Landing page

| Sentence | Words | Claim coverage |
| --- | ---: | --- |
| For teachers and group hosts sharing one display while players control four station panels. | 14 | Audience description |
| Opens a repair already in progress. | 6 | `sample-demo` |
| Free to play | 3 | `free-play` |
| No accounts or chat | 4 | `no-personal-data` |
| Keyboard and touch controls | 4 | `keyboard-controls` |
| Project the host screen. Players join from their own browsers with the room code. | 12 | `cross-device-room` |
| Scan this sample fault. The full demo includes every station. | 11 | `playable-first-screen`, `demo-stations` |
| Signals must scan the fault before the repair starts. | 9 | Gameplay instruction |
| Project the bridge and read the five-character room code aloud. | 10 | Gameplay instruction |
| Assign Helm, Power, Signals, and Engineering. Extra players share controls. | 11 | `player-capacity` |
| Call out each clue, align the ship, route power, and enter the repair code. | 14 | Gameplay instruction |
| No names, chat, cameras, or recordings. | 6 | `no-personal-data` |
| The room service stores game progress, station choices, and random codes used to reconnect. | 14 | `room-storage` |
| Rooms are deleted 20 minutes after their last update. The game includes no analytics. | 15 | `room-expiry`, `no-tracking` |

All landing sentences are 22 words or fewer. No banned plain-words term appears.

## Terminology

| Concept | One term used |
| --- | --- |
| The multiplayer authority | room service |
| A multiplayer session | room |
| A player’s assigned control area | station |
| The persistent recovery value | random reconnect code |
| The prefilled sandbox | demo |
| Deterministic run identifier | numbered game |

## README and legal revisions

The README now says “room service,” “files loaded from another company,” and
“random code” in visitor-facing text. It removes the FPS and rate-limit
marketing statements. Privacy says live rooms send data to the room service;
only the demo is local-only. Terms describe supervised play rather than making
a broad safety guarantee. All sentences in public user-facing prose are 22
words or fewer.

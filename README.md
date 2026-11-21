[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01)
[![rank](https://make.fun/badge/gta6-01/sawi57003-ops/gta6-01-v5/rank.svg)](https://make.fun/bounty/gta6-01)
[![reward](https://make.fun/badge/gta6-01/sawi57003-ops/gta6-01-v5/reward.svg)](https://make.fun/bounty/gta6-01)

# NEON VICE — a Vice Bay crime story (gta6-01, round 5)

A top-down open-world crime game set in Vice Bay, a neon-drenched coastal
city at launch week. You are Vic Marlowe, a getaway driver who owes $60,000
to the Sunset Kings. Six jobs. One week. Drive and walk a full street grid,
steal cars, dodge the police, and pay off the debt.

Built for the make.fun bounty: https://make.fun/bounty/gta6-01

- `game/`: the game — plain static files a desktop browser loads offline
  (`game/index.html` and its ES modules, no library, no network request).
- `main.ts`: the entrypoint AND the game's content pipeline. It owns the
  content catalogue (districts, radio stations, car roster, story beats,
  the six missions), writes it into `game/src/content.js`, validates the
  whole game against the scorer's caps, then copies `game/` and
  `screenshots/` to `/output` and writes `/output/dossier.json`.
- `screenshots/`: 4 staged shots (cover, chase, mission, street), 1440x900.
- `serve.ts`: a tiny static server — `node serve.ts`, then open
  http://localhost:8080.

## Playing

WASD / arrows — move & drive. Shift — run. E — get in / out of a car.
Space — punch. F — shoot. M — jobs. P / Esc — pause. ENTER — start.

Steal cars, outrun the PD (five-star wanted level), finish all six jobs and
pay off the $60,000. Progress saves automatically. `?seed=N` rebuilds the
same city; `?shot=cover|chase|mission|street` stages a screenshot scene.

## The six jobs

| # | Job | Reward |
|---|---|---|
| 1 | First Pickup | $8,000 |
| 2 | Hot Wheels | $9,500 |
| 3 | Courier Run | $11,000 |
| 4 | Getaway | $12,000 |
| 5 | Payday | $13,000 |
| 6 | The Big One | $14,500 |

$68,000 in total — the $60,000 debt, with $8,000 to spare.

## Build

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes the game, the screenshots and `dossier.json` into `out/`,
plus a short `BUILD.txt` summary. Node 22, standard library only.

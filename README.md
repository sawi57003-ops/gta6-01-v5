[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/sawi57003-ops/gta6-01-v5/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/sawi57003-ops/gta6-01-v5/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

# NEON VICE — a Vice Bay crime story (gta6-01, round 5)

A top-down open-world crime game set in Vice Bay, a neon-drenched coastal
city at launch week. You are Vic Marlowe, a getaway driver who owes $60,000
to the Sunset Kings. Six jobs. One week. Drive and walk a full street grid,
steal cars, dodge the police, and pay off the debt.

Built for the make.fun bounty: https://make.fun/bounty/gta6-01

- `game/`: the game — plain static files a desktop browser loads offline
  (`game/index.html` and its ES modules, no library, no network request).
- `main.ts`: the entrypoint AND the game's content pipeline. It owns the
  content catalogue (districts, radio stations, car roster, story beats),
  writes it into `game/src/content.js`, validates the whole game against the
  scorer's caps, then copies `game/` and `screenshots/` to `/output` and
  writes `/output/dossier.json`.
- `screenshots/`: 4 staged shots (cover, chase, mission, street), 1440x900.
- `serve.ts`: a tiny static server — `node serve.ts`, then open
  http://localhost:8080.

## Playing

WASD / arrows — move & drive. Shift — run. E — get in / out of a car.
Space — punch. F — shoot. M — jobs. P / Esc — pause. ENTER — start.

Steal cars, outrun the PD (five-star wanted level), finish all six jobs and
pay off the $60,000. Progress saves automatically. `?seed=N` rebuilds the
same city; `?shot=cover|chase|mission|street` stages a screenshot scene.

## Build

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

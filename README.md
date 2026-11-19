# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![GTA 6 Trophy Guide](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/beduldudul/gta6-trophy-guide-01-entry/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/beduldudul/gta6-trophy-guide-01-entry/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline web app that guides and tracks all **55 PlayStation 5 trophies** of Grand Theft Auto VI: 1 Platinum, 2 Gold, 6 Silver, 46 Bronze, 28 of them hidden, 0 online, 1 missable. Built for the [make.fun GTA 6 trophy guide bounty](https://make.fun/c/gta6-trophy-guide-01).

## What it does

- **Every trophy, official and complete** — each with its official name, description and grade as PlayStation publishes them, in `app/data/trophies.json`.
- **A guide in our own words for each trophy** — what to do, where, and when it can be missed — with its sources named beside it (Exophase, PSNProfiles, Output Lag, Press-Start, KeenGamer). Where a hidden trophy's method is not yet confirmed in play, the guide says so plainly instead of guessing.
- **A tracker** — check trophies off; progress saves in the browser (localStorage) and survives reloads. Export it as JSON and import it back.
- **Filters by kind** — story, missable, collectibles, activities, online (empty on purpose: all 55 are single-player) — plus search and a hide-earned toggle.
- **Spoiler setting** — hides the names and descriptions of hidden story trophies until they are earned.
- **Roadmap to the platinum** — seven stages built from the official descriptions, with the save discipline the list demands (no mission replay, no New Game Plus).
- **Missable trophies flagged** — Positive Mental Attitude is the one reported missable, with the Chapter 1 balcony meditation spelled out.

## Run it offline

Serve the `app/` folder with any static server and open `index.html`:

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080. It works with the network off and makes no network request: every file it loads is one of its own.

## Layout

- `app/index.html`, `app/app.js`, `app/style.css` — the guide and tracker (static files, no build step).
- `app/data/trophies.json` — the 55 trophies with official names, descriptions, grades, kinds, missable flags, targets, guides and sources.
- `screenshots/` — four real renders of the app in a browser.
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts`.
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged.

## Check it locally

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.

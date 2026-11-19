# Vice Nights — GTA 6-Style Cover Art Maker

[![Bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/thanhvu261090/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/thanhvu261090/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Turn your own photo into a multi-panel GTA 6-style poster: bold caption lettering,
a Vice City sunset or neon colour grade, a skyline silhouette and halftone dots —
exported as a PNG to share. Fully offline: every file lives under `app/`, your photos
never leave your machine, and there is no build step.

## How it works

1. **Load photos** — up to three, from your machine (or try the bundled samples).
   Each photo has zoom and pan sliders to crop and position it inside its panel.
2. **Pick a layout and grade** — Hero + two below, Big panel + two stacked, or
   Three strips; Vice Sunset, Neon Nights, or Midnight Drive.
3. **Write the caption** — main caption plus a sub-caption strip, top or bottom.
4. **Export** — one click gives a PNG in 1080 × 1080, 1080 × 1350, or 1920 × 1080.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## What's inside

- `app/index.html` — the editor page
- `app/style.css` — the dark neon editor chrome
- `app/src/cover.js` — the poster renderer (panels, grade, skyline, caption)
- `app/src/main.js` — editor wiring and PNG export
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=editor` / `?shot=cover`)
- `app/fonts/Anton-Regular.ttf` — Anton, under the SIL Open Font License (`OFL.txt`)
- `app/samples/` — two image-model-made sample photos, free to use
- `main.ts` — the make.fun entrypoint: copies `app/` + `screenshots/` to `/output`
  and writes `dossier.json`

All artwork and lettering are original. No Rockstar Games logo, wordmark, official
artwork, character, or font is used anywhere in this app.

## License

MIT — see `LICENSE` (`SPDX-License-Identifier: MIT`).

# My World / My Story Website MVP

Static front-end prototype for a game-like personal story website.

The MVP focuses on one shared front-end experience with two states:

- `浏览模式`: visitors and owner both explore the same world view
- `编辑模式`: the owner enters a PIN to generate the avatar and manage cards in-place

## Core Experience

- Immersive home lobby with a central AI cartoon avatar and 6 fixed planet levels
- Fixed level structure and fixed theme taxonomy for each level
- Level archive view for browsing published story cards
- Card detail modal for reading each story in full
- Owner-only PIN flow for:
  - generating 3 avatar candidates and choosing 1
  - adding cards
  - editing cards
  - deleting cards
- `localStorage` persistence, with `save = auto publish`

## Files

- `index.html`: single-page structure for home, level archive, and modal overlays
- `styles.css`: fairy-tale cosmos visual system, responsive layout, and motion
- `script.js`: local state, planet navigation, avatar generation mock, and card CRUD

## Run Locally

Start the full local dev environment with:

```bash
./dev
```

This command prefers the Node runtime bundled in `.tools/` and falls back to your system `npm` if available.

After startup:

- Frontend: `http://localhost:5173/`
- Backend: `http://127.0.0.1:3001/`

## Demo Notes

- Demo owner PIN: `2468`
- This version is pure front-end only
- No backend, auth system, or real AI image service is included
- Avatar generation is simulated with front-end SVG candidates
- Content is stored in browser `localStorage`

## MVP Boundaries

- 6 levels are fixed
- level order is fixed
- themes are fixed per level
- one card supports one primary media type only: image, audio, video, or map
- no draft / publish workflow
- no comments, likes, or visitor accounts

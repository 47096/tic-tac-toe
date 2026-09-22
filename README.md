# 過三關 — Tic Tac Toe

A polished, mobile-first tic-tac-toe game with local and online multiplayer.

**[▶ Play now](https://47096.github.io/tic-tac-toe/)**

## Features

- **Local mode** — two players on the same device
- **Computer mode** — play against AI with Easy, Medium (blocks/takes wins), or Hard (minimax) difficulty
- **Online mode** — real-time multiplayer via Firebase Realtime Database (anonymous auth, transactional moves)
- **Offline-first** — loads instantly, Local and Computer modes work with no internet; Firebase loads only when entering Online mode
- **Invite links** — share a URL to invite someone to your game
- **Emoji avatars** — 5 categories (Faces, Animals, Cars, Nature, Photo) or upload your own (shared with your opponent; deleted with the room)
- **Dark mode** — warm paper palette in light, matching ink tones at night (system preference or toggle)
- **Win effects** — purple glow on winning cells, near-win glow on threatening cells, confetti
- **Win streak** — tracks consecutive wins against the computer (persisted in localStorage)
- **PWA** — install to home screen, play offline in local/computer mode
- **Session recovery** — refresh mid-game without losing your spot (online mode)
- **Room cleanup** — Firebase rooms auto-delete when both players disconnect

## Accessibility

- **Keyboard accessible** — arrow keys navigate the 3×3 board and emoji grid
- **Screen reader support** — ARIA labels, live announcements for turns and results
- **Focus management** — focus moves between screens, traps in result dialog
- **Reduced motion** — respects `prefers-reduced-motion`, disables confetti and animations
- **Touch targets** — all interactive elements meet 44×44px minimum
- **Safe areas** — respects `safe-area-inset` for notched devices

## How to play

### Local
1. Choose **Local** mode from the title screen
2. Pick avatars for Player 1 and Player 2
3. Take turns tapping cells
4. Tap **Play Again** to start the next round

### Computer
1. Choose **Computer** mode from the title screen
2. Pick your avatar and AI difficulty (Easy / Medium / Hard)
3. Play against the AI

### Online
1. Choose **Online** mode from the title screen
2. Pick your avatar
3. Tap **Create Room** and share the invite link
4. Friend opens the link, picks their avatar, and taps **Join Room**

## Tech stack

- Vanilla JavaScript (no frameworks, no runtime dependencies)
- Split assets: `index.html` + `css/game.css` + `js/game-logic.js` + `js/game.js`
- Firebase Realtime Database + Anonymous Auth (lazy-loaded, online only)
- CSS custom properties (paper theme, light/dark)
- Canvas API (win line, confetti)
- Web Share / clipboard (invite links)

## Online safety

- Writes require anonymous auth and match a seat `uid` in that room
- Moves commit via `transaction` (empty cell, your turn, game not over)
- Room codes use `crypto.getRandomValues` (8 chars, no `0`/`1`/`I`/`O`)
- Avatar photos are small `data:image/…` JPEGs only (see `firebase-rules.md`)

## Tests

```bash
node --test test/game-logic.test.mjs
```

Covers win/draw detection, board/score serialization, room codes, and AI (easy/medium/hard).

## Customisation

| What | Where | Default |
|------|-------|---------|
| Accent colour | `--accent` in `:root` CSS | Violet `#a29bfe` |
| Primary accent | `--accent-primary` in `:root` CSS | Purple `#7c6fde` |
| Paper background | `--bg` in `:root` CSS | `#f7f4ef` |
| Emoji categories | `EMOJI_CATS` in `js/game.js` | Faces, Animals, Cars, Nature |
| Photo limits | upload handler | 10 MB file → ~12KB compressed JPEG |
| AI difficulty | `aiDifficulty` in `js/game.js` | medium |
| Format | `.prettierrc` | single quotes, width 100 |

## Browser support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Safari | 15+ |
| Firefox | 90+ |
| Edge | 90+ |
| Mobile Safari | iOS 15+ |
| Chrome Android | 90+ |

## Project structure

```
index.html          # Markup + boot scripts
css/game.css        # All styles
js/game-logic.js    # Pure rules/AI/board helpers (tested)
js/game.js          # UI, Firebase, online multiplayer
test/               # node --test for game-logic
.prettierrc         # Formatter config
manifest.json       # PWA manifest
sw.js               # Service worker (network-first HTML, no CDN cache)
icon-192.png        # PWA icon (192×192, purpose any)
icon-512.png        # PWA icon (512×512, purpose any)
icon-192-maskable.png   # Maskable icon (192×192)
icon-512-maskable.png   # Maskable icon (512×512)
firebase-rules.md   # Firebase Realtime Database security rules
.gitignore          # Git ignore rules
README.md           # This file
```

## License

[MIT](LICENSE)

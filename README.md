# 過三關 — Tic Tac Toe

A polished, mobile-first tic-tac-toe game with local and online multiplayer.

**[▶ Play now](https://wsamuelw.github.io/tic-tac-toe/)**

## Features

- **Local mode** — two players on the same device, auto-rematch with countdown
- **Computer mode** — play against AI with Easy, Medium (blocks/takes wins), or Hard (minimax) difficulty
- **Online mode** — real-time multiplayer via Firebase Realtime Database
- **Invite links** — share a URL to invite someone to your game
- **Emoji avatars** — 5 categories (Faces, Animals, Cars, Nature, Photo) or upload your own
- **Dark mode** — automatic (system preference) or manual toggle
- **Win effects** — purple glow on winning cells + confetti
- **PWA** — install to home screen, play offline in local/computer mode
- **Session recovery** — refresh mid-game without losing your spot
- **Keyboard accessible** — arrow keys navigate the 3×3 board
- **Accessible** — ARIA labels, focus traps, reduced motion support

## How to play

### Local
1. Choose **Local** mode from the title screen
2. Pick avatars for Player 1 and Player 2
3. Take turns tapping cells
4. Game auto-starts next round after 8 seconds

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

- Single HTML file (~1,600 lines)
- Vanilla JavaScript (no frameworks, no dependencies)
- Firebase Realtime Database (online multiplayer)
- CSS custom properties (theming)
- Canvas API (win line animation, confetti)

## Customisation

| What | Where | Default |
|------|-------|---------|
| Accent colour | `--accent` and `--accent-bg` in `:root` CSS | Violet `#a29bfe` |
| Emoji categories | `EMOJI_CATS` array in JavaScript | Faces, Animals, Cars, Nature |
| Photo upload | `MAX_PHOTO_BYTES` in JavaScript | 50 KB |
| Auto-rematch timer | `countdownSeconds` in `endGame()` | 8 seconds |

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
index.html          # The entire game (HTML + CSS + JS)
manifest.json       # PWA manifest
sw.js               # Service worker (cache-first for offline play)
icon-192.png        # PWA icon (192×192)
icon-512.png        # PWA icon (512×512)
README.md           # This file
```

## License

[MIT](LICENSE)

# 過三關 — Tic Tac Toe

A polished, mobile-first tic-tac-toe game with local and online multiplayer.

**[▶ Play now](https://wsamuelw.github.io/tic-tac-toe/)**

## Features

- **Local mode** — two players on the same device, auto-rematch with countdown
- **Computer mode** — play against AI with Easy, Medium (blocks/takes wins), or Hard (minimax) difficulty
- **Online mode** — real-time multiplayer via Firebase Realtime Database
- **Invite links** — share a URL to invite someone to your game
- **Emoji avatars** — 5 categories (Faces, Animals, Cars, Nature, Photo) or upload your own
- **Dark mode** — automatic (system preference) or manual toggle with smooth transition
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
- CSS custom properties (theming with `--accent` and `--accent-primary`)
- Canvas API (win line animation, confetti)
- Web Share API (mobile sharing)

## Customisation

| What | Where | Default |
|------|-------|---------|
| Accent colour | `--accent` in `:root` CSS | Violet `#a29bfe` |
| Primary accent | `--accent-primary` in `:root` CSS | Purple `#7c6fde` |
| Emoji categories | `EMOJI_CATS` array in JavaScript | Faces, Animals, Cars, Nature |
| Photo upload limit | file size check in upload handler | 10 MB |
| AI difficulty | `aiDifficulty` variable | medium |

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

# 過三關 — Tic Tac Toe

A polished, mobile-first tic-tac-toe game with local and online multiplayer.

**[▶ Play now](https://wsamuelw.github.io/tic-tac-toe/)**

## Features

- **Local mode** — two players on the same device, auto-rematch with countdown
- **Online mode** — real-time multiplayer via Firebase Realtime Database
- **Invite links** — share a URL to invite someone to your game
- **Emoji avatars** — pick from 25 emojis or take a photo with your camera
- **Dark mode** — automatic (system preference) or manual toggle
- **Confetti + hand-drawn win line** — celebration effects on win
- **Session recovery** — refresh mid-game without losing your spot
- **Keyboard accessible** — arrow keys navigate the 3×3 board
- **Accessible** — ARIA labels, focus traps, reduced motion support

## How to play

### Local
1. Pick avatars for Player 1 and Player 2
2. Tap **Play Local**
3. Take turns tapping cells
4. Game auto-starts next round after 8 seconds

### Online
1. Pick your avatar
2. Tap **Play Online** → **Create Room**
3. Share the invite link with your friend
4. They open the link, pick their avatar, and tap **Join Room**

## Tech stack

- Single HTML file (~1,400 lines)
- Vanilla JavaScript (no frameworks, no dependencies)
- Firebase Realtime Database (online multiplayer)
- CSS custom properties (theming)
- Canvas API (win line animation, confetti)

## Customisation

| What | Where | Default |
|------|-------|---------|
| Accent colour | `--accent` and `--accent-bg` in `:root` CSS | Violet `#a29bfe` |
| Available emojis | `EMOJIS` array in JavaScript | 25 emojis |
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
README.md           # This file
```

## License

[MIT](LICENSE)

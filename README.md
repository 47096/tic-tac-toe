# 過三關 — Tic Tac Toe

A polished, mobile-first tic-tac-toe game with local and online multiplayer.

**[Play now](https://wsamuelw.github.io/tic-tac-toe/)**

## Features

- **Local mode** — two players on the same device, auto-rematch with 8-second countdown
- **Online mode** — real-time multiplayer via Firebase Realtime Database
- **Invite links** — share a URL to invite someone to your game
- **Emoji avatars** — pick from 25 emojis or take a photo with your camera
- **Dark mode** — automatic (system preference) or manual toggle
- **Confetti** — celebration effect on win
- **Hand-drawn win line** — organic, wobbly line like scribbling on paper
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
- Vanilla JavaScript (no frameworks)
- Firebase Realtime Database (online multiplayer)
- CSS custom properties (theming)
- Canvas API (win line animation, confetti)

## Project structure

```
tic-tac-toe/
├── index.html              # The entire game (HTML + CSS + JS)
├── database.rules.json     # Firebase security rules (not yet deployed)
├── firebase.json           # Firebase CLI config
├── logo-mockups.html       # Logo design exploration (dev only)
├── accent-mockups.html     # Accent colour exploration (dev only)
├── tab-mockups.html        # Tab bar design exploration (dev only)
└── README.md
```

## Firebase setup

The game uses Firebase Realtime Database for online multiplayer. The config is hardcoded in `index.html` (client-side keys are public by design).

### Deploy security rules (optional)

```bash
npm install -g firebase-tools
firebase login
firebase use tic-tac-toe-dd488
firebase deploy --only database
```

Or paste the contents of `database.rules.json` into the [Firebase Console](https://console.firebase.google.com) → Realtime Database → Rules tab.

### What the rules enforce

- Board: exactly 9 cells, each `null`, `0`, or `1`
- Turn: only `0` or `1`
- Scores: 3 non-negative numbers
- Photos: must start with `data:image/`, max 50KB
- Emojis: string, max 10 chars
- Status: only `waiting`, `playing`, `finished`

## Customisation

### Accent colour

Change `--accent` and `--accent-bg` in the `:root` CSS block (line ~37). The game ships with violet (`#a29bfe`).

### Emojis

Edit the `EMOJIS` array (line ~400) to change the available avatar options.

### Auto-rematch timer

Change `countdownSeconds = 8` in `endGame()` (line ~1165) to adjust the local auto-rematch delay.

## Browser support

- Chrome 90+
- Safari 15+
- Firefox 90+
- Edge 90+
- Mobile Safari (iOS 15+)
- Chrome for Android (90+)

## License

MIT

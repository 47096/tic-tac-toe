# 過三關 — Tic Tac Toe

Mobile-first tic-tac-toe: local, AI, and online with friends.

**[▶ Play now](https://47096.github.io/tic-tac-toe/)**

## Features

- **Local / Computer / Online** — same board, three ways to play (AI: Easy / Medium / Hard)
- **Offline-first** — Local and Computer work with no network; Firebase loads only for Online
- **Invite links** — share a URL; rooms clean up when both players leave
- **Emoji or photo avatars** — photo is shared with your opponent and deleted with the room
- **Paper UI** — warm light theme, matching dark mode, hand-drawn mark
- **Sound** — distinct place ticks for each player, win line synced to the stroke, mute toggle
- **Win effects** — line draw, glow, confetti (respects reduced motion)
- **PWA** — installable; session recovery in online mode

## Accessibility

Keyboard board/emoji navigation, ARIA labels and live regions, focus management, `prefers-reduced-motion`, 44px targets, safe-area insets.

## How to play

**Local** — pick two avatars, take turns, **Play Again**.

**Computer** — pick your avatar and difficulty, then play the AI.

**Online** — pick an avatar → **Create Room** → share the link; your friend opens it and **Join Room**.

## Tech

Vanilla HTML/CSS/JS (no build step). Firebase Realtime Database + Anonymous Auth (lazy). Canvas for win line and confetti. Web Audio for SFX.

| Piece | Role |
|-------|------|
| `index.html` | Markup + boot |
| `css/game.css` | Theme + layout |
| `js/game-logic.js` | Pure win/AI/board helpers (unit-tested) |
| `js/game.js` | UI, audio, Firebase |
| `sw.js` | PWA cache (network-first for HTML/CSS/JS) |
| `test/` | `node --test` for game logic |

## Online setup (Firebase)

1. Create a Realtime Database project and enable **Anonymous** auth.
2. Paste the web config into `FIREBASE_CONFIG` in `js/game.js`.
3. Publish these rules (also keeps avatar photos as small `data:image/…` strings):

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,

        ".write": "auth != null && (
          (!data.exists() && newData.child('players').child('0').child('uid').val() === auth.uid) ||
          (data.child('players').child('0').child('uid').val() === auth.uid) ||
          (data.child('players').child('1').child('uid').val() === auth.uid)
        )",

        "players": {
          "$i": {
            ".validate": "($i === '0' || $i === '1')
              && newData.hasChildren(['disconnected', 'uid'])
              && newData.child('uid').val() === auth.uid
              && newData.child('disconnected').isBoolean()
              && (!newData.hasChildren(['photo'])
                || newData.child('photo').val().matches(/^data:image\\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]*$/))
              && (!newData.hasChildren(['emoji']) || newData.child('emoji').isString())"
          }
        },

        "board": {
          "$cell": {
            ".validate": "($cell === '0' || $cell === '1' || $cell === '2' || $cell === '3' || $cell === '4' || $cell === '5' || $cell === '6' || $cell === '7' || $cell === '8')
              && newData.isNumber()
              && (newData.val() === 0 || newData.val() === 1)"
          }
        },

        "turn": {
          ".validate": "newData.isNumber() && (newData.val() === 0 || newData.val() === 1)"
        },

        "scores": {
          "$s": {
            ".validate": "($s === '0' || $s === '1' || $s === '2') && newData.isNumber()"
          }
        },

        "gameOver": {
          ".validate": "newData.isBoolean()"
        },

        "status": {
          ".validate": "newData.isString()"
        },

        "created": {
          ".validate": "newData.isNumber()"
        },

        "host": {
          ".validate": "newData.isString()"
        },

        "startedAt": {
          ".validate": "newData.isNumber()"
        },

        "endedAt": {
          ".validate": "newData.isNumber()"
        }
      }
    },
    ".read": false,
    ".write": false
  }
}
```

Writes require auth and a matching seat `uid`. Moves use transactions. Room codes come from `crypto.getRandomValues`.

## Tests

```bash
node --test test/game-logic.test.mjs
```

## Customisation

| What | Where | Default |
|------|-------|---------|
| Accent / primary | `--accent`, `--accent-primary` | Violet `#a29bfe` / `#7c6fde` |
| Paper background | `--bg` | `#f7f4ef` |
| Emoji sets | `EMOJI_CATS` in `js/game.js` | Faces, Animals, Cars, Nature |
| Photo limits | upload handler | 10 MB in → ~12 KB out |
| Mute | 🔊 control | Saved in `localStorage` |
| Format | `.prettierrc` | single quotes, width 100 |

## Browser support

Chrome / Edge / Firefox 90+, Safari 15+, iOS Safari 15+, Chrome Android 90+.

## License

[MIT](LICENSE)

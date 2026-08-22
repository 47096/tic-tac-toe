# Firebase Realtime Database Security Rules

Copy the JSON below and paste into Firebase Console → Realtime Database → Rules.

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        "players": {
          "$playerIndex": {
            ".validate": (
              ($playerIndex == '0' || $playerIndex == '1')
              && newData.hasChildren(['disconnected'])
            )
          }
        },
        "board": {
          ".validate": "newData.isList() && newData.val().size() == 9"
        },
        "turn": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 1"
        },
        "scores": {
          ".validate": "newData.isList()"
        },
        "gameOver": {
          ".validate": "newData.isBoolean()"
        },
        "status": {
          ".validate": "newData.isString()"
        }
      }
    },
    ".read": false,
    ".write": false
  }
}
```

## What these rules do

| Path | Read | Write | Validation |
|------|------|-------|------------|
| `/rooms/{roomCode}` | Anyone | Anyone | — |
| `/rooms/{roomCode}/players/{0 or 1}` | Anyone | Anyone | Must be index 0 or 1, must have `disconnected` field |
| `/rooms/{roomCode}/board` | Anyone | Anyone | Must be array of 9 |
| `/rooms/{roomCode}/turn` | Anyone | Anyone | Must be 0 or 1 |
| `/rooms/{roomCode}/gameOver` | Anyone | Anyone | Must be boolean |
| `/rooms/{roomCode}/status` | Anyone | Anyone | Must be string |
| Everything else | Denied | Denied | — |

## Notes

- **Read is open** — needed for invite links (anyone with the link can read the room to join)
- **Write is open** — the app already handles turn enforcement and room hijack prevention client-side
- **Validation only** — prevents malformed data from being written (wrong types, invalid board size, etc.)
- For stricter rules (e.g. only the room creator can write to certain fields), you'd need Firebase Auth, which this game doesn't use

## How to apply

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`tic-tac-toe-dd488`)
3. Left sidebar → Realtime Database → Rules tab
4. Replace the existing rules with the JSON above
5. Click "Publish"

# Firebase Realtime Database Security Rules

Paste into **Firebase Console → Realtime Database → Rules tab**.

```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": true,
        "players": {
          "$idx": {
            "emoji": {
              ".validate": "newData.isString() || newData.val() == null"
            },
            "photo": {
              ".validate": "newData.isString() || newData.val() == null"
            },
            "disconnected": {
              ".validate": "newData.isBoolean()"
            }
          }
        },
        "board": {
          "$cellIdx": {
            ".validate": "newData.val() == null || newData.isNumber()"
          }
        },
        "turn": {
          ".validate": "newData.isNumber()"
        },
        "scores": {
          "$scoreIdx": {
            ".validate": "newData.isNumber()"
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
        },
        "deviceType": {
          ".validate": "newData.isString()"
        },
        "browser": {
          ".validate": "newData.isString()"
        },
        "referrer": {
          ".validate": "newData.isString()"
        }
      }
    }
  }
}
```

## What these rules enforce

- Root is read/write denied — only `/rooms` is accessible
- Room codes validated as 6-char alphanumeric
- Players can only be index 0 or 1 with emoji, photo, disconnected fields
- Photo must be a string or null (client validates `data:image/` prefix)
- Board cells must be null (empty) or a number (player index 0 or 1)
- Type checks on all game state fields (turn, scores, gameOver, status)

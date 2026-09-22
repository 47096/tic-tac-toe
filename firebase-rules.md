# Firebase Realtime Database Security Rules

Requires **Anonymous Auth** (Firebase Console → Authentication → Sign-in method → Anonymous → Enable).

Paste the JSON below into Firebase Console → Realtime Database → Rules.

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
              && (!newData.hasChildren(['photo']) || newData.child('photo').isString())
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

## Why this shape

RTDB write rules at **child** paths see only that child's `newData` (e.g. `created` is just a number), so
`newData.child('players')…` is always null there and create gets `PERMISSION_DENIED` even when the room
rule would pass.

**Fix:** one `.write` at `$roomCode` (parent grant cascades to children). Children only have `.validate`.

| Path | Read | Write | Validate |
|------|------|-------|----------|
| `/rooms/{roomCode}` | Anyone (invite links) | Create if `players/0.uid` is you; then only a player in that room | — |
| `players/{0\|1}` | (via parent) | (via parent) | `uid` must be `auth.uid`; `disconnected` boolean; photo/emoji optional strings |
| `board` cells | (via parent) | (via parent) | index `0`–`8`, value `0` or `1` |
| `turn` / `scores` / `gameOver` / … | (via parent) | (via parent) | shape checks |

## Client contract

1. Load `firebase-app-compat`, `firebase-auth-compat`, `firebase-database-compat`
2. `signInAnonymously()` before any write
3. Put `uid` on `players/0` (create) and `players/1` (join)
4. Never send `null` fields in `set()`/`update()` (null = delete)

## How to apply

1. Enable Anonymous Auth
2. Realtime Database → Rules → replace JSON → **Publish**
3. Deploy the updated `index.html` (view-source must show `signInAnonymously`)

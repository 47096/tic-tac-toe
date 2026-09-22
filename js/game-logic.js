// Pure game logic — shared by the app and unit tests (no DOM, no Firebase).
(function (root) {
    'use strict';

    var WIN_LINES = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    var ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    function boardFromStore(rb) {
        var b = [null, null, null, null, null, null, null, null, null];
        if (rb && typeof rb === 'object') {
            for (var i = 0; i < 9; i++) if (rb[i] != null) b[i] = rb[i];
        }
        return b;
    }

    function boardToStore(b) {
        var o = {};
        for (var i = 0; i < 9; i++) if (b[i] !== null && b[i] !== undefined) o[i] = b[i];
        return o;
    }

    function scoresFromStore(rs) {
        var s = [0, 0, 0];
        if (rs && typeof rs === 'object') {
            if (rs[0] != null) s[0] = rs[0];
            if (rs[1] != null) s[1] = rs[1];
            if (rs[2] != null) s[2] = rs[2];
        }
        return s;
    }

    function findWin(b) {
        for (var i = 0; i < WIN_LINES.length; i++) {
            var a = WIN_LINES[i][0], bb = WIN_LINES[i][1], c = WIN_LINES[i][2];
            if (b[a] !== null && b[a] === b[bb] && b[a] === b[c]) {
                return { w: b[a], wl: [a, bb, c] };
            }
        }
        return { w: null, wl: null };
    }

    function isDraw(b) {
        for (var i = 0; i < 9; i++) if (b[i] === null || b[i] === undefined) return false;
        return findWin(b).w === null;
    }

    function roomCodeFromBytes(bytes) {
        var out = '';
        for (var i = 0; i < 8; i++) out += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
        return out;
    }

    function aiBestMove(board, aiPlayer, difficulty) {
        var human = 1 - aiPlayer;
        var empty = [];
        for (var i = 0; i < 9; i++) if (board[i] === null) empty.push(i);
        if (!empty.length) return -1;

        function findThreat(player) {
            for (var j = 0; j < WIN_LINES.length; j++) {
                var a = WIN_LINES[j][0], b = WIN_LINES[j][1], c = WIN_LINES[j][2];
                var line = [board[a], board[b], board[c]];
                var count = 0, emptyIdx = -1;
                for (var k = 0; k < 3; k++) {
                    if (line[k] === player) count++;
                    else if (line[k] === null) emptyIdx = [a, b, c][k];
                }
                if (count === 2 && emptyIdx !== -1) return emptyIdx;
            }
            return -1;
        }

        function pickRandom() {
            return empty[Math.floor(Math.random() * empty.length)];
        }

        if (difficulty === 'easy') return pickRandom();

        if (difficulty === 'medium') {
            var win = findThreat(aiPlayer);
            if (win !== -1) return win;
            var block = findThreat(human);
            if (block !== -1) return block;
            return pickRandom();
        }

        function minimax(b, depth, isMax) {
            var found = findWin(b);
            if (found.w !== null) return found.w === aiPlayer ? 10 - depth : depth - 10;
            if (isDraw(b)) return 0;
            if (isMax) {
                var best = -Infinity;
                for (var i = 0; i < 9; i++) {
                    if (b[i] === null) {
                        b[i] = aiPlayer;
                        best = Math.max(best, minimax(b, depth + 1, false));
                        b[i] = null;
                    }
                }
                return best;
            }
            var bestMin = Infinity;
            for (var j = 0; j < 9; j++) {
                if (b[j] === null) {
                    b[j] = human;
                    bestMin = Math.min(bestMin, minimax(b, depth + 1, true));
                    b[j] = null;
                }
            }
            return bestMin;
        }

        var bestScore = -Infinity;
        var bestMove = empty[0];
        for (var m = 0; m < empty.length; m++) {
            var i = empty[m];
            board[i] = aiPlayer;
            var score = minimax(board, 0, false);
            board[i] = null;
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
        return bestMove;
    }

    var api = {
        WIN_LINES: WIN_LINES,
        ROOM_CODE_ALPHABET: ROOM_CODE_ALPHABET,
        boardFromStore: boardFromStore,
        boardToStore: boardToStore,
        scoresFromStore: scoresFromStore,
        findWin: findWin,
        isDraw: isDraw,
        roomCodeFromBytes: roomCodeFromBytes,
        aiBestMove: aiBestMove
    };

    if (typeof module === 'object' && module.exports) module.exports = api;
    root.TTT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

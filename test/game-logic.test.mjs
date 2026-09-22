import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  WIN_LINES,
  ROOM_CODE_ALPHABET,
  boardFromStore,
  boardToStore,
  scoresFromStore,
  findWin,
  isDraw,
  roomCodeFromBytes,
  aiBestMove,
} = require('../js/game-logic.js');

test('WIN_LINES has 8 lines of 3 unique cells', () => {
  assert.equal(WIN_LINES.length, 8);
  for (const line of WIN_LINES) {
    assert.equal(line.length, 3);
    assert.equal(new Set(line).size, 3);
    for (const i of line) assert.ok(i >= 0 && i <= 8);
  }
});

test('boardToStore / boardFromStore round-trip sparse boards', () => {
  const b = [0, null, 1, null, 0, null, null, null, 1];
  const stored = boardToStore(b);
  assert.deepEqual(stored, { 0: 0, 2: 1, 4: 0, 8: 1 });
  assert.deepEqual(boardFromStore(stored), b);
  assert.deepEqual(boardFromStore(null), [null, null, null, null, null, null, null, null, null]);
});

test('scoresFromStore fills missing indices with 0', () => {
  assert.deepEqual(scoresFromStore({ 0: 2 }), [2, 0, 0]);
  assert.deepEqual(scoresFromStore(null), [0, 0, 0]);
  assert.deepEqual(scoresFromStore({ 0: 1, 1: 2, 2: 3 }), [1, 2, 3]);
});

test('findWin detects rows, columns, and diagonals', () => {
  assert.deepEqual(findWin([0, 0, 0, 1, 1, null, null, null, null]), { w: 0, wl: [0, 1, 2] });
  assert.equal(findWin([0, 1, 0, 0, 1, null, null, 1, null]).w, 1);
  assert.equal(findWin([0, 1, 0, 1, 0, null, null, null, 0]).w, 0);
  assert.equal(findWin([0, 1, 0, 1, 0, 1, 1, 0, 1]).w, null);
});

test('isDraw only when full with no winner', () => {
  assert.equal(isDraw([0, 1, 0, 0, 1, 1, 1, 0, 0]), true);
  assert.equal(isDraw([0, 0, 0, 1, 1, null, null, null, null]), false);
  assert.equal(isDraw([0, 0, 0, 1, 1, 1, 0, 0, 1]), false);
});

test('roomCodeFromBytes is 8 chars from a restricted alphabet', () => {
  const code = roomCodeFromBytes(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]));
  assert.equal(code.length, 8);
  for (const ch of code) assert.ok(ROOM_CODE_ALPHABET.includes(ch));
  assert.ok(!/[01IO]/.test(code));
});

test('medium AI takes an immediate win', () => {
  const board = [1, 1, null, 0, 0, null, null, null, null];
  assert.equal(aiBestMove(board.slice(), 1, 'medium'), 2);
});

test('medium AI blocks an immediate loss', () => {
  const board = [0, 0, null, 1, null, null, null, null, null];
  assert.equal(aiBestMove(board.slice(), 1, 'medium'), 2);
});

test('hard AI returns a legal move', () => {
  const board = Array(9).fill(null);
  board[0] = 0;
  const move = aiBestMove(board.slice(), 1, 'hard');
  assert.ok(move >= 0 && move <= 8 && board[move] === null);
});

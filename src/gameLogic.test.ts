import { describe, expect, test } from 'vitest';
import {
  bossHitByWord,
  climbStep,
  createBossFight,
  createLadder,
  ladderProgress,
  pickNextIndex,
  playerHitByTimeout,
} from './gameLogic';

// Unit tests for the Sprint 2 game logic (Boss Fight + Word Ladder).
// Critical module under the Definition of Done; also backs quality
// requirement QR-1 (Functional Correctness).

describe('Boss Fight', () => {
  test('starts with full boss and player HP and playing status', () => {
    const state = createBossFight(8, 3);
    expect(state.bossHp).toBe(8);
    expect(state.playerHp).toBe(3);
    expect(state.wordsDefeated).toBe(0);
    expect(state.status).toBe('playing');
  });

  test('clamps invalid starting HP to at least 1', () => {
    const state = createBossFight(0, -5);
    expect(state.bossHp).toBe(1);
    expect(state.playerHp).toBe(1);
  });

  test('a correct word removes 1 boss HP and counts the word', () => {
    const next = bossHitByWord(createBossFight(8, 3));
    expect(next.bossHp).toBe(7);
    expect(next.wordsDefeated).toBe(1);
    expect(next.status).toBe('playing');
  });

  test('does not mutate the previous state', () => {
    const state = createBossFight(8, 3);
    bossHitByWord(state);
    expect(state.bossHp).toBe(8);
  });

  test('defeating the last boss HP wins the round', () => {
    let state = createBossFight(2, 3);
    state = bossHitByWord(state);
    state = bossHitByWord(state);
    expect(state.bossHp).toBe(0);
    expect(state.status).toBe('won');
  });

  test('a timeout removes 1 player HP and losing all HP ends the game', () => {
    let state = createBossFight(8, 2);
    state = playerHitByTimeout(state);
    expect(state.playerHp).toBe(1);
    expect(state.status).toBe('playing');
    state = playerHitByTimeout(state);
    expect(state.playerHp).toBe(0);
    expect(state.status).toBe('lost');
  });

  test('no further changes once the round is over', () => {
    let state = createBossFight(1, 1);
    state = bossHitByWord(state); // won
    const after = playerHitByTimeout(state);
    expect(after).toEqual(state);
  });
});

describe('Word Ladder', () => {
  test('starts at the bottom step with playing status', () => {
    const state = createLadder(10);
    expect(state.currentStep).toBe(0);
    expect(state.totalSteps).toBe(10);
    expect(state.status).toBe('playing');
  });

  test('each correct word climbs one step', () => {
    const next = climbStep(createLadder(10));
    expect(next.currentStep).toBe(1);
    expect(next.status).toBe('playing');
  });

  test('reaching the top step wins', () => {
    let state = createLadder(3);
    state = climbStep(state);
    state = climbStep(state);
    state = climbStep(state);
    expect(state.currentStep).toBe(3);
    expect(state.status).toBe('won');
  });

  test('does not climb past the top', () => {
    let state = createLadder(1);
    state = climbStep(state); // won, at top
    state = climbStep(state);
    expect(state.currentStep).toBe(1);
  });

  test('ladderProgress reports a 0..1 fraction', () => {
    const state = createLadder(4);
    expect(ladderProgress(state)).toBe(0);
    expect(ladderProgress(climbStep(state))).toBe(0.25);
  });
});

describe('pickNextIndex', () => {
  test('returns -1 for an empty list', () => {
    expect(pickNextIndex(0)).toBe(-1);
  });

  test('always returns 0 for a single-word list', () => {
    expect(pickNextIndex(1, -1, () => 0.99)).toBe(0);
  });

  test('uses the injected rng to choose an index', () => {
    // rng 0.5 over 4 items -> floor(2.0) = 2
    expect(pickNextIndex(4, -1, () => 0.5)).toBe(2);
  });

  test('avoids repeating the previous index', () => {
    // rng would pick index 2, but previous is 2, so it advances to 3
    expect(pickNextIndex(4, 2, () => 0.5)).toBe(3);
  });
});

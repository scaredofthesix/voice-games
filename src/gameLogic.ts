/**
 * Pure game logic for the two MVP v2 games added in Sprint 2:
 * Boss Fight and Word Ladder (the rocket climb).
 *
 * The rules live here, separate from the React/canvas/voice UI, so they can be
 * unit tested deterministically. This is a critical module under the
 * Assignment 4 Definition of Done and is covered by gameLogic.test.ts.
 *
 * All functions are pure and return new state objects (no mutation), matching
 * the project immutability convention.
 */

export type PlayStatus = 'playing' | 'won' | 'lost';

// ---------------------------------------------------------------------------
// Boss Fight
// A prince fights a boss. Each correctly pronounced word removes 1 boss HP.
// If the child fails to pronounce a word in time, the boss deals 1 damage.
// ---------------------------------------------------------------------------

export interface BossFightState {
  bossMaxHp: number;
  bossHp: number;
  playerMaxHp: number;
  playerHp: number;
  wordsDefeated: number;
  status: PlayStatus;
}

export const DEFAULT_BOSS_HP = 8;
export const DEFAULT_PLAYER_HP = 3;

export function createBossFight(
  bossHp: number = DEFAULT_BOSS_HP,
  playerHp: number = DEFAULT_PLAYER_HP,
): BossFightState {
  const safeBossHp = Math.max(1, Math.floor(bossHp));
  const safePlayerHp = Math.max(1, Math.floor(playerHp));
  return {
    bossMaxHp: safeBossHp,
    bossHp: safeBossHp,
    playerMaxHp: safePlayerHp,
    playerHp: safePlayerHp,
    wordsDefeated: 0,
    status: 'playing',
  };
}

/** A correctly pronounced word: the boss loses 1 HP. */
export function bossHitByWord(state: BossFightState): BossFightState {
  if (state.status !== 'playing') return state;

  const bossHp = Math.max(0, state.bossHp - 1);
  const wordsDefeated = state.wordsDefeated + 1;
  const status: PlayStatus = bossHp === 0 ? 'won' : 'playing';

  return { ...state, bossHp, wordsDefeated, status };
}

/** A missed/timed-out word: the player loses 1 HP. */
export function playerHitByTimeout(state: BossFightState): BossFightState {
  if (state.status !== 'playing') return state;

  const playerHp = Math.max(0, state.playerHp - 1);
  const status: PlayStatus = playerHp === 0 ? 'lost' : 'playing';

  return { ...state, playerHp, status };
}

// The fight is a short gauntlet of bosses. The player advances through them in
// order; player HP carries over, each boss is a little tougher. The emoji is
// what the canvas draws as the boss; the rules stay here so they stay testable.
export interface BossKind {
  name: string;
  emoji: string;
  hp: number;
  color: string; // canvas accent colour
}

export const BOSS_ROSTER: readonly BossKind[] = [
  { name: 'Goblin', emoji: '👺', hp: 5, color: '#22c55e' },
  { name: 'Ogre', emoji: '👹', hp: 7, color: '#f97316' },
  { name: 'Dragon', emoji: '🐉', hp: 10, color: '#ef4444' },
];

/** The boss for a (zero-based) gauntlet level, clamped into the roster. */
export function bossAtLevel(level: number): BossKind {
  const i = Math.max(0, Math.min(BOSS_ROSTER.length - 1, Math.floor(level)));
  return BOSS_ROSTER[i];
}

/** True when the given level is the last boss of the gauntlet. */
export function isFinalBoss(level: number): boolean {
  return Math.floor(level) >= BOSS_ROSTER.length - 1;
}

export type BossPhase = 'calm' | 'angry' | 'enraged';

/** Visual phase of the current boss, by its remaining HP fraction. */
export function bossPhase(state: BossFightState): BossPhase {
  if (state.bossMaxHp <= 0) return 'calm';
  const frac = state.bossHp / state.bossMaxHp;
  if (frac > 0.66) return 'calm';
  if (frac > 0.33) return 'angry';
  return 'enraged';
}

// ---------------------------------------------------------------------------
// Word Ladder (rocket climb)
// Each correctly pronounced word lifts the rocket up one step. Reaching the
// top step wins the round.
// ---------------------------------------------------------------------------

export interface WordLadderState {
  totalSteps: number;
  currentStep: number;
  status: PlayStatus;
}

export const DEFAULT_LADDER_STEPS = 10;

export function createLadder(
  totalSteps: number = DEFAULT_LADDER_STEPS,
): WordLadderState {
  const safeSteps = Math.max(1, Math.floor(totalSteps));
  return { totalSteps: safeSteps, currentStep: 0, status: 'playing' };
}

/** A correctly pronounced word: the rocket climbs one step. */
export function climbStep(state: WordLadderState): WordLadderState {
  if (state.status !== 'playing') return state;

  const currentStep = Math.min(state.totalSteps, state.currentStep + 1);
  const status: PlayStatus = currentStep >= state.totalSteps ? 'won' : 'playing';

  return { ...state, currentStep, status };
}

/** Climb progress as a 0..1 fraction, useful for the progress UI. */
export function ladderProgress(state: WordLadderState): number {
  if (state.totalSteps <= 0) return 0;
  return state.currentStep / state.totalSteps;
}

export type LadderZone = 'ground' | 'clouds' | 'sky' | 'space';

/** The altitude band the rocket is in, by climb progress (drives the canvas). */
export function ladderZone(state: WordLadderState): LadderZone {
  const p = ladderProgress(state);
  if (p < 0.25) return 'ground';
  if (p < 0.55) return 'clouds';
  if (p < 0.85) return 'sky';
  return 'space';
}

// ---------------------------------------------------------------------------
// Shared word selection
// Deterministic when given a random source, so tests can pin the output.
// ---------------------------------------------------------------------------

/**
 * Pick the next target word index, avoiding an immediate repeat of `previous`.
 * `rng` returns a float in [0, 1) (defaults to Math.random) so callers in tests
 * can inject a fixed value.
 */
export function pickNextIndex(
  count: number,
  previous: number = -1,
  rng: () => number = Math.random,
): number {
  if (count <= 0) return -1;
  if (count === 1) return 0;

  let index = Math.floor(rng() * count);
  if (index >= count) index = count - 1;
  if (index === previous) {
    index = (index + 1) % count;
  }
  return index;
}

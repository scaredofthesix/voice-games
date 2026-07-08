import { describe, expect, test } from 'vitest';

import {
  BOSS_ROSTER,
  bossAtLevel,
  bossHitByWord,
  bossPhase,
  climbStep,
  createBossFight,
  createLadder,
  ENDLESS_HP_RAMP,
  endlessBossAtLevel,
  isFinalBoss,
  ladderZone,
} from './gameLogic';

// Unit tests for the boss gauntlet and rocket altitude helpers added in the
// Sprint 2 game rework. These drive the difficulty curve and the canvas scenes.

describe('boss roster', () => {
  test('has at least three bosses with non-decreasing HP', () => {
    expect(BOSS_ROSTER.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < BOSS_ROSTER.length; i++) {
      expect(BOSS_ROSTER[i].hp).toBeGreaterThanOrEqual(BOSS_ROSTER[i - 1].hp);
    }
  });

  test('bossAtLevel returns the matching boss and clamps out-of-range levels', () => {
    expect(bossAtLevel(0)).toBe(BOSS_ROSTER[0]);
    expect(bossAtLevel(BOSS_ROSTER.length - 1)).toBe(
      BOSS_ROSTER[BOSS_ROSTER.length - 1],
    );
    expect(bossAtLevel(-5)).toBe(BOSS_ROSTER[0]);
    expect(bossAtLevel(999)).toBe(BOSS_ROSTER[BOSS_ROSTER.length - 1]);
  });

  test('isFinalBoss is true only for the last roster index', () => {
    expect(isFinalBoss(0)).toBe(false);
    expect(isFinalBoss(BOSS_ROSTER.length - 1)).toBe(true);
    expect(isFinalBoss(999)).toBe(true);
  });

  test('isFinalBoss respects totalBosses parameter', () => {
    expect(isFinalBoss(2, 3)).toBe(true);
    expect(isFinalBoss(1, 3)).toBe(false);
    expect(isFinalBoss(4, 5)).toBe(true);
    expect(isFinalBoss(3, 5)).toBe(false);
  });

  test('isFinalBoss returns false for Endless mode (totalBosses = -1)', () => {
    expect(isFinalBoss(0, -1)).toBe(false);
    expect(isFinalBoss(14, -1)).toBe(false);
    expect(isFinalBoss(999, -1)).toBe(false);
  });
});

describe('endlessBossAtLevel', () => {
  test('returns the roster bosses unchanged on the first pass', () => {
    for (let i = 0; i < BOSS_ROSTER.length; i++) {
      expect(endlessBossAtLevel(i).name).toBe(BOSS_ROSTER[i].name);
      expect(endlessBossAtLevel(i).hp).toBe(BOSS_ROSTER[i].hp);
    }
  });

  test('loops the roster and ramps HP each full pass', () => {
    const looped = endlessBossAtLevel(BOSS_ROSTER.length); // first boss again
    expect(looped.name).toBe(BOSS_ROSTER[0].name);
    expect(looped.hp).toBe(BOSS_ROSTER[0].hp + ENDLESS_HP_RAMP);

    const twice = endlessBossAtLevel(BOSS_ROSTER.length * 2);
    expect(twice.name).toBe(BOSS_ROSTER[0].name);
    expect(twice.hp).toBe(BOSS_ROSTER[0].hp + ENDLESS_HP_RAMP * 2);
  });

  test('never runs out of bosses and keeps HP positive', () => {
    for (const level of [0, 7, 50, 999]) {
      const boss = endlessBossAtLevel(level);
      expect(boss.emoji.length).toBeGreaterThan(0);
      expect(boss.hp).toBeGreaterThan(0);
    }
  });
});

describe('bossPhase', () => {
  test('moves from calm to angry to enraged as HP drops', () => {
    let fight = createBossFight(10, 3);
    expect(bossPhase(fight)).toBe('calm'); // 10/10

    for (let i = 0; i < 4; i++) fight = bossHitByWord(fight); // 6/10
    expect(bossPhase(fight)).toBe('angry');

    for (let i = 0; i < 4; i++) fight = bossHitByWord(fight); // 2/10
    expect(bossPhase(fight)).toBe('enraged');
  });
});

describe('ladderZone', () => {
  test('climbs through ground, clouds, sky and space', () => {
    let ladder = createLadder(10);
    expect(ladderZone(ladder)).toBe('ground'); // 0/10

    const climbTo = (target: number) => {
      while (ladder.currentStep < target) ladder = climbStep(ladder);
    };

    climbTo(3);
    expect(ladderZone(ladder)).toBe('clouds'); // 0.3
    climbTo(6);
    expect(ladderZone(ladder)).toBe('sky'); // 0.6
    climbTo(9);
    expect(ladderZone(ladder)).toBe('space'); // 0.9
  });
});

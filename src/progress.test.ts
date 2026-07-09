import { afterEach, describe, expect, test } from 'vitest';
import {
  clearProgress,
  emptyProgress,
  loadProgress,
  progressToCsv,
  recordHighScore,
  recordSessionPlayed,
  recordWordSpoken,
  recordWordStruggled,
  saveProgress,
} from './progress';

// Unit tests for the progress persistence module (Issue #25, US-10).

describe('progress module', () => {
  afterEach(() => {
    localStorage.clear();
  });

  test('emptyProgress returns zeroed stats for all 7 games', () => {
    const p = emptyProgress();
    expect(Object.keys(p)).toHaveLength(7);
    for (const g of Object.values(p)) {
      expect(g.sessionsPlayed).toBe(0);
      expect(g.highScore).toBe(0);
      expect(Object.keys(g.words)).toHaveLength(0);
    }
  });

  test('loadProgress returns defaults when localStorage is empty', () => {
    const p = loadProgress();
    expect(p['voice-racer'].sessionsPlayed).toBe(0);
    expect(p['boss-fight'].highScore).toBe(0);
  });

  test('loadProgress migrates legacy highscore keys on first load', () => {
    localStorage.setItem('voice_racer_highscore', '42');
    localStorage.setItem('boss_fight_highscore', '99');
    const p = loadProgress();
    expect(p['voice-racer'].highScore).toBe(42);
    expect(p['boss-fight'].highScore).toBe(99);
    expect(p['bubble-popper'].highScore).toBe(0);
  });

  test('save and load round-trips correctly', () => {
    let p = emptyProgress();
    p = recordSessionPlayed(p, 'voice-racer');
    p = recordHighScore(p, 'voice-racer', 50);
    p = recordWordSpoken(p, 'voice-racer', 'apple');
    saveProgress(p);

    const loaded = loadProgress();
    expect(loaded['voice-racer'].sessionsPlayed).toBe(1);
    expect(loaded['voice-racer'].highScore).toBe(50);
    expect(loaded['voice-racer'].words['apple'].spoken).toBe(1);
  });

  test('recordSessionPlayed increments session count', () => {
    let p = emptyProgress();
    p = recordSessionPlayed(p, 'boss-fight');
    p = recordSessionPlayed(p, 'boss-fight');
    expect(p['boss-fight'].sessionsPlayed).toBe(2);
  });

  test('recordHighScore only updates if score is higher', () => {
    let p = emptyProgress();
    p = recordHighScore(p, 'word-ladder', 10);
    expect(p['word-ladder'].highScore).toBe(10);
    p = recordHighScore(p, 'word-ladder', 5);
    expect(p['word-ladder'].highScore).toBe(10);
    p = recordHighScore(p, 'word-ladder', 20);
    expect(p['word-ladder'].highScore).toBe(20);
  });

  test('recordWordSpoken accumulates spoken count', () => {
    let p = emptyProgress();
    p = recordWordSpoken(p, 'bubble-popper', 'cat');
    p = recordWordSpoken(p, 'bubble-popper', 'cat');
    p = recordWordSpoken(p, 'bubble-popper', 'dog');
    expect(p['bubble-popper'].words['cat'].spoken).toBe(2);
    expect(p['bubble-popper'].words['dog'].spoken).toBe(1);
  });

  test('recordWordStruggled accumulates struggled count', () => {
    let p = emptyProgress();
    p = recordWordStruggled(p, 'skate-word', 'tree');
    p = recordWordStruggled(p, 'skate-word', 'tree');
    expect(p['skate-word'].words['tree'].struggled).toBe(2);
    expect(p['skate-word'].words['tree'].spoken).toBe(0);
  });

  test('clearProgress resets everything to empty', () => {
    let p = emptyProgress();
    p = recordSessionPlayed(p, 'aste-word');
    p = recordHighScore(p, 'aste-word', 100);
    saveProgress(p);

    const cleared = clearProgress();
    expect(cleared['aste-word'].sessionsPlayed).toBe(0);
    expect(cleared['aste-word'].highScore).toBe(0);

    const reloaded = loadProgress();
    expect(reloaded['aste-word'].sessionsPlayed).toBe(0);
  });

  test('progressToCsv produces valid CSV rows', () => {
    let p = emptyProgress();
    p = recordSessionPlayed(p, 'voice-racer');
    p = recordHighScore(p, 'voice-racer', 42);
    p = recordWordSpoken(p, 'voice-racer', 'apple');
    p = recordWordStruggled(p, 'voice-racer', 'apple');

    const csv = progressToCsv(p);
    const lines = csv.split('\n');
    expect(lines[0]).toBe(
      'Game,Sessions Played,High Score,Word,Times Spoken,Times Struggled',
    );
    // voice-racer line with word data
    const racerLine = lines.find((l) => l.includes('Voice Lane Racer') && l.includes('apple'));
    expect(racerLine).toBeTruthy();
    expect(racerLine).toContain(',1,42,');
    expect(racerLine).toContain('"apple",1,1');
  });

  test('does not mutate input when recording', () => {
    const p = emptyProgress();
    const p2 = recordSessionPlayed(p, 'voice-racer');
    expect(p['voice-racer'].sessionsPlayed).toBe(0);
    expect(p2['voice-racer'].sessionsPlayed).toBe(1);
  });
});

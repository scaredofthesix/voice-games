import { afterEach, describe, expect, test } from 'vitest';
import {
  ALL_GAME_IDS,
  clearProgress,
  emptyProgress,
  loadProgress,
  MASTERY_THRESHOLD,
  pickAdaptiveWordIndex,
  progressToCsv,
  recordHighScore,
  recordSessionPlayed,
  recordWordSpoken,
  recordWordStruggled,
  saveProgress,
  WordStats,
  wordSelectionWeight,
} from './progress';

// Unit tests for the progress persistence module (Issue #25, US-10).

describe('progress module', () => {
  afterEach(() => {
    localStorage.clear();
  });

  test('emptyProgress returns zeroed stats for all games', () => {
    const p = emptyProgress();
    expect(Object.keys(p)).toHaveLength(ALL_GAME_IDS.length);
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

  // Regression test for issue #103: the Progress view showed 0 sessions/words
  // while the high score survived. Root cause: loadProgress() treated any
  // JSON.parse failure the same as "never saved before", and permanently
  // overwrote the stored blob with a reset snapshot via saveProgress(fresh).
  test('loadProgress does not wipe stored data on a parse failure', () => {
    // Seed real, previously-saved progress plus a legacy high score key.
    localStorage.setItem('voice_games_progress', '{not valid json');
    localStorage.setItem('boss_fight_highscore', '120');

    const p = loadProgress();

    // The read recovers what it safely can (the legacy high score)...
    expect(p['boss-fight'].highScore).toBe(120);
    expect(p['boss-fight'].sessionsPlayed).toBe(0);

    // ...but must NOT have overwritten the original stored value. A prior
    // implementation called saveProgress(fresh) here, permanently destroying
    // any recoverable data on every subsequent read.
    expect(localStorage.getItem('voice_games_progress')).toBe('{not valid json');
  });

  test('a parse failure does not affect sessions/words recorded after it', () => {
    localStorage.setItem('voice_games_progress', 'not json at all');

    // The app keeps working after a bad read: subsequent record calls still
    // read-modify-write correctly and accumulate normally.
    saveProgress(recordSessionPlayed(loadProgress(), 'boss-fight'));
    saveProgress(recordWordSpoken(loadProgress(), 'boss-fight', 'dragon'));

    const p = loadProgress();
    expect(p['boss-fight'].sessionsPlayed).toBe(1);
    expect(p['boss-fight'].words['dragon'].spoken).toBe(1);
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
      '"Game","Sessions Played","High Score","Word","Times Spoken","Times Struggled"',
    );
    // voice-racer line with word data
    const racerLine = lines.find((l) => l.includes('Voice Lane Racer') && l.includes('apple'));
    expect(racerLine).toBeTruthy();
    expect(racerLine).toContain('"Voice Lane Racer","1","42","apple","1","1"');
  });

  test('progressToCsv escapes commas and quotes in word fields', () => {
    let p = emptyProgress();
    p = recordWordSpoken(p, 'voice-racer', 'nice, "quoted" word');

    const csv = progressToCsv(p);
    expect(csv).toContain('"Voice Lane Racer","0","0","nice, ""quoted"" word","1","0"');
  });

  test('does not mutate input when recording', () => {
    const p = emptyProgress();
    const p2 = recordSessionPlayed(p, 'voice-racer');
    expect(p['voice-racer'].sessionsPlayed).toBe(0);
    expect(p2['voice-racer'].sessionsPlayed).toBe(1);
  });
});

// Regression / feature tests for issue #105: adaptive word selection driven
// by progress statistics, instead of uniform randomness.
describe('wordSelectionWeight', () => {
  test('an unseen word (no stats, or spoken 0 times) gets the "unseen" weight', () => {
    expect(wordSelectionWeight(undefined)).toBe(2);
    expect(wordSelectionWeight({ spoken: 0, struggled: 0 })).toBe(2);
  });

  test('a struggled word is weighted higher than an unseen or normal word', () => {
    const struggled: WordStats = { spoken: 3, struggled: 1 };
    const unseen: WordStats = { spoken: 0, struggled: 0 };
    const normal: WordStats = { spoken: 2, struggled: 0 };
    expect(wordSelectionWeight(struggled)).toBeGreaterThan(wordSelectionWeight(unseen));
    expect(wordSelectionWeight(struggled)).toBeGreaterThan(wordSelectionWeight(normal));
  });

  test('more struggles increase the weight, up to a cap', () => {
    const w1 = wordSelectionWeight({ spoken: 5, struggled: 1 });
    const w3 = wordSelectionWeight({ spoken: 5, struggled: 3 });
    const w10 = wordSelectionWeight({ spoken: 5, struggled: 10 });
    const w20 = wordSelectionWeight({ spoken: 5, struggled: 20 });
    expect(w3).toBeGreaterThan(w1);
    expect(w10).toBeGreaterThan(w3);
    expect(w20).toBe(w10); // capped, doesn't keep growing forever
  });

  test('a word spoken correctly MASTERY_THRESHOLD times without struggling is deprioritized', () => {
    const mastered: WordStats = { spoken: MASTERY_THRESHOLD, struggled: 0 };
    const normal: WordStats = { spoken: MASTERY_THRESHOLD - 1, struggled: 0 };
    expect(wordSelectionWeight(mastered)).toBeLessThan(wordSelectionWeight(normal));
    expect(wordSelectionWeight(mastered)).toBeGreaterThan(0); // never fully excluded
  });
});

describe('pickAdaptiveWordIndex', () => {
  test('returns -1 for an empty word list and 0 for a single word', () => {
    expect(pickAdaptiveWordIndex([], {})).toBe(-1);
    expect(pickAdaptiveWordIndex(['only'], {})).toBe(0);
  });

  test('a struggled word resurfaces sooner than a mastered one', () => {
    const words = ['cat', 'dog'];
    const stats: Record<string, WordStats> = {
      cat: { spoken: MASTERY_THRESHOLD, struggled: 0 }, // mastered
      dog: { spoken: 2, struggled: 2 }, // struggled
    };

    // A roll near the top of the weighted range should land on the
    // much-higher-weighted struggled word ("dog"), not the mastered one.
    const idx = pickAdaptiveWordIndex(words, stats, -1, () => 0.99);
    expect(words[idx]).toBe('dog');
  });

  test('never repeats the immediately previous index when more than one word exists', () => {
    const words = ['a', 'b'];
    // Even with an rng that would otherwise pick index 0 every time, the
    // previous index must be avoided.
    const idx = pickAdaptiveWordIndex(words, {}, 0, () => 0);
    expect(idx).toBe(1);
  });

  test('introduces unseen words once there is nothing struggled to reinforce', () => {
    const words = ['known', 'new'];
    const stats: Record<string, WordStats> = {
      known: { spoken: 3, struggled: 0 },
      // 'new' has no stats at all - never seen.
    };
    // Unseen words get a higher weight than plain "normal" words, so a
    // high roll should favor the new word.
    const idx = pickAdaptiveWordIndex(words, stats, -1, () => 0.9);
    expect(words[idx]).toBe('new');
  });
});

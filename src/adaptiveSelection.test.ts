import { describe, expect, test } from 'vitest';
import {
  wordSelectionWeight,
  pickAdaptiveWordIndex,
  MASTERY_THRESHOLD,
  emptyProgress,
  recordWordSpoken,
  recordWordStruggled,
} from './progress';
import type { WordStats } from './progress';

// Deterministic RNG (mulberry32) so distribution assertions are reproducible.
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawCounts(
  words: readonly string[],
  stats: Record<string, WordStats>,
  draws: number,
  seed = 1,
): number[] {
  const rng = mulberry32(seed);
  const counts = new Array(words.length).fill(0);
  for (let i = 0; i < draws; i++) {
    counts[pickAdaptiveWordIndex(words, stats, -1, rng)]++;
  }
  return counts;
}

describe('wordSelectionWeight (adaptive categories)', () => {
  test('an unseen word (no stats, or spoken 0) gets the moderate "introduce me" weight', () => {
    expect(wordSelectionWeight(undefined)).toBe(2);
    expect(wordSelectionWeight({ spoken: 0, struggled: 0 })).toBe(2);
  });

  test('a correctly-spoken but not-yet-mastered word gets the baseline weight', () => {
    expect(wordSelectionWeight({ spoken: 2, struggled: 0 })).toBe(1);
  });

  test('a mastered word (spoken >= threshold, never struggled) gets a low weight but is never zero', () => {
    const weight = wordSelectionWeight({ spoken: MASTERY_THRESHOLD, struggled: 0 });
    expect(weight).toBeGreaterThan(0);
    expect(weight).toBeLessThan(1);
  });

  test('a struggled word gets the highest weight and grows with struggle count, capped', () => {
    const once = wordSelectionWeight({ spoken: 3, struggled: 1 });
    const twice = wordSelectionWeight({ spoken: 3, struggled: 2 });
    const extreme = wordSelectionWeight({ spoken: 3, struggled: 50 });

    expect(twice).toBeGreaterThan(once);
    // Cap keeps a single very-struggled word from dominating forever.
    expect(extreme).toBe(wordSelectionWeight({ spoken: 3, struggled: 5 }));
  });

  test('ordering holds: struggled > unseen > normal > mastered', () => {
    const struggled = wordSelectionWeight({ spoken: 1, struggled: 1 });
    const unseen = wordSelectionWeight(undefined);
    const normal = wordSelectionWeight({ spoken: 2, struggled: 0 });
    const mastered = wordSelectionWeight({ spoken: MASTERY_THRESHOLD, struggled: 0 });

    expect(struggled).toBeGreaterThan(unseen);
    expect(unseen).toBeGreaterThan(normal);
    expect(normal).toBeGreaterThan(mastered);
  });
});

describe('pickAdaptiveWordIndex distribution', () => {
  const words = ['struggled', 'unseen', 'normal', 'mastered'] as const;
  const stats: Record<string, WordStats> = {
    struggled: { spoken: 4, struggled: 3 },
    normal: { spoken: 2, struggled: 0 },
    mastered: { spoken: MASTERY_THRESHOLD + 2, struggled: 0 },
    // "unseen" intentionally absent from stats (silent / never attempted).
  };

  test('struggled words are selected far more often than mastered ones', () => {
    const [struggled, unseen, normal, mastered] = drawCounts(words, stats, 8000);

    expect(struggled).toBeGreaterThan(normal);
    expect(struggled).toBeGreaterThan(mastered);
    expect(unseen).toBeGreaterThan(mastered);
    expect(normal).toBeGreaterThan(mastered);
  });

  test('silent/unseen and mastered words are deprioritized but never fully excluded', () => {
    const [, unseen, , mastered] = drawCounts(words, stats, 8000);

    expect(unseen).toBeGreaterThan(0);
    expect(mastered).toBeGreaterThan(0);
  });

  test('does not repeat the previous index immediately when other words exist', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i++) {
      expect(pickAdaptiveWordIndex(words, stats, 0, rng)).not.toBe(0);
    }
  });
});

describe('dynamic within the current round', () => {
  const gameId = 'boss-fight' as const;
  const words = ['a', 'b', 'c'] as const;

  test('an incorrect attempt this round immediately raises that word\'s selection weight', () => {
    let progress = emptyProgress();
    const before = progress[gameId].words;
    expect(wordSelectionWeight(before['b'])).toBe(wordSelectionWeight(before['a']));

    // Same round: the child struggles with "b". Games persist this and re-read
    // fresh stats before the next pick, so the change takes effect immediately.
    progress = recordWordStruggled(progress, gameId, 'b');
    const after = progress[gameId].words;

    expect(wordSelectionWeight(after['b'])).toBeGreaterThan(wordSelectionWeight(after['a']));
  });

  test('after struggling with a word this round it is drawn more often than its peers', () => {
    let progress = emptyProgress();
    progress = recordWordStruggled(progress, gameId, 'b');
    const stats = progress[gameId].words;

    const [a, b, c] = drawCounts(words, stats, 6000);

    expect(b).toBeGreaterThan(a);
    expect(b).toBeGreaterThan(c);
  });

  test('mastering a word this round pushes it below still-unseen peers', () => {
    let progress = emptyProgress();
    for (let i = 0; i < MASTERY_THRESHOLD; i++) {
      progress = recordWordSpoken(progress, gameId, 'a');
    }
    const stats = progress[gameId].words;

    // "a" is now mastered; "c" was never attempted (silent) this round.
    expect(wordSelectionWeight(stats['a'])).toBeLessThan(wordSelectionWeight(stats['c']));
  });
});

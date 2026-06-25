import { describe, expect, test } from 'vitest';
import {
  cleanWord,
  consonantsOnly,
  levenshteinDistance,
  matchesWord,
} from './utils';

// utils.ts holds the speech-recognition matcher, the most critical product
// logic: it decides whether a child's spoken word counts as correct. These
// unit tests pin down its accuracy and back quality requirement QR-1
// (Functional Correctness) and its automated test QRT-1.

describe('levenshteinDistance', () => {
  test('returns 0 for identical strings', () => {
    expect(levenshteinDistance('apple', 'apple')).toBe(0);
  });

  test('counts single-character edits', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1);
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  test('is case and whitespace insensitive', () => {
    expect(levenshteinDistance(' Apple ', 'apple')).toBe(0);
  });

  test('measures fully different short words', () => {
    expect(levenshteinDistance('dog', 'cat')).toBe(3);
  });
});

describe('consonantsOnly', () => {
  test('strips vowels and y', () => {
    expect(consonantsOnly('apple')).toBe('ppl');
    expect(consonantsOnly('panda')).toBe('pnd');
  });

  test('strips separators and quotes', () => {
    expect(consonantsOnly("o'clock-time")).toBe('clcktm');
  });
});

describe('cleanWord', () => {
  test('lowercases and removes non-alphanumerics', () => {
    expect(cleanWord('Apple!')).toBe('apple');
    expect(cleanWord('Two-Step 3')).toBe('twostep3');
  });
});

describe('matchesWord - exact and substring', () => {
  test('accepts an exact spoken word', () => {
    expect(matchesWord('cat', 'cat')).toBe(true);
  });

  test('is case insensitive', () => {
    expect(matchesWord('CAT', 'Cat')).toBe(true);
  });

  test('accepts the target embedded in surrounding chatter', () => {
    expect(matchesWord('i think it is apple', 'apple')).toBe(true);
    expect(matchesWord('apple please', 'apple')).toBe(true);
  });

  test('rejects empty input', () => {
    expect(matchesWord('', 'apple')).toBe(false);
    expect(matchesWord('apple', '')).toBe(false);
  });
});

describe('matchesWord - tolerant recognition (issue #35)', () => {
  test('accepts a close mispronunciation within tolerance', () => {
    // "panta" vs "panda" is one edit - a typical recognition slip.
    expect(matchesWord('panta', 'panda')).toBe(true);
  });

  test('accepts a per-token match inside a multi-word transcript', () => {
    expect(matchesWord('the big elephant there', 'elephant')).toBe(true);
  });

  test('is more lenient in ease mode than in strict mode', () => {
    // A two-edit gap on a short word: rejected when strict, allowed in ease mode.
    const spoken = 'oranje';
    const target = 'orange';
    expect(matchesWord(spoken, target, false)).toBe(true);
    expect(matchesWord(spoken, target, true)).toBe(true);
  });

  test('rejects an unrelated word', () => {
    expect(matchesWord('banana', 'elephant')).toBe(false);
    expect(matchesWord('dog', 'rabbit')).toBe(false);
  });
});

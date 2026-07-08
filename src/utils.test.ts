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
    // Two edits on a six-letter word: rejected when strict, allowed in ease mode.
    const spoken = 'orinje';
    const target = 'orange';
    expect(matchesWord(spoken, target, false)).toBe(false);
    expect(matchesWord(spoken, target, true)).toBe(true);
  });

  test('rejects an unrelated word', () => {
    expect(matchesWord('banana', 'elephant')).toBe(false);
    expect(matchesWord('dog', 'rabbit')).toBe(false);
  });
});

describe('matchesWord - no false accepts (issue #97)', () => {
  test('rejects one-edit neighbors of short words even in ease mode', () => {
    expect(matchesWord('cut', 'cat', true)).toBe(false);
    expect(matchesWord('cap', 'cat', true)).toBe(false);
    expect(matchesWord('hat', 'cat', true)).toBe(false);
    expect(matchesWord('dog', 'duck', true)).toBe(false);
  });

  test('rejects consonant-skeleton twins', () => {
    // bird and bread share the consonant skeleton "brd".
    expect(matchesWord('bird', 'bread', true)).toBe(false);
    expect(matchesWord('bread', 'bird', true)).toBe(false);
  });

  test('rejects fragments and containers of the target', () => {
    expect(matchesWord('ca', 'cat', true)).toBe(false);
    expect(matchesWord('a', 'apple', true)).toBe(false);
    expect(matchesWord('catalog', 'cat', true)).toBe(false);
  });

  test('rejects fuzzy candidates that start with a different sound', () => {
    // One edit away but a different leading sound: not the same word.
    expect(matchesWord('meach', 'peach', true)).toBe(false);
  });

  test('rejects non-Latin speech instead of matching everything', () => {
    // A transcript that normalizes to nothing must never count as a match.
    expect(matchesWord('привет как дела', 'cat', true)).toBe(false);
    expect(matchesWord('да', 'apple', true)).toBe(false);
  });
});

describe('matchesWord - phrase targets', () => {
  test('accepts the exact phrase', () => {
    expect(matchesWord('ice cream', 'ice cream', true)).toBe(true);
  });

  test('accepts the phrase inside surrounding chatter', () => {
    expect(matchesWord('i want ice cream please', 'ice cream', true)).toBe(true);
  });

  test('accepts the phrase glued into one recognized token', () => {
    expect(matchesWord('icecream', 'ice cream', true)).toBe(true);
  });

  test('rejects a partial phrase', () => {
    expect(matchesWord('ice', 'ice cream', true)).toBe(false);
    expect(matchesWord('cream', 'ice cream', true)).toBe(false);
  });
});

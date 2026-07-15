import { describe, expect, test } from 'vitest';
import { parseBulkWords } from './CustomWordsManager';

describe('parseBulkWords', () => {
  test('parses one word-translation pair per line with the vertical bar delimiter', () => {
    const { pairs, skipped } = parseBulkWords('hello|привет\nbye|пока');

    expect(skipped).toBe(0);
    expect(pairs).toEqual([
      { word: 'hello', translation: 'привет' },
      { word: 'bye', translation: 'пока' },
    ]);
  });

  test('accepts the semicolon delimiter too', () => {
    const { pairs } = parseBulkWords('cat;кот');

    expect(pairs).toEqual([{ word: 'cat', translation: 'кот' }]);
  });

  test('preserves spaces inside multi-word phrases and only splits on the first delimiter', () => {
    const { pairs } = parseBulkWords('good morning | доброе утро');

    expect(pairs).toEqual([{ word: 'good morning', translation: 'доброе утро' }]);
  });

  test('ignores blank lines and counts malformed lines as skipped without dropping valid ones', () => {
    const { pairs, skipped } = parseBulkWords('\nhello|привет\nno-delimiter-here\n   \nbye|пока');

    expect(pairs).toEqual([
      { word: 'hello', translation: 'привет' },
      { word: 'bye', translation: 'пока' },
    ]);
    expect(skipped).toBe(1);
  });

  test('skips lines whose English side has invalid characters or an empty translation', () => {
    const { pairs, skipped } = parseBulkWords('café|кафе\nhello|');

    expect(pairs).toEqual([]);
    expect(skipped).toBe(2);
  });
});

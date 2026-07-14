import { describe, expect, test } from 'vitest';
import { parseWordPairs } from './CustomWordsManager';

describe('parseWordPairs', () => {
  test('imports a standard comma-separated file with a header', () => {
    const { pairs, skipped } = parseWordPairs('word,translation\nhello,привет\nbye,пока');

    expect(skipped).toBe(0);
    expect(pairs).toEqual([
      { word: 'hello', translation: 'привет' },
      { word: 'bye', translation: 'пока' },
    ]);
  });

  test('accepts a headerless CSV and semicolon separators used by spreadsheet locales', () => {
    const { pairs, skipped } = parseWordPairs('cat;кот\ndog;собака');

    expect(skipped).toBe(0);
    expect(pairs).toEqual([
      { word: 'cat', translation: 'кот' },
      { word: 'dog', translation: 'собака' },
    ]);
  });

  test('supports quoted fields, commas and escaped quotes', () => {
    const { pairs } = parseWordPairs(
      'word,translation\n"hello, friend","привет, друг"\n"say ""hello""","скажи привет"',
    );

    expect(pairs).toEqual([
      { word: 'hello, friend', translation: 'привет, друг' },
      { word: 'say "hello"', translation: 'скажи привет' },
    ]);
  });

  test('accepts a UTF-8 BOM, Windows line endings and Russian header names', () => {
    const { pairs, skipped } = parseWordPairs('\uFEFFслово,перевод\r\ngood morning,доброе утро\r\n');

    expect(skipped).toBe(0);
    expect(pairs).toEqual([{ word: 'good morning', translation: 'доброе утро' }]);
  });

  test('keeps valid rows and reports malformed or incomplete rows as skipped', () => {
    const { pairs, skipped } = parseWordPairs(
      'word,translation\nhello,привет\nmissing translation,\ncafé,кафе\nonly-one-column',
    );

    expect(pairs).toEqual([{ word: 'hello', translation: 'привет' }]);
    expect(skipped).toBe(3);
  });

  test('uses only the first two columns as word and translation', () => {
    const { pairs } = parseWordPairs('word,translation,note\nfox,лиса,optional note');

    expect(pairs).toEqual([{ word: 'fox', translation: 'лиса' }]);
  });

  test('rejects an unterminated quoted row without dropping earlier valid rows', () => {
    const { pairs, skipped } = parseWordPairs('word,translation\ncat,кот\n"broken,строка');

    expect(pairs).toEqual([{ word: 'cat', translation: 'кот' }]);
    expect(skipped).toBe(1);
  });

  test('parses a hand-typed pipe-separated list pasted into the textarea', () => {
    const { pairs, skipped } = parseWordPairs('hello | привет\ngood morning | доброе утро');

    expect(skipped).toBe(0);
    expect(pairs).toEqual([
      { word: 'hello', translation: 'привет' },
      { word: 'good morning', translation: 'доброе утро' },
    ]);
  });

  test('keeps a comma inside a pasted translation when the pipe is the delimiter', () => {
    const { pairs } = parseWordPairs('hello | привет, друг');

    expect(pairs).toEqual([{ word: 'hello', translation: 'привет, друг' }]);
  });

  test('skips pasted lines that have no delimiter but keeps the valid ones', () => {
    const { pairs, skipped } = parseWordPairs('cat | кот\njust-one-word\ndog | собака');

    expect(pairs).toEqual([
      { word: 'cat', translation: 'кот' },
      { word: 'dog', translation: 'собака' },
    ]);
    expect(skipped).toBe(1);
  });
});

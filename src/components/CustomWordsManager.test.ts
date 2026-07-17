import { describe, expect, test } from 'vitest';
import { parseWordPairs } from './CustomWordsManager';

describe('parseWordPairs', () => {
  test('parses two tab-separated columns copied from a spreadsheet', () => {
    const { pairs, skipped } = parseWordPairs('word\ttranslation\nhello\tпривет\nbye\tпока');

    expect(skipped).toBe(0);
    expect(pairs).toEqual([
      { word: 'hello', translation: 'привет' },
      { word: 'bye', translation: 'пока' },
    ]);
  });

  test('supports UTF-8 BOM, CRLF, blank rows and Russian headers', () => {
    const { pairs, skipped } = parseWordPairs(
      '\uFEFFслово\tперевод\r\ngood morning\tдоброе утро\r\n\r\n',
    );

    expect(skipped).toBe(0);
    expect(pairs).toEqual([{ word: 'good morning', translation: 'доброе утро' }]);
  });

  test('preserves spaces inside phrases and Unicode translations', () => {
    const { pairs } = parseWordPairs(
      'thank you very much\tбольшое спасибо\nice cream\tмороженое',
    );

    expect(pairs).toEqual([
      { word: 'thank you very much', translation: 'большое спасибо' },
      { word: 'ice cream', translation: 'мороженое' },
    ]);
  });

  test('parses four-space separators without splitting English phrases', () => {
    const { pairs, skipped } = parseWordPairs(
      'word    translation\nNice to meet you    Приятно познакомиться\nHow are you?    Как дела?',
    );

    expect(skipped).toBe(0);
    expect(pairs).toEqual([
      { word: 'Nice to meet you', translation: 'Приятно познакомиться' },
      { word: 'How are you?', translation: 'Как дела?' },
    ]);
  });

  test('rejects CSV, semicolon, pipe, three-space and five-space separators', () => {
    const { pairs, skipped } = parseWordPairs(
      'cat,кот\ndog;собака\nfox | лиса\ngood morning доброе утро\nthank you   спасибо\nsee you     увидимся',
    );

    expect(pairs).toEqual([]);
    expect(skipped).toBe(6);
  });

  test('keeps valid rows and reports missing or extra columns', () => {
    const { pairs, skipped } = parseWordPairs(
      'cat\tкот\nmissing translation\t\nfox\tлиса\textra',
    );

    expect(pairs).toEqual([{ word: 'cat', translation: 'кот' }]);
    expect(skipped).toBe(2);
  });
});

import { describe, expect, test } from 'vitest';
import { BUILTIN_CATEGORIES } from './data';

// Data-integrity tests for the built-in word lists. The games depend on every
// category having usable, unique, non-empty words, so a broken list would
// silently break gameplay. Backs quality requirement QR-1 (Functional
// Correctness) at the content level.

describe('BUILTIN_CATEGORIES', () => {
  test('ships several categories', () => {
    expect(BUILTIN_CATEGORIES.length).toBeGreaterThanOrEqual(5);
  });

  test('every category has a stable id, name, icon and words', () => {
    for (const category of BUILTIN_CATEGORIES) {
      expect(category.id).toBeTruthy();
      expect(category.name).toBeTruthy();
      expect(category.icon).toBeTruthy();
      expect(category.words.length).toBeGreaterThanOrEqual(10);
    }
  });

  test('category ids are unique', () => {
    const ids = BUILTIN_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every word is a non-empty trimmed string with a translation', () => {
    for (const category of BUILTIN_CATEGORIES) {
      for (const entry of category.words) {
        expect(entry.word.trim().length).toBeGreaterThan(0);
        expect(entry.word).toBe(entry.word.trim());
        expect(entry.translation.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('words within a category are unique (case-insensitive)', () => {
    for (const category of BUILTIN_CATEGORIES) {
      const words = category.words.map((w) => w.word.toLowerCase());
      expect(new Set(words).size).toBe(words.length);
    }
  });

  test('the Animals category carries Russian translations for bilingual play', () => {
    const animals = BUILTIN_CATEGORIES.find((c) => c.id === 'animals');
    expect(animals).toBeDefined();
    expect(animals!.words.every((w) => Boolean(w.translationRu))).toBe(true);
  });
});

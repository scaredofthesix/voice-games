import { describe, expect, test } from 'vitest';

import {
  buildSpellRecipe,
  findSpokenRune,
  MAX_RECIPE_SIZE,
  matchesCursedRune,
} from './magicWizardLogic';
import type { WordData } from './types';

const WORDS: WordData[] = [
  { word: 'Apple', translation: 'Fruit', translationRu: 'Яблоко', speakCount: 0, struggleCount: 0 },
  { word: 'Banana', translation: 'Fruit', translationRu: 'Банан', speakCount: 0, struggleCount: 0 },
  { word: 'Cherry', translation: 'Fruit', translationRu: 'Вишня', speakCount: 0, struggleCount: 0 },
  { word: 'Dragon', translation: 'Creature', translationRu: 'Дракон', speakCount: 0, struggleCount: 0 },
  { word: 'Emerald', translation: 'Gem', translationRu: 'Изумруд', speakCount: 0, struggleCount: 0 },
  { word: 'Forest', translation: 'Place', translationRu: 'Лес', speakCount: 0, struggleCount: 0 },
];

describe('Magic Wizard spell recipes', () => {
  test('grows from two runes to the five-rune cap without duplicates', () => {
    const first = buildSpellRecipe(WORDS, {}, 0, -1, () => 0);
    const final = buildSpellRecipe(WORDS, {}, 10, -1, () => 0);

    expect(first.runes).toHaveLength(2);
    expect(final.runes).toHaveLength(MAX_RECIPE_SIZE);
    expect(new Set(final.runes.map((rune) => rune.word))).toHaveLength(
      MAX_RECIPE_SIZE,
    );
    expect(final.cursedRune?.word).toBe('Forest');
    expect(final.runes).not.toContain(final.cursedRune);
  });

  test('supports a one-word custom list', () => {
    const recipe = buildSpellRecipe(WORDS.slice(0, 1), {}, 3, -1, () => 0.5);

    expect(recipe.runes.map((rune) => rune.word)).toEqual(['Apple']);
    expect(recipe.cursedRune).toBeNull();
  });

  test('one recognition event charges only the first matching open rune', () => {
    const repeated = [WORDS[0], WORDS[0], WORDS[1]];

    expect(findSpokenRune('apple', repeated, new Set())).toBe(0);
    expect(findSpokenRune('apple', repeated, new Set([0]))).toBe(1);
    expect(findSpokenRune('apple', repeated, new Set([0, 1]))).toBe(-1);
  });

  test('only the displayed curse word triggers the curse', () => {
    expect(matchesCursedRune('dragon', WORDS[3])).toBe(true);
    expect(matchesCursedRune('apple', WORDS[3])).toBe(false);
    expect(matchesCursedRune('dragon', null)).toBe(false);
  });
});

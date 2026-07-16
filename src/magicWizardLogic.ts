import { pickAdaptiveWordIndex, type WordStats } from './progress';
import type { WordData } from './types';
import { matchesWord } from './utils';

export const SPELLS_PER_SESSION = 4;
export const FIRST_RECIPE_SIZE = 2;
export const MAX_RECIPE_SIZE = 5;

export interface SpellRecipe {
  runes: WordData[];
  lastWordIndex: number;
}

/**
 * Build a progressively larger spell recipe while keeping the existing
 * progress-weighted word scheduling. A recipe never repeats a word when the
 * selected word set has enough distinct entries.
 */
export function buildSpellRecipe(
  words: readonly WordData[],
  wordStats: Record<string, WordStats>,
  round: number,
  previousWordIndex = -1,
  rng: () => number = Math.random,
): SpellRecipe {
  if (words.length === 0) {
    return { runes: [], lastWordIndex: -1 };
  }

  const recipeSize = Math.min(
    words.length,
    MAX_RECIPE_SIZE,
    FIRST_RECIPE_SIZE + round,
  );
  const available = words.map((word, originalIndex) => ({ word, originalIndex }));
  const runes: WordData[] = [];
  let lastWordIndex = previousWordIndex;

  while (runes.length < recipeSize && available.length > 0) {
    const candidateWords = available.map(({ word }) => word.word);
    const previousCandidateIndex = available.findIndex(
      ({ originalIndex }) => originalIndex === lastWordIndex,
    );
    const selectedCandidateIndex = pickAdaptiveWordIndex(
      candidateWords,
      wordStats,
      previousCandidateIndex,
      rng,
    );
    const [selected] = available.splice(selectedCandidateIndex, 1);
    runes.push(selected.word);
    lastWordIndex = selected.originalIndex;
  }

  return { runes, lastWordIndex };
}

/** Return the first uncharged rune matched by one recognition event. */
export function findSpokenRune(
  transcript: string,
  runes: readonly WordData[],
  chargedRuneIndexes: ReadonlySet<number>,
): number {
  return runes.findIndex(
    (rune, index) =>
      !chargedRuneIndexes.has(index) && matchesWord(transcript, rune.word, true),
  );
}

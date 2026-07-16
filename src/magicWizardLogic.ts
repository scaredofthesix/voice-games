import { pickAdaptiveWordIndex, type WordStats } from './progress';
import type { WordData } from './types';
import { matchesWord } from './utils';

export const SPELLS_PER_SESSION = 4;
export const FIRST_RECIPE_SIZE = 2;
export const MAX_RECIPE_SIZE = 5;

export interface SpellRecipe {
  runes: WordData[];
  cursedRune: WordData | null;
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
    return { runes: [], cursedRune: null, lastWordIndex: -1 };
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

  const runeWords = new Set(runes.map((rune) => rune.word.toLocaleLowerCase()));
  const curseCandidates = available.filter(
    ({ word }) => !runeWords.has(word.word.toLocaleLowerCase()),
  );
  const curseIndex = curseCandidates.length > 0
    ? Math.min(
        curseCandidates.length - 1,
        Math.floor(rng() * curseCandidates.length),
      )
    : -1;

  return {
    runes,
    cursedRune: curseCandidates[curseIndex]?.word || null,
    lastWordIndex,
  };
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

/** A curse only triggers when its explicitly displayed English word is spoken. */
export function matchesCursedRune(
  transcript: string,
  cursedRune: WordData | null,
): boolean {
  return cursedRune ? matchesWord(transcript, cursedRune.word, true) : false;
}

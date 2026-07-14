/**
 * Pure, testable progress persistence module.
 *
 * Persists per-game progress (sessions played, high scores, words practiced)
 * to localStorage. Designed to be decoupled from React rendering so it can be
 * unit tested deterministically.
 *
 * Created for US-10 / Issue #25 (Sprint 3, MVP v2).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WordStats {
  spoken: number;
  struggled: number;
}

export interface GameProgress {
  sessionsPlayed: number;
  highScore: number;
  words: Record<string, WordStats>;
}

export type GameId =
  | 'voice-racer'
  | 'bubble-popper'
  | 'boss-fight'
  | 'word-ladder'
  | 'skate-word'
  | 'aste-word'
  | 'treasure-hunter'
  | 'sentence-bird'
  | 'echo-recorder'
  | 'magic-wizard';

export const ALL_GAME_IDS: readonly GameId[] = [
  'voice-racer',
  'bubble-popper',
  'boss-fight',
  'word-ladder',
  'skate-word',
  'aste-word',
  'treasure-hunter',
  'sentence-bird',
  'echo-recorder',
  'magic-wizard',
] as const;

export const GAME_LABELS: Record<GameId, { en: string; ru: string; icon: string }> = {
  'voice-racer': { en: 'Voice Lane Racer', ru: 'Голосовая Гонка', icon: '🚗' },
  'bubble-popper': { en: 'Voice Bubble Popper', ru: 'Лопание Пузырей', icon: '🫧' },
  'boss-fight': { en: 'Boss Fight', ru: 'Бой с Боссом', icon: '⚔️' },
  'word-ladder': { en: 'Voice Rocket Climb', ru: 'Космический Старт', icon: '🚀' },
  'skate-word': { en: 'SkateWord', ru: 'СкейтВорд', icon: '🛹' },
  'aste-word': { en: 'AsteWord Destroyer', ru: 'АстеВорд Разрушитель', icon: '☄️' },
  'treasure-hunter': { en: 'Voice Treasure Hunter', ru: 'Поиск сокровищ', icon: '🐳' },
  'sentence-bird': { en: 'Sentence Bird', ru: 'Фразоптичка', icon: '🐦' },
  'echo-recorder': { en: 'Echo Microphone', ru: 'Эхо-микрофон', icon: '🎤' },
  'magic-wizard': { en: 'Magic Wizard', ru: 'Магический Волшебник', icon: '🧙' },
};

export type AllGamesProgress = Record<GameId, GameProgress>;

const STORAGE_KEY = 'voice_games_progress';

// Old standalone localStorage keys used before the unified progress system.
// Used for backward-compatible migration on first load.
const LEGACY_HIGHSCORE_KEYS: Record<GameId, string> = {
  'voice-racer': 'voice_racer_highscore',
  'bubble-popper': 'bubble_popper_highscore',
  'boss-fight': 'boss_fight_highscore',
  'word-ladder': 'word_ladder_highscore',
  'skate-word': 'skate_word_highscore',
  'aste-word': 'aste_word_highscore',
  'treasure-hunter': 'treasure_hunter_highscore',
  'sentence-bird': 'sentence_bird_highscore',
  'echo-recorder': 'echo_recorder_highscore',
  'magic-wizard': 'magic_wizard_highscore',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function emptyGameProgress(): GameProgress {
  return { sessionsPlayed: 0, highScore: 0, words: {} };
}

export function emptyProgress(): AllGamesProgress {
  return Object.fromEntries(
    ALL_GAME_IDS.map((id) => [id, emptyGameProgress()]),
  ) as AllGamesProgress;
}

// ---------------------------------------------------------------------------
// Load / Save
// ---------------------------------------------------------------------------

/** Recover high scores from the old standalone per-game localStorage keys. */
function progressFromLegacyHighScores(): AllGamesProgress {
  const fresh = emptyProgress();
  for (const id of ALL_GAME_IDS) {
    try {
      const legacy = localStorage.getItem(LEGACY_HIGHSCORE_KEYS[id]);
      if (legacy) {
        const val = parseInt(legacy, 10);
        if (!isNaN(val) && val > 0) {
          fresh[id].highScore = val;
        }
      }
    } catch {
      // Ignore per-key errors.
    }
  }
  return fresh;
}

/**
 * Load all progress from localStorage. Migrates legacy high scores on the very
 * first load (`voice_games_progress` has never been written).
 *
 * If the stored blob exists but cannot be parsed (corrupted data, e.g. from a
 * cross-tab write race or manual tampering), this returns a fresh, legacy-
 * high-score-recovered snapshot for the CURRENT call only and does NOT persist
 * it. Previously this path called saveProgress() on the reset snapshot, which
 * permanently destroyed every game's sessions/words history on a single bad
 * read - see issue #103. Not auto-persisting means a transient read failure
 * cannot turn into permanent data loss, and leaves the original (possibly
 * still-recoverable) stored value untouched for a future read.
 */
export function loadProgress(): AllGamesProgress {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    // Genuine first load: nothing has ever been saved. Migrate legacy
    // high-score keys and persist the migrated result as the new baseline.
    const fresh = progressFromLegacyHighScores();
    saveProgress(fresh);
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AllGamesProgress>;
    // Ensure every game ID is present (new games added after the save).
    const full = emptyProgress();
    for (const id of ALL_GAME_IDS) {
      if (parsed[id]) {
        full[id] = { ...emptyGameProgress(), ...parsed[id] };
      }
    }
    return full;
  } catch {
    // Stored value exists but is not valid JSON. Do not overwrite it -
    // return a legacy-recovered snapshot for this read only.
    return progressFromLegacyHighScores();
  }
}

/** Persist the full progress blob to localStorage. */
export function saveProgress(progress: AllGamesProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage full or unavailable; silently fail.
  }
}

// ---------------------------------------------------------------------------
// Mutation helpers (pure: return a new object, caller saves)
// ---------------------------------------------------------------------------

export function recordSessionPlayed(
  progress: AllGamesProgress,
  gameId: GameId,
): AllGamesProgress {
  const game = { ...progress[gameId] };
  game.sessionsPlayed += 1;
  return { ...progress, [gameId]: game };
}

export function recordHighScore(
  progress: AllGamesProgress,
  gameId: GameId,
  score: number,
): AllGamesProgress {
  const game = { ...progress[gameId] };
  if (score > game.highScore) {
    game.highScore = score;
  }
  return { ...progress, [gameId]: game };
}

export function recordWordSpoken(
  progress: AllGamesProgress,
  gameId: GameId,
  word: string,
): AllGamesProgress {
  const game = { ...progress[gameId], words: { ...progress[gameId].words } };
  const prev = game.words[word] || { spoken: 0, struggled: 0 };
  game.words[word] = { ...prev, spoken: prev.spoken + 1 };
  return { ...progress, [gameId]: game };
}

export function recordWordStruggled(
  progress: AllGamesProgress,
  gameId: GameId,
  word: string,
): AllGamesProgress {
  const game = { ...progress[gameId], words: { ...progress[gameId].words } };
  const prev = game.words[word] || { spoken: 0, struggled: 0 };
  game.words[word] = { ...prev, struggled: prev.struggled + 1 };
  return { ...progress, [gameId]: game };
}

// ---------------------------------------------------------------------------
// Adaptive word selection
// Issue #105 (Sprint 3 customer review, top Sprint 4 priority): games should
// pick the next word using recorded progress instead of uniform randomness,
// so struggled words resurface soon, unseen words get introduced, and
// well-known words are shown less often.
// ---------------------------------------------------------------------------

/**
 * A word spoken correctly this many times, without ever being struggled with,
 * is considered "mastered" and gets a much lower selection weight (but is
 * never fully excluded).
 */
export const MASTERY_THRESHOLD = 5;

const WEIGHT_UNSEEN = 2;
const WEIGHT_NORMAL = 1;
const WEIGHT_MASTERED = 0.2;
const WEIGHT_STRUGGLED_BASE = 4;
const WEIGHT_STRUGGLED_CAP = 5;

/**
 * Selection weight for a single word given its recorded stats. Struggled
 * words are weighted highest, more so the more times they were struggled with
 * (capped so one very-struggled word doesn't dominate every round). Unseen
 * words get a moderate weight so they get introduced once there is nothing
 * left to reinforce. Mastered words (see MASTERY_THRESHOLD) are shown much
 * less often, and everything else gets the baseline weight.
 */
export function wordSelectionWeight(stats: WordStats | undefined): number {
  if (!stats) return WEIGHT_UNSEEN;
  // A struggled word is prioritized even if it has never been said correctly
  // yet (spoken === 0). This is what makes an incorrect/silent attempt in the
  // current round immediately raise the word's chance of coming back, instead
  // of it being mistaken for a fresh unseen word.
  if (stats.struggled > 0) {
    return WEIGHT_STRUGGLED_BASE + Math.min(stats.struggled, WEIGHT_STRUGGLED_CAP);
  }
  if (stats.spoken === 0) return WEIGHT_UNSEEN;
  if (stats.spoken >= MASTERY_THRESHOLD) return WEIGHT_MASTERED;
  return WEIGHT_NORMAL;
}

/**
 * Pick the next word index using progress-weighted random selection: words
 * struggled with in the past are much more likely to come up again, unseen
 * words get a fair shot, and mastered words are deprioritized without being
 * excluded. Avoids an immediate repeat of `previous` when there is more than
 * one word to choose from. `rng` returns a float in [0, 1) (defaults to
 * Math.random) so callers in tests can inject a fixed value.
 */
export function pickAdaptiveWordIndex(
  words: readonly string[],
  wordStats: Record<string, WordStats>,
  previous: number = -1,
  rng: () => number = Math.random,
): number {
  if (words.length === 0) return -1;
  if (words.length === 1) return 0;

  const weights = words.map((word, i) =>
    i === previous ? 0 : wordSelectionWeight(wordStats[word]),
  );
  const total = weights.reduce((sum, w) => sum + w, 0);

  if (total <= 0) {
    // Every candidate got zeroed out; fall back to a plain random pick.
    return Math.min(words.length - 1, Math.floor(rng() * words.length));
  }

  let roll = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return i;
  }
  return weights.length - 1; // floating-point rounding fallback
}

// ---------------------------------------------------------------------------
// Clear
// ---------------------------------------------------------------------------

export function clearProgress(): AllGamesProgress {
  const fresh = emptyProgress();
  saveProgress(fresh);
  return fresh;
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

export function progressToCsv(progress: AllGamesProgress): string {
  const separator = ';';
  const rows: string[][] = [
    ['Game', 'Sessions Played', 'High Score', 'Word', 'Times Spoken', 'Times Struggled'],
  ];

  for (const gameId of ALL_GAME_IDS) {
    const g = progress[gameId];
    const label = GAME_LABELS[gameId].en;
    const words = Object.keys(g.words);
    if (words.length === 0) {
      rows.push([label, String(g.sessionsPlayed), String(g.highScore), '', '', '']);
    } else {
      for (const word of words) {
        const w = g.words[word];
        rows.push([label, String(g.sessionsPlayed), String(g.highScore), word, String(w.spoken), String(w.struggled)]);
      }
    }
  }

  const dataRows = rows.map((row) =>
    row.map((value) => `"${value.replace(/"/g, '""')}"`).join(separator),
  );
  return [`sep=${separator}`, ...dataRows].join('\r\n');
}

/** Trigger a CSV file download in the browser. */
export function downloadProgressCsv(progress: AllGamesProgress): void {
  const csv = progressToCsv(progress);
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'voice_games_progress.csv';
  a.click();
  URL.revokeObjectURL(url);
}

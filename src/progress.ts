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
  | 'magic-wizard';

export const ALL_GAME_IDS: readonly GameId[] = [
  'voice-racer',
  'bubble-popper',
  'boss-fight',
  'word-ladder',
  'skate-word',
  'aste-word',
  'magic-wizard',
] as const;

export const GAME_LABELS: Record<GameId, { en: string; ru: string; icon: string }> = {
  'voice-racer': { en: 'Voice Lane Racer', ru: 'Голосовая Гонка', icon: '🚗' },
  'bubble-popper': { en: 'Voice Bubble Popper', ru: 'Лопание Пузырей', icon: '🫧' },
  'boss-fight': { en: 'Boss Fight', ru: 'Бой с Боссом', icon: '⚔️' },
  'word-ladder': { en: 'Voice Rocket Climb', ru: 'Космический Старт', icon: '🚀' },
  'skate-word': { en: 'SkateWord', ru: 'СкейтВорд', icon: '🛹' },
  'aste-word': { en: 'AsteWord Destroyer', ru: 'АстеВорд Разрушитель', icon: '☄️' },
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

/** Load all progress from localStorage. Migrates legacy high scores on first load. */
export function loadProgress(): AllGamesProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AllGamesProgress>;
      // Ensure every game ID is present (new games added after the save).
      const full = emptyProgress();
      for (const id of ALL_GAME_IDS) {
        if (parsed[id]) {
          full[id] = { ...emptyGameProgress(), ...parsed[id] };
        }
      }
      return full;
    }
  } catch {
    // Corrupt data; fall through to migration / default.
  }

  // First load: migrate legacy standalone high score keys.
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
  saveProgress(fresh);
  return fresh;
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
  const rows: string[] = [
    'Game,Sessions Played,High Score,Word,Times Spoken,Times Struggled',
  ];

  for (const gameId of ALL_GAME_IDS) {
    const g = progress[gameId];
    const label = GAME_LABELS[gameId].en;
    const words = Object.keys(g.words);
    if (words.length === 0) {
      rows.push(`"${label}",${g.sessionsPlayed},${g.highScore},"","",""` );
    } else {
      for (const word of words) {
        const w = g.words[word];
        rows.push(
          `"${label}",${g.sessionsPlayed},${g.highScore},"${word}",${w.spoken},${w.struggled}`,
        );
      }
    }
  }

  return rows.join('\n');
}

/** Trigger a CSV file download in the browser. */
export function downloadProgressCsv(progress: AllGamesProgress): void {
  const csv = progressToCsv(progress);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'voice_games_progress.csv';
  a.click();
  URL.revokeObjectURL(url);
}

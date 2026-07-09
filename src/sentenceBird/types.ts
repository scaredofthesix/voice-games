export interface SentenceItem {
  id: string;
  steps: string[]; // e.g. ["Sun", "Sun is", "Sun is shining"]
  translation: string; // Translation for the complete sentence (e.g. Russian)
  category: string; // e.g., "Weather", "Animals", "My Day"
}

export type SceneType = 'forest' | 'winter' | 'space' | 'ninja';

export interface GameScene {
  id: SceneType;
  name: string;
  themeColor: string; // Hex color or Tailwind class
  bgClass: string; // Tailwind bg class
  accentClass: string;
  cloudClass: string;
  groundClass: string;
  ambientSoundEmoji: string;
  particleEmoji: string;
}

export type GameState = 'start' | 'tutorial' | 'playing' | 'level_complete' | 'game_over';

export interface GameStats {
  score: number; // total steps completed
  completedSentencesCount: number;
  totalAttempts: number;
  wrongWords: { [word: string]: number }; // list of words mispronounced with count
}

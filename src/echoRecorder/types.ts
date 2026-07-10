export type EchoGamePhase = 'start' | 'playback' | 'recording' | 'victory';

export interface EchoWord {
  text: string;
  translation: string;
  emoji?: string;
  phonetic?: string;
}

export interface EchoLevel {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  pool: EchoWord[];
  targetChainLength: number;
  speechPitch: number;
  speechRate: number;
}

export interface EchoGameStats {
  score: number;
  longestChain: number;
  totalAttempts: number;
  correctRounds: number;
  failedWords: Record<string, number>;
}

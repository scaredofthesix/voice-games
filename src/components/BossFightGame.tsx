import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Heart, Mic, Play, RotateCcw, Shield, Swords, Volume2 } from 'lucide-react';

import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
import {
  BossFightState,
  bossHitByWord,
  createBossFight,
  DEFAULT_BOSS_HP,
  DEFAULT_PLAYER_HP,
  pickNextIndex,
  playerHitByTimeout,
} from '../gameLogic';
import { matchesWord, speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';

// Boss Fight: a prince fights a boss by pronouncing words. Each correct word
// removes 1 boss HP; if the child cannot pronounce the word in time, the boss
// deals 1 damage. The game rules live in gameLogic.ts; this component is the UI
// shell, voice wiring and timer around them. Added in Sprint 2 (Assignment 4).

const WORD_TIME_SECONDS = 10;

interface BossFightGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
}

export function BossFightGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
}: BossFightGameProps) {
  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [fight, setFight] = useState<BossFightState>(() => createBossFight());
  const [phase, setPhase] = useState<'START' | 'PLAYING'>('START');
  const [target, setTarget] = useState('');
  const [timeLeft, setTimeLeft] = useState(WORD_TIME_SECONDS);
  const [hitFlash, setHitFlash] = useState(false);

  // Refs keep the recognition thread reading current values (no stale closures).
  const phaseRef = useRef(phase);
  const targetRef = useRef(target);
  const wordIndexRef = useRef(-1);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  const wordList = useCallback((): WordData[] => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0
        ? customWords
        : (BUILTIN_CATEGORIES[0].words as WordData[]);
    }
    return activeCategory.words as WordData[];
  }, [activeCategory, customWords]);

  const nextWord = useCallback(() => {
    const list = wordList();
    if (list.length === 0) return;
    const idx = pickNextIndex(list.length, wordIndexRef.current);
    wordIndexRef.current = idx;
    const word = list[idx].word;
    setTarget(word);
    setTimeLeft(WORD_TIME_SECONDS);
    speakWord(word);
  }, [wordList]);

  // Sync the score (words defeated) up to the parent for the hub record card.
  useEffect(() => {
    onScoreChange?.(fight.wordsDefeated);
  }, [fight.wordsDefeated, onScoreChange]);

  // Persist a new record when the boss is beaten.
  useEffect(() => {
    if (fight.status === 'won' && fight.wordsDefeated > highScore) {
      onUpdateHighScore?.(fight.wordsDefeated);
    }
  }, [fight.status, fight.wordsDefeated, highScore, onUpdateHighScore]);

  const handleTranscript = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'PLAYING') return;
      const current = targetRef.current;
      if (!current) return;
      if (matchesWord(text, current, true)) {
        setFight((prev) => {
          const updated = bossHitByWord(prev);
          if (updated.status === 'won') speakSound.playSuccess();
          else speakSound.playCoin();
          return updated;
        });
        setHitFlash(true);
        setTimeout(() => setHitFlash(false), 500);
        nextWord();
      }
    },
    [nextWord],
  );

  const { status, lastTranscript, isSupported, start, stop } =
    useSpeechRecognition(handleTranscript);

  const beginFight = useCallback(() => {
    speakSound.playCoin();
    setFight(createBossFight(DEFAULT_BOSS_HP, DEFAULT_PLAYER_HP));
    setPhase('PLAYING');
    wordIndexRef.current = -1;
    nextWord();
    start();
  }, [nextWord, start]);

  const restart = useCallback(() => {
    setFight(createBossFight(DEFAULT_BOSS_HP, DEFAULT_PLAYER_HP));
    wordIndexRef.current = -1;
    nextWord();
    setPhase('PLAYING');
  }, [nextWord]);

  // Stop listening once the round ends.
  useEffect(() => {
    if (fight.status !== 'playing') stop();
  }, [fight.status, stop]);

  // Per-word countdown: when it runs out, the boss hits the player.
  useEffect(() => {
    if (phase !== 'PLAYING' || fight.status !== 'playing') return;
    if (timeLeft <= 0) {
      setFight((prev) => playerHitByTimeout(prev));
      speakSound.playMiss();
      nextWord();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, fight.status, timeLeft, nextWord]);

  const isOver = fight.status !== 'playing';

  return (
    <section
      className="max-w-md mx-auto py-4 px-2"
      aria-label="Boss Fight game"
    >
      <button
        onClick={() => {
          stop();
          onBackToHub();
        }}
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900"
        aria-label="Back to the game hub"
      >
        <ArrowLeft className="w-4 h-4 stroke-[3]" /> Hub
      </button>

      {phase === 'START' ? (
        <div className="text-center space-y-5" id="boss-fight-start">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-3xl bg-rose-500 border-4 border-slate-900 flex items-center justify-center">
              <Swords className="w-9 h-9 text-white stroke-[3]" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900">
              Boss Fight
            </h1>
            <p className="text-xs font-bold text-slate-600 max-w-xs leading-relaxed">
              Say each English word out loud to hit the boss. Beat the boss
              before it beats you! You have {WORD_TIME_SECONDS} seconds per word.
            </p>
          </div>

          <fieldset className="text-left">
            <legend className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Choose a word set
            </legend>
            <div className="flex flex-wrap gap-2">
              {BUILTIN_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory.id === cat.id}
                  className={`px-3 py-1.5 rounded-xl border-4 text-xs font-black uppercase tracking-wide ${
                    activeCategory.id === cat.id
                      ? 'bg-rose-400 border-slate-900 text-white'
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </fieldset>

          {!isSupported && (
            <p className="text-xs font-bold text-rose-600" role="alert">
              Voice control needs Google Chrome. Please open the game in Chrome.
            </p>
          )}

          <button
            onClick={beginFight}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2"
            aria-label="Start the boss fight"
          >
            <Play className="w-4 h-4 fill-current stroke-[3]" /> Start Fight
          </button>
        </div>
      ) : (
        <div className={`space-y-4 ${hitFlash ? 'animate-pulse' : ''}`} id="boss-fight-play">
          {/* Boss health */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-rose-700 inline-flex items-center gap-1">
                <Swords className="w-4 h-4 stroke-[3]" /> Boss
              </span>
              <span
                className="text-xs font-mono font-bold text-rose-700"
                aria-label={`Boss health ${fight.bossHp} of ${fight.bossMaxHp}`}
              >
                {fight.bossHp}/{fight.bossMaxHp}
              </span>
            </div>
            <div className="h-4 rounded-full bg-rose-100 border-2 border-slate-900 overflow-hidden">
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${(fight.bossHp / fight.bossMaxHp) * 100}%` }}
              />
            </div>
          </div>

          {/* Player lives */}
          <div
            className="flex items-center gap-1.5"
            aria-label={`Your lives: ${fight.playerHp} of ${fight.playerMaxHp}`}
          >
            <Shield className="w-4 h-4 text-emerald-600 stroke-[3]" />
            {Array.from({ length: fight.playerMaxHp }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 stroke-[3] ${
                  i < fight.playerHp ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
                }`}
              />
            ))}
          </div>

          {isOver ? (
            <div className="text-center space-y-4 py-4" role="status">
              <h2 className="text-3xl font-black uppercase tracking-wider text-slate-900">
                {fight.status === 'won' ? 'You won! 🏆' : 'Game over'}
              </h2>
              <p className="text-sm font-bold text-slate-600">
                Words defeated: {fight.wordsDefeated}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={restart}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2"
                  aria-label="Play again"
                >
                  <RotateCcw className="w-4 h-4 stroke-[3]" /> Again
                </button>
                <button
                  onClick={() => {
                    stop();
                    onBackToHub();
                  }}
                  className="flex-1 py-3 bg-white hover:bg-slate-50 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl"
                >
                  Hub
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 py-2">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Say this word
              </p>
              <p
                className="text-4xl font-black tracking-wide text-slate-900"
                data-testid="target-word"
                aria-live="assertive"
              >
                {target}
              </p>
              <button
                onClick={() => speakWord(target)}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900"
                aria-label={`Hear the word ${target}`}
              >
                <Volume2 className="w-4 h-4 stroke-[3]" /> Hear it
              </button>
              <div
                className="h-2 rounded-full bg-slate-200 border-2 border-slate-900 overflow-hidden"
                aria-label={`Time left: ${timeLeft} seconds`}
              >
                <div
                  className="h-full bg-amber-400 transition-all"
                  style={{ width: `${(timeLeft / WORD_TIME_SECONDS) * 100}%` }}
                />
              </div>
              <p className="text-[11px] font-bold text-slate-500 inline-flex items-center gap-1 justify-center">
                <Mic className="w-3.5 h-3.5 stroke-[3]" /> {status.message}
              </p>
              {lastTranscript && (
                <p className="text-[11px] font-mono text-slate-400">
                  heard: {lastTranscript}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Mic,
  Play,
  RotateCcw,
  Shield,
  Swords,
  Volume2,
} from 'lucide-react';

import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
import {
  BossFightState,
  bossAtLevel,
  bossHitByWord,
  bossPhase,
  BOSS_ROSTER,
  createBossFight,
  DEFAULT_PLAYER_HP,
  isFinalBoss,
  pickNextIndex,
  playerHitByTimeout,
} from '../gameLogic';
import { matchesWord, speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { BossArena } from './BossArena';
import { CustomWordsManager } from './CustomWordsManager';

// Boss Fight: a hero fights a short gauntlet of bosses (Goblin -> Ogre ->
// Dragon) by pronouncing words. Each correct word removes 1 boss HP; failing to
// pronounce a word in time lets the boss hit the player. Player HP carries
// across bosses. The rules live in gameLogic.ts; the animated arena lives in
// BossArena.tsx; this component is the start screen, word picker, voice wiring
// and the per-word timer around them. Reworked in Sprint 2 (Assignment 4).

const WORD_TIME_SECONDS = 10;

interface BossFightGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
  onAddCustomWord?: (word: string, translation: string) => void;
  onDeleteCustomWord?: (index: number) => void;
  onClearCustomWords?: () => void;
}

export function BossFightGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
  onAddCustomWord,
  onDeleteCustomWord,
  onClearCustomWords,
}: BossFightGameProps) {
  const [activeCategory, setActiveCategory] = useState<WordCategory>(
    BUILTIN_CATEGORIES[0],
  );
  const [bossLevel, setBossLevel] = useState(0);
  const [fight, setFight] = useState<BossFightState>(() =>
    createBossFight(bossAtLevel(0).hp, DEFAULT_PLAYER_HP),
  );
  const [phase, setPhase] = useState<'START' | 'PLAYING'>('START');
  const [target, setTarget] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(WORD_TIME_SECONDS);
  const [hitNonce, setHitNonce] = useState(0);
  const [attackNonce, setAttackNonce] = useState(0);
  const [killNonce, setKillNonce] = useState(0);
  const [isWarmupOpen, setIsWarmupOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const phaseRef = useRef(phase);
  const targetRef = useRef(target);
  const fightRef = useRef(fight);
  const bossLevelRef = useRef(bossLevel);
  const wordIndexRef = useRef(-1);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    fightRef.current = fight;
  }, [fight]);
  useEffect(() => {
    bossLevelRef.current = bossLevel;
  }, [bossLevel]);

  const boss = bossAtLevel(bossLevel);

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

  useEffect(() => {
    onScoreChange?.(score);
  }, [score, onScoreChange]);

  useEffect(() => {
    if (fight.status === 'won' && score > highScore) {
      onUpdateHighScore?.(score);
    }
  }, [fight.status, score, highScore, onUpdateHighScore]);

  const handleTranscript = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'PLAYING') return;
      const prev = fightRef.current;
      if (prev.status !== 'playing') return;
      const current = targetRef.current;
      if (!current) return;
      if (!matchesWord(text, current, true)) return;

      const hit = bossHitByWord(prev);
      setScore((s) => s + 1);
      setHitNonce((n) => n + 1);

      if (hit.status === 'won') {
        setKillNonce((n) => n + 1);
        speakSound.playSuccess();
        if (isFinalBoss(bossLevelRef.current)) {
          // Whole gauntlet cleared.
          fightRef.current = hit;
          setFight(hit);
          return;
        }
        // Advance to the next, tougher boss; carry player HP and max HP.
        const nextLevel = bossLevelRef.current + 1;
        const nextBoss = bossAtLevel(nextLevel);
        const fresh: BossFightState = {
          bossMaxHp: nextBoss.hp,
          bossHp: nextBoss.hp,
          playerMaxHp: prev.playerMaxHp,
          playerHp: prev.playerHp,
          wordsDefeated: 0,
          status: 'playing',
        };
        bossLevelRef.current = nextLevel;
        setBossLevel(nextLevel);
        fightRef.current = fresh;
        setFight(fresh);
        nextWord();
        return;
      }

      speakSound.playCoin();
      fightRef.current = hit;
      setFight(hit);
      nextWord();
    },
    [nextWord],
  );

  const { status, lastTranscript, isSupported, start, stop } =
    useSpeechRecognition(handleTranscript);

  const beginFight = useCallback(() => {
    speakSound.playCoin();
    const fresh = createBossFight(bossAtLevel(0).hp, DEFAULT_PLAYER_HP);
    bossLevelRef.current = 0;
    setBossLevel(0);
    fightRef.current = fresh;
    setFight(fresh);
    setScore(0);
    setPhase('PLAYING');
    wordIndexRef.current = -1;
    nextWord();
    start();
  }, [nextWord, start]);

  const restart = useCallback(() => {
    beginFight();
  }, [beginFight]);

  // Stop listening once the round ends (win or lose).
  useEffect(() => {
    if (fight.status !== 'playing') stop();
  }, [fight.status, stop]);

  // Per-word countdown: when it runs out, the boss hits the player.
  useEffect(() => {
    if (phase !== 'PLAYING' || fight.status !== 'playing') return;
    if (timeLeft <= 0) {
      const hurt = playerHitByTimeout(fightRef.current);
      fightRef.current = hurt;
      setFight(hurt);
      setAttackNonce((n) => n + 1);
      speakSound.playMiss();
      if (hurt.status === 'playing') nextWord();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, fight.status, timeLeft, nextWord]);

  const isOver = fight.status !== 'playing';
  const won = fight.status === 'won';
  const list = wordList();

  return (
    <section className="max-w-md mx-auto py-4 px-2" aria-label="Boss Fight game">
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
        <div className="space-y-4" id="boss-fight-start">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-500 border-4 border-slate-900 flex items-center justify-center">
              <Swords className="w-9 h-9 text-white stroke-[3]" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900">
              Boss Fight
            </h1>
            <p className="text-xs font-bold text-slate-600 max-w-xs leading-relaxed">
              Beat {BOSS_ROSTER.length} bosses by saying each English word out
              loud. Say it before the timer runs out, or the boss hits back! You
              have {WORD_TIME_SECONDS} seconds per word.
            </p>
          </div>

          {/* Boss roster preview */}
          <div className="flex items-center justify-center gap-3" aria-hidden="true">
            {BOSS_ROSTER.map((b, i) => (
              <div key={b.name} className="flex flex-col items-center">
                <span className="text-3xl">{b.emoji}</span>
                <span className="text-[9px] font-black uppercase text-slate-500">
                  {i + 1}. {b.name}
                </span>
              </div>
            ))}
          </div>

          <fieldset className="text-left bg-slate-50 border-4 border-slate-900 rounded-2xl p-3">
            <legend className="text-xs font-black uppercase tracking-wider text-slate-700 px-1">
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
              <button
                onClick={() =>
                  setActiveCategory({
                    id: 'custom',
                    name: 'My Words',
                    description: '',
                    icon: 'edit',
                    words: customWords,
                  })
                }
                aria-pressed={activeCategory.id === 'custom'}
                className={`px-3 py-1.5 rounded-xl border-4 text-xs font-black uppercase tracking-wide ${
                  activeCategory.id === 'custom'
                    ? 'bg-pink-400 border-slate-900 text-white'
                    : 'bg-white border-slate-300 text-slate-600'
                }`}
              >
                My Words ({customWords.length})
              </button>
            </div>
          </fieldset>

          {/* Listen and learn warmup */}
          <div className="text-left">
            <button
              onClick={() => {
                setIsWarmupOpen((v) => !v);
                setIsAddOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-white border-4 border-slate-900 hover:bg-slate-50 rounded-2xl font-black text-xs text-slate-800"
              aria-expanded={isWarmupOpen}
            >
              <span>Listen and learn ({list.length} words)</span>
              <span className="bg-slate-100 border-2 border-slate-900 px-1.5 rounded-md">
                {isWarmupOpen ? '▲' : '▼'}
              </span>
            </button>
            {isWarmupOpen && (
              <div className="bg-white border-4 border-t-0 border-slate-900 rounded-b-2xl p-3 grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                {list.map((item, i) => (
                  <button
                    key={`${item.word}-${i}`}
                    onClick={() => speakWord(item.word)}
                    className="bg-yellow-50 hover:bg-yellow-100 border-2 border-slate-900 text-left p-2 rounded-xl flex items-center justify-between gap-1"
                    aria-label={`Hear the word ${item.word}`}
                  >
                    <span className="text-slate-900 font-extrabold text-xs truncate">
                      {item.word}
                    </span>
                    <Volume2 className="w-4 h-4 text-slate-600 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add my own words */}
          {onAddCustomWord && onDeleteCustomWord && onClearCustomWords && (
            <div className="text-left">
              <button
                onClick={() => {
                  setIsAddOpen((v) => !v);
                  setIsWarmupOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-3 bg-white border-4 border-slate-900 hover:bg-slate-50 rounded-2xl font-black text-xs text-slate-800"
                aria-expanded={isAddOpen}
              >
                <span>Add my own words ({customWords.length})</span>
                <span className="bg-slate-100 border-2 border-slate-900 px-1.5 rounded-md">
                  {isAddOpen ? '▲' : '▼'}
                </span>
              </button>
              {isAddOpen && (
                <div className="bg-white border-4 border-t-0 border-slate-900 rounded-b-2xl p-4">
                  <CustomWordsManager
                    customWords={customWords}
                    onAddWord={onAddCustomWord}
                    onDeleteWord={onDeleteCustomWord}
                    onClearAll={onClearCustomWords}
                  />
                </div>
              )}
            </div>
          )}

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
        <div className="space-y-3" id="boss-fight-play">
          {/* Animated arena */}
          <div className="border-4 border-slate-900 rounded-2xl overflow-hidden bg-slate-900">
            <BossArena
              bossEmoji={boss.emoji}
              bossColor={boss.color}
              bossHpFrac={fight.bossHp / fight.bossMaxHp}
              phase={bossPhase(fight)}
              hitNonce={hitNonce}
              attackNonce={attackNonce}
              killNonce={killNonce}
              defeated={won}
              victory={won}
            />
          </div>

          {/* Boss name + level */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-700 inline-flex items-center gap-1">
              <Swords className="w-4 h-4 stroke-[3]" /> {boss.emoji} {boss.name}
            </span>
            <span className="text-[10px] font-black uppercase text-slate-500">
              Boss {Math.min(bossLevel + 1, BOSS_ROSTER.length)}/
              {BOSS_ROSTER.length}
            </span>
          </div>

          {/* Boss health (accessible) */}
          <div
            className="h-4 rounded-full bg-rose-100 border-2 border-slate-900 overflow-hidden"
            aria-label={`Boss health ${fight.bossHp} of ${fight.bossMaxHp}`}
          >
            <div
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${(fight.bossHp / fight.bossMaxHp) * 100}%` }}
            />
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
                  i < fight.playerHp
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-slate-300'
                }`}
              />
            ))}
          </div>

          {isOver ? (
            <div className="text-center space-y-4 py-4" role="status">
              <h2 className="text-3xl font-black uppercase tracking-wider text-slate-900">
                {won ? 'You won! 🏆' : 'Game over'}
              </h2>
              <p className="text-sm font-bold text-slate-600">
                Words defeated: {score}
                {won ? ' • all bosses beaten!' : ''}
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
            <div className="text-center space-y-3 py-1">
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

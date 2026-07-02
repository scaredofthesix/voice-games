import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, GameId } from '../progress';
import {
  ArrowLeft,
  BookOpen,
  Heart,
  Mic,
  Pause,
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
  bossHitByWord,
  bossPhase,
  BOSS_ROSTER,
  createBossFight,
  DEFAULT_PLAYER_HP,
  endlessBossAtLevel,
  isFinalBoss,
  pickNextIndex,
  playerHitByTimeout,
  BossKind,
} from '../gameLogic';
import { BossTheme } from './BossArena';
import { matchesWord, speakSound, speakWord } from '../voice/engine';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { BossArena } from './BossArena';
import { CustomWordsManager } from './CustomWordsManager';
import { useUiLanguage } from '../uiLanguage';

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
  const { t, language, setLanguage } = useUiLanguage();
  const [activeCategory, setActiveCategory] = useState<WordCategory>(
    BUILTIN_CATEGORIES[0],
  );
  const [bossTheme, setBossTheme] = useState<BossTheme>('castle');
  const [sessionRoster, setSessionRoster] = useState<BossKind[]>(() => {
    // Shuffled copy initially
    const r = [...BOSS_ROSTER];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  });
  const [bossLevel, setBossLevel] = useState(0);
  const [bossMode, setBossMode] = useState<number>(3); // 3, 5, 10, or -1 (Endless)
  const [isInfiniteUnlocked, setIsInfiniteUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('boss_fight_infinite_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  const bossModeRef = useRef(bossMode);
  useEffect(() => {
    bossModeRef.current = bossMode;
  }, [bossMode]);

  const getBossAtLevel = (level: number, roster: BossKind[]) => {
    if (roster.length === 0) return endlessBossAtLevel(level);
    const safe = Math.max(0, Math.floor(level));
    const base = roster[safe % roster.length];
    const loop = Math.floor(safe / roster.length);
    return { ...base, hp: base.hp + loop * 3 };
  };

  const [fight, setFight] = useState<BossFightState>(() =>
    createBossFight(getBossAtLevel(0, [...BOSS_ROSTER]).hp, DEFAULT_PLAYER_HP),
  );
  const [phase, setPhase] = useState<'START' | 'PLAYING'>('START');
  const [paused, setPaused] = useState(false);
  const [target, setTarget] = useState('');
  const [score, setScore] = useState(0);
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
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
  const pausedRef = useRef(paused);
  const wordIndexRef = useRef(-1);
  const sessionRosterRef = useRef<BossKind[]>(sessionRoster);

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
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    sessionRosterRef.current = sessionRoster;
  }, [sessionRoster]);

  const boss = getBossAtLevel(bossLevel, sessionRoster);

  const randomizeRoster = useCallback(() => {
    const shuffled = [...BOSS_ROSTER];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSessionRoster(shuffled);
  }, []);

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
  }, [wordList]);

  useEffect(() => {
    onScoreChange?.(score);
  }, [score, onScoreChange]);

  useEffect(() => {
    // Record the high score when the game concludes (either won or lost)
    if ((fight.status === 'lost' || fight.status === 'won') && score > highScore) {
      onUpdateHighScore?.(score);
    }
  }, [fight.status, score, highScore, onUpdateHighScore]);

  const handleTranscript = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'PLAYING') return;
      if (pausedRef.current) return;
      const prev = fightRef.current;
      if (prev.status !== 'playing') return;
      const current = targetRef.current;
      if (!current) return;
      if (!matchesWord(text, current, true)) return;

      const hit = bossHitByWord(prev);
      setScore((s) => s + 1);
      setHitNonce((n) => n + 1);

      setWordStudyStats((prevStats) => ({
        ...prevStats,
        [current]: {
          spoken: (prevStats[current]?.spoken || 0) + 1,
          struggled: prevStats[current]?.struggled || 0,
        },
      }));
      saveProgress(recordWordSpoken(loadProgress(), 'boss-fight', current));

      if (hit.status === 'won') {
        setKillNonce((n) => n + 1);
        speakSound.playSuccess();

        const isFinite = bossModeRef.current !== -1;
        const isLast = isFinite && isFinalBoss(bossLevelRef.current, bossModeRef.current);

        if (isLast) {
          // Whole gauntlet cleared!
          fightRef.current = hit;
          setFight(hit);
          // Unlock Endless mode
          try {
            localStorage.setItem('boss_fight_infinite_unlocked', 'true');
            setIsInfiniteUnlocked(true);
          } catch {}
          return;
        }

        // Advance to the next, tougher boss; carry player HP and max HP.
        const nextLevel = bossLevelRef.current + 1;
        const nextBoss = getBossAtLevel(nextLevel, sessionRosterRef.current);
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
    const updatedProgress = recordSessionPlayed(loadProgress(), 'boss-fight');
    saveProgress(updatedProgress);
    // Re-shuffle order on start to ensure complete randomness
    const shuffled = [...BOSS_ROSTER];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setSessionRoster(shuffled);
    sessionRosterRef.current = shuffled;

    const firstBoss = getBossAtLevel(0, shuffled);
    const fresh = createBossFight(firstBoss.hp, DEFAULT_PLAYER_HP);
    bossLevelRef.current = 0;
    setBossLevel(0);
    fightRef.current = fresh;
    setFight(fresh);
    setScore(0);
    setWordStudyStats({});
    setPaused(false);
    pausedRef.current = false;
    setPhase('PLAYING');
    wordIndexRef.current = -1;
    nextWord();
    start();
  }, [nextWord, start]);

  const restart = useCallback(() => {
    beginFight();
  }, [beginFight]);

  // Pause/resume: freeze the per-word timer and stop listening while paused.
  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (next) stop();
      else start();
      return next;
    });
  }, [start, stop]);

  // Stop listening once the round ends (win or lose).
  useEffect(() => {
    if (fight.status !== 'playing') stop();
  }, [fight.status, stop]);

  // Per-word countdown: when it runs out, the boss hits the player. Frozen
  // while the game is paused.
  useEffect(() => {
    if (phase !== 'PLAYING' || fight.status !== 'playing' || paused) return;
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
  }, [phase, fight.status, timeLeft, nextWord, paused]);

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
        <ArrowLeft className="w-4 h-4 stroke-[3]" /> {t('shared.backToHub')}
      </button>

      {phase === 'START' ? (
        <div className={`space-y-4 p-6 border-8 border-slate-900 rounded-4xl transition-all duration-300 ${
          bossTheme === 'castle' ? 'bg-slate-100 bubble-shadow-purple' :
          bossTheme === 'lava' ? 'bg-orange-50 bubble-shadow-pink' :
          bossTheme === 'forest' ? 'bg-emerald-50 bubble-shadow-green' :
          'bg-purple-50 bubble-shadow-purple'
        }`} id="boss-fight-start">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-3xl bg-rose-500 border-4 border-slate-900 flex items-center justify-center">
              <Swords className="w-9 h-9 text-white stroke-[3]" />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
                aria-label={language === 'en' ? t('header.switchLabel') : t('header.switchLabel')}
                className="bg-white border-4 border-slate-900 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider"
              >
                {language === 'en' ? 'RU' : 'EN'}
              </button>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900">
              {t('games.bossFight.title')}
            </h1>
            <p className="text-xs font-bold text-slate-600 max-w-xs leading-relaxed">
              {bossMode === -1 
                ? (language === 'ru' 
                  ? 'Сражайся с бесконечной ордой боссов! Произноси английские слова вслух, пока не закончатся жизни.' 
                  : 'Fight an endless horde of bosses! Say each English word out loud to survive as long as you can.')
                : (language === 'ru'
                  ? `Победи ${bossMode} боссов, произнося английские слова вслух. Успей до конца таймера, иначе босс ударит в ответ!`
                  : `Beat ${bossMode} bosses by saying each English word out loud. Say it before the timer runs out, or the boss hits back!`)}
            </p>
          </div>

          {/* Boss roster preview with randomize button */}
          <div className="flex flex-col items-center gap-2 bg-white border-4 border-slate-900 rounded-2xl p-3">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                {language === 'ru' ? 'Порядок Боссов в Бою:' : 'Boss Gauntlet Order:'}
              </span>
              <button
                type="button"
                onClick={randomizeRoster}
                className="bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 active:translate-y-0.5"
              >
                🎲 {language === 'ru' ? 'Перемешать' : 'Shuffle Roster'}
              </button>
            </div>
            <div className="flex items-center justify-center gap-3 w-full overflow-x-auto py-1" aria-hidden="true">
              {sessionRoster.slice(0, bossMode === -1 ? 5 : Math.min(5, bossMode)).map((b, i) => (
                <div key={`${b.name}-${i}`} className="flex flex-col items-center shrink-0">
                  <span className="text-2xl animate-bounce">{b.emoji}</span>
                  <span className="text-[8px] font-black uppercase text-slate-500">
                    {i + 1}. {b.name}
                  </span>
                </div>
              ))}
              {bossMode === -1 ? (
                <div className="flex flex-col items-center shrink-0">
                  <span className="text-2xl animate-pulse">♾️</span>
                  <span className="text-[8px] font-black uppercase text-slate-400">
                    {language === 'ru' ? 'и др.' : '& more'}
                  </span>
                </div>
              ) : (
                bossMode > 5 && (
                  <div className="flex flex-col items-center shrink-0">
                    <span className="text-sm font-black text-slate-400">...</span>
                    <span className="text-[8px] font-black uppercase text-slate-400">
                      +{bossMode - 5} {language === 'ru' ? 'еще' : 'more'}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Choose Arena Theme */}
          <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <label className="block text-xs font-black text-rose-500 uppercase tracking-widest ml-1">
              {t('shared.chooseArenaTheme')}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {(['castle', 'lava', 'forest', 'abyss'] as const).map((themeId) => (
                <button
                  key={themeId}
                  onClick={() => {
                    speakSound.playCoin();
                    setBossTheme(themeId);
                  }}
                  className={`px-3 py-2 border-4 rounded-2xl text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer text-center ${
                    bossTheme === themeId
                      ? 'bg-rose-500 border-slate-900 text-white shadow-sm -translate-y-0.5'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-900'
                  }`}
                >
                  {t(`themes.boss.${themeId}`)}
                </button>
              ))}
            </div>

            {/* Dynamic visual preview of selected boss fight theme */}
            <div className={`w-full h-24 rounded-2xl border-4 border-slate-900 relative overflow-hidden transition-all duration-300 flex items-center justify-center ${
              bossTheme === 'castle' ? 'bg-gradient-to-b from-slate-700 to-slate-900' :
              bossTheme === 'lava' ? 'bg-gradient-to-b from-orange-800 to-stone-900' :
              bossTheme === 'forest' ? 'bg-gradient-to-b from-teal-800 to-emerald-950' :
              'bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950'
            }`}>
              {bossTheme === 'castle' && (
                <>
                  <div className="absolute inset-y-0 left-4 w-6 bg-slate-800/60 border-x border-slate-700" />
                  <div className="absolute inset-y-0 right-4 w-6 bg-slate-800/60 border-x border-slate-700" />
                  <span className="absolute bottom-3 left-12 text-2xl animate-bounce">🛡️</span>
                  <span className="absolute bottom-3 right-12 text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>👹</span>
                  <span className="absolute top-2 left-6 text-[10px] animate-pulse">🔥</span>
                </>
              )}
              {bossTheme === 'lava' && (
                <>
                  <div className="absolute inset-x-0 bottom-0 h-4 bg-orange-600 animate-pulse" />
                  <span className="absolute bottom-3 left-12 text-2xl animate-bounce">🛡️</span>
                  <span className="absolute bottom-3 right-12 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🐉</span>
                  <span className="absolute bottom-4 left-24 text-xs animate-ping">🫧</span>
                  <span className="absolute bottom-6 right-24 text-xs animate-pulse">🫧</span>
                </>
              )}
              {bossTheme === 'forest' && (
                <>
                  <span className="absolute bottom-2 left-2 text-2xl">🌲</span>
                  <span className="absolute bottom-2 right-2 text-2xl">🌲</span>
                  <span className="absolute bottom-3 left-12 text-2xl animate-bounce">🛡️</span>
                  <span className="absolute bottom-3 right-12 text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🧟</span>
                  <span className="absolute top-2 left-20 text-[6px] text-lime-400 animate-ping">✨</span>
                  <span className="absolute top-4 right-20 text-[6px] text-lime-400 animate-pulse">✨</span>
                </>
              )}
              {bossTheme === 'abyss' && (
                <>
                  <div className="absolute w-12 h-12 rounded-full border border-purple-500/30 bg-purple-500/10 animate-ping" />
                  <span className="absolute bottom-3 left-12 text-2xl animate-bounce">🛡️</span>
                  <span className="absolute bottom-3 right-12 text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>👽</span>
                  <span className="absolute top-2 right-12 text-xs animate-pulse">🌌</span>
                </>
              )}
              <div className="absolute top-2 left-2 bg-slate-900/80 border border-white/20 text-white font-black text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md z-10">
                Preview
              </div>
            </div>
          </div>

          {/* Battle Length Selection */}
          <fieldset className="text-left bg-slate-50 border-4 border-slate-900 rounded-2xl p-3">
            <legend className="text-xs font-black uppercase tracking-wider text-slate-700 px-1">
              {language === 'ru' ? 'Длительность битвы:' : 'Battle Length:'}
            </legend>
            <div className="flex flex-wrap gap-2">
              {[3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    speakSound.playCoin();
                    setBossMode(num);
                  }}
                  aria-pressed={bossMode === num}
                  className={`px-3 py-1.5 rounded-xl border-4 text-xs font-black uppercase tracking-wide cursor-pointer ${
                    bossMode === num
                      ? 'bg-rose-500 border-slate-900 text-white font-black'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-slate-900'
                  }`}
                >
                  {num === 3 
                    ? (language === 'ru' ? '3 Босса' : '3 Bosses') 
                    : num === 5 
                    ? (language === 'ru' ? '5 Боссов' : '5 Bosses') 
                    : (language === 'ru' ? '10 Боссов' : '10 Bosses')}
                </button>
              ))}
              <button
                type="button"
                disabled={!isInfiniteUnlocked}
                onClick={() => {
                  if (isInfiniteUnlocked) {
                    speakSound.playCoin();
                    setBossMode(-1);
                  }
                }}
                aria-pressed={bossMode === -1}
                className={`px-3 py-1.5 rounded-xl border-4 text-xs font-black uppercase tracking-wide relative flex items-center gap-1.5 cursor-pointer ${
                  bossMode === -1
                    ? 'bg-purple-600 border-slate-900 text-white font-black'
                    : isInfiniteUnlocked
                    ? 'bg-white border-slate-300 text-slate-600 hover:border-slate-900'
                    : 'bg-slate-200 border-slate-350 text-slate-400 cursor-not-allowed'
                }`}
                title={isInfiniteUnlocked ? 'Endless Boss Fight' : 'Beat a boss fight once to unlock!'}
              >
                <span>{language === 'ru' ? 'Бесконечно' : 'Endless'}</span>
                {!isInfiniteUnlocked && <span className="text-[10px]">🔒</span>}
              </button>
            </div>
            {!isInfiniteUnlocked && (
              <p className="text-[10px] text-purple-700 font-bold mt-1.5 ml-1 leading-normal">
                ⭐ {language === 'ru' 
                  ? 'Совет: Победи в любом режиме, чтобы разблокировать бесконечный бой!' 
                  : 'Tip: Beat any mode to unlock Endless mode!'}
              </p>
            )}
          </fieldset>

          <fieldset className="text-left bg-slate-50 border-4 border-slate-900 rounded-2xl p-3">
            <legend className="text-xs font-black uppercase tracking-wider text-slate-700 px-1">
              {t('shared.chooseWordSet')}
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
                    name: t('shared.myWords'),
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
                {t('shared.myWords')} ({customWords.length})
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
              <span>{t('shared.listenAndLearn')} ({list.length} {t('shared.wordsLabel')})</span>
              <span className="bg-slate-100 border-2 border-slate-900 px-1.5 rounded-md">
                {isWarmupOpen ? '▲' : '▼'}
              </span>
            </button>
            {isWarmupOpen && (
              <div className="bg-white border-4 border-t-0 border-slate-900 rounded-b-2xl p-3 grid grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                {list.map((item, i) => {
                  const translation = item.translationRu || item.translation;
                  return (
                    <button
                      key={`${item.word}-${i}`}
                      onClick={() => speakWord(item.word)}
                      className="bg-yellow-50 hover:bg-yellow-100 border-2 border-slate-900 text-left p-2 rounded-xl flex items-center justify-between gap-2"
                      aria-label={`Hear the word ${item.word}`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-slate-900 font-extrabold text-xs truncate">
                          {item.word}
                        </span>
                        {translation && (
                          <span className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                            {translation}
                          </span>
                        )}
                      </div>
                      <Volume2 className="w-4 h-4 text-slate-600 shrink-0" />
                    </button>
                  );
                })}
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
            <Play className="w-4 h-4 fill-current stroke-[3]" /> {t('shared.startFight')}
          </button>
        </div>
      ) : (
        <div className="space-y-3" id="boss-fight-play">
          {/* Animated arena */}
          <div className="relative border-4 border-slate-900 rounded-2xl overflow-hidden bg-slate-900">
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
              bossName={boss.name}
              theme={bossTheme}
            />
            {paused && !isOver && (
              <div
                className="absolute inset-0 bg-slate-900/75 flex flex-col items-center justify-center gap-1"
                role="status"
              >
                <span className="text-4xl" aria-hidden="true">⏸️</span>
                <span className="text-lg font-black uppercase tracking-widest text-orange-400">
                  Paused
                </span>
              </div>
            )}
          </div>

          {/* Prominent pause / resume control */}
          {!isOver && (
            <button
              onClick={togglePause}
              aria-pressed={paused}
              aria-label={paused ? 'Resume the fight' : 'Pause the fight'}
              className={`w-full py-3 border-4 border-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 ${
                paused
                  ? 'bg-orange-400 hover:bg-orange-500 text-slate-900'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {paused ? (
                <>
                  <Play className="w-5 h-5 fill-current stroke-[3]" /> Resume
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5 fill-current stroke-[3]" /> Pause
                </>
              )}
            </button>
          )}

          {/* Boss name + level */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-rose-700 inline-flex items-center gap-1">
              <Swords className="w-4 h-4 stroke-[3]" /> {boss.emoji} {boss.name}
            </span>
            <span className="text-[10px] font-black uppercase text-slate-500">
              {bossMode === -1 
                ? `♾️ Boss #${bossLevel + 1}` 
                : `${language === 'ru' ? 'Босс' : 'Boss'} ${bossLevel + 1}/${bossMode}`}
               · {score} {language === 'ru' ? 'уд.' : 'hits'}
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
            <div className="max-w-md mx-auto w-full py-4 animate-scale-up">
              <div className="bg-white border-8 border-slate-900 rounded-4xl p-6 text-center relative overflow-hidden bubble-shadow-rose">
                
                <span className="inline-flex items-center gap-1 bg-yellow-300 border-4 border-slate-900 px-4 py-1.5 rounded-full text-slate-900 text-xs font-black uppercase tracking-widest animate-pulse">
                  {won
                    ? (language === 'ru' ? 'ТЫ ПОБЕДИЛ!' : 'VICTORY!')
                    : (language === 'ru' ? 'БИТВА ЗАВЕРШЕНА!' : 'BATTLE CONCLUDED!')}
                </span>

                <h2 className="text-3xl font-black text-slate-950 mt-6 mb-2 uppercase tracking-wide">
                  {won
                    ? (language === 'ru' ? 'ПОБЕДА!' : 'YOU WON!')
                    : (language === 'ru' ? 'БИТВА ЗАВЕРШЕНА!' : 'GAME OVER!')}
                </h2>
                <p className="text-xs text-slate-500 leading-normal font-bold">
                  {language === 'ru' ? 'Твой боевой отчет по английским словам:' : 'Review your English combat stats below:'}
                </p>

                {/* Score logs */}
                <div className="grid grid-cols-2 gap-3.5 my-6">
                  <div className="bg-sky-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                    <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest text-center">
                      {language === 'ru' ? 'УДАРОВ НАНЕСЕНО' : 'WORDS SMASHED'}
                    </span>
                    <span className="text-lg font-black text-sky-900 mt-1 font-mono">{score} hits</span>
                  </div>
                  <div className="bg-amber-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">
                      {language === 'ru' ? 'ЛИЧНЫЙ РЕКОРД' : 'PERSONAL HIGH'}
                    </span>
                    <span className="text-lg font-black text-amber-800 mt-1 font-mono">{highScore} hits</span>
                  </div>
                </div>

                {/* Historic word review logs */}
                <div className="bg-purple-100 border-4 border-slate-900 p-4 rounded-3xl text-left mb-6">
                  <div className="flex items-center gap-2 mb-2.5">
                    <BookOpen className="w-5 h-5 text-purple-700 stroke-[2.5]" />
                    <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest">
                      {language === 'ru' ? 'Твой боевой отчет:' : 'Your Spelling Scorecard:'}
                    </h4>
                  </div>

                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {Object.keys(wordStudyStats).length === 0 ? (
                      <div className="text-center py-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
                        <p className="text-xs text-slate-500 font-extrabold leading-normal">
                          {language === 'ru' ? 'Слов ещё нет. Начни бой, чтобы потренироваться!' : 'No words registered yet. Start the fight to practice!'}
                        </p>
                      </div>
                    ) : (
                      Object.keys(wordStudyStats).map((word, idx) => {
                        const spoken = wordStudyStats[word].spoken;
                        const struggled = wordStudyStats[word].struggled;
                        
                        return (
                          <div
                            key={idx}
                            className="bg-white border-2 border-slate-900 p-2 rounded-xl flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-slate-950 font-black text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-900 truncate">{word}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[8px] md:text-[9px] text-emerald-800 bg-emerald-100 px-1.5 py-1 rounded-full font-black border border-emerald-300">
                                {language === 'ru' ? 'Ударов:' : 'Hits:'} {spoken}
                              </span>
                              {struggled > 0 && (
                                <span className="text-[8px] md:text-[9px] text-amber-800 bg-amber-100 px-1.5 py-1 rounded-full font-black border border-amber-350">
                                  {language === 'ru' ? 'Подсказок:' : 'Clues:'} {struggled}
                                </span>
                              )}
                              <button
                                onClick={() => speakWord(word)}
                                className="p-1 bg-yellow-50 hover:bg-yellow-200 border-2 border-slate-900 rounded-lg cursor-pointer"
                                aria-label={`Hear the word ${word}`}
                              >
                                <Volume2 className="w-3.5 h-3.5 text-slate-900" />
                              </button>
                              {(() => {
                                const matchedObj = list.find(
                                  (item) => item.word.toLowerCase() === word.toLowerCase()
                                );
                                return matchedObj?.translationRu ? (
                                  <button
                                    onClick={() => matchedObj?.translationRu && speakWord(matchedObj.translationRu, 'ru')}
                                    className="p-1 bg-blue-100 hover:bg-blue-200 border-2 border-slate-900 rounded-lg cursor-pointer text-blue-800 text-[10px] font-bold"
                                    aria-label="Listen in Russian"
                                  >
                                    RU
                                  </button>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Loop Controls */}
                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    onClick={restart}
                    className="w-full bg-pink-500 hover:bg-pink-600 border-4 border-slate-900 text-white font-black text-xs py-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-1 shadow-md uppercase"
                  >
                    <RotateCcw className="w-4 h-4 text-white stroke-[3]" /> {language === 'ru' ? 'Сражаться снова!' : 'Fight Again!'}
                  </button>
                  
                  <button
                    onClick={() => {
                      stop();
                      onBackToHub();
                    }}
                    className="w-full bg-purple-500 hover:bg-purple-600 border-4 border-slate-900 text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md uppercase"
                  >
                    🏰 {language === 'ru' ? 'ВЫЙТИ В ХАБ' : 'EXIT TO PORTAL'}
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 py-1">
              <div className="relative bg-amber-50 border-4 border-slate-900 rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] animate-pulse-subtle">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-500 border-2 border-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm">
                  🎯 SAY THIS / ПРОИЗНЕСИ:
                </span>
                
                <p
                  className={`${
                    target.length > 25
                      ? 'text-lg md:text-xl'
                      : target.length > 15
                      ? 'text-2xl'
                      : 'text-3.5xl'
                  } font-black tracking-wide text-slate-900 leading-snug mt-1`}
                  data-testid="target-word"
                  aria-live="assertive"
                >
                  {target}
                </p>

                {(() => {
                  const currentWordItem = list.find(
                    (item) => item.word.toLowerCase() === target.toLowerCase(),
                  );
                  const translation =
                    currentWordItem?.translationRu || currentWordItem?.translation;
                  return (
                    <div className="mt-2.5 space-y-2">
                      {translation && (
                        <p className="text-xs md:text-sm font-extrabold text-purple-600">
                          {translation}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2.5 border-t-2 border-dashed border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            speakWord(target);
                            setWordStudyStats((p) => ({
                              ...p,
                              [target]: {
                                spoken: p[target]?.spoken || 0,
                                struggled: (p[target]?.struggled || 0) + 1,
                              },
                            }));
                            saveProgress(recordWordStruggled(loadProgress(), 'boss-fight', target));
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white border-2 border-slate-900 px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform active:translate-y-0.5"
                          aria-label={`Hear the word ${target}`}
                        >
                          <Volume2 className="w-3.5 h-3.5 stroke-[3] text-indigo-500" /> Hear it
                        </button>
                        {currentWordItem?.translationRu && (
                          <button
                            type="button"
                            onClick={() => currentWordItem?.translationRu && speakWord(currentWordItem.translationRu, 'ru')}
                            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 bg-white border-2 border-slate-900 px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform active:translate-y-0.5"
                            aria-label="Listen in Russian"
                          >
                            <Volume2 className="w-3.5 h-3.5 stroke-[3] text-blue-500" /> Слушать перевод
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div
                className="h-3.5 rounded-full bg-slate-200 border-4 border-slate-900 overflow-hidden shadow-inner"
                aria-label={`Time left: ${timeLeft} seconds`}
              >
                <div
                  className="h-full bg-amber-400 transition-all border-r-4 border-slate-900"
                  style={{ width: `${(timeLeft / WORD_TIME_SECONDS) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-2 bg-slate-100 border-2 border-slate-900 rounded-xl py-1.5 px-3 inline-flex mx-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                  {status.status === 'listening' ? '🎤 Mic is listening...' : status.message}
                </p>
              </div>

              {lastTranscript && (
                <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-2 max-w-xs mx-auto animate-fade-in">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Last heard / Распознано:
                  </p>
                  <p className="text-xs font-mono font-black text-rose-600 italic">
                    "{lastTranscript}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

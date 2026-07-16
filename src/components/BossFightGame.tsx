import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, pickAdaptiveWordIndex, GameId } from '../progress';
import {
  Heart,
  Play,
  Swords,
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
  playerHitByTimeout,
  BossKind,
} from '../gameLogic';
import { BossTheme } from './BossArena';
import { matchesWord, speakSound, speakWord } from '../voice/engine';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { BossArena } from './BossArena';
import {
  BackToHubButton,
  CustomWordsSection,
  GameHeader,
  GameResultCard,
  GameSetupCard,
  ListenAndLearnSection,
  OptionPicker,
  PauseButton,
  TargetWordCard,
  WordSetPicker,
} from './GameUi';
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
  const { t } = useUiLanguage();
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
    const words = list.map((w) => w.word);
    const wordStats = loadProgress()['boss-fight'].words;
    const idx = pickAdaptiveWordIndex(words, wordStats, wordIndexRef.current);
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
        speakSound.playCorrect();

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

      speakSound.playCorrect();
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
      const missedTarget = targetRef.current;
      if (missedTarget) {
        setWordStudyStats((prevStats) => ({
          ...prevStats,
          [missedTarget]: {
            spoken: prevStats[missedTarget]?.spoken || 0,
            struggled: (prevStats[missedTarget]?.struggled || 0) + 1,
          },
        }));
        saveProgress(recordWordStruggled(loadProgress(), 'boss-fight', missedTarget));
      }
      const hurt = playerHitByTimeout(fightRef.current);
      fightRef.current = hurt;
      setFight(hurt);
      setAttackNonce((n) => n + 1);
      speakSound.playLose();
      if (hurt.status === 'playing') nextWord();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, fight.status, timeLeft, nextWord, paused]);

  const isOver = fight.status !== 'playing';
  const won = fight.status === 'won';
  const list = wordList();
  const bossNameKey = boss.name === 'Dark Sorcerer'
    ? 'darkSorcerer'
    : boss.name.toLocaleLowerCase();
  const localizedBossName = t(`boss.names.${bossNameKey}`);
  const resultCard = (
    <GameResultCard
      title={won ? t('boss.youWon') : t('boss.gameOver')}
      description={t('boss.report')}
      scoreLabel={t('boss.wordsSmashed')}
      score={score}
      bestLabel={t('boss.personalHigh')}
      best={Math.max(highScore, score)}
      wordStats={wordStudyStats}
      words={list}
      replayLabel={t('boss.fightAgain')}
      onReplay={restart}
      icon={<span className="block text-5xl" aria-hidden="true">{won ? '🏆⚔️' : `${boss.emoji}🛡️`}</span>}
      summary={(
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border-4 border-slate-900 bg-rose-100 p-3">
            <p className="text-[10px] font-black uppercase text-rose-800">{t('boss.boss')}</p>
            <p className="text-2xl font-black">{bossLevel + 1}</p>
          </div>
          <div className="rounded-2xl border-4 border-slate-900 bg-emerald-100 p-3">
            <p className="text-[10px] font-black uppercase text-emerald-800">{t('shared.lives')}</p>
            <p className="text-2xl font-black">{fight.playerHp}/{fight.playerMaxHp}</p>
          </div>
        </div>
      )}
      toneClass={won ? 'bg-amber-50' : 'bg-rose-50'}
      shadowClass={won ? 'bubble-shadow-amber' : 'bubble-shadow-rose'}
    />
  );

  return (
    <section className="max-w-md mx-auto py-4 px-2" aria-label={t('games.bossFight.title')}>
      <BackToHubButton label={t('shared.backToHub')} onClick={() => { stop(); onBackToHub(); }} />

      {phase === 'START' ? (
        <div id="boss-fight-start">
          <GameSetupCard
            icon={<Swords className="h-10 w-10 text-white stroke-[3]" />}
            title={t('games.bossFight.title')}
            description={bossMode === -1
              ? t('boss.endlessDescription')
              : `${t('boss.beatPrefix')} ${bossMode} ${t('boss.beatSuffix')}`}
            toneClass={
              bossTheme === 'castle' ? 'bg-slate-100' :
              bossTheme === 'lava' ? 'bg-orange-50' :
              bossTheme === 'forest' ? 'bg-emerald-50' :
              'bg-purple-50'
            }
            iconClass="bg-rose-500"
            shadowClass={
              bossTheme === 'lava' ? 'bubble-shadow-pink' :
              bossTheme === 'forest' ? 'bubble-shadow-green' :
              'bubble-shadow-purple'
            }
          >

          {/* Choose Arena Theme */}
          <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <OptionPicker
              label={t('shared.chooseArenaTheme')}
              columns={2}
              options={(['castle', 'lava', 'forest', 'abyss'] as const).map((themeId) => ({
                id: themeId,
                label: t(`themes.boss.${themeId}`),
              }))}
              selected={bossTheme}
              onSelect={(themeId) => {
                speakSound.playCoin();
                setBossTheme(themeId);
              }}
            />

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
                {t('shared.preview')}
              </div>
            </div>
          </div>

          <WordSetPicker
            legend={t('shared.chooseWordSet')}
            myWordsLabel={t('shared.myWords')}
            activeCategoryId={activeCategory.id}
            customWords={customWords}
            onSelect={setActiveCategory}
          />

          <ListenAndLearnSection words={activeCategory.id === 'custom' ? customWords : list} />

          {onAddCustomWord && onDeleteCustomWord && onClearCustomWords && (
            <CustomWordsSection
              customWords={customWords}
              onAddWord={onAddCustomWord}
              onDeleteWord={onDeleteCustomWord}
              onClearAll={onClearCustomWords}
            />
          )}

          {/* Battle Length Selection follows the canonical four setup sections. */}
          <fieldset className="text-left bg-slate-50 border-4 border-slate-900 rounded-2xl p-3">
            <legend className="text-xs font-black uppercase tracking-wider text-slate-700 px-1">
              {t('boss.battleLength')}
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
                  {num} {t('boss.bosses')}
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
                title={isInfiniteUnlocked ? t('boss.endlessTitle') : t('boss.unlockHint')}
              >
                <span>{t('boss.endless')}</span>
                {!isInfiniteUnlocked && <span className="text-[10px]">🔒</span>}
              </button>
            </div>
            {!isInfiniteUnlocked && (
              <p className="text-[10px] text-purple-700 font-bold mt-1.5 ml-1 leading-normal">
                ⭐ {t('boss.unlockTip')}
              </p>
            )}
          </fieldset>

          {!isSupported && (
            <p className="text-xs font-bold text-rose-600" role="alert">
              {t('shared.voiceNeedsChrome')}
            </p>
          )}

          <button
            onClick={beginFight}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2"
            aria-label={t('shared.startFight')}
          >
            <Play className="w-4 h-4 fill-current stroke-[3]" /> {t('shared.startFight')}
          </button>
          </GameSetupCard>
        </div>
      ) : isOver ? (
        <div className="max-w-md mx-auto w-full pb-4 animate-scale-up">
          {resultCard}
        </div>
      ) : (
        <div className="space-y-3" id="boss-fight-play">
          <GameHeader
            icon={<Swords className="h-5 w-5 text-slate-900 stroke-[3]" />}
            title={t('games.bossFight.title')}
            subtitle={`${boss.emoji} ${localizedBossName} - ${
              bossMode === -1
                ? `${t('boss.endless')} - ${t('boss.boss')} #${bossLevel + 1}`
                : `${t('boss.boss')} ${bossLevel + 1}/${bossMode}`
            }`}
            stats={[
              { label: t('boss.hits'), value: score, tone: 'amber' },
              { label: t('shared.best'), value: Math.max(highScore, score), tone: 'sky' },
              {
                label: t('shared.lives'),
                value: (
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({ length: fight.playerMaxHp }).map((_, index) => (
                      <Heart
                        key={index}
                        className={`h-3.5 w-3.5 ${
                          index < fight.playerHp
                            ? 'fill-rose-500 text-rose-600'
                            : 'fill-slate-200 text-slate-300'
                        }`}
                      />
                    ))}
                  </span>
                ),
                tone: 'violet',
              },
            ]}
          />

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
              bossName={localizedBossName}
              theme={bossTheme}
            />
            {paused && !isOver && (
              <div
                className="absolute inset-0 bg-slate-900/75 flex flex-col items-center justify-center gap-1"
                role="status"
              >
                <span className="text-4xl" aria-hidden="true">⏸️</span>
                <span className="text-lg font-black uppercase tracking-widest text-orange-400">
                  {t('shared.paused')}
                </span>
              </div>
            )}
          </div>

          {/* Prominent pause / resume control */}
          {!isOver && (
            <PauseButton
              paused={paused}
              onToggle={togglePause}
              pauseLabel={t('shared.pause')}
              resumeLabel={t('shared.resume')}
            />
          )}

          {/* Boss health (accessible).
              Issue #108 dev note on the "duplicated" boss HP: it is shown both
              here and above the boss inside the canvas scene. Decision - keep
              both, per the counterargument the customer accepted at the
              Sprint 3 review: the labeled HUD bar below teaches kids what the
              mechanic means, while the in-scene bar gives feedback right where
              they are looking during the fight. To strengthen that purpose the
              HUD bar now carries a visible text label instead of being an
              anonymous second bar. */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-rose-700 mb-1">
              <span>{t('boss.health')}</span>
              <span className="font-mono">{fight.bossHp}/{fight.bossMaxHp}</span>
            </div>
            <div
              className="h-4 rounded-full bg-rose-100 border-2 border-slate-900 overflow-hidden"
              aria-label={`${t('boss.health')} ${fight.bossHp}/${fight.bossMaxHp}`}
            >
              <div
                className="h-full bg-rose-500 transition-all"
                style={{ width: `${(fight.bossHp / fight.bossMaxHp) * 100}%` }}
              />
            </div>
          </div>

          <div className="text-center space-y-4 py-1">
              {(() => {
                const currentWordItem = list.find(
                  (item) => item.word.toLowerCase() === target.toLowerCase(),
                );
                return (
                  <TargetWordCard
                    ribbon={t('shared.targetRibbon')}
                    word={target}
                    translation={currentWordItem?.translationRu || currentWordItem?.translation}
                    translationRu={currentWordItem?.translationRu}
                    heard={lastTranscript}
                    heardLabel={t('shared.youSaidHeard')}
                    onListenEn={() => {
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
                    onListenRu={() =>
                      currentWordItem?.translationRu && speakWord(currentWordItem.translationRu, 'ru')
                    }
                  />
                );
              })()}

              <div
                className="h-3.5 rounded-full bg-slate-200 border-4 border-slate-900 overflow-hidden shadow-inner"
                aria-label={`${t('boss.timeLeft')}: ${timeLeft} ${t('sentenceBird.secondsSuffix')}`}
              >
                <div
                  className="h-full bg-amber-400 transition-all border-r-4 border-slate-900"
                  style={{ width: `${(timeLeft / WORD_TIME_SECONDS) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-2 bg-slate-100 border-2 border-slate-900 rounded-xl py-1.5 px-3 inline-flex mx-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                  {status.status === 'listening' ? t('shared.micListening') : status.message}
                </p>
              </div>

          </div>
        </div>
      )}
    </section>
  );
}

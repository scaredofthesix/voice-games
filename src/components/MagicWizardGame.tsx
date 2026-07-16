import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Check, Pause, Shield, Skull, Sparkles, Volume2 } from 'lucide-react';

import { BUILTIN_CATEGORIES } from '../data';
import {
  buildSpellRecipe,
  findSpokenRune,
  matchesCursedRune,
  SPELLS_PER_SESSION,
} from '../magicWizardLogic';
import {
  loadProgress,
  recordSessionPlayed,
  recordWordSpoken,
  recordWordStruggled,
  saveProgress,
} from '../progress';
import type { WordCategory, WordData } from '../types';
import { useUiLanguage } from '../uiLanguage';
import { speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';
import {
  BackToHubButton,
  CustomWordsSection,
  GameResultCard,
  ListenAndLearnSection,
  OptionPicker,
  PauseButton,
  WordSetPicker,
} from './GameUi';

interface MagicWizardGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
  onAddCustomWord?: (word: string, translation: string) => void;
  onDeleteCustomWord?: (index: number) => void;
  onClearCustomWords?: () => void;
}

type WizardTheme = 'fire' | 'ice' | 'lightning';
type GamePhase = 'START' | 'PLAYING' | 'GAMEOVER';
type GameOutcome = 'won' | 'lost' | null;

const WARDS_PER_SESSION = 3;
const MAGIC_STARS = [
  ['7%', '14%', '0s'],
  ['18%', '68%', '0.7s'],
  ['29%', '24%', '1.4s'],
  ['42%', '78%', '0.2s'],
  ['55%', '12%', '1.8s'],
  ['66%', '70%', '1s'],
  ['78%', '21%', '0.4s'],
  ['91%', '63%', '1.3s'],
] as const;

const THEME_STYLE: Record<
  WizardTheme,
  { icon: string; glow: string; panel: string; charged: string }
> = {
  fire: {
    icon: '🔥',
    glow: 'from-orange-500/40 via-rose-500/20 to-violet-950',
    panel: 'bg-orange-100',
    charged: 'bg-orange-400',
  },
  ice: {
    icon: '❄️',
    glow: 'from-cyan-400/40 via-blue-500/20 to-violet-950',
    panel: 'bg-cyan-100',
    charged: 'bg-cyan-400',
  },
  lightning: {
    icon: '⚡',
    glow: 'from-yellow-300/40 via-violet-500/20 to-violet-950',
    panel: 'bg-yellow-100',
    charged: 'bg-yellow-300',
  },
};

export function MagicWizardGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
  onAddCustomWord = () => undefined,
  onDeleteCustomWord = () => undefined,
  onClearCustomWords = () => undefined,
}: MagicWizardGameProps) {
  const { language, t } = useUiLanguage();
  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [phase, setPhase] = useState<GamePhase>('START');
  const [paused, setPaused] = useState(false);
  const [theme, setTheme] = useState<WizardTheme>('fire');
  const [spellNumber, setSpellNumber] = useState(0);
  const [recipe, setRecipe] = useState<WordData[]>([]);
  const [cursedRune, setCursedRune] = useState<WordData | null>(null);
  const [curseTriggered, setCurseTriggered] = useState(false);
  const [chargedRunes, setChargedRunes] = useState<Set<number>>(() => new Set());
  const [wards, setWards] = useState(WARDS_PER_SESSION);
  const [outcome, setOutcome] = useState<GameOutcome>(null);
  const [lastRecognized, setLastRecognized] = useState('');
  const [feedback, setFeedback] = useState<'listening' | 'charged' | 'complete' | 'curse'>('listening');
  const [wordStudyStats, setWordStudyStats] = useState<
    Record<string, { spoken: number; struggled: number }>
  >({});

  const phaseRef = useRef<GamePhase>('START');
  const pausedRef = useRef(false);
  const recipeRef = useRef<WordData[]>([]);
  const cursedRuneRef = useRef<WordData | null>(null);
  const curseTriggeredRef = useRef(false);
  const chargedRunesRef = useRef<Set<number>>(new Set());
  const wardsRef = useRef(WARDS_PER_SESSION);
  const spellNumberRef = useRef(0);
  const previousWordIndexRef = useRef(-1);
  const changingRecipeRef = useRef(false);
  const lastTtsPlayTimeRef = useRef(0);
  const nextRecipeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const strings = useMemo(
    () => ({
      title: t('wizard.title'),
      description: t('wizard.description'),
      start: t('wizard.start'),
      score: t('wizard.score'),
      best: t('wizard.best'),
      paused: t('wizard.paused'),
      resume: t('wizard.resume'),
      pause: t('wizard.pause'),
      chooseSet: t('wizard.chooseSet'),
      myWords: t('wizard.myWords'),
      chooseTheme: t('wizard.chooseTheme'),
      gameOverTitle: t('wizard.gameOverTitle'),
      gameOverSubtitle: t('wizard.gameOverSubtitle'),
      playAgain: t('wizard.playAgain'),
      recipeTitle: t('wizard.recipeTitle'),
      recipeHint: t('wizard.recipeHint'),
      charged: t('wizard.charged'),
      spellProgress: t('wizard.spellProgress'),
      spellComplete: t('wizard.spellComplete'),
      youSaid: t('wizard.youSaid'),
      hearRune: t('wizard.hearRune'),
      workshop: t('wizard.workshop'),
      wards: t('wizard.wards'),
      cursedRune: t('wizard.cursedRune'),
      doNotSay: t('wizard.doNotSay'),
      curseSealed: t('wizard.curseSealed'),
      curseHit: t('wizard.curseHit'),
      safeMistakes: t('wizard.safeMistakes'),
      spellCast: t('wizard.spellCast'),
      defeatTitle: t('wizard.defeatTitle'),
      defeatSubtitle: t('wizard.defeatSubtitle'),
    }),
    [t],
  );

  const wordList = useCallback((): WordData[] => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0
        ? customWords
        : (BUILTIN_CATEGORIES[0].words as WordData[]);
    }
    return activeCategory.words as WordData[];
  }, [activeCategory, customWords]);

  const list = wordList();
  const score = spellNumber;

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    recipeRef.current = recipe;
  }, [recipe]);

  useEffect(() => {
    chargedRunesRef.current = chargedRunes;
  }, [chargedRunes]);

  useEffect(() => {
    spellNumberRef.current = spellNumber;
  }, [spellNumber]);

  useEffect(() => {
    onScoreChange?.(score);
    if (score > highScore) onUpdateHighScore?.(score);
  }, [highScore, onScoreChange, onUpdateHighScore, score]);

  useEffect(
    () => () => {
      if (nextRecipeTimerRef.current) clearTimeout(nextRecipeTimerRef.current);
    },
    [],
  );

  const openRecipe = useCallback(
    (round: number) => {
      const words = wordList();
      const stats = loadProgress()['magic-wizard'].words;
      const nextRecipe = buildSpellRecipe(
        words,
        stats,
        round,
        previousWordIndexRef.current,
      );
      previousWordIndexRef.current = nextRecipe.lastWordIndex;
      recipeRef.current = nextRecipe.runes;
      cursedRuneRef.current = nextRecipe.cursedRune;
      curseTriggeredRef.current = false;
      chargedRunesRef.current = new Set();
      setRecipe(nextRecipe.runes);
      setCursedRune(nextRecipe.cursedRune);
      setCurseTriggered(false);
      setChargedRunes(new Set());
      setFeedback('listening');
      setLastRecognized('');
      changingRecipeRef.current = false;
    },
    [wordList],
  );

  const finishSpell = useCallback(() => {
    const completedSpells = spellNumberRef.current + 1;
    spellNumberRef.current = completedSpells;
    setSpellNumber(completedSpells);
    setFeedback('complete');
    speakSound.playCorrect();

    nextRecipeTimerRef.current = setTimeout(() => {
      if (completedSpells >= SPELLS_PER_SESSION) {
        setOutcome('won');
        phaseRef.current = 'GAMEOVER';
        setPhase('GAMEOVER');
        changingRecipeRef.current = false;
        return;
      }
      openRecipe(completedSpells);
    }, 850);
  }, [openRecipe]);

  const handleTranscript = useCallback(
    (text: string) => {
      if (
        phaseRef.current !== 'PLAYING' ||
        pausedRef.current ||
        changingRecipeRef.current
      ) {
        return;
      }

      setLastRecognized(text);
      if (Date.now() - lastTtsPlayTimeRef.current < 750) return;

      if (
        !curseTriggeredRef.current &&
        matchesCursedRune(text, cursedRuneRef.current)
      ) {
        const curseWord = cursedRuneRef.current?.word;
        curseTriggeredRef.current = true;
        setCurseTriggered(true);
        setFeedback('curse');
        speakSound.playLose();

        if (curseWord) {
          setWordStudyStats((current) => ({
            ...current,
            [curseWord]: {
              spoken: current[curseWord]?.spoken || 0,
              struggled: (current[curseWord]?.struggled || 0) + 1,
            },
          }));
          saveProgress(recordWordStruggled(loadProgress(), 'magic-wizard', curseWord));
        }

        const nextWards = wardsRef.current - 1;
        wardsRef.current = nextWards;
        setWards(nextWards);
        if (nextWards <= 0) {
          changingRecipeRef.current = true;
          setOutcome('lost');
          nextRecipeTimerRef.current = setTimeout(() => {
            phaseRef.current = 'GAMEOVER';
            setPhase('GAMEOVER');
            changingRecipeRef.current = false;
          }, 700);
        }
        return;
      }

      const matchedRuneIndex = findSpokenRune(
        text,
        recipeRef.current,
        chargedRunesRef.current,
      );
      if (matchedRuneIndex < 0) return;

      const matchedWord = recipeRef.current[matchedRuneIndex].word;
      const nextCharged = new Set(chargedRunesRef.current);
      nextCharged.add(matchedRuneIndex);
      chargedRunesRef.current = nextCharged;
      setChargedRunes(nextCharged);
      setFeedback('charged');
      speakSound.playCoin();
      setWordStudyStats((current) => ({
        ...current,
        [matchedWord]: {
          spoken: (current[matchedWord]?.spoken || 0) + 1,
          struggled: current[matchedWord]?.struggled || 0,
        },
      }));
      saveProgress(recordWordSpoken(loadProgress(), 'magic-wizard', matchedWord));

      if (nextCharged.size === recipeRef.current.length) {
        changingRecipeRef.current = true;
        finishSpell();
      }
    },
    [finishSpell],
  );

  const { status, isSupported, start, stop } = useSpeechRecognition(handleTranscript);

  useEffect(() => {
    if (phase === 'PLAYING' && !paused) start();
    else stop();
    return () => stop();
  }, [paused, phase, start, stop]);

  const startGame = useCallback(() => {
    if (nextRecipeTimerRef.current) clearTimeout(nextRecipeTimerRef.current);
    previousWordIndexRef.current = -1;
    spellNumberRef.current = 0;
    wardsRef.current = WARDS_PER_SESSION;
    cursedRuneRef.current = null;
    curseTriggeredRef.current = false;
    changingRecipeRef.current = false;
    setSpellNumber(0);
    setWards(WARDS_PER_SESSION);
    setOutcome(null);
    setCursedRune(null);
    setCurseTriggered(false);
    setWordStudyStats({});
    setPaused(false);
    pausedRef.current = false;
    setPhase('PLAYING');
    phaseRef.current = 'PLAYING';
    saveProgress(recordSessionPlayed(loadProgress(), 'magic-wizard'));
    openRecipe(0);
  }, [openRecipe]);

  const playRune = useCallback((word: string) => {
    lastTtsPlayTimeRef.current = Date.now();
    speakWord(word, 'en');
    setWordStudyStats((current) => ({
      ...current,
      [word]: {
        spoken: current[word]?.spoken || 0,
        struggled: (current[word]?.struggled || 0) + 1,
      },
    }));
    saveProgress(recordWordStruggled(loadProgress(), 'magic-wizard', word));
  }, []);

  const themeStyle = THEME_STYLE[theme];
  const translatedWord = (word: WordData) =>
    language === 'ru'
      ? word.translationRu || word.translation
      : word.translation;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
      <div className="flex items-center mb-6">
        <BackToHubButton label={t('shared.backToHub')} onClick={onBackToHub} />
      </div>

      {phase === 'START' && (
        <div className="max-w-md mx-auto w-full py-4 animate-scale-up">
          <div className="space-y-4 p-6 border-8 border-slate-900 rounded-4xl bg-violet-50 bubble-shadow-purple">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-18 h-18 rounded-3xl bg-violet-400 border-4 border-slate-900 flex items-center justify-center animate-bounce">
                <span className="text-4xl">🧙‍♂️</span>
              </div>
              <h1 className="text-4xl font-black uppercase tracking-wider text-slate-950">
                {strings.title}
              </h1>
              <p className="text-xs font-bold text-slate-700 max-w-xs leading-relaxed">
                {strings.description}
              </p>
            </div>

            <div className="space-y-3 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
              <OptionPicker
                label={strings.chooseTheme}
                options={(['fire', 'ice', 'lightning'] as const).map((themeId) => ({
                  id: themeId,
                  label: t(`themes.wizard.${themeId}`),
                }))}
                selected={theme}
                onSelect={(themeId) => {
                  speakSound.playCoin();
                  setTheme(themeId);
                }}
              />

              <div className={`relative overflow-hidden rounded-2xl border-4 border-slate-900 bg-gradient-to-r ${themeStyle.glow} p-4 text-white`}>
                <div className="absolute top-2 left-2 rounded-md border border-white/20 bg-slate-900/80 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest">
                  {t('shared.preview')}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2" aria-hidden="true">
                  <span className="text-3xl">🧙‍♂️</span>
                  <span className="text-lg">→</span>
                  {[0, 1, 2].map((index) => (
                    <span key={index} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white/15 text-sm">
                      {themeStyle.icon}
                    </span>
                  ))}
                  <span className="text-lg">→</span>
                  <span className="text-3xl">🪄</span>
                </div>
                <p className="mt-2 text-center text-xs font-black uppercase tracking-wider">
                  {t(`wizard.preview.${theme}.title`)}
                </p>
                <p className="text-center text-[10px] font-bold text-white/85">
                  {t(`wizard.preview.${theme}.description`)}
                </p>
              </div>
            </div>

            <WordSetPicker
              legend={strings.chooseSet}
              myWordsLabel={strings.myWords}
              activeCategoryId={activeCategory.id}
              customWords={customWords}
              onSelect={setActiveCategory}
            />
            <ListenAndLearnSection words={activeCategory.id === 'custom' ? customWords : list} />
            <CustomWordsSection
              customWords={customWords}
              onAddWord={onAddCustomWord}
              onDeleteWord={onDeleteCustomWord}
              onClearAll={onClearCustomWords}
            />

            {!isSupported && (
              <p className="text-xs font-bold text-rose-600 text-center animate-pulse" role="alert">
                {t('shared.voiceNeedsChrome')}
              </p>
            )}

            <button
              type="button"
              onClick={startGame}
              disabled={!isSupported}
              className="w-full py-3 bg-violet-400 hover:bg-violet-500 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4 stroke-[3]" /> {strings.start}
            </button>
          </div>
        </div>
      )}

      {phase === 'PLAYING' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border-4 border-slate-900 bg-white p-2 sm:grid-cols-4 sm:p-3">
            <div className="rounded-xl bg-violet-50 p-2 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">{strings.score}</span>
              <span className="text-xl font-black text-slate-900">🪄 {spellNumber}</span>
            </div>
            <div className="rounded-xl bg-purple-50 p-2 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 block">{strings.spellProgress}</span>
              <span className="text-xl font-black text-violet-700">
                {Math.min(
                  feedback === 'complete' ? spellNumber : spellNumber + 1,
                  SPELLS_PER_SESSION,
                )}{' '}
                / {SPELLS_PER_SESSION}
              </span>
            </div>
            <div className="rounded-xl bg-cyan-50 p-2 text-center">
              <span className="block text-[10px] font-black uppercase tracking-widest text-cyan-700">{strings.wards}</span>
              <span className="mt-1 flex justify-center gap-1" aria-label={`${strings.wards}: ${wards}`}>
                {Array.from({ length: WARDS_PER_SESSION }).map((_, index) => (
                  <Shield
                    key={index}
                    className={`h-5 w-5 stroke-[3] ${
                      index < wards
                        ? 'fill-cyan-300 text-cyan-800'
                        : 'fill-slate-100 text-slate-300'
                    }`}
                  />
                ))}
              </span>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">{strings.best}</span>
              <span className="text-xl font-black text-emerald-600 block">{highScore}</span>
            </div>
          </div>

          <PauseButton
            paused={paused}
            onToggle={() => setPaused((current) => !current)}
            pauseLabel={strings.pause}
            resumeLabel={strings.resume}
          />

          <section
            aria-label={strings.workshop}
            className={`wizard-spell-stage relative overflow-hidden rounded-3xl border-8 border-slate-900 bg-gradient-to-br ${themeStyle.glow} p-3 sm:p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]`}
          >
            <div className="wizard-stars" aria-hidden="true">
              {MAGIC_STARS.map(([left, top, delay], index) => (
                <span
                  key={index}
                  style={{ left, top, animationDelay: delay }}
                >
                  ✦
                </span>
              ))}
            </div>

            <div className="wizard-duel-scene relative z-10 grid grid-cols-[auto_1fr_auto] items-center gap-2 px-1 py-2 text-white sm:gap-5 sm:px-8" aria-hidden="true">
              <div className={`wizard-character ${feedback === 'curse' ? 'is-hit' : ''}`}>
                <span className="text-5xl sm:text-7xl">🧙‍♂️</span>
                <span className="wizard-wand-spark">✦</span>
              </div>

              <div className={`wizard-spell-circle wizard-spell-circle-${theme} ${feedback === 'complete' ? 'is-casting' : ''}`}>
                <span className="wizard-orbit wizard-orbit-one" />
                <span className="wizard-orbit wizard-orbit-two" />
                <span className="wizard-element-core">{themeStyle.icon}</span>
                <span className="wizard-charge-count">{chargedRunes.size}/{recipe.length}</span>
              </div>

              <div className={`wizard-curse-cloud ${curseTriggered ? 'is-sealed' : ''}`}>
                <span className="text-4xl sm:text-6xl">{curseTriggered ? '🔒' : '🌑'}</span>
                <Skull className="wizard-curse-skull h-5 w-5 sm:h-7 sm:w-7" />
              </div>
            </div>

            {feedback === 'complete' && (
              <div className="wizard-cast-overlay" aria-hidden="true">
                <span>{themeStyle.icon}</span>
                <strong>{strings.spellCast}</strong>
              </div>
            )}
            {feedback === 'curse' && (
              <div className="wizard-curse-overlay" aria-hidden="true">
                <span>💥</span>
                <strong>{strings.curseHit}</strong>
              </div>
            )}

            <div className="wizard-spellbook relative z-10 mt-2 rounded-2xl border-4 border-slate-900 bg-white/95 p-3 sm:mt-4 sm:p-5">
              <div className="flex items-center justify-center gap-2 text-slate-900">
                <BookOpen className="h-5 w-5 text-violet-700" />
                <h2 className="text-center text-lg font-black uppercase tracking-wider">
                  {strings.recipeTitle}
                </h2>
              </div>
              <p className="mb-3 text-center text-xs font-bold text-violet-700">
                {strings.recipeHint}
              </p>

              <div className="wizard-rune-grid grid grid-cols-2 gap-2 sm:grid-cols-3" role="list">
                {recipe.map((rune, index) => {
                  const charged = chargedRunes.has(index);
                  return (
                    <div
                      key={`${rune.word}-${index}`}
                      role="listitem"
                      data-charged={charged ? 'true' : 'false'}
                      className={`wizard-rune-card relative min-w-0 rounded-2xl border-4 border-slate-900 p-3 text-center transition-all ${
                        charged
                          ? `${themeStyle.charged} is-charged scale-[0.98]`
                          : `${themeStyle.panel} shadow-[3px_3px_0_0_rgba(15,23,42,1)]`
                      }`}
                    >
                      {charged && <span className="wizard-rune-energy" aria-hidden="true">✦</span>}
                      <span className="block text-2xl" aria-hidden="true">
                        {charged ? '✨' : '◇'}
                      </span>
                      <p className={`break-words text-sm font-black ${charged ? 'text-slate-700 line-through' : 'text-slate-950'}`}>
                        {rune.word}
                      </p>
                      <p className="mt-0.5 break-words text-[10px] font-bold text-violet-900">
                        {translatedWord(rune)}
                      </p>
                      {charged ? (
                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase text-slate-900">
                          <Check className="h-3.5 w-3.5 stroke-[4]" /> {strings.charged}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => playRune(rune.word)}
                          aria-label={`${strings.hearRune}: ${rune.word}`}
                          className="mt-2 inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-white px-2 py-1 text-[10px] font-black uppercase text-violet-700 hover:bg-violet-50"
                        >
                          <Volume2 className="h-3.5 w-3.5" /> EN
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {cursedRune && (
                <aside
                  data-cursed-rune="true"
                  className={`wizard-cursed-rune mt-3 rounded-2xl border-4 p-3 text-center ${
                    curseTriggered
                      ? 'is-sealed border-slate-500 bg-slate-200 text-slate-600'
                      : 'border-rose-950 bg-gradient-to-r from-slate-950 via-purple-950 to-rose-950 text-white'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-300">
                      <Skull className="h-4 w-4" /> {strings.cursedRune}
                    </span>
                    <p data-cursed-word="true" className={`text-base font-black ${curseTriggered ? 'line-through' : ''}`}>
                      {cursedRune.word}
                    </p>
                    <span className="text-[10px] font-bold text-violet-200">
                      {translatedWord(cursedRune)}
                    </span>
                  </div>
                  <p className={`mt-1 text-[10px] font-black uppercase ${curseTriggered ? 'text-slate-600' : 'text-rose-300 animate-pulse'}`}>
                    {curseTriggered ? strings.curseSealed : strings.doNotSay}
                  </p>
                </aside>
              )}

              <p className="mt-2 text-center text-[10px] font-bold text-slate-500">
                {strings.safeMistakes}
              </p>

              <div className="mt-3 min-h-8 rounded-xl border-2 border-slate-900 bg-slate-100 px-3 py-2 text-center" role="status" aria-live="polite">
                <p className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {feedback === 'complete'
                    ? strings.spellComplete
                    : feedback === 'curse'
                      ? strings.curseHit
                    : status.status === 'listening'
                      ? t('shared.micListening')
                      : status.message}
                </p>
                {lastRecognized && (
                  <p className="mt-0.5 text-[10px] font-bold text-slate-600">
                    {strings.youSaid}: {lastRecognized}
                  </p>
                )}
              </div>
            </div>

            {paused && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-slate-900/90 text-white">
                <Pause className="h-12 w-12" />
                <span className="text-lg font-black uppercase tracking-widest">{strings.paused}</span>
              </div>
            )}
          </section>
        </div>
      )}

      {phase === 'GAMEOVER' && (
        <div className="max-w-md mx-auto w-full py-4 animate-scale-up">
          <GameResultCard
            title={outcome === 'lost' ? strings.defeatTitle : strings.gameOverTitle}
            description={outcome === 'lost' ? strings.defeatSubtitle : strings.gameOverSubtitle}
            scoreLabel={strings.score}
            score={score}
            bestLabel={strings.best}
            best={Math.max(highScore, score)}
            wordStats={wordStudyStats}
            words={list}
            replayLabel={strings.playAgain}
            onReplay={startGame}
            icon={<span className="block text-5xl">{outcome === 'lost' ? '🧙‍♂️💨📕' : '🧙‍♂️📖✨'}</span>}
          />
        </div>
      )}
    </div>
  );
}

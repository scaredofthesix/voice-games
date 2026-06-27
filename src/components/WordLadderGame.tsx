import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, Pause, Play, Rocket, RotateCcw, Volume2 } from 'lucide-react';

import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
import {
  WordLadderState,
  climbStep,
  createLadder,
  DEFAULT_LADDER_STEPS,
  ladderProgress,
  ladderZone,
  pickNextIndex,
} from '../gameLogic';
import { matchesWord, speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { RocketClimb, RocketTheme } from './RocketClimb';
import { CustomWordsManager } from './CustomWordsManager';
import { useUiLanguage } from '../uiLanguage';

// Word Ladder (rocket climb): each correctly pronounced word lifts the rocket
// one step higher through altitude zones (ground -> clouds -> sky -> space).
// Reaching the top step wins. Rules live in gameLogic.ts; the animated scene
// lives in RocketClimb.tsx; this component is the start screen, word picker and
// voice wiring around them. Reworked in Sprint 2 (Assignment 4).

const ZONE_LABEL: Record<string, string> = {
  ground: 'Ground',
  clouds: 'Clouds',
  sky: 'Sky',
  space: 'Space',
};

interface WordLadderGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
  onAddCustomWord?: (word: string, translation: string) => void;
  onDeleteCustomWord?: (index: number) => void;
  onClearCustomWords?: () => void;
}

export function WordLadderGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
  onAddCustomWord,
  onDeleteCustomWord,
  onClearCustomWords,
}: WordLadderGameProps) {
  const { t, language, setLanguage } = useUiLanguage();
  const [activeCategory, setActiveCategory] = useState<WordCategory>(
    BUILTIN_CATEGORIES[0],
  );
  const [rocketTheme, setRocketTheme] = useState<RocketTheme>('earth');
  const [ladder, setLadder] = useState<WordLadderState>(() => createLadder());
  const [phase, setPhase] = useState<'START' | 'PLAYING'>('START');
  const [paused, setPaused] = useState(false);
  const [target, setTarget] = useState('');
  const [boostNonce, setBoostNonce] = useState(0);
  const [isWarmupOpen, setIsWarmupOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const phaseRef = useRef(phase);
  const targetRef = useRef(target);
  const ladderRef = useRef(ladder);
  const pausedRef = useRef(paused);
  const wordIndexRef = useRef(-1);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);
  useEffect(() => {
    ladderRef.current = ladder;
  }, [ladder]);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

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
    speakWord(word);
  }, [wordList]);

  useEffect(() => {
    onScoreChange?.(ladder.currentStep);
  }, [ladder.currentStep, onScoreChange]);

  useEffect(() => {
    if (ladder.status === 'won' && ladder.currentStep > highScore) {
      onUpdateHighScore?.(ladder.currentStep);
    }
  }, [ladder.status, ladder.currentStep, highScore, onUpdateHighScore]);

  const handleTranscript = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'PLAYING') return;
      if (pausedRef.current) return;
      const prev = ladderRef.current;
      if (prev.status !== 'playing') return;
      const current = targetRef.current;
      if (!current) return;
      if (!matchesWord(text, current, true)) return;

      const updated = climbStep(prev);
      ladderRef.current = updated;
      setLadder(updated);
      setBoostNonce((n) => n + 1);
      if (updated.status === 'won') {
        speakSound.playSuccess();
      } else {
        speakSound.playCoin();
        nextWord();
      }
    },
    [nextWord],
  );

  const { status, lastTranscript, isSupported, start, stop } =
    useSpeechRecognition(handleTranscript);

  const beginClimb = useCallback(() => {
    speakSound.playCoin();
    const fresh = createLadder(DEFAULT_LADDER_STEPS);
    ladderRef.current = fresh;
    setLadder(fresh);
    setPaused(false);
    pausedRef.current = false;
    setPhase('PLAYING');
    wordIndexRef.current = -1;
    nextWord();
    start();
  }, [nextWord, start]);

  const restart = useCallback(() => {
    beginClimb();
  }, [beginClimb]);

  // Pause/resume: the climb is self-paced (no timer), so pausing just stops
  // listening until the player resumes.
  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (next) stop();
      else start();
      return next;
    });
  }, [start, stop]);

  useEffect(() => {
    if (ladder.status === 'won') stop();
  }, [ladder.status, stop]);

  const isWon = ladder.status === 'won';
  const zone = ladderZone(ladder);
  const progressPct = Math.round(ladderProgress(ladder) * 100);
  const list = wordList();

  return (
    <section className="max-w-md mx-auto py-4 px-2" aria-label="Word Ladder rocket game">
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
          rocketTheme === 'earth' ? 'bg-sky-50 bubble-shadow-purple' :
          rocketTheme === 'mars' ? 'bg-orange-50 bubble-shadow-pink' :
          'bg-indigo-50 bubble-shadow-purple'
        }`} id="word-ladder-start">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500 border-4 border-slate-900 flex items-center justify-center">
              <Rocket className="w-9 h-9 text-white stroke-[3]" />
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
              {t('games.wordLadder.title')}
            </h1>
            <p className="text-xs font-bold text-slate-600 max-w-xs leading-relaxed">
              {t('games.wordLadder.description')}
            </p>
          </div>

          {/* Choose Mission Theme */}
          <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <label className="block text-xs font-black text-indigo-500 uppercase tracking-widest ml-1">
              {t('shared.chooseMissionTheme')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['earth', 'mars', 'nebula'] as const).map((themeId) => (
                <button
                  key={themeId}
                  onClick={() => {
                    speakSound.playCoin();
                    setRocketTheme(themeId);
                  }}
                  className={`px-2 py-2 border-4 rounded-xl text-[9px] font-black uppercase transition-all tracking-wider cursor-pointer text-center ${
                    rocketTheme === themeId
                      ? 'bg-indigo-500 border-slate-900 text-white shadow-sm -translate-y-0.5'
                      : 'bg-white border-slate-300 text-slate-700 hover:border-slate-900'
                  }`}
                >
                  {t(`themes.ladder.${themeId}`)}
                </button>
              ))}
            </div>

            {/* Dynamic visual preview of selected rocket theme */}
            <div className={`w-full h-24 rounded-2xl border-4 border-slate-900 relative overflow-hidden transition-all duration-300 flex items-center justify-center ${
              rocketTheme === 'earth' ? 'bg-gradient-to-b from-sky-400 to-indigo-950' :
              rocketTheme === 'mars' ? 'bg-gradient-to-b from-orange-500 to-amber-950' :
              'bg-gradient-to-b from-purple-950 via-pink-950 to-indigo-900'
            }`}>
              {rocketTheme === 'earth' && (
                <>
                  <div className="absolute inset-x-0 bottom-0 h-4 bg-emerald-500" />
                  <span className="absolute bottom-1 left-4 text-xs">🌲</span>
                  <span className="absolute bottom-2 right-4 text-xs">🌲</span>
                  <span className="absolute top-2 right-6 text-xl animate-pulse">🌙</span>
                  <span className="absolute top-8 left-12 text-sm animate-bounce">☁️</span>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-3xl animate-pulse">🚀</span>
                </>
              )}
              {rocketTheme === 'mars' && (
                <>
                  <div className="absolute inset-x-0 bottom-0 h-4 bg-amber-800" />
                  <span className="absolute bottom-2 left-6 text-xs">🌵</span>
                  <span className="absolute bottom-2 right-8 text-xs">🌵</span>
                  <span className="absolute top-2 left-8 text-xl animate-pulse">☀️</span>
                  <span className="absolute top-6 right-16 text-sm animate-bounce">🪐</span>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-3xl animate-pulse">🚀</span>
                </>
              )}
              {rocketTheme === 'nebula' && (
                <>
                  <div className="absolute w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                  <span className="absolute top-2 left-12 text-sm animate-pulse">🛸</span>
                  <span className="absolute top-4 right-10 text-xs animate-ping">✨</span>
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-3xl animate-pulse">🚀</span>
                </>
              )}
              <div className="absolute top-2 left-2 bg-slate-900/80 border border-white/20 text-white font-black text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md z-10">
                Preview
              </div>
            </div>
          </div>

          <fieldset className="text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
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
                      ? 'bg-indigo-400 border-slate-900 text-white'
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
            onClick={beginClimb}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2"
            aria-label="Start the rocket climb"
          >
            <Play className="w-4 h-4 fill-current stroke-[3]" /> {t('shared.startClimb')}
          </button>
        </div>
      ) : (
        <div className="space-y-3" id="word-ladder-play">
          {/* Animated rocket scene */}
          <div className="relative border-4 border-slate-900 rounded-2xl overflow-hidden bg-slate-900">
            <RocketClimb
              progress={ladderProgress(ladder)}
              zone={zone}
              boostNonce={boostNonce}
              won={isWon}
              theme={rocketTheme}
            />
            {paused && !isWon && (
              <div
                className="absolute inset-0 bg-slate-900/75 flex flex-col items-center justify-center gap-1"
                role="status"
              >
                <span className="text-4xl" aria-hidden="true">⏸️</span>
                <span className="text-lg font-black uppercase tracking-widest text-white">
                  Paused
                </span>
              </div>
            )}
          </div>

          {/* Prominent pause / resume control */}
          {!isWon && (
            <button
              onClick={togglePause}
              aria-pressed={paused}
              aria-label={paused ? 'Resume the climb' : 'Pause the climb'}
              className={`w-full py-3 border-4 border-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 ${
                paused
                  ? 'bg-emerald-400 hover:bg-emerald-500 text-slate-900'
                  : 'bg-amber-400 hover:bg-amber-500 text-slate-900'
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

          {/* Climb progress (accessible) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 inline-flex items-center gap-1">
                <Rocket className="w-4 h-4 stroke-[3]" /> {ZONE_LABEL[zone]}
              </span>
              <span
                className="text-xs font-mono font-bold text-indigo-700"
                aria-label={`Step ${ladder.currentStep} of ${ladder.totalSteps}`}
              >
                {ladder.currentStep}/{ladder.totalSteps}
              </span>
            </div>
            <div
              className="h-4 rounded-full bg-indigo-100 border-2 border-slate-900 overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {isWon ? (
            <div className="text-center space-y-4 py-4" role="status">
              <h2 className="text-3xl font-black uppercase tracking-wider text-slate-900">
                {t('games.wordLadder.winTitle')}
              </h2>
              <p className="text-sm font-bold text-slate-600">
                {t('games.wordLadder.winDescription').replace('{total}', ladder.totalSteps.toString())}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={restart}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2"
                  aria-label="Play again"
                >
                  <RotateCcw className="w-4 h-4 stroke-[3]" /> {t('games.wordLadder.again')}
                </button>
                <button
                  onClick={() => {
                    stop();
                    onBackToHub();
                  }}
                  className="flex-1 py-3 bg-white hover:bg-slate-50 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl"
                >
                  {t('shared.backToHub')}
                </button>
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
                          onClick={() => speakWord(target)}
                          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white border-2 border-slate-900 px-2.5 py-1 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform active:translate-y-0.5"
                          aria-label={`Hear the word ${target}`}
                        >
                          <Volume2 className="w-3.5 h-3.5 stroke-[3] text-indigo-500" /> {t('games.wordLadder.hearIt')}
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

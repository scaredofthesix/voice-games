import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Mic, Play, Rocket, RotateCcw, Volume2 } from 'lucide-react';

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
import { RocketClimb } from './RocketClimb';
import { CustomWordsManager } from './CustomWordsManager';

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
  const [activeCategory, setActiveCategory] = useState<WordCategory>(
    BUILTIN_CATEGORIES[0],
  );
  const [ladder, setLadder] = useState<WordLadderState>(() => createLadder());
  const [phase, setPhase] = useState<'START' | 'PLAYING'>('START');
  const [target, setTarget] = useState('');
  const [boostNonce, setBoostNonce] = useState(0);
  const [isWarmupOpen, setIsWarmupOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const phaseRef = useRef(phase);
  const targetRef = useRef(target);
  const ladderRef = useRef(ladder);
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
    setPhase('PLAYING');
    wordIndexRef.current = -1;
    nextWord();
    start();
  }, [nextWord, start]);

  const restart = useCallback(() => {
    beginClimb();
  }, [beginClimb]);

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
        <ArrowLeft className="w-4 h-4 stroke-[3]" /> Hub
      </button>

      {phase === 'START' ? (
        <div className="space-y-4" id="word-ladder-start">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500 border-4 border-slate-900 flex items-center justify-center">
              <Rocket className="w-9 h-9 text-white stroke-[3]" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900">
              Word Ladder
            </h1>
            <p className="text-xs font-bold text-slate-600 max-w-xs leading-relaxed">
              Say each English word to fly your rocket one step higher, from the
              ground up into space. Reach the top in {DEFAULT_LADDER_STEPS} words
              to win the launch!
            </p>
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
            <Play className="w-4 h-4 fill-current stroke-[3]" /> Start Climb
          </button>
        </div>
      ) : (
        <div className="space-y-3" id="word-ladder-play">
          {/* Animated rocket scene */}
          <div className="border-4 border-slate-900 rounded-2xl overflow-hidden bg-slate-900">
            <RocketClimb
              progress={ladderProgress(ladder)}
              zone={zone}
              boostNonce={boostNonce}
              won={isWon}
            />
          </div>

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
                Top reached! 🚀
              </h2>
              <p className="text-sm font-bold text-slate-600">
                You climbed all {ladder.totalSteps} steps into space.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={restart}
                  className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2"
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
                Say this word to climb
              </p>
              <p
                className="text-4xl font-black tracking-wide text-slate-900"
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
                  <>
                    {translation ? (
                      <p className="text-sm font-extrabold text-purple-600 mt-0.5">
                        {translation}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-center gap-4 mt-2">
                      <button
                        onClick={() => speakWord(target)}
                        className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900"
                        aria-label={`Hear the word ${target}`}
                      >
                        <Volume2 className="w-4 h-4 stroke-[3]" /> Hear it
                      </button>
                      {currentWordItem?.translationRu && (
                        <button
                          onClick={() => currentWordItem?.translationRu && speakWord(currentWordItem.translationRu, 'ru')}
                          className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-800"
                          aria-label="Listen in Russian"
                        >
                          <Volume2 className="w-4 h-4 stroke-[3]" /> Слушать по-русски
                        </button>
                      )}
                    </div>
                  </>
                );
              })()}
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

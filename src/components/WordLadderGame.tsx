import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, pickAdaptiveWordIndex, GameId } from '../progress';
import { Play, Rocket } from 'lucide-react';

import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
import {
  WordLadderState,
  climbStep,
  createLadder,
  DEFAULT_LADDER_STEPS,
  ladderProgress,
  ladderZone,
} from '../gameLogic';
import { matchesWord, speakSound, speakWord } from '../voice/engine';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { RocketClimb, RocketTheme } from './RocketClimb';
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

// Word Ladder (rocket climb): each correctly pronounced word lifts the rocket
// one step higher through altitude zones (ground -> clouds -> sky -> space).
// Reaching the top step wins. Rules live in gameLogic.ts; the animated scene
// lives in RocketClimb.tsx; this component is the start screen, word picker and
// voice wiring around them. Reworked in Sprint 2 (Assignment 4).

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
  const { t } = useUiLanguage();
  const [activeCategory, setActiveCategory] = useState<WordCategory>(
    BUILTIN_CATEGORIES[0],
  );
  const [rocketTheme, setRocketTheme] = useState<RocketTheme>('earth');
  const [ladder, setLadder] = useState<WordLadderState>(() => createLadder());
  const [phase, setPhase] = useState<'START' | 'PLAYING'>('START');
  const [paused, setPaused] = useState(false);
  const [target, setTarget] = useState('');
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [boostNonce, setBoostNonce] = useState(0);
  const [isWarmupOpen, setIsWarmupOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isAlienGreetingOpen, setIsAlienGreetingOpen] = useState(false);

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
    const words = list.map((w) => w.word);
    const wordStats = loadProgress()['word-ladder'].words;
    const idx = pickAdaptiveWordIndex(words, wordStats, wordIndexRef.current);
    wordIndexRef.current = idx;
    const word = list[idx].word;
    setTarget(word);
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

      setWordStudyStats((prevStats) => ({
        ...prevStats,
        [current]: {
          spoken: (prevStats[current]?.spoken || 0) + 1,
          struggled: prevStats[current]?.struggled || 0,
        },
      }));
      saveProgress(recordWordSpoken(loadProgress(), 'word-ladder', current));

      if (updated.status === 'won') {
        speakSound.playCorrect();
      } else {
        speakSound.playCorrect();
        nextWord();
      }
    },
    [nextWord],
  );

  const { status, lastTranscript, isSupported, start, stop } =
    useSpeechRecognition(handleTranscript);

  const beginClimb = useCallback(() => {
    speakSound.playCoin();
    const updatedProgress = recordSessionPlayed(loadProgress(), 'word-ladder');
    saveProgress(updatedProgress);
    const fresh = createLadder(DEFAULT_LADDER_STEPS);
    ladderRef.current = fresh;
    setLadder(fresh);
    setWordStudyStats({});
    setPaused(false);
    pausedRef.current = false;
    setIsAlienGreetingOpen(false);
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
  const resultCard = (
    <GameResultCard
      title={t('games.wordLadder.winTitle')}
      description={t('games.wordLadder.winDescription').replace('{total}', ladder.totalSteps.toString())}
      scoreLabel={t('ladder.altitude')}
      score={ladder.currentStep}
      bestLabel={t('ladder.personalHigh')}
      best={Math.max(highScore, ladder.currentStep)}
      wordStats={wordStudyStats}
      words={list}
      replayLabel={t('games.wordLadder.again')}
      onReplay={restart}
      icon={<span className="block text-5xl" aria-hidden="true">🚀👽</span>}
      summary={(
        <div className="rounded-2xl border-4 border-slate-900 bg-sky-100 p-4 text-left shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">👽</span>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                {t('ladder.alienEncounter')}
              </p>
              <p className="text-sm font-bold text-slate-800">
                {t('ladder.alienDescription')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAlienGreetingOpen((value) => !value)}
            className="mt-4 w-full rounded-2xl border-4 border-slate-900 bg-white py-3 font-black uppercase tracking-wider text-slate-900 hover:bg-slate-50"
            aria-label={t('ladder.sayHello')}
          >
            {t('ladder.sayHello')}
          </button>
          {isAlienGreetingOpen && (
            <p className="mt-3 rounded-xl border-2 border-slate-900 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              {t('ladder.alienGreeting')}
            </p>
          )}
        </div>
      )}
      toneClass="bg-indigo-50"
      shadowClass="bubble-shadow-purple"
    />
  );

  return (
    <section className="max-w-md mx-auto py-4 px-2" aria-label={t('games.wordLadder.title')}>
      <BackToHubButton label={t('shared.backToHub')} onClick={() => { stop(); onBackToHub(); }} />

      {phase === 'START' ? (
        <div id="word-ladder-start">
          <GameSetupCard
            icon={<Rocket className="h-10 w-10 text-white stroke-[3]" />}
            title={t('games.wordLadder.title')}
            description={t('games.wordLadder.description')}
            toneClass={
              rocketTheme === 'earth' ? 'bg-sky-50' :
              rocketTheme === 'mars' ? 'bg-orange-50' :
              'bg-indigo-50'
            }
            iconClass="bg-indigo-500"
            shadowClass={rocketTheme === 'mars' ? 'bubble-shadow-pink' : 'bubble-shadow-purple'}
          >

          {/* Choose Mission Theme */}
          <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <OptionPicker
              label={t('shared.chooseMissionTheme')}
              options={(['earth', 'mars', 'nebula'] as const).map((themeId) => ({
                id: themeId,
                label: t(`themes.ladder.${themeId}`),
              }))}
              selected={rocketTheme}
              onSelect={(themeId) => {
                speakSound.playCoin();
                setRocketTheme(themeId);
              }}
            />

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

          {!isSupported && (
            <p className="text-xs font-bold text-rose-600" role="alert">
              {t('shared.voiceNeedsChrome')}
            </p>
          )}

          <button
            onClick={beginClimb}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2"
            aria-label={t('shared.startClimb')}
          >
            <Play className="w-4 h-4 fill-current stroke-[3]" /> {t('shared.startClimb')}
          </button>
          </GameSetupCard>
        </div>
      ) : isWon ? (
        <div className="max-w-md mx-auto w-full pb-4 animate-scale-up">
          {resultCard}
        </div>
      ) : (
        <div className="space-y-3" id="word-ladder-play">
          <GameHeader
            icon={<Rocket className="h-5 w-5 text-slate-900 stroke-[3]" />}
            title={t('games.wordLadder.title')}
            subtitle={`${
              activeCategory.id === 'custom'
                ? t('shared.myWords')
                : t(`wordSets.${activeCategory.id}`)
            } - ${t(`rocket.zones.${zone}`)}`}
            stats={[
              { label: t('rocket.step'), value: `${ladder.currentStep}/${ladder.totalSteps}`, tone: 'sky' },
              { label: t('shared.progress'), value: `${progressPct}%`, tone: 'emerald' },
              { label: t('shared.best'), value: Math.max(highScore, ladder.currentStep), tone: 'amber' },
            ]}
          />

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
                <span className="text-lg font-black uppercase tracking-widest text-orange-400">
                  {t('shared.paused')}
                </span>
              </div>
            )}
          </div>

          {/* Prominent pause / resume control */}
          {!isWon && (
            <PauseButton
              paused={paused}
              onToggle={togglePause}
              pauseLabel={t('shared.pause')}
              resumeLabel={t('shared.resume')}
            />
          )}

          {/* Climb progress (accessible) */}
          <div>
            <div
              className="h-4 rounded-full bg-indigo-100 border-2 border-slate-900 overflow-hidden"
              role="progressbar"
              aria-label={`${t('rocket.step')} ${ladder.currentStep} ${t('rocket.of')} ${ladder.totalSteps}`}
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
                      saveProgress(recordWordStruggled(loadProgress(), 'word-ladder', target));
                    }}
                    onListenRu={() =>
                      currentWordItem?.translationRu && speakWord(currentWordItem.translationRu, 'ru')
                    }
                  />
                );
              })()}

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

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Star, Trophy } from 'lucide-react';

import { BUILTIN_CATEGORIES } from '../data';
import { loadProgress, pickAdaptiveWordIndex, recordHighScore, recordWordSpoken, recordWordStruggled, saveProgress } from '../progress';
import { sceneDefinitions } from '../sentenceBird/presets';
import { cleanText } from '../sentenceBird/speechHelper';
import { synths } from '../sentenceBird/audioSynth';
import type { SceneType } from '../sentenceBird/types';
import type { WordCategory, WordData } from '../types';
import { useUiLanguage } from '../uiLanguage';
import { matchesWord, speakWord } from '../utils';
import { BackToHubButton, CustomWordsSection, GameHeader, GameSetupCard, ListenAndLearnSection, OptionPicker, PauseButton, TargetWordCard, WordSetPicker } from './GameUi';
import FlappyBirdIcon from './FlappyBirdIcon';

interface SentenceBirdGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
  onAddCustomWord?: (word: string, translation: string) => void;
  onDeleteCustomWord?: (index: number) => void;
  onClearCustomWords?: () => void;
}

type WordOption = Omit<WordData, 'speakCount' | 'struggleCount'>;

const GAME_ID = 'sentence-bird' as const;

const LOCAL_LANG = {
  en: {
    title: 'Sentence Bird',
    subtitle: 'Speak one word to fly through each pipe.',
    startLabel: 'Start flying',
    score: 'Score',
    best: 'Best',
    completed: 'Done',
    chooseSet: 'Choose Word Set',
    myWords: 'My Words',
    chooseTheme: 'Choose sky theme',
    targetRibbon: 'Say this word',
    listening: '🎤 Mic is listening...',
    ready: 'Ready to listen.',
    detected: 'Detected',
    completedTitle: 'You did it, champion!',
    completedText: 'You flew through every word in this set.',
    playAgain: 'Play again',
    back: 'Back to hub',
    world: 'World',
    emptySet: 'Add words to My Words or choose a built-in set.',
  },
  ru: {
    title: 'Фразоптичка',
    subtitle: 'Произнеси одно слово, чтобы лететь через трубы.',
    startLabel: 'Начать полёт',
    score: 'Очки',
    best: 'Рекорд',
    completed: 'Готово',
    chooseSet: 'Выбери набор слов',
    myWords: 'Мои слова',
    chooseTheme: 'Выбери тему неба',
    targetRibbon: 'Произнеси слово',
    listening: '🎤 Микрофон слушает...',
    ready: 'Готов слушать.',
    detected: 'Распознано',
    completedTitle: 'Ты справился, чемпион!',
    completedText: 'Ты пролетел через все слова в наборе.',
    playAgain: 'Играть снова',
    back: 'Назад в хаб',
    world: 'Мир',
    emptySet: 'Добавь слова в Мои слова или выбери готовый набор.',
  },
};

function normalizeWords(category: WordCategory): WordOption[] {
  return category.words.filter((item) => item.word.trim().length > 0);
}

function ThemePreview({ scene }: { scene: (typeof sceneDefinitions)[number] }) {
  const { t } = useUiLanguage();
  return (
    <div className={`mt-3 overflow-hidden rounded-2xl border-4 border-slate-900 ${scene.bgClass}`}>
      <div className="relative h-24">
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }} />
        <div className="absolute left-4 top-4 text-2xl">{scene.ambientSoundEmoji}</div>
        <div className={`absolute left-0 right-0 bottom-0 h-6 ${scene.groundClass}`} />
        <div className="absolute right-5 top-5 flex items-center gap-2">
          <div className="h-10 w-6 border-x-4 border-b-4 border-slate-900 bg-emerald-500" />
          <div className="h-10 w-6 border-x-4 border-t-4 border-slate-900 bg-emerald-500 translate-y-10" />
        </div>
        <div className="absolute left-1/2 top-10 -translate-x-1/2">
          <FlappyBirdIcon size={40} />
        </div>
      </div>
      <div className={`border-t-4 border-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-wider ${scene.accentClass}`}>
        {t(`themes.sentenceBird.${scene.id}`)} {scene.particleEmoji}
      </div>
    </div>
  );
}

export default function SentenceBirdGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
  onAddCustomWord = () => undefined,
  onDeleteCustomWord = () => undefined,
  onClearCustomWords = () => undefined,
}: SentenceBirdGameProps) {
  const { language, t } = useUiLanguage();
  const strings = Object.fromEntries(
    Object.keys(LOCAL_LANG.en).map((key) => [key, t(`sentenceBird.${key}`)]),
  ) as Record<keyof typeof LOCAL_LANG.en, string>;

  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [activeSceneId, setActiveSceneId] = useState<SceneType>('forest');
  const [gameState, setGameState] = useState<'lobby' | 'playing'>('lobby');
  const [targetIndex, setTargetIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [spokenText, setSpokenText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isFlapping, setIsFlapping] = useState(false);
  const [pipeEntering, setPipeEntering] = useState(false);
  const [paused, setPaused] = useState(false);
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>(() => {
    try {
      return loadProgress()[GAME_ID].words;
    } catch {
      return {};
    }
  });

  const recognitionRef = useRef<any>(null);
  const isProcessingSuccessRef = useRef(false);
  const keepListeningRef = useRef(false);
  const gameStateRef = useRef(gameState);
  const consecutiveErrorCountRef = useRef(0);
  const isSpeechActiveRef = useRef(false);
  const pausedRef = useRef(false);
  const targetWordRef = useRef('');
  const targetIndexRef = useRef(-1);
  const wordStatsRef = useRef<Record<string, { spoken: number; struggled: number }>>({});

  const words = useMemo(() => normalizeWords(activeCategory), [activeCategory]);
  const activeScene = sceneDefinitions.find((scene) => scene.id === activeSceneId) || sceneDefinitions[0];
  const currentWord = targetIndex >= 0 ? words[targetIndex] : undefined;
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { targetIndexRef.current = targetIndex; }, [targetIndex]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { targetWordRef.current = currentWord?.word || ''; }, [currentWord?.word]);
  useEffect(() => { wordStatsRef.current = wordStudyStats; }, [wordStudyStats]);
  useEffect(() => {
    onScoreChange?.(score);
    if (score > highScore) {
      onUpdateHighScore?.(score);
    }
    saveProgress(recordHighScore(loadProgress(), GAME_ID, score));
  }, [score, highScore, onScoreChange, onUpdateHighScore]);

  const chooseNextWordIndex = useCallback((previous: number) => {
    if (words.length === 0) return -1;
    const picked = pickAdaptiveWordIndex(
      words.map((item) => item.word),
      wordStatsRef.current,
      previous,
    );
    return Math.max(0, picked);
  }, [words]);

  const safeStartSpeech = useCallback(() => {
    if (!recognitionRef.current || isSpeechActiveRef.current) return;
    isSpeechActiveRef.current = true;
    try {
      recognitionRef.current.start();
    } catch (e) {
      isSpeechActiveRef.current = false;
      console.warn('Speech start failed:', e);
    }
  }, []);

  const handleListenEn = useCallback((word = targetWordRef.current) => {
    if (!word) return;
    setWordStudyStats((prev) => ({
      ...prev,
      [word]: { spoken: prev[word]?.spoken || 0, struggled: (prev[word]?.struggled || 0) + 1 },
    }));
    saveProgress(recordWordStruggled(loadProgress(), GAME_ID, word));
    const resumeAfterSpeech = keepListeningRef.current && gameStateRef.current === 'playing' && !pausedRef.current;
    if (resumeAfterSpeech) {
      keepListeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
    }
    speakWord(word, 'en');
    if (resumeAfterSpeech) {
      window.setTimeout(() => {
        if (gameStateRef.current === 'playing' && !pausedRef.current) {
          keepListeningRef.current = true;
          safeStartSpeech();
        }
      }, 900);
    }
  }, [safeStartSpeech]);

  const handleSuccessHop = useCallback(() => {
    if (isProcessingSuccessRef.current) return;
    const spokenWord = targetWordRef.current;
    if (!spokenWord) return;
    isProcessingSuccessRef.current = true;
    setIsFlapping(true);
    synths.playFlap();
    window.setTimeout(() => { synths.playSuccess(); }, 200);
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);

    saveProgress(recordWordSpoken(loadProgress(), GAME_ID, spokenWord));
    setWordStudyStats((prev) => ({
      ...prev,
      [spokenWord]: { spoken: (prev[spokenWord]?.spoken || 0) + 1, struggled: prev[spokenWord]?.struggled || 0 },
    }));

    window.setTimeout(() => {
      setScore((prev) => prev + 1);
      setSpokenText('');
      const nextIndex = chooseNextWordIndex(targetIndexRef.current);
      setTargetIndex(nextIndex);
      setIsFlapping(false);
      setPipeEntering(true);
      window.setTimeout(() => setPipeEntering(false), 30);
      isProcessingSuccessRef.current = false;
      if (keepListeningRef.current) {
        window.setTimeout(() => {
          if (keepListeningRef.current && !isProcessingSuccessRef.current && gameStateRef.current === 'playing') {
            safeStartSpeech();
          }
        }, 150);
      }
    }, 700);
  }, [chooseNextWordIndex, safeStartSpeech]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isSpeechActiveRef.current = true;
      setIsListening(true);
      consecutiveErrorCountRef.current = 0;
    };

    rec.onresult = (event: any) => {
      if (pausedRef.current) return;
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }
      const activeResultText = finalTranscript || interimTranscript;
      if (!activeResultText.trim()) return;
      setSpokenText(activeResultText);
      const target = targetWordRef.current;
      if (target && (matchesWord(activeResultText, target) || cleanText(activeResultText).includes(cleanText(target)))) {
        handleSuccessHop();
      }
    };

    rec.onerror = (err: any) => {
      console.warn('SPEECH ERROR', err.error);
      if (err.error !== 'no-speech') consecutiveErrorCountRef.current += 1;
      if (err.error === 'not-allowed') {
        setIsListening(false);
        keepListeningRef.current = false;
      }
      if (consecutiveErrorCountRef.current > 5) {
        setIsListening(false);
        keepListeningRef.current = false;
      }
    };

    rec.onend = () => {
      isSpeechActiveRef.current = false;
      setIsListening(false);
      if (keepListeningRef.current && !isProcessingSuccessRef.current && gameStateRef.current === 'playing' && consecutiveErrorCountRef.current <= 5) {
        window.setTimeout(() => {
          if (keepListeningRef.current && !isProcessingSuccessRef.current && gameStateRef.current === 'playing' && consecutiveErrorCountRef.current <= 5) {
            safeStartSpeech();
          }
        }, 300);
      }
    };

    recognitionRef.current = rec;
    return () => {
      keepListeningRef.current = false;
      try { recognitionRef.current?.abort(); } catch {}
    };
  }, [handleSuccessHop, safeStartSpeech]);

  const startPlayingAndListening = () => {
    synths.playFlap();
    const firstIndex = chooseNextWordIndex(-1);
    setTargetIndex(firstIndex);
    setScore(0);
    setSpokenText('');
    setPipeEntering(true);
    setPaused(false);
    pausedRef.current = false;
    setGameState('playing');
    window.setTimeout(() => setPipeEntering(false), 30);
    window.setTimeout(() => {
      if (recognitionRef.current && firstIndex !== -1) {
        keepListeningRef.current = true;
        consecutiveErrorCountRef.current = 0;
        safeStartSpeech();
      }
    }, 150);
  };

  const togglePause = () => {
    const nextPaused = !pausedRef.current;
    pausedRef.current = nextPaused;
    setPaused(nextPaused);
    if (nextPaused) {
      keepListeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
      return;
    }
    keepListeningRef.current = true;
    consecutiveErrorCountRef.current = 0;
    window.setTimeout(safeStartSpeech, 100);
  };

  const handleBackToHub = () => {
    keepListeningRef.current = false;
    try { recognitionRef.current?.abort(); } catch {}
    if (score > highScore) onUpdateHighScore?.(score);
    onBackToHub();
  };

  if (gameState === 'lobby') {
    return (
      <section className="max-w-md mx-auto py-4 px-2">
        <BackToHubButton label={strings.back} onClick={onBackToHub} />
        <GameSetupCard
          icon={<FlappyBirdIcon size={52} />}
          title={strings.title}
          description={strings.subtitle}
          toneClass="bg-sky-50"
          iconClass="bg-yellow-300"
          shadowClass="bubble-shadow-cyan"
        >
          <div className="rounded-2xl border-4 border-slate-900 bg-white p-3">
            <OptionPicker<SceneType>
              label={strings.chooseTheme}
              options={sceneDefinitions.map((scene) => ({ id: scene.id, label: t(`themes.sentenceBird.${scene.id}`) }))}
              selected={activeSceneId}
              onSelect={setActiveSceneId}
              columns={2}
            />
            <ThemePreview scene={activeScene} />
          </div>
          <WordSetPicker
            legend={t('shared.chooseWordSet')}
            myWordsLabel={t('shared.myWords')}
            activeCategoryId={activeCategory.id}
            customWords={customWords}
            onSelect={setActiveCategory}
          />
          <ListenAndLearnSection words={words} />
          <CustomWordsSection
            customWords={customWords}
            onAddWord={onAddCustomWord}
            onDeleteWord={onDeleteCustomWord}
            onClearAll={onClearCustomWords}
          />
          {words.length === 0 && (
            <p className="rounded-xl border-2 border-amber-500 bg-amber-50 px-3 py-2 text-xs font-black uppercase text-amber-800">
              {strings.emptySet}
            </p>
          )}
          <button
            type="button"
            onClick={startPlayingAndListening}
            disabled={words.length === 0}
            className="w-full py-3 bg-emerald-400 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-500 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 fill-current stroke-[3]" /> {strings.startLabel}
          </button>
        </GameSetupCard>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <BackToHubButton label={strings.back} onClick={handleBackToHub} />

      <GameHeader
        icon={<Trophy className="h-5 w-5 text-slate-900" />}
        title={strings.title}
        subtitle={strings.subtitle}
        stats={[
          { label: strings.score, value: score, icon: <Star className="h-3.5 w-3.5 text-amber-500" />, tone: 'amber' },
          { label: strings.best, value: Math.max(highScore, score), icon: <Trophy className="h-3.5 w-3.5 text-sky-600" />, tone: 'sky' },
        ]}
      />

      <PauseButton paused={paused} onToggle={togglePause} />

      <div className={`relative flex min-h-[380px] w-full flex-col justify-between overflow-hidden rounded-[2rem] border-8 border-slate-900 p-3 sm:min-h-[440px] sm:p-4 shadow-[10px_10px_0_0_rgba(15,23,42,1)] transition-all duration-700 ${activeScene.bgClass}`}>
        <div className="absolute inset-0 z-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
        <div className="self-center z-10">
          <span className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${activeScene.accentClass}`}>
            {t(`wordSets.${activeCategory.id}`)} · {strings.world}: {t(`themes.sentenceBird.${activeScene.id}`)}
          </span>
        </div>

        <div className="relative z-10 flex-1 w-full min-h-[280px] pb-4 sm:min-h-[340px] sm:pb-6">
            {(() => {
              const gapCenter = 48 + ((targetIndex + words.length) % 3) * 2;
              const gapHalf = 21;
              const bottomPipeHeight = Math.max(10, gapCenter - gapHalf);
              const topPipeHeight = Math.max(10, 100 - (gapCenter + gapHalf));
              return (
                <div
                  className={`absolute bottom-1 top-2 z-10 w-12 -translate-x-1/2 pointer-events-none transition-all duration-700 ease-in-out sm:w-16 ${isFlapping ? 'left-[12%] opacity-20' : pipeEntering ? 'left-[108%] opacity-0' : 'left-[70%] sm:left-[66%] opacity-100'}`}
                >
                  <div className="absolute top-0 w-full border-x-4 border-b-4 border-slate-900 bg-emerald-500" style={{ height: `${topPipeHeight}%` }} />
                  <div className="absolute bottom-0 w-full border-x-4 border-t-4 border-slate-900 bg-emerald-500" style={{ height: `${bottomPipeHeight}%` }} />
                </div>
              );
            })()}

            <div className={`absolute bottom-[42%] z-20 -translate-x-1/2 transition-all duration-700 ease-in-out ${isFlapping ? 'left-[58%] -translate-y-7' : 'left-[30%] sm:left-[34%] translate-y-0'}`}>
              <FlappyBirdIcon size={72} isFlapping={isFlapping} className={`h-14 w-14 transition-all duration-300 sm:h-18 sm:w-18 ${isFlapping ? '-rotate-6 scale-105' : 'rotate-0'}`} />
            </div>
            {paused && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/70">
                <span className="rounded-2xl border-4 border-slate-900 bg-orange-400 px-5 py-3 text-sm font-black uppercase text-slate-900">
                  {t('shared.paused')}
                </span>
              </div>
            )}
          </div>
        <div className={`z-10 h-8 w-full rounded-b-[1.5rem] transition-colors duration-700 ${activeScene.groundClass}`} />
      </div>

      {currentWord && gameState === 'playing' && (
        <div className="text-center space-y-4 py-1">
          <TargetWordCard
            ribbon={strings.targetRibbon}
            word={currentWord.word}
            translation={currentWord.translationRu || currentWord.translation}
            translationRu={currentWord.translationRu}
            heard={spokenText}
            heardLabel={t('shared.youSaidHeard')}
            onListenEn={() => handleListenEn(currentWord.word)}
            onListenRu={currentWord.translationRu ? () => speakWord(currentWord.translationRu || '', 'ru') : undefined}
          />

          <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 bg-slate-100 border-2 border-slate-900 rounded-xl py-1.5 px-3 inline-flex mx-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
              {isListening ? strings.listening : strings.ready}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

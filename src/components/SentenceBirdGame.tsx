import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Star, Trophy } from 'lucide-react';

import { BUILTIN_CATEGORIES } from '../data';
import { loadProgress, pickAdaptiveWordIndex, recordHighScore, recordWordSpoken, recordWordStruggled, saveProgress } from '../progress';
import { sceneDefinitions } from '../sentenceBird/presets';
import { cleanText } from '../sentenceBird/speechHelper';
import { synths } from '../sentenceBird/audioSynth';
import type { SceneType } from '../sentenceBird/types';
import type { WordCategory, WordData } from '../types';
import { useUiLanguage } from '../uiLanguage';
import { matchesWord, speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';
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
    wordsMastered: 'Words mastered:',
    accuracy: 'Accuracy',
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
    wordsMastered: 'Слов освоено:',
    accuracy: 'Точность',
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
  const [phase, setPhase] = useState<'START_SCREEN' | 'PLAYING' | 'GAME_OVER'>('START_SCREEN');
  const [targetIndex, setTargetIndex] = useState(-1);
  const [score, setScore] = useState(0);
  const [spokenText, setSpokenText] = useState('');
  const [isFlapping, setIsFlapping] = useState(false);
  const [pipeEntering, setPipeEntering] = useState(false);
  const [paused, setPaused] = useState(false);
  const [lives, setLives] = useState(5);
  const [totalWordsInSet, setTotalWordsInSet] = useState(0);
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>(() => {
    try {
      return loadProgress()[GAME_ID].words;
    } catch {
      return {};
    }
  });

  const isProcessingSuccessRef = useRef(false);
  const pausedRef = useRef(false);
  const livesRef = useRef(5);
  const targetWordRef = useRef('');
  const targetIndexRef = useRef(-1);
  const wordStatsRef = useRef<Record<string, { spoken: number; struggled: number }>>({});
  const onSuccessHopRef = useRef<() => void>(() => {});
  const onLoseLifeRef = useRef<() => void>(() => {});

  const words = useMemo(() => normalizeWords(activeCategory), [activeCategory]);
  const activeScene = sceneDefinitions.find((scene) => scene.id === activeSceneId) || sceneDefinitions[0];
  const currentWord = targetIndex >= 0 ? words[targetIndex] : undefined;
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

  const handleListenEn = useCallback((word = targetWordRef.current) => {
    if (!word) return;
    setWordStudyStats((prev) => ({
      ...prev,
      [word]: { spoken: prev[word]?.spoken || 0, struggled: (prev[word]?.struggled || 0) + 1 },
    }));
    saveProgress(recordWordStruggled(loadProgress(), GAME_ID, word));
    speakWord(word, 'en');
    onLoseLifeRef.current();
  }, []);

  const handleTranscript = useCallback((text: string) => {
    if (pausedRef.current || isProcessingSuccessRef.current) return;
    setSpokenText(text);
    const target = targetWordRef.current;
    if (target && (matchesWord(text, target) || cleanText(text).includes(cleanText(target)))) {
      onSuccessHopRef.current();
    }
  }, []);

  const { status, isSupported, start, stop } = useSpeechRecognition(handleTranscript);
  const isListening = status.status === 'listening';

  const handleLoseLife = useCallback(() => {
    if (livesRef.current <= 1) {
      livesRef.current = 0;
      setLives(0);
      stop();
      setPhase('GAME_OVER');
      return;
    }
    const next = livesRef.current - 1;
    livesRef.current = next;
    setLives(next);
  }, [stop]);

  onLoseLifeRef.current = handleLoseLife;

  const handleSuccessHop = useCallback(() => {
    if (isProcessingSuccessRef.current) return;
    const spokenWord = targetWordRef.current;
    const currentIdx = targetIndexRef.current;
    if (!spokenWord || currentIdx < 0) return;

    isProcessingSuccessRef.current = true;
    setIsFlapping(true);
    synths.playFlap();
    window.setTimeout(() => { synths.playSuccess(); }, 200);

    saveProgress(recordWordSpoken(loadProgress(), GAME_ID, spokenWord));
    setWordStudyStats((prev) => ({
      ...prev,
      [spokenWord]: { spoken: (prev[spokenWord]?.spoken || 0) + 1, struggled: prev[spokenWord]?.struggled || 0 },
    }));

    window.setTimeout(() => {
      const newScore = score + 1;

      if (newScore >= totalWordsInSet) {
        isProcessingSuccessRef.current = false;
        setScore(newScore);
        stop();
        setPhase('GAME_OVER');
        return;
      }

      setScore(newScore);
      setSpokenText('');
      const nextIndex = chooseNextWordIndex(currentIdx);
      setTargetIndex(nextIndex);
      setIsFlapping(false);
      setPipeEntering(true);
      window.setTimeout(() => setPipeEntering(false), 30);
      isProcessingSuccessRef.current = false;
    }, 700);
  }, [chooseNextWordIndex, score, stop, totalWordsInSet]);

  onSuccessHopRef.current = handleSuccessHop;

  const startPlayingAndListening = () => {
    synths.playFlap();
    const firstIndex = chooseNextWordIndex(-1);
    setTargetIndex(firstIndex);
    setScore(0);
    setSpokenText('');
    setPipeEntering(true);
    setPaused(false);
    pausedRef.current = false;
    setLives(5);
    livesRef.current = 5;
    setTotalWordsInSet(words.length);
    setPhase('PLAYING');
    window.setTimeout(() => setPipeEntering(false), 30);
    window.setTimeout(() => { start(); }, 150);
  };

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (next) stop();
      else start();
      return next;
    });
  }, [start, stop]);

  const handleBackToHub = () => {
    stop();
    if (score > highScore) onUpdateHighScore?.(score);
    onBackToHub();
  };

  if (phase === 'START_SCREEN') {
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

  if (phase === 'PLAYING') {
    return (
    <div className="space-y-6">
      <BackToHubButton label={strings.back} onClick={handleBackToHub} />

      <GameHeader
        icon={<Trophy className="h-5 w-5 text-slate-900" />}
        title={strings.title}
        subtitle={strings.subtitle}
        stats={[
          { label: strings.score, value: score, icon: <Star className="h-3.5 w-3.5 text-amber-500" />, tone: 'amber' },
          { label: t('shared.lives'), value: lives, icon: <span className="text-red-500">❤️</span>, tone: 'violet' },
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

      {currentWord && phase === 'PLAYING' && (
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

  if (phase === 'GAME_OVER') {
    const wordCount = Object.keys(wordStudyStats).length;
    const totalAttempts = (Object.values(wordStudyStats) as { spoken: number; struggled: number }[]).reduce(
      (acc, s) => acc + s.spoken + s.struggled,
      0,
    );
    const accuracy = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0;

    return (
      <section className="max-w-md mx-auto py-4 px-2">
        <BackToHubButton label={strings.back} onClick={handleBackToHub} />
        <div className="space-y-4 p-6 border-8 border-slate-900 rounded-4xl bg-amber-50 bubble-shadow-amber text-center">
          <FlappyBirdIcon size={64} className="mx-auto" />
          <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900">
            {strings.completedTitle}
          </h1>
          <p className="text-sm font-bold text-slate-600">
            {strings.completedText}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-4 border-slate-900 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">{strings.score}</p>
              <p className="text-3xl font-black text-slate-900">{score}</p>
            </div>
            <div className="rounded-2xl border-4 border-slate-900 bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">{strings.best}</p>
              <p className="text-3xl font-black text-slate-900">{Math.max(highScore, score)}</p>
            </div>
          </div>
          <div className="rounded-2xl border-4 border-slate-900 bg-white p-3 text-xs font-bold text-slate-600 space-y-1">
            <p>{strings.wordsMastered} {wordCount}</p>
            <p>{strings.accuracy}: {accuracy}%</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPhase('START_SCREEN');
                setTargetIndex(-1);
                setScore(0);
                setSpokenText('');
                setIsFlapping(false);
                setPipeEntering(false);
              }}
              className="flex-1 py-3 bg-sky-400 hover:bg-sky-500 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[3]" /> {strings.playAgain}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return null;
}

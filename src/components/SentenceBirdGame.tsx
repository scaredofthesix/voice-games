import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Star, Trophy } from 'lucide-react';

import { BUILTIN_CATEGORIES } from '../data';
import { loadProgress, recordHighScore, recordWordSpoken, recordWordStruggled, saveProgress } from '../progress';
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
    failureTitle: 'Oh no, crashed!',
    failureText: 'You ran out of lives. Try again!',
    playAgain: 'Play again',
    back: 'Back to hub',
    world: 'World',
    emptySet: 'Add words to My Words or choose a built-in set.',
    wordsMastered: 'Words mastered:',
    accuracy: 'Accuracy',
    speakLabel: 'Say it!',
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
    failureTitle: 'Ой, разбился!',
    failureText: 'У тебя кончились жизни. Попробуй снова!',
    playAgain: 'Играть снова',
    back: 'Назад в хаб',
    world: 'Мир',
    emptySet: 'Добавь слова в Мои слова или выбери готовый набор.',
    wordsMastered: 'Слов освоено:',
    accuracy: 'Точность',
    speakLabel: 'Скажи!',
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
  const [birdCloudIndex, setBirdCloudIndex] = useState(-1);
  const [scrollOffset, setScrollOffset] = useState(-30);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [isFlapping, setIsFlapping] = useState(false);
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
  const birdCloudIndexRef = useRef(-1);
  const scrollOffsetRef = useRef(-30);
  const wordStatsRef = useRef<Record<string, { spoken: number; struggled: number }>>({});
  const onSuccessHopRef = useRef<() => void>(() => {});
  const onLoseLifeRef = useRef<() => void>(() => {});
  const lastWrongTextRef = useRef('');
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const words = useMemo(() => normalizeWords(activeCategory), [activeCategory]);
  const activeScene = sceneDefinitions.find((scene) => scene.id === activeSceneId) || sceneDefinitions[0];
  const currentWord = targetIndex >= 0 ? words[targetIndex] : undefined;
  useEffect(() => { targetIndexRef.current = targetIndex; }, [targetIndex]);
  useEffect(() => { birdCloudIndexRef.current = birdCloudIndex; }, [birdCloudIndex]);
  useEffect(() => { scrollOffsetRef.current = scrollOffset; }, [scrollOffset]);
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
    const next = previous + 1;
    return next < words.length ? next : -1;
  }, [words]);

  const handleListenEn = useCallback((word = targetWordRef.current) => {
    if (!word) return;
    setWordStudyStats((prev) => ({
      ...prev,
      [word]: { spoken: prev[word]?.spoken || 0, struggled: (prev[word]?.struggled || 0) + 1 },
    }));
    saveProgress(recordWordStruggled(loadProgress(), GAME_ID, word));
    speakWord(word, 'en');
  }, []);

  const handleTranscript = useCallback((text: string) => {
    if (pausedRef.current || isProcessingSuccessRef.current) return;
    setSpokenText(text);
    const target = targetWordRef.current;
    if (target && (matchesWord(text, target) || cleanText(text).includes(cleanText(target)))) {
      lastWrongTextRef.current = '';
      if (failTimerRef.current) {
        clearTimeout(failTimerRef.current);
        failTimerRef.current = null;
      }
      onSuccessHopRef.current();
    } else if (target && text.trim() && text !== lastWrongTextRef.current) {
      lastWrongTextRef.current = text;
      if (!failTimerRef.current) {
        failTimerRef.current = window.setTimeout(() => { failTimerRef.current = null; }, 1500);
        onLoseLifeRef.current();
      }
    }
  }, []);

  const { status, isSupported, start, stop } = useSpeechRecognition(handleTranscript);
  const isListening = status.status === 'listening';

  const handleLoseLife = useCallback(() => {
    if (livesRef.current <= 1) {
      livesRef.current = 0;
      setLives(0);
      setWon(false);
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
        setWon(true);
        stop();
        setPhase('GAME_OVER');
        return;
      }

      setScore(newScore);
      setBirdCloudIndex(newScore - 1);
      setSpokenText('');
      const nextIndex = chooseNextWordIndex(currentIdx);
      setTargetIndex(nextIndex);

      window.setTimeout(() => {
        const spacing = Math.max(12, 100 / (totalWordsInSet + 1));
        const BIRD_SCREEN_PCT = 30;
        const MAX_SCROLL = totalWordsInSet * spacing - BIRD_SCREEN_PCT;
        const newOffset = Math.min(
          Math.max(-BIRD_SCREEN_PCT, newScore * spacing - BIRD_SCREEN_PCT),
          MAX_SCROLL,
        );
        setScrollOffset(newOffset);
        setIsFlapping(false);
        isProcessingSuccessRef.current = false;
      }, 700);
    }, 700);
  }, [chooseNextWordIndex, score, stop, totalWordsInSet]);

  onSuccessHopRef.current = handleSuccessHop;

  const startPlayingAndListening = () => {
    synths.playFlap();
    const firstIndex = chooseNextWordIndex(-1);
    setTargetIndex(firstIndex);
    setBirdCloudIndex(-1);
    setScrollOffset(-30);
    setScore(0);
    setWon(false);
    setSpokenText('');
    setPaused(false);
    pausedRef.current = false;
    setLives(5);
    livesRef.current = 5;
    setTotalWordsInSet(words.length);
    setPhase('PLAYING');
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

      {(() => {
        const totalWords = words.length;
        if (totalWords === 0) return null;
        const spacing = Math.max(12, 100 / (totalWords + 1));
        const BIRD_SCREEN_PCT = 30;
        const cloudHeight = (idx: number) => 32 + Math.sin(idx * 1.8) * 11;

        const MAX_VISIBLE = 7;
        const centerIdx = Math.max(0, Math.min(
          Math.max(0, birdCloudIndex + 2),
          Math.max(0, totalWords - Math.floor(MAX_VISIBLE / 2)),
        ));
        const renderFrom = Math.max(0, centerIdx - Math.floor(MAX_VISIBLE / 2));
        const renderTo = Math.min(totalWords, renderFrom + MAX_VISIBLE);

        const birdScreenBottom = `calc(${cloudHeight(Math.max(0, birdCloudIndex))}% + 25px)`;

        const pipeTheme: Record<string, { body: string; cap: string }> = {
          forest: { body: '#059669', cap: '#34d399' },
          winter: { body: '#0891b2', cap: '#22d3ee' },
          space: { body: '#7c3aed', cap: '#a78bfa' },
          ninja: { body: '#b45309', cap: '#f59e0b' },
        };
        const pc = pipeTheme[activeSceneId] || pipeTheme.forest;

        return (
      <div className={`relative w-full aspect-[16/9] min-h-[300px] rounded-[2rem] border-8 border-slate-900 shadow-[10px_10px_0_0_rgba(15,23,42,1)] overflow-hidden transition-all duration-700 ${activeScene.bgClass}`}>
        <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
        <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
          <div className="absolute top-6 left-[10%] opacity-40 text-xl animate-bounce" style={{ animationDuration: '6s' }}>☁️</div>
          <div className="absolute top-20 right-[15%] opacity-30 text-2xl animate-pulse" style={{ animationDuration: '8s' }}>☁️</div>
          <div className="absolute top-8 left-[60%] opacity-40 text-lg animate-bounce" style={{ animationDuration: '4s' }}>🎈</div>
          <div className="absolute top-12 left-[35%] opacity-25 text-sm">{activeScene.ambientSoundEmoji}</div>
          <span className="absolute top-1/4 left-[5%] text-lg animate-pulse" style={{ animationDuration: '12s' }}>{activeScene.particleEmoji}</span>
          <span className="absolute top-1/3 right-[10%] text-sm opacity-50">{activeScene.particleEmoji}</span>
          <span className="absolute bottom-1/4 left-[40%] text-xs opacity-70 animate-bounce">{activeScene.particleEmoji}</span>
        </div>
        <div className="self-center z-40 absolute top-3 left-1/2 -translate-x-1/2">
          <span className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${activeScene.accentClass}`}>
            {t(`wordSets.${activeCategory.id}`)} · {strings.world}: {t(`themes.sentenceBird.${activeScene.id}`)}
          </span>
        </div>

        <div className="relative w-full h-full z-10">
          <div
            className="absolute inset-0 transition-all duration-700 ease-out will-change-transform"
            style={{ transform: `translateX(-${scrollOffset}%)` }}
          >
            {words.slice(renderFrom, renderTo).map((word, idx) => {
              const globalIdx = renderFrom + idx;
              const left = `${(globalIdx + 1) * spacing}%`;
              const bottom = `${cloudHeight(globalIdx)}%`;
              const isPassed = globalIdx < birdCloudIndex;
              const isActive = globalIdx === targetIndex;
              return (
                <div
                  key={globalIdx}
                  style={{ left, bottom }}
                  className={`absolute -translate-x-1/2 translate-y-1/2 p-2 rounded-lg border-2 border-slate-900 transition-all duration-500 font-bold cursor-pointer z-10 flex flex-col items-center ${
                    isActive
                      ? `scale-110 ring-4 ring-yellow-400 ${activeScene.cloudClass} py-3 shadow-[4px_4px_0_0_rgba(15,23,42,1)] z-20`
                      : isPassed
                      ? 'opacity-65 scale-95 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]'
                      : 'opacity-50 scale-90 border-dashed bg-slate-100 text-slate-600'
                  }`}
                >
                  <div className="text-center space-y-0.5">
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-[8px] uppercase tracking-wider font-black text-slate-500">#{globalIdx + 1}</span>
                    </div>
                    <p className={`text-[10px] font-black leading-tight ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                      {word.word}
                    </p>
                    <p className="text-[7px] font-bold italic text-slate-500 truncate max-w-[80px]">
                      {word.translationRu || word.translation}
                    </p>
                  </div>
                  {isActive && (
                    <div className="absolute -top-3.5 px-2 py-0.5 bg-yellow-400 text-slate-900 border border-slate-900 rounded text-[8px] font-black uppercase tracking-wider animate-bounce shadow">
                      {strings.speakLabel}
                    </div>
                  )}
                  {isPassed && (
                    <div className="absolute -top-2 text-emerald-600 text-xs font-black">✨</div>
                  )}
                </div>
              );
            })}

            {Array.from({ length: totalWords - 1 }).map((_, pIdx) => {
              if (pIdx < renderFrom - 1 || pIdx >= renderTo - 1) return null;
              const pos1Left = (pIdx + 1) * spacing;
              const pos2Left = (pIdx + 2) * spacing;
              const leftPos = (pos1Left + pos2Left) / 2;
              const avgBottom = (cloudHeight(pIdx) + cloudHeight(pIdx + 1)) / 2;
              const gapCenter = avgBottom + 10;
              const gapHalf = 15;
              const bottomPipeHeight = Math.max(10, gapCenter - gapHalf);
              const topPipeHeight = Math.max(10, 100 - (gapCenter + gapHalf));
              const isPassed = (pIdx + 1) <= birdCloudIndex;
              return (
                <div key={pIdx} className="absolute inset-y-0 z-0 pointer-events-none" style={{ left: `${leftPos}%`, width: '38px', transform: 'translateX(-50%)' }}>
                  <div className="absolute top-0 w-full border-x-4 border-b-4 border-slate-900 flex flex-col justify-end" style={{ height: `${topPipeHeight}%`, backgroundColor: pc.body }}>
                    <div className="h-5 w-[46px] -ml-[4px] border-4 border-slate-900 rounded-sm self-center" style={{ backgroundColor: pc.cap }} />
                    <div className="absolute inset-y-0 left-1.5 w-2 opacity-50" style={{ backgroundColor: pc.cap }} />
                  </div>
                  <div className="absolute bottom-0 w-full border-x-4 border-t-4 border-slate-900 flex flex-col justify-start" style={{ height: `${bottomPipeHeight}%`, backgroundColor: pc.body }}>
                    <div className="h-5 w-[46px] -ml-[4px] border-4 border-slate-900 rounded-sm self-center" style={{ backgroundColor: pc.cap }} />
                    <div className="absolute inset-y-0 left-1.5 w-2 opacity-50" style={{ backgroundColor: pc.cap }} />
                  </div>
                  {isPassed && (
                    <div className="absolute left-1/2 -translate-x-1/2 text-lg animate-ping" style={{ bottom: `${gapCenter}%`, animationDuration: '2s' }}>✨</div>
                  )}
                </div>
              );
            })}

            <div
              style={{ left: `${(birdCloudIndex + 1) * spacing}%`, bottom: birdScreenBottom }}
              className="absolute z-20 flex flex-col items-center transition-all duration-700 ease-out"
            >
              <FlappyBirdIcon
                size={64}
                isFlapping={isFlapping}
                className={`transform transition-all duration-300 ${isFlapping ? '-rotate-6 scale-105' : 'rotate-0'}`}
              />
              {spokenText && (
                <div className="absolute bottom-16 bg-[#fef08a] text-slate-900 text-[10px] font-black px-2.5 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] max-w-[120px] text-center truncate">
                  "{spokenText}"
                </div>
              )}
            </div>
          </div>

          {paused && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/70">
              <span className="rounded-2xl border-4 border-slate-900 bg-orange-400 px-5 py-3 text-sm font-black uppercase text-slate-900">
                {t('shared.paused')}
              </span>
            </div>
          )}
        </div>
        <div className={`z-10 h-8 w-full absolute bottom-0 pointer-events-none ${activeScene.groundClass} rounded-b-[1.5rem]`} />
      </div>
        );
      })()}

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
        <div className={`space-y-4 p-6 border-8 border-slate-900 rounded-4xl text-center ${won ? 'bg-amber-50 bubble-shadow-amber' : 'bg-red-50 bubble-shadow-red'}`}>
          <FlappyBirdIcon size={64} className="mx-auto" />
          <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900">
            {won ? strings.completedTitle : strings.failureTitle}
          </h1>
          <p className="text-sm font-bold text-slate-600">
            {won ? strings.completedText : strings.failureText}
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
                setBirdCloudIndex(-1);
                setScrollOffset(-30);
                setScore(0);
                setWon(false);
                setSpokenText('');
                setIsFlapping(false);
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

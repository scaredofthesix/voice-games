import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Star, Trophy } from 'lucide-react';

import { BUILTIN_CATEGORIES } from '../data';
import { loadProgress, pickAdaptiveWordIndex, recordHighScore, recordSessionPlayed, recordWordSpoken, recordWordStruggled, saveProgress } from '../progress';
import { sceneDefinitions } from '../sentenceBird/presets';
import { cleanText } from '../sentenceBird/speechHelper';
import { synths } from '../sentenceBird/audioSynth';
import type { SceneType } from '../sentenceBird/types';
import type { WordCategory, WordData } from '../types';
import { useUiLanguage } from '../uiLanguage';
import { matchesWord, speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { BackToHubButton, CustomWordsSection, GameHeader, GameResultCard, GameSetupCard, ListenAndLearnSection, OptionPicker, PauseButton, TargetWordCard, WordSetPicker } from './GameUi';
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

// Per-word countdown (seconds). Running out costs a life with a fall animation,
// instead of penalizing every unrelated bit of speech.
const WORD_TIME_LIMIT = 8;
// How long the microphone stays on after the child activates it (push-to-talk).
const MIC_WINDOW_MS = 4000;
const START_LIVES = 3;

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
    tapToSpeak: 'Tap the word or press Space, then say it',
    timeLabel: 'Time',
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
    tapToSpeak: 'Нажми на слово или пробел, потом скажи его',
    timeLabel: 'Время',
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
  const [lives, setLives] = useState(START_LIVES);
  const [totalWordsInSet, setTotalWordsInSet] = useState(0);
  const [timeLeft, setTimeLeft] = useState(WORD_TIME_LIMIT);
  const [isFalling, setIsFalling] = useState(false);
  const [micActive, setMicActive] = useState(false);
  // Bumped on every timeout so the countdown effect restarts for a retry of the
  // same word (targetIndex does not change on a miss).
  const [attemptNonce, setAttemptNonce] = useState(0);
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [sessionWords, setSessionWords] = useState<WordOption[]>([]);

  const isProcessingSuccessRef = useRef(false);
  const pausedRef = useRef(false);
  const livesRef = useRef(START_LIVES);
  const targetWordRef = useRef('');
  const targetIndexRef = useRef(-1);
  const birdCloudIndexRef = useRef(-1);
  const scrollOffsetRef = useRef(-30);
  const wordStatsRef = useRef<Record<string, { spoken: number; struggled: number }>>({});
  const onSuccessHopRef = useRef<() => void>(() => {});
  const lastWrongTextRef = useRef('');
  const phaseRef = useRef<'START_SCREEN' | 'PLAYING' | 'GAME_OVER'>('START_SCREEN');
  const micActiveRef = useRef(false);
  const micWindowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTimeoutRef = useRef<() => void>(() => {});
  const activateMicRef = useRef<() => void>(() => {});
  const correctSoundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const categoryWords = useMemo(() => normalizeWords(activeCategory), [activeCategory]);
  const words = phase === 'START_SCREEN' || sessionWords.length === 0 ? categoryWords : sessionWords;
  const activeScene = sceneDefinitions.find((scene) => scene.id === activeSceneId) || sceneDefinitions[0];
  const currentWord = targetIndex >= 0 ? words[targetIndex] : undefined;
  useEffect(() => { targetIndexRef.current = targetIndex; }, [targetIndex]);
  useEffect(() => { birdCloudIndexRef.current = birdCloudIndex; }, [birdCloudIndex]);
  useEffect(() => { scrollOffsetRef.current = scrollOffset; }, [scrollOffset]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
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
    // Push-to-talk: only react to speech while the mic was explicitly activated
    // (tap the word / on-screen button / Space). This stops unrelated chatter
    // from being treated as an attempt at the current word.
    if (!micActiveRef.current || pausedRef.current || isProcessingSuccessRef.current) return;
    setSpokenText(text);
    const target = targetWordRef.current;
    if (target && (matchesWord(text, target) || cleanText(text).includes(cleanText(target)))) {
      lastWrongTextRef.current = '';
      onSuccessHopRef.current();
    } else if (target && text.trim()) {
      // Wrong or unrelated speech is echoed back as feedback but never costs a
      // life - only the per-word countdown running out does.
      lastWrongTextRef.current = text;
    }
  }, []);

  const { start, stop } = useSpeechRecognition(handleTranscript);

  const stopMic = useCallback(() => {
    micActiveRef.current = false;
    setMicActive(false);
    if (micWindowRef.current) {
      clearTimeout(micWindowRef.current);
      micWindowRef.current = null;
    }
    stop();
  }, [stop]);

  // Push-to-talk: start listening only when the child asks for it, and auto-stop
  // after a short window so the mic is not always live.
  const activateMic = useCallback(() => {
    if (phaseRef.current !== 'PLAYING' || pausedRef.current || isProcessingSuccessRef.current) return;
    if (micActiveRef.current) return;
    micActiveRef.current = true;
    setMicActive(true);
    setSpokenText('');
    start();
    if (micWindowRef.current) clearTimeout(micWindowRef.current);
    micWindowRef.current = window.setTimeout(() => {
      micActiveRef.current = false;
      setMicActive(false);
      stop();
      micWindowRef.current = null;
    }, MIC_WINDOW_MS);
  }, [start, stop]);

  activateMicRef.current = activateMic;

  // The per-word countdown ran out: show a fall, cost one life, and either end
  // the game or retry the same word with a fresh timer.
  const handleTimeout = useCallback(() => {
    if (isProcessingSuccessRef.current || pausedRef.current) return;
    const word = targetWordRef.current;
    if (word) {
      saveProgress(recordWordStruggled(loadProgress(), GAME_ID, word));
      setWordStudyStats((prev) => ({
        ...prev,
        [word]: { spoken: prev[word]?.spoken || 0, struggled: (prev[word]?.struggled || 0) + 1 },
      }));
    }
    stopMic();
    synths.playFlap();
    setIsFalling(true);

    if (livesRef.current <= 1) {
      isProcessingSuccessRef.current = true;
      livesRef.current = 0;
      setLives(0);
      setWon(false);
      stop();
      if (defeatTimerRef.current) clearTimeout(defeatTimerRef.current);
      defeatTimerRef.current = window.setTimeout(() => {
        defeatTimerRef.current = null;
        setPhase('GAME_OVER');
        setIsFalling(false);
        isProcessingSuccessRef.current = false;
      }, 1000);
      return;
    }
    window.setTimeout(() => setIsFalling(false), 700);
    const next = livesRef.current - 1;
    livesRef.current = next;
    setLives(next);
    // Retry the same word: bump the nonce so the countdown effect restarts.
    setAttemptNonce((n) => n + 1);
  }, [stop, stopMic]);

  handleTimeoutRef.current = handleTimeout;

  const handleSuccessHop = useCallback(() => {
    if (isProcessingSuccessRef.current) return;
    const spokenWord = targetWordRef.current;
    const currentIdx = targetIndexRef.current;
    if (!spokenWord || currentIdx < 0) return;

    isProcessingSuccessRef.current = true;
    stopMic();
    setIsFlapping(true);
    synths.playFlap();
    if (correctSoundTimerRef.current) clearTimeout(correctSoundTimerRef.current);
    correctSoundTimerRef.current = window.setTimeout(() => {
      correctSoundTimerRef.current = null;
      speakSound.playCorrect();
    }, 200);

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
  }, [chooseNextWordIndex, score, stopMic, totalWordsInSet]);

  onSuccessHopRef.current = handleSuccessHop;

  const startPlayingAndListening = () => {
    synths.playFlap();
    const progress = loadProgress()[GAME_ID].words;
    let previous = -1;
    const adaptiveSequence = categoryWords.map(() => {
      const index = pickAdaptiveWordIndex(
        categoryWords.map((item) => item.word),
        progress,
        previous,
      );
      previous = index;
      return categoryWords[index];
    });
    setSessionWords(adaptiveSequence);
    setTargetIndex(adaptiveSequence.length > 0 ? 0 : -1);
    setBirdCloudIndex(-1);
    setScrollOffset(-30);
    setScore(0);
    setWon(false);
    setSpokenText('');
    setPaused(false);
    pausedRef.current = false;
    setLives(START_LIVES);
    livesRef.current = START_LIVES;
    setTotalWordsInSet(adaptiveSequence.length);
    setWordStudyStats({});
    saveProgress(recordSessionPlayed(loadProgress(), GAME_ID));
    // Full reset so a replay never inherits stale timers or flags.
    setIsFalling(false);
    setTimeLeft(WORD_TIME_LIMIT);
    setAttemptNonce(0);
    isProcessingSuccessRef.current = false;
    lastWrongTextRef.current = '';
    micActiveRef.current = false;
    setMicActive(false);
    if (micWindowRef.current) {
      clearTimeout(micWindowRef.current);
      micWindowRef.current = null;
    }
    if (correctSoundTimerRef.current) {
      clearTimeout(correctSoundTimerRef.current);
      correctSoundTimerRef.current = null;
    }
    if (defeatTimerRef.current) {
      clearTimeout(defeatTimerRef.current);
      defeatTimerRef.current = null;
    }
    setPhase('PLAYING');
    // Push-to-talk: do NOT auto-start the mic; the child activates it per word.
  };

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (next) stopMic();
      return next;
    });
  }, [stopMic]);

  const handleBackToHub = () => {
    stopMic();
    if (correctSoundTimerRef.current) {
      clearTimeout(correctSoundTimerRef.current);
      correctSoundTimerRef.current = null;
    }
    if (defeatTimerRef.current) {
      clearTimeout(defeatTimerRef.current);
      defeatTimerRef.current = null;
    }
    if (score > highScore) onUpdateHighScore?.(score);
    onBackToHub();
  };

  // Per-word countdown: while a word is active and the game is not paused, tick
  // down once a second. Reaching zero costs a life (see handleTimeout). The
  // attemptNonce dependency restarts a fresh timer when retrying the same word.
  useEffect(() => {
    if (phase !== 'PLAYING' || paused || targetIndex < 0) return;
    let remaining = WORD_TIME_LIMIT;
    setTimeLeft(remaining);
    const id = window.setInterval(() => {
      if (pausedRef.current || isProcessingSuccessRef.current) return;
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
        handleTimeoutRef.current();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, paused, targetIndex, attemptNonce]);

  // Space bar activates the mic (push-to-talk), except while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;
      if (phaseRef.current !== 'PLAYING' || pausedRef.current) return;
      e.preventDefault();
      activateMicRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Clear a pending mic auto-stop timer if the game unmounts mid-listen.
  useEffect(() => () => {
    if (micWindowRef.current) clearTimeout(micWindowRef.current);
    if (correctSoundTimerRef.current) clearTimeout(correctSoundTimerRef.current);
    if (defeatTimerRef.current) clearTimeout(defeatTimerRef.current);
  }, []);

  if (phase === 'START_SCREEN') {
    return (
      <section className="max-w-md mx-auto py-4 px-2">
        <BackToHubButton label={t('shared.backToHub')} onClick={onBackToHub} />
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
      <BackToHubButton label={t('shared.backToHub')} onClick={handleBackToHub} />

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
                  onClick={isActive ? () => activateMicRef.current() : undefined}
                  role={isActive ? 'button' : undefined}
                  aria-label={isActive ? `${strings.tapToSpeak}: ${word.word}` : undefined}
                  className={`absolute -translate-x-1/2 translate-y-1/2 p-2 rounded-lg border-2 border-slate-900 transition-all duration-500 font-bold cursor-pointer z-10 flex flex-col items-center ${
                    isActive
                      ? `scale-110 ring-4 ${micActive ? 'ring-emerald-500 animate-pulse' : 'ring-yellow-400'} bg-white text-slate-900 py-3 shadow-[4px_4px_0_0_rgba(15,23,42,1)] z-20`
                      : isPassed
                      ? 'opacity-65 scale-95 border-slate-900 bg-white text-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]'
                      : 'opacity-50 scale-90 border-dashed bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="text-center space-y-0.5">
                    <div className="flex items-center gap-1 justify-center">
                      <span className="text-[8px] uppercase tracking-wider font-black text-slate-500">#{globalIdx + 1}</span>
                    </div>
                    <p className={`text-[13px] font-black leading-tight ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>
                      {word.word}
                    </p>
                    <p className="text-[9px] font-bold italic text-slate-700 truncate max-w-[90px]">
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
              className={`absolute z-20 flex flex-col items-center transition-all duration-700 ease-out ${isFalling ? 'translate-y-24 opacity-70' : ''}`}
            >
              <FlappyBirdIcon
                size={64}
                isFlapping={isFlapping}
                className={`transform transition-all duration-300 ${isFalling ? 'rotate-[70deg]' : isFlapping ? '-rotate-6 scale-105' : 'rotate-0'}`}
              />
              {spokenText && (
                <div className="absolute bottom-16 bg-[#fef08a] text-slate-900 text-[12px] font-black px-2.5 py-1 rounded border-2 border-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] max-w-[120px] text-center truncate">
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

          {/* Per-word countdown bar */}
          <div className="mx-auto max-w-xs">
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">{strings.timeLabel}</span>
              <span className={`text-[10px] font-black ${timeLeft <= 3 ? 'text-rose-600' : 'text-slate-700'}`}>{Math.max(0, timeLeft)}s</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full border-2 border-slate-900 bg-white">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, (timeLeft / WORD_TIME_LIMIT) * 100))}%` }}
              />
            </div>
          </div>

          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{strings.tapToSpeak}</p>
        </div>
      )}
    </div>
  );
  }

  if (phase === 'GAME_OVER') {
    return (
      <section className="max-w-md mx-auto py-4 px-2">
        <BackToHubButton label={t('shared.backToHub')} onClick={handleBackToHub} />
        <GameResultCard
          title={won ? strings.completedTitle : strings.failureTitle}
          description={won ? strings.completedText : strings.failureText}
          scoreLabel={strings.score}
          score={score}
          bestLabel={strings.best}
          best={Math.max(highScore, score)}
          wordStats={wordStudyStats}
          words={words}
          replayLabel={strings.playAgain}
          onReplay={() => {
            setPhase('START_SCREEN');
            setTargetIndex(-1);
            setBirdCloudIndex(-1);
            setScrollOffset(-30);
            setScore(0);
            setWon(false);
            setSpokenText('');
            setIsFlapping(false);
          }}
          icon={<FlappyBirdIcon size={64} className="mx-auto" />}
          toneClass={won ? 'bg-amber-50' : 'bg-red-50'}
          shadowClass={won ? 'bubble-shadow-amber' : 'bubble-shadow-red'}
        />
      </section>
    );
  }

  return null;
}

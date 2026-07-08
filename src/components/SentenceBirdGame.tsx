import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Mic, MicOff, Volume2, HelpCircle, Trophy, Star, Award, RefreshCw, AlertCircle, Languages, BarChart3, ArrowLeft } from 'lucide-react';
import FlappyBirdIcon from './FlappyBirdIcon';
import TutorialModal from './TutorialModal';
import { useUiLanguage } from '../uiLanguage';
import { defaultSentenceItems, sceneDefinitions } from '../sentenceBird/presets';
import type { GameStats, SceneType, SentenceItem } from '../sentenceBird/types';
import { checkPhraseMatch, cleanText, type MatchDetails } from '../sentenceBird/speechHelper';
import { synths } from '../sentenceBird/audioSynth';

interface SentenceBirdGameProps {
  onBackToHub: () => void;
  customSentences: SentenceItem[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
}

function shuffleSentences(items: SentenceItem[]): SentenceItem[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const LOCAL_LANG = {
  en: {
    title: 'Sentence Bird',
    subtitle: 'Speak each step to guide the bird across the sky.',
    start: 'Start Flying',
    score: 'STEP SCORE',
    best: 'BEST',
    completed: 'DONE',
    world: 'World',
    howToPlay: 'How to play',
    help: 'Help',
    listenGuide: 'Listen guide',
    skipWord: 'Skip word',
    detected: 'Detected',
    matchConfidence: 'Match confidence',
    pronunciationTip: 'Pronunciation tip',
    metricsTitle: 'Lesson metrics',
    pronouncedSteps: 'Pronounced steps',
    sentencesMastered: 'Sentences mastered',
    successRating: 'Success rating',
    trickyWords: 'Tricky words to practice again',
    noTrickyWords: 'No tricky words yet!',
    playAgain: 'Play again',
    tutorialTitle: 'Sentence Bird Academy',
    tutorialCta: 'Let\'s play!',
    lobbyTitle: 'Sentence Bird',
    lobbyIntro: 'Speak the sentence steps out loud and guide the bird through the clouds.',
    lobbyStepOne: 'Listen and learn each step by tapping the clouds.',
    lobbyStepTwo: 'Speak clearly into the mic and the bird will hop forward.',
    lobbyStepThree: 'Complete the full sentence and unlock a new scene.',
    choiceTitle: 'Choose game length',
    short: 'Short',
    medium: 'Medium',
    full: 'Full',
    activeTarget: 'Active target step',
    translation: 'Translation',
    listening: 'Speak now into your microphone!',
    ready: 'Click the big blue mic to record.',
    micUnsupported: 'Speech recognition is not supported in this browser. Please open in Google Chrome.',
    micBlocked: 'Microphone access blocked. Please allow mic permissions in your address bar.',
    noSpeech: 'No speech detected. Try speaking again!',
    stopped: 'Stopped listening.',
    connecting: 'Connecting microphone...',
    paused: 'Microphone connection paused due to environment constraints.',
    skipHelp: 'Skip word (simulate voice)',
    completedTitle: 'You did it, champion!',
    completedText: 'You played and pronounced every sentence scaffold beautifully.',
    completedSentences: 'Completed sentences',
    accuracyRating: 'Accuracy rating',
    victoryText: 'Your spoken English wings are flying high!',
    startLabel: 'Start flying',
    back: 'Back to hub',
  },
  ru: {
    title: 'Фразоптичка',
    subtitle: 'Произноси каждую часть фразы, чтобы вести птичку по небу.',
    start: 'Начать полёт',
    score: 'ОЧКИ',
    best: 'РЕКОРД',
    completed: 'ГОТОВО',
    world: 'Мир',
    howToPlay: 'Как играть',
    help: 'Помощь',
    listenGuide: 'Слушать подсказку',
    skipWord: 'Пропустить слово',
    detected: 'Распознано',
    matchConfidence: 'Уверенность совпадения',
    pronunciationTip: 'Подсказка по произношению',
    metricsTitle: 'Метрики урока',
    pronouncedSteps: 'Произнесено шагов',
    sentencesMastered: 'Предложений пройдено',
    successRating: 'Процент успеха',
    trickyWords: 'Сложные слова для повтора',
    noTrickyWords: 'Пока нет сложных слов!',
    playAgain: 'Играть снова',
    tutorialTitle: 'Sentence Bird Academy',
    tutorialCta: 'Поехали!',
    lobbyTitle: 'Sentence Bird',
    lobbyIntro: 'Произноси части предложений вслух и веди птичку через облака.',
    lobbyStepOne: 'Слушай и учись, нажимая на облака.',
    lobbyStepTwo: 'Говори ясно в микрофон, и птичка будет прыгать вперёд.',
    lobbyStepThree: 'Пройди всё предложение и открой новую сцену.',
    choiceTitle: 'Выбери длину игры',
    short: 'Коротко',
    medium: 'Средне',
    full: 'Полный',
    activeTarget: 'Текущий шаг',
    translation: 'Перевод',
    listening: 'Говори в микрофон прямо сейчас!',
    ready: 'Нажми на синий микрофон, чтобы начать.',
    micUnsupported: 'Распознавание речи не поддерживается в этом браузере. Открой Google Chrome.',
    micBlocked: 'Доступ к микрофону заблокирован. Разреши доступ в адресной строке.',
    noSpeech: 'Речь не распознана. Попробуй ещё раз!',
    stopped: 'Слушание остановлено.',
    connecting: 'Подключаю микрофон...',
    paused: 'Соединение с микрофоном приостановлено.',
    skipHelp: 'Пропустить слово (имитация голоса)',
    completedTitle: 'Ты справился, чемпион!',
    completedText: 'Ты красиво произнёс все шаги предложений.',
    completedSentences: 'Пройдено предложений',
    accuracyRating: 'Точность',
    victoryText: 'Твои английские крылья летят высоко!',
    startLabel: 'Начать полёт',
    back: 'Назад в хаб',
  },
};

export default function SentenceBirdGame({ onBackToHub, customSentences, highScore = 0, onUpdateHighScore, onScoreChange }: SentenceBirdGameProps) {
  const { language } = useUiLanguage();
  const strings = LOCAL_LANG[language as 'en' | 'ru'] || LOCAL_LANG.en;

  const activeSentencesSrc = customSentences.length > 0 ? customSentences : defaultSentenceItems;
  const [gameSentences, setGameSentences] = useState<SentenceItem[]>([]);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [listeningStatus, setListeningStatus] = useState(strings.ready);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [sessionLength, setSessionLength] = useState<number | 'all'>(4);
  const [stats, setStats] = useState<GameStats>({ score: 0, completedSentencesCount: 0, totalAttempts: 0, wrongWords: {} });
  const [activeSceneId, setActiveSceneId] = useState<SceneType>('forest');
  const [isFlapping, setIsFlapping] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'completed'>('lobby');
  const [matchResult, setMatchResult] = useState<MatchDetails | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<number | null>(null);
  const isProcessingSuccessRef = useRef(false);
  const keepListeningRef = useRef(false);
  const gameStateRef = useRef(gameState);
  const consecutiveErrorCountRef = useRef(0);
  const isSpeechActiveRef = useRef(false);
  const currentTargetStepTextRef = useRef('');
  const handleSuccessHopRef = useRef<(() => void) | null>(null);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { setListeningStatus(strings.ready); }, [strings.ready]);

  useEffect(() => {
    const shuffled = shuffleSentences(activeSentencesSrc);
    const sliced = sessionLength === 'all' ? shuffled : shuffled.slice(0, sessionLength);
    setGameSentences(sliced);
  }, [activeSentencesSrc, sessionLength]);

  useEffect(() => {
    onScoreChange?.(stats.score);
    if (stats.score > highScore) {
      onUpdateHighScore?.(stats.score);
    }
  }, [stats.score, highScore, onScoreChange, onUpdateHighScore]);

  const activeScene = sceneDefinitions.find((s) => s.id === activeSceneId) || sceneDefinitions[0];
  const currentSentence = gameSentences[currentSentenceIdx] || gameSentences[0] || activeSentencesSrc[0];
  const totalSteps = currentSentence?.steps.length || 0;
  const currentTargetStepText = currentSentence?.steps[currentStepIdx] || '';
  currentTargetStepTextRef.current = currentTargetStepText;
  const finalFullSentence = currentSentence?.steps[totalSteps - 1] || '';

  const activateAudioContext = () => {
    synths.playFlap();
  };

  const handleTTS = (text: string) => {
    if (!text) return;
    try {
      activateAudioContext();
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1.15;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech Synthesis error', err);
    }
  };

  const safeStartSpeech = () => {
    if (!recognitionRef.current || isSpeechActiveRef.current) return;
    isSpeechActiveRef.current = true;
    try {
      recognitionRef.current.start();
    } catch (e) {
      isSpeechActiveRef.current = false;
      console.warn('Speech start failed:', e);
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionError(strings.micUnsupported);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      isSpeechActiveRef.current = true;
      setIsListening(true);
      setListeningStatus(strings.listening);
      setRecognitionError(null);
      consecutiveErrorCountRef.current = 0;
    };

    rec.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeResultText = finalTranscript || interimTranscript;
      if (!activeResultText.trim()) return;

      setSpokenText(activeResultText);
      const match = checkPhraseMatch(activeResultText, currentTargetStepTextRef.current);
      setMatchResult(match);
      if (match.isMatch) {
        handleSuccessHopRef.current?.();
      }
    };

    rec.onerror = (err: any) => {
      console.warn('SPEECH ERROR', err.error);
      if (err.error !== 'no-speech') {
        consecutiveErrorCountRef.current += 1;
      }
      if (err.error === 'no-speech') {
        setListeningStatus(strings.noSpeech);
      } else if (err.error === 'not-allowed') {
        setRecognitionError(strings.micBlocked);
        setIsListening(false);
        keepListeningRef.current = false;
      } else if (err.error === 'aborted') {
        setListeningStatus(strings.connecting);
      } else {
        setListeningStatus(strings.connecting);
      }
      if (consecutiveErrorCountRef.current > 5) {
        setRecognitionError(strings.paused);
        setIsListening(false);
        keepListeningRef.current = false;
      }
    };

    rec.onend = () => {
      isSpeechActiveRef.current = false;
      setIsListening(false);
      if (keepListeningRef.current && !isProcessingSuccessRef.current && gameStateRef.current === 'playing' && consecutiveErrorCountRef.current <= 5) {
        setTimeout(() => {
          if (keepListeningRef.current && !isProcessingSuccessRef.current && gameStateRef.current === 'playing' && consecutiveErrorCountRef.current <= 5) {
            safeStartSpeech();
          }
        }, 300);
      }
    };

    recognitionRef.current = rec;
    return () => {
      keepListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, [strings.connecting, strings.listening, strings.micBlocked, strings.noSpeech, strings.paused, strings.ready]);

  const toggleListening = () => {
    activateAudioContext();
    if (!recognitionRef.current) {
      setRecognitionError(strings.micUnsupported);
      return;
    }
    if (isListening || isSpeechActiveRef.current) {
      keepListeningRef.current = false;
      try { recognitionRef.current.stop(); } catch {}
      isSpeechActiveRef.current = false;
      setIsListening(false);
      setListeningStatus(strings.stopped);
    } else {
      keepListeningRef.current = true;
      consecutiveErrorCountRef.current = 0;
      setSpokenText('');
      setMatchResult(null);
      safeStartSpeech();
    }
  };

  const handleSuccessHop = () => {
    if (isProcessingSuccessRef.current) return;
    isProcessingSuccessRef.current = true;
    setIsFlapping(true);
    synths.playFlap();
    setTimeout(() => { synths.playSuccess(); }, 200);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsListening(false);

    setTimeout(() => {
      setIsFlapping(false);
      setStats((prev) => ({ ...prev, score: prev.score + 1, totalAttempts: prev.totalAttempts + 1 }));
      if (currentStepIdx < totalSteps - 1) {
        setCurrentStepIdx((prev) => prev + 1);
        setSpokenText('');
        setMatchResult(null);
        isProcessingSuccessRef.current = false;
        if (keepListeningRef.current) {
          setTimeout(() => {
            if (keepListeningRef.current && !isProcessingSuccessRef.current && gameStateRef.current === 'playing') {
              safeStartSpeech();
            }
          }, 150);
        }
      } else {
        handleSentenceCompleted();
      }
    }, 800);
  };
  handleSuccessHopRef.current = handleSuccessHop;

  const handleSentenceCompleted = () => {
    synths.playSentenceComplete();
    setStats((prev) => ({ ...prev, completedSentencesCount: prev.completedSentencesCount + 1 }));
    setTimeout(() => {
      if (currentSentenceIdx < gameSentences.length - 1) {
        setCurrentSentenceIdx((prev) => prev + 1);
        setCurrentStepIdx(0);
        setSpokenText('');
        setMatchResult(null);
        const nextIdx = (currentSentenceIdx + 1) % 4;
        const scenes: SceneType[] = ['forest', 'winter', 'space', 'ninja'];
        setActiveSceneId(scenes[nextIdx]);
        isProcessingSuccessRef.current = false;
        if (keepListeningRef.current) {
          setTimeout(() => {
            if (keepListeningRef.current && !isProcessingSuccessRef.current && gameStateRef.current === 'playing') {
              safeStartSpeech();
            }
          }, 150);
        }
      } else {
        setGameState('completed');
        keepListeningRef.current = false;
        isProcessingSuccessRef.current = false;
      }
    }, 1200);
  };

  const handleSkipOrCheat = () => {
    activateAudioContext();
    if (isProcessingSuccessRef.current) return;
    const targetWord = currentTargetStepText.split(' ').slice(-1)[0] || 'unknown';
    setStats((prev) => ({ ...prev, totalAttempts: prev.totalAttempts + 1, wrongWords: { ...prev.wrongWords, [targetWord]: (prev.wrongWords[targetWord] || 0) + 1 } }));
    handleSuccessHop();
  };

  const handleResetGameSession = () => {
    activateAudioContext();
    isProcessingSuccessRef.current = false;
    const shuffled = shuffleSentences(activeSentencesSrc);
    const sliced = sessionLength === 'all' ? shuffled : shuffled.slice(0, sessionLength);
    setGameSentences(sliced);
    setCurrentSentenceIdx(0);
    setCurrentStepIdx(0);
    setSpokenText('');
    setMatchResult(null);
    setGameState('playing');
    setStats({ score: 0, completedSentencesCount: 0, totalAttempts: 0, wrongWords: {} });
    setTimeout(() => {
      if (recognitionRef.current) {
        keepListeningRef.current = true;
        consecutiveErrorCountRef.current = 0;
        safeStartSpeech();
      }
    }, 150);
  };

  const startPlayingAndListening = () => {
    activateAudioContext();
    const shuffled = shuffleSentences(activeSentencesSrc);
    const sliced = sessionLength === 'all' ? shuffled : shuffled.slice(0, sessionLength);
    setGameSentences(sliced);
    setGameState('playing');
    setTimeout(() => {
      if (recognitionRef.current) {
        keepListeningRef.current = true;
        consecutiveErrorCountRef.current = 0;
        setSpokenText('');
        setMatchResult(null);
        safeStartSpeech();
      }
    }, 150);
  };

  const getCloudOffsetNums = (index: number) => {
    const spacing = 100 / (totalSteps + 1);
    const left = (index + 1) * spacing;
    const bottom = 32 + Math.sin(index * 1.8) * 11;
    return { left, bottom };
  };

  const getCloudOffset = (index: number) => {
    const { left, bottom } = getCloudOffsetNums(index);
    return { left: `${left}%`, bottom: `${bottom}%` };
  };

  const renderWordHighlights = useMemo(() => {
    if (!currentTargetStepText) return null;
    const targetWords = currentTargetStepText.split(' ');
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4 py-2 mt-2">
        {targetWords.map((word, index) => {
          const isMatched = matchResult?.matchedWords[index] || false;
          return (
            <span
              key={index}
              onClick={() => handleTTS(word)}
              className={`cursor-pointer px-3.5 py-2 rounded-xl font-sans text-sm md:text-lg font-black uppercase border-2 border-slate-900 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${isMatched ? 'bg-emerald-400 text-slate-900' : 'bg-white text-slate-900 hover:bg-slate-50'}`}
            >
              {word}
              <Volume2 className="w-3.5 h-3.5 text-slate-700" />
            </span>
          );
        })}
      </div>
    );
  }, [currentTargetStepText, matchResult]);

  if (gameState === 'lobby') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-[2rem] border-8 border-slate-900 bg-white p-6 shadow-[10px_10px_0_0_rgba(15,23,42,1)]">
          <div className="text-center space-y-3">
            <div className="inline-flex rounded-full border-4 border-slate-900 bg-yellow-300 p-3 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
              <FlappyBirdIcon size={64} />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900">{strings.lobbyTitle}</h2>
              <p className="text-sm font-bold text-slate-600">{strings.subtitle}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border-4 border-slate-900 bg-slate-50 p-5 text-left space-y-3 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
            <p className="text-sm font-black text-slate-900">{strings.lobbyIntro}</p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• {strings.lobbyStepOne}</li>
              <li>• {strings.lobbyStepTwo}</li>
              <li>• {strings.lobbyStepThree}</li>
            </ul>
          </div>

          <div className="mt-6 rounded-3xl border-4 border-slate-900 bg-slate-50 p-4 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
            <p className="text-xs font-black uppercase tracking-wider text-slate-700">{strings.choiceTitle}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[{ value: 4, label: strings.short }, { value: 8, label: strings.medium }, { value: 'all', label: strings.full }].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setSessionLength(opt.value as number | 'all')}
                  className={`rounded-2xl border-2 border-slate-900 px-3 py-2 text-xs font-black uppercase transition-all ${sessionLength === opt.value ? 'bg-pink-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBackToHub}
              className="flex-1 rounded-2xl border-4 border-slate-900 bg-white px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]"
            >
              {strings.back}
            </button>
            <button
              type="button"
              onClick={startPlayingAndListening}
              className="flex-1 rounded-2xl border-4 border-slate-900 bg-emerald-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]"
            >
              {strings.startLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleBackToHub = () => {
    keepListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
    if (stats.score > highScore) {
      onUpdateHighScore?.(stats.score);
    }
    onBackToHub();
  };

  return (
    <div className="space-y-6">
      <button
        onClick={handleBackToHub}
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 stroke-[3]" /> {strings.back}
      </button>

      <div className="rounded-[2rem] border-8 border-slate-900 bg-white p-5 shadow-[10px_10px_0_0_rgba(15,23,42,1)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border-4 border-slate-900 bg-yellow-300 p-2.5 shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
              <Trophy className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">{strings.title}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{strings.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border-4 border-slate-900 bg-amber-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{strings.score}: {stats.score}</span>
            </div>
            <div className="rounded-2xl border-4 border-slate-900 bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
              <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5 text-emerald-600" />{strings.completed}: {stats.completedSentencesCount}</span>
            </div>
            <div className="rounded-2xl border-4 border-slate-900 bg-sky-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
              <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-sky-600" />{strings.best}: {Math.max(highScore, stats.score)}</span>
            </div>
            <button type="button" onClick={() => setIsTutorialOpen(true)} className="rounded-2xl border-4 border-slate-900 bg-blue-500 p-2.5 text-white shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className={`relative flex min-h-[420px] w-full flex-col justify-between overflow-hidden rounded-[2rem] border-8 border-slate-900 p-4 shadow-[10px_10px_0_0_rgba(15,23,42,1)] transition-all duration-700 ${activeScene.bgClass}`}>
        <div className="absolute inset-0 z-0 opacity-15" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
        <div className="self-center z-10">
          <span className={`rounded-full border-2 border-slate-900 px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_rgba(15,23,42,1)] ${activeScene.accentClass}`}>
            {currentSentence?.category || 'Practice'} · {strings.world}: {activeScene.name}
          </span>
        </div>

        {gameState === 'playing' ? (
          <div className="relative z-10 flex-1 w-full pb-6">
            {Array.from({ length: totalSteps - 1 }).map((_, pIdx) => {
              const { left: left1, bottom: bottom1 } = getCloudOffsetNums(pIdx);
              const { left: left2, bottom: bottom2 } = getCloudOffsetNums(pIdx + 1);
              const leftPos = (left1 + left2) / 2;
              const avgBottom = (bottom1 + bottom2) / 2;
              const gapCenter = avgBottom + 10;
              const gapHalf = 15;
              const bottomPipeHeight = Math.max(10, gapCenter - gapHalf);
              const topPipeHeight = Math.max(10, 100 - (gapCenter + gapHalf));
              return (
                <div key={pIdx} className="absolute inset-y-0 z-0 pointer-events-none transition-all duration-700" style={{ left: `${leftPos}%`, width: '38px', transform: 'translateX(-50%)' }}>
                  <div className="absolute top-0 w-full border-x-4 border-b-4 border-slate-900 bg-emerald-500" style={{ height: `${topPipeHeight}%` }} />
                  <div className="absolute bottom-0 w-full border-x-4 border-t-4 border-slate-900 bg-emerald-500" style={{ height: `${bottomPipeHeight}%` }} />
                </div>
              );
            })}

            {currentSentence?.steps.map((stepText, idx) => {
              const { left, bottom } = getCloudOffset(idx);
              const isPassed = idx < currentStepIdx;
              const isActive = idx === currentStepIdx;
              const isDarkScene = activeScene.id === 'space' || activeScene.id === 'ninja';
              const contentTextClass = isActive
                ? (isDarkScene ? 'text-white' : 'text-slate-900')
                : (isDarkScene ? 'text-slate-200' : 'text-slate-700');
              const labelTextClass = isDarkScene ? 'text-slate-300' : 'text-slate-500';
              const translationTextClass = isDarkScene ? 'text-slate-300 border-slate-700' : 'text-slate-500 border-slate-200';
              return (
                <div
                  key={idx}
                  style={{ left, bottom }}
                  onClick={() => isActive && handleTTS(stepText)}
                  className={`absolute -translate-x-1/2 translate-y-1/2 rounded-xl border-2 border-slate-900 p-2.5 font-bold transition-all duration-500 z-10 flex flex-col items-center ${isActive ? `scale-110 ring-4 ring-yellow-400 ${activeScene.cloudClass} py-3.5 shadow-[4px_4px_0_0_rgba(15,23,42,1)] z-20` : isPassed ? 'scale-95 border-slate-900 bg-white text-slate-900 opacity-70 shadow-[2px_2px_0_0_rgba(15,23,42,1)]' : 'scale-90 border-dashed bg-slate-100 text-slate-600 opacity-50'}`}
                >
                  <div className="text-center space-y-0.5">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`text-[9px] font-black uppercase tracking-wider ${labelTextClass}`}>Cloud {idx + 1}</span>
                      {isActive && <Volume2 className={`h-3.5 w-3.5 ${isDarkScene ? 'text-amber-200' : 'text-blue-600'}`} />}
                    </div>
                    <p className={`text-xs font-black leading-tight ${contentTextClass}`}>{stepText}</p>
                    {showTranslations && currentSentence.translation && (isActive || isPassed) && (
                      <p className={`mt-1 max-w-[124px] truncate border-t pt-1 text-[9px] font-bold italic ${translationTextClass}`}>
                        {getIncrementalTranslation(stepText, finalFullSentence, currentSentence.translation, idx, totalSteps)}
                      </p>
                    )}
                  </div>
                  {isActive && <div className="absolute -top-3.5 rounded bg-yellow-400 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-slate-900 shadow">Speak!</div>}
                </div>
              );
            })}

            <div style={{ left: getCloudOffset(currentStepIdx).left, bottom: `calc(${getCloudOffset(currentStepIdx).bottom} + 45px)`, transform: 'translateX(-50%)' }} className="absolute z-20 flex flex-col items-center transition-all duration-700 ease-out">
              <FlappyBirdIcon size={64} isFlapping={isFlapping} className={`transition-all duration-300 ${isFlapping ? '-rotate-6 scale-105' : 'rotate-0'}`} />
              {spokenText && <div className="absolute bottom-16 max-w-[120px] truncate rounded border-2 border-slate-900 bg-yellow-200 px-2.5 py-1 text-[10px] font-black text-slate-900">"{spokenText}"</div>}
            </div>
          </div>
        ) : (
          <div className="z-10 flex flex-1 flex-col items-center justify-center rounded-[1.5rem] border-4 border-slate-900 bg-white p-6 text-center text-slate-900 shadow-[8px_8px_0_0_rgba(15,23,42,1)]">
            <span className="text-4xl animate-bounce">🏆</span>
            <h3 className="mt-2 text-xl font-black uppercase tracking-tight">{strings.completedTitle}</h3>
            <p className="mt-1 max-w-sm text-xs font-bold text-slate-600">{strings.completedText}</p>
            <div className="mt-4 grid w-full max-w-xs grid-cols-2 gap-4 rounded border-2 border-slate-900 bg-slate-100 p-4 text-left font-mono shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{strings.completedSentences}</p>
                <p className="mt-1 text-base font-black text-slate-900">{stats.completedSentencesCount}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{strings.accuracyRating}</p>
                <p className="mt-1 text-base font-black text-blue-600">{stats.totalAttempts > 0 ? `${Math.round((stats.score / stats.totalAttempts) * 100)}%` : '100%'}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 w-full max-w-xs">
              <button type="button" onClick={handleResetGameSession} className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-emerald-400 px-6 py-3 text-xs font-black uppercase shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
                <RefreshCw className="h-4 w-4" /> {strings.playAgain}
              </button>
              <button type="button" onClick={handleBackToHub} className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-purple-500 px-6 py-3 text-xs font-black uppercase text-white shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
                <ArrowLeft className="h-4 w-4" /> {strings.back}
              </button>
            </div>
          </div>
        )}
        <div className={`z-10 h-8 w-full rounded-b-[1.5rem] transition-colors duration-700 ${activeScene.groundClass}`} />
      </div>

      <div className="rounded-[2rem] border-8 border-slate-900 bg-white p-6 shadow-[10px_10px_0_0_rgba(15,23,42,1)] text-center space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-slate-500">
            <BookOpen className="h-4 w-4 text-slate-500" /> {strings.activeTarget}
          </div>
          {renderWordHighlights}
          {showTranslations && currentSentence?.translation && (
            <p className="flex items-center justify-center gap-1 text-xs font-bold italic text-slate-500">
              <Languages className="h-3.5 w-3.5 text-blue-600" /> {strings.translation}: "{currentSentence.translation}"
            </p>
          )}
        </div>

        {isListening && (
          <div className="flex items-center justify-center gap-1.5 pb-1">
            <span className="h-4 w-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="h-7 w-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
            <span className="h-5 w-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
            <span className="h-8 w-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
            <span className="h-4 w-1.5 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: '0.5s' }} />
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-4">
            <button type="button" onClick={toggleListening} className={`rounded-full border-4 border-slate-900 p-7 text-white shadow-[4px_4px_0_0_rgba(15,23,42,1)] transition-all duration-300 ${isListening ? 'bg-rose-500 hover:bg-rose-600' : 'bg-sky-500 hover:bg-sky-600'}`}>
              {isListening ? <MicOff className="h-8 w-8 animate-pulse" /> : <Mic className="h-8 w-8" />}
            </button>
            <button type="button" onClick={() => handleTTS(currentTargetStepText)} className="flex items-center gap-2 rounded-xl border-2 border-slate-900 bg-white px-4 py-3 text-xs font-black uppercase text-slate-900 shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
              <Volume2 className="h-4 w-4" /> {strings.listenGuide}
            </button>
          </div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-600">{isListening ? strings.listening : strings.ready}</p>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>{strings.skipHelp}</span>
            <button type="button" onClick={handleSkipOrCheat} className="font-extrabold text-blue-600 underline hover:text-blue-800">{strings.skipWord}</button>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-slate-900 bg-slate-100 p-4 shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
          {recognitionError ? (
            <p className="flex items-center gap-1 text-xs font-black uppercase text-rose-600"><AlertCircle className="h-4 w-4" />{recognitionError}</p>
          ) : spokenText ? (
            <div className="space-y-1 text-center font-bold">
              <p className="text-xs uppercase text-slate-500">{strings.detected}: <span className="font-black text-slate-900">"{spokenText}"</span></p>
              {matchResult && <p className={`text-[10px] font-black uppercase ${matchResult.isMatch ? 'text-emerald-700' : 'text-slate-500'}`}>{strings.matchConfidence}: {matchResult.score}% {matchResult.isMatch && '✨'}</p>}
              {matchResult?.detectedMistakeTip && !matchResult.isMatch && (
                <div className="mt-1.5 rounded border border-rose-300 bg-rose-50 p-2 text-left text-[10px] font-bold text-rose-900">
                  <span className="block text-[9.5px] font-black uppercase tracking-wider text-rose-800">{strings.pronunciationTip}</span>
                  <span>{matchResult.detectedMistakeTip}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs font-black uppercase tracking-wide text-slate-500">{listeningStatus}</p>
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border-8 border-slate-900 bg-white p-6 shadow-[10px_10px_0_0_rgba(15,23,42,1)] space-y-5">
        <h3 className="flex items-center gap-2 text-base font-black uppercase tracking-tight text-slate-900"><BarChart3 className="h-5 w-5 text-blue-600" /> {strings.metricsTitle}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded border-2 border-slate-900 bg-yellow-100 p-4 text-center shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{strings.pronouncedSteps}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{stats.score}</p>
          </div>
          <div className="rounded border-2 border-slate-900 bg-emerald-100 p-4 text-center shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{strings.sentencesMastered}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{stats.completedSentencesCount}</p>
          </div>
          <div className="rounded border-2 border-slate-900 bg-sky-100 p-4 text-center shadow-[3px_3px_0_0_rgba(15,23,42,1)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{strings.successRating}</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{stats.totalAttempts > 0 ? `${Math.round((stats.score / stats.totalAttempts) * 100)}%` : '100%'}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-black uppercase text-slate-700">{strings.trickyWords}</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.wrongWords).map(([word, count]) => (
              <span key={word} onClick={() => handleTTS(word)} className="flex cursor-pointer items-center gap-1.5 rounded border-2 border-slate-900 bg-rose-100 px-3 py-1.5 text-[10px] font-black uppercase text-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)] transition-all hover:scale-105">
                <span>{word} ({count}x)</span>
                <Volume2 className="h-3.5 w-3.5" />
              </span>
            ))}
            {Object.keys(stats.wrongWords).length === 0 && <span className="text-[10px] font-bold uppercase italic text-slate-500">{strings.noTrickyWords}</span>}
          </div>
        </div>
      </div>

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
}

function getIncrementalTranslation(stepText: string, fullText: string, translation: string, stepIdx: number, totalSteps: number): string {
  if (!translation) return '';
  const separators = ['|', '/', ';'];
  for (const sep of separators) {
    if (translation.includes(sep)) {
      const parts = translation.split(sep).map((p) => p.trim());
      if (parts.length > 0) {
        const idx = Math.min(stepIdx, parts.length - 1);
        return parts[idx];
      }
    }
  }
  const englishWordsClean = fullText.split(/\s+/).filter(Boolean);
  const stepWordsClean = stepText.split(/\s+/).filter(Boolean);
  const transWords = translation.split(/\s+/).filter(Boolean);
  if (englishWordsClean.length === 0 || transWords.length === 0) {
    return translation;
  }
  const ratio = stepWordsClean.length / englishWordsClean.length;
  const targetWordCount = Math.max(1, Math.min(transWords.length, Math.round(ratio * transWords.length)));
  return transWords.slice(0, targetWordCount).join(' ');
}

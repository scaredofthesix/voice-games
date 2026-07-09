import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Mic, MicOff, Volume2, ArrowLeft, Brain,
  RefreshCw, Check, Headphones, ArrowRight, Star, Trophy,
} from 'lucide-react';
import { useUiLanguage } from '../uiLanguage';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { LEVELS } from '../echoRecorder/levels';
import type { EchoGamePhase, EchoGameStats, EchoLevel, EchoWord } from '../echoRecorder/types';

function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return tmp[a.length][b.length];
}

const RECOGNITION_OVERLAPS: Record<string, string[]> = {
  apple: ["apple", "apel", "appl", "abble", "epple", "uple"],
  sun: ["sun", "son", "san", "some", "same", "soon"],
  tree: ["tree", "tri", "three", "free", "tea", "treat", "tray"],
  bird: ["bird", "berd", "bard", "birth", "bad", "board", "word", "beard", "third"],
  water: ["water", "woter", "voter", "watter", "what are", "warter", "walter", "daughter", "wetter", "warmer", "watta", "watte", "quarter", "waiter", "wooter"],
  clock: ["clock", "clok", "lock", "cloak", "click", "clog", "block", "cook", "coke"],
  star: ["star", "stor", "sta", "start", "stir", "steer", "scar", "store"],
  house: ["house", "haus", "hows", "horse", "mouse", "out", "how's", "hause"],
  green: ["green", "grin", "grene", "grain", "queen", "gring"],
  spoon: ["spoon", "spun", "spon", "soon", "bloom", "spune", "spawn"],
  "run fast": ["run fast", "ran fast", "rum fast", "run past", "run first", "ran first", "fast", "run"],
  "speak clear": ["speak clear", "speak cleer", "speek clear", "speak clean", "speak care", "speaker", "clear", "speak"],
  "fly high": ["fly high", "fly hi", "fly guy", "flight high", "play high", "high", "fly"],
  "smile bright": ["smile bright", "smile write", "smile bite", "small bright", "bright", "smile"],
  "look up": ["look up", "lock up", "luke up", "look cap", "look out", "up", "look"],
  "play music": ["play music", "play musek", "play musical", "play musig", "music", "play"],
  "drink milk": ["drink milk", "drink melk", "drink silk", "drink milk", "milk", "drink"],
  "sweet cat": ["sweet cat", "sweat cat", "sweet cut", "sweet cap", "cat", "sweet"],
  "blue sky": ["blue sky", "blew sky", "blue guy", "blue side", "sky", "blue"],
  "ice cream": ["ice cream", "icecream", "eyes cream", "i scream", "cream", "ice"],
  "piece of cake": ["piece of cake", "piss of cake", "peace of cake", "pizza cake", "piece", "cake"],
  "break a leg": ["break a leg", "brake a leg", "break egg", "break leg", "break", "leg"],
  "once in a blue moon": ["once in a blue moon", "once in a blew moon", "once in blue moon", "blue moon", "moon"],
  "quiet as a mouse": ["quiet as a mouse", "quiet as mouse", "quite as a mouse", "quiet", "mouse"],
  "better late than never": ["better late than never", "better late then never", "better light than never", "late than never", "never", "late"],
  "she sells seashells": ["she sells seashells", "she sells sea shells", "she sell seashell", "she sells shells", "seashells"],
  "time flies like an arrow": ["time flies like an arrow", "time flies like arrow", "time fly like an arrow", "time flies", "arrow"],
};

function checkPronunciationMatch(spoken: string, expected: string): boolean {
  const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  const cleanExpected = expected.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  if (!cleanSpoken || !cleanExpected) return false;

  if (cleanSpoken.includes(cleanExpected) || cleanExpected.includes(cleanSpoken)) {
    return true;
  }

  const overlaps = RECOGNITION_OVERLAPS[cleanExpected];
  if (overlaps) {
    for (const alt of overlaps) {
      if (cleanSpoken.includes(alt) || alt.includes(cleanSpoken)) {
        return true;
      }
    }
  }

  const distance = getLevenshteinDistance(cleanSpoken, cleanExpected);

  if (cleanExpected.length <= 3) {
    return distance <= 1;
  }
  if (cleanExpected.length <= 6) {
    return distance <= 2;
  }
  return distance <= 4 || (distance / Math.max(cleanSpoken.length, cleanExpected.length)) < 0.35;
}

const LOCAL_LANG = {
  en: {
    title: 'Echo Microphone',
    subtitle: 'Listen and repeat the chain!',
    back: 'Back to hub',
    start: 'Start Level 1',
    best: 'Best',
    howToPlay: 'How to play',
    learnRules: 'Learn Rules',
    lobbyTitle: 'Echo Microphone',
    lobbyIntro: 'Listen to the sequence of words carefully, then repeat them back in the exact same sequence through your microphone to grow the chain!',
    lobbyStepOne: 'Listen to each word in the sequence.',
    lobbyStepTwo: 'Repeat them back in order through your mic.',
    lobbyStepThree: 'Grow the chain and complete the level!',
    listening: 'Listening phase: Pay attention to pronunciation...',
    speaking: 'Speak Echo now: Repeat the terms in order!',
    replay: 'Replay Voice Guidance',
    currentChain: 'Current Chain',
    levelTarget: 'Level Target',
    bestChain: 'Best Chain',
    perfectMatch: 'Perfect Memory Echo!',
    perfectDesc: 'Your English sequence order and pronunciation was flawless. Now, get ready to memorize an even longer vocabulary chain!',
    growChain: 'Grow Chain',
    proceed: 'Proceed to Level',
    restart: 'Restart Chain',
    victory: 'ECHO RECORDER COMPLETED!',
    victoryDesc: 'Incredible performance! You have successfully completed all the voice chain levels.',
    replayAll: 'Replay All Levels',
    tryAgain: 'Try Again!',
    missedAt: 'You missed at word',
    startOver: "Let's start the sequence over!",
    phonetic: 'Phonetic',
    score: 'Score',
    completed: 'Done',
    chainWords: 'Words',
    pts: 'pts',
    word: 'Word',
    translation: 'Translation',
    target: 'Target',
    memoryCard: 'MEMORY CARD',
    sayNext: 'SAY NEXT',
    idle: 'Transceiver Idle',
    voiceActive: 'Voice Active',
    muted: 'Receiver Muted',
    guide: 'Guide',
    words: 'words',
    level: 'Level',
    speakLabel: 'Speak!',
    voiceFeed: 'Voice Feed',
    pronRef: 'Pronunciation Reference',
    supremeMaster: 'Supreme Memory Master!',
    finalScore: 'Final Score',
    longestChainLabel: 'Longest Chain',
    totalAttemptsLabel: 'Total Attempts',
    correctRoundsLabel: 'Correct Rounds',
  },
  ru: {
    title: 'Эхо-микрофон',
    subtitle: 'Слушай и повторяй цепочку!',
    back: 'Назад в хаб',
    start: 'Начать Уровень 1',
    best: 'Рекорд',
    howToPlay: 'Как играть',
    learnRules: 'Правила',
    lobbyTitle: 'Эхо-микрофон',
    lobbyIntro: 'Внимательно слушай последовательность слов, а затем повторяй их в том же порядке в микрофон, чтобы удлинить цепочку!',
    lobbyStepOne: 'Слушай каждое слово в последовательности.',
    lobbyStepTwo: 'Повторяй их по порядку в микрофон.',
    lobbyStepThree: 'Удлиняй цепочку и проходи уровень!',
    listening: 'Фаза прослушивания: обращай внимание на произношение...',
    speaking: 'Говори сейчас: повторяй слова по порядку!',
    replay: 'Повторить подсказку',
    currentChain: 'Текущая цепь',
    levelTarget: 'Цель уровня',
    bestChain: 'Лучшая цепь',
    perfectMatch: 'Идеальное эхо!',
    perfectDesc: 'Твоя английская последовательность и произношение были безупречны. Приготовься запомнить ещё более длинную цепочку!',
    growChain: 'Удлинить цепь',
    proceed: 'Перейти к уровню',
    restart: 'Начать заново',
    victory: 'ЭХО-РЕКОРДЕР ПРОЙДЕН!',
    victoryDesc: 'Невероятный результат! Ты успешно прошёл все уровни голосовых цепочек.',
    replayAll: 'Пройти всё заново',
    tryAgain: 'Попробуй ещё раз!',
    missedAt: 'Ты ошибся на слове',
    startOver: 'Начнём последовательность заново!',
    phonetic: 'Фонетика',
    score: 'Очки',
    completed: 'Готово',
    chainWords: 'Слов',
    pts: 'очк',
    word: 'Слово',
    translation: 'Перевод',
    target: 'Цель',
    memoryCard: 'КАРТА ПАМЯТИ',
    sayNext: 'ГОВОРИ',
    idle: 'Приёмник в режиме ожидания',
    voiceActive: 'Микрофон активен',
    muted: 'Микрофон выключен',
    guide: 'Гайд',
    words: 'слов',
    level: 'Уровень',
    speakLabel: 'Говори!',
    voiceFeed: 'Голосовой канал',
    pronRef: 'Справочник произношения',
    supremeMaster: 'Верховный мастер памяти!',
    finalScore: 'Финальный счёт',
    longestChainLabel: 'Самая длинная цепь',
    totalAttemptsLabel: 'Всего попыток',
    correctRoundsLabel: 'Правильных раундов',
  },
};

interface EchoRecorderGameProps {
  onBackToHub: () => void;
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
}

export default function EchoRecorderGame({ onBackToHub, highScore = 0, onUpdateHighScore }: EchoRecorderGameProps) {
  const { language } = useUiLanguage();
  const strings = LOCAL_LANG[language as 'en' | 'ru'] || LOCAL_LANG.en;
  const [gameState, setGameState] = useState<EchoGamePhase>('start');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [currentSequence, setCurrentSequence] = useState<EchoWord[]>([]);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [userSpeechProgressIdx, setUserSpeechProgressIdx] = useState(0);
  const [tryAgainTip, setTryAgainTip] = useState<{ text: string; translation: string; phonetic: string } | null>(null);
  const [recentTranscript, setRecentTranscript] = useState('');
  const [stats, setStats] = useState<EchoGameStats>({
    score: 0, longestChain: 1, totalAttempts: 0, correctRounds: 0, failedWords: {},
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const gameStateRef = useRef(gameState);
  const currentSequenceRef = useRef(currentSequence);
  const userSpeechProgressIdxRef = useRef(userSpeechProgressIdx);
  const currentLevelIdxRef = useRef(currentLevelIdx);
  const statsRef = useRef(stats);
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef('');

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { currentSequenceRef.current = currentSequence; }, [currentSequence]);
  useEffect(() => { userSpeechProgressIdxRef.current = userSpeechProgressIdx; }, [userSpeechProgressIdx]);
  useEffect(() => { currentLevelIdxRef.current = currentLevelIdx; }, [currentLevelIdx]);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  const level: EchoLevel = LEVELS[currentLevelIdx];

  const playSound = (type: 'success' | 'fail' | 'flip' | 'click' | 'victory') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'fail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(147, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'victory') {
        osc.type = 'sine';
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        });
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch {
      // Audio context may not be available
    }
  };

  const speakSequence = async (sequence: EchoWord[], pitch?: number, rate?: number) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      for (let i = 0; i < sequence.length; i++) {
        setActiveWordIdx(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setActiveWordIdx(-1);
      setGameState('recording');
      return;
    }
    window.speechSynthesis.cancel();
    setGameState('playback');
    setActiveWordIdx(0);

    const speakItem = (index: number) => {
      if (index >= sequence.length) {
        setActiveWordIdx(-1);
        setGameState('recording');
        return;
      }
      setActiveWordIdx(index);
      const item = sequence[index];
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = 'en-US';
      utterance.pitch = pitch ?? level.speechPitch;
      utterance.rate = rate ?? level.speechRate;
      utterance.onend = () => {
        setTimeout(() => { speakItem(index + 1); }, 400);
      };
      utterance.onerror = () => { speakItem(index + 1); };
      window.speechSynthesis.speak(utterance);
    };

    speakItem(0);
  };

  const extendChain = (current: EchoWord[], pool: EchoWord[]): EchoWord[] => {
    const lastWord = current[current.length - 1];
    const availablePool = pool.filter(w => !lastWord || w.text !== lastWord.text);
    const selectedPool = availablePool.length > 0 ? availablePool : pool;
    const randomWord = selectedPool[Math.floor(Math.random() * selectedPool.length)];
    return [...current, randomWord];
  };

  const startLevel = (lvlIdx: number) => {
    setCurrentLevelIdx(lvlIdx);
    const lvl = LEVELS[lvlIdx];
    const initialChain = extendChain([], lvl.pool);
    setCurrentSequence(initialChain);
    setUserSpeechProgressIdx(0);
    setTryAgainTip(null);
    setRecentTranscript('');
    setGameState('playback');
    speakSequence(initialChain, lvl.speechPitch, lvl.speechRate);
  };

  const cancelFailTimer = () => {
    if (failTimerRef.current) {
      clearTimeout(failTimerRef.current);
      failTimerRef.current = null;
    }
  };

  const advanceToNextWord = useCallback((spokenText: string, localProgressIdx: number) => {
    playSound('flip');
    setUserSpeechProgressIdx(localProgressIdx);
    setRecentTranscript('');
    setTryAgainTip(null);
    cancelFailTimer();

    if (localProgressIdx >= currentSequenceRef.current.length) {
      setTimeout(() => {
        playSound('success');
        setStats(prev => ({
          ...prev,
          score: prev.score + currentSequenceRef.current.length * 20,
          longestChain: Math.max(prev.longestChain, currentSequenceRef.current.length),
          correctRounds: prev.correctRounds + 1,
          totalAttempts: prev.totalAttempts + 1,
        }));
        const seqLen = currentSequenceRef.current.length;
        const lvlIdx = currentLevelIdxRef.current;
        if (seqLen >= LEVELS[lvlIdx].targetChainLength) {
          if (lvlIdx >= LEVELS.length - 1) {
            setGameState('victory');
            playSound('victory');
          } else {
            const next = lvlIdx + 1;
            setCurrentLevelIdx(next);
            startLevel(next);
          }
        } else {
          const updatedSequence = extendChain(currentSequenceRef.current, LEVELS[currentLevelIdxRef.current].pool);
          setCurrentSequence(updatedSequence);
          setUserSpeechProgressIdx(0);
          setRecentTranscript('');
          setTryAgainTip(null);
          const lvl = LEVELS[currentLevelIdxRef.current];
          speakSequence(updatedSequence, lvl.speechPitch, lvl.speechRate);
        }
      }, 500);
    }
  }, []);

  const handleTranscript = useCallback((text: string) => {
    if (gameStateRef.current !== 'recording') return;
    const rawText = text.toLowerCase().trim();
    if (!rawText || rawText === lastTranscriptRef.current) return;
    lastTranscriptRef.current = rawText;
    setRecentTranscript(text);

    let localProgressIdx = userSpeechProgressIdxRef.current;
    let matchedAny = false;

    while (localProgressIdx < currentSequenceRef.current.length) {
      const expectedWord = currentSequenceRef.current[localProgressIdx];
      if (checkPronunciationMatch(text, expectedWord.text)) {
        localProgressIdx++;
        matchedAny = true;
      } else {
        break;
      }
    }

    if (matchedAny) {
      advanceToNextWord(text, localProgressIdx);
    } else {
      cancelFailTimer();
      failTimerRef.current = setTimeout(() => {
        if (gameStateRef.current !== 'recording') return;
        const idx = userSpeechProgressIdxRef.current;
        if (idx >= currentSequenceRef.current.length) return;
        const expectedWord = currentSequenceRef.current[idx];
        if (expectedWord) {
          playSound('fail');
          setStats(prev => {
            const nextFailed = { ...prev.failedWords };
            nextFailed[expectedWord.text] = (nextFailed[expectedWord.text] || 0) + 1;
            return { ...prev, totalAttempts: prev.totalAttempts + 1, failedWords: nextFailed };
          });
          setTryAgainTip({
            text: expectedWord.text,
            translation: expectedWord.translation,
            phonetic: expectedWord.phonetic,
          });
          setUserSpeechProgressIdx(0);
          setRecentTranscript('');
        }
        cancelFailTimer();
      }, 1500);
    }
  }, [advanceToNextWord]);

  const { status, start, stop } = useSpeechRecognition(handleTranscript);
  const isListening = status.status === 'listening';

  useEffect(() => {
    if (gameState === 'recording') {
      start();
    } else {
      stop();
      cancelFailTimer();
    }
    return () => { stop(); cancelFailTimer(); };
  }, [gameState, start, stop]);

  const handleNextChainStep = () => {
    setUserSpeechProgressIdx(0);
    setRecentTranscript('');
    setTryAgainTip(null);
    const updatedSequence = extendChain(currentSequence, level.pool);
    setCurrentSequence(updatedSequence);
    speakSequence(updatedSequence);
  };

  const replayCurrentSequence = () => {
    setUserSpeechProgressIdx(0);
    setRecentTranscript('');
    setTryAgainTip(null);
    speakSequence(currentSequence);
  };

  const handleBackToHub = () => {
    if (stats.score > highScore) {
      onUpdateHighScore?.(stats.score);
    }
    onBackToHub();
  };

  useEffect(() => {
    if (stats.score > highScore) {
      onUpdateHighScore?.(stats.score);
    }
  }, [stats.score, highScore, onUpdateHighScore]);

  if (gameState === 'start') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-[2rem] border-8 border-slate-900 bg-white p-6 shadow-[10px_10px_0_0_rgba(15,23,42,1)]">
          <div className="text-center space-y-3">
            <div className="inline-flex rounded-full border-4 border-slate-900 bg-yellow-300 p-3 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
              <span className="text-4xl">🗣️</span>
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleBackToHub}
              className="flex-1 rounded-2xl border-4 border-slate-900 bg-white px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]"
            >
              {strings.back}
            </button>
            <button
              type="button"
              onClick={() => { playSound('click'); startLevel(0); }}
              className="flex-1 rounded-2xl border-4 border-slate-900 bg-emerald-400 px-4 py-3 text-sm font-black uppercase tracking-wider text-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)]"
            >
              {strings.start}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              <Brain className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">{strings.title}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{level.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border-4 border-slate-900 bg-amber-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
              <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{strings.score}: {stats.score}</span>
            </div>
            <div className="rounded-2xl border-4 border-slate-900 bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-900">
              <span className="flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-emerald-600" />{strings.best}: {Math.max(highScore, stats.score)}</span>
            </div>
            <button
              type="button"
              onClick={() => { playSound('click'); setSoundEnabled(!soundEnabled); }}
              className={`rounded-2xl border-4 border-slate-900 p-2.5 shadow-[3px_3px_0_0_rgba(15,23,42,1)] ${soundEnabled ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-500'}`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border-4 border-slate-900 bg-white p-3 shadow-[3px_3px_0_0_rgba(15,23,42,1)] text-center">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{strings.currentChain}</p>
          <p className="mt-1 text-base font-black text-slate-900">{currentSequence.length} {strings.words}</p>
        </div>
        <div className="rounded-2xl border-4 border-slate-900 bg-white p-3 shadow-[3px_3px_0_0_rgba(15,23,42,1)] text-center">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{strings.target}</p>
          <p className="mt-1 text-base font-black text-slate-900">{level.targetChainLength} {strings.words}</p>
        </div>
        <div className="rounded-2xl border-4 border-slate-900 bg-white p-3 shadow-[3px_3px_0_0_rgba(15,23,42,1)] text-center">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{strings.bestChain}</p>
          <p className="mt-1 text-base font-black text-slate-900">{stats.longestChain} {strings.words}</p>
        </div>
      </div>

      <div className="rounded-[2rem] border-8 border-slate-900 bg-slate-100 p-6 shadow-[10px_10px_0_0_rgba(15,23,42,1)] space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
            {gameState === 'playback' ? (
              <><Headphones className="w-4 h-4 text-indigo-600 animate-pulse" /> {strings.listening}</>
            ) : (
              <><Mic className="w-4 h-4 text-emerald-600 animate-pulse" /> {strings.speaking}</>
            )}
          </span>
          {gameState === 'recording' && (
            <button
              onClick={() => { playSound('click'); replayCurrentSequence(); }}
              className="px-2.5 py-1 bg-white border-2 border-slate-900 font-black text-[9px] uppercase tracking-wider hover:bg-yellow-100 cursor-pointer flex items-center gap-1 shadow-[2px_2px_0_0_rgba(15,23,42,1)] active:translate-y-[0.5px]"
            >
              <RefreshCw className="w-3 h-3 text-indigo-600" /> {strings.replay}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {currentSequence.map((word, idx) => {
            const isTTSActive = idx === activeWordIdx;
            const isRevealed = userSpeechProgressIdx > idx;
            const isCurrentTarget = userSpeechProgressIdx === idx && gameState === 'recording';

            let cardBg = 'bg-white';
            let cardBorder = 'border-slate-900';
            if (isTTSActive) {
              cardBg = 'bg-indigo-600';
              cardBorder = 'border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] scale-105';
            } else if (isRevealed) {
              cardBg = 'bg-yellow-400';
              cardBorder = 'border-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)]';
            } else if (isCurrentTarget) {
              cardBg = 'bg-white border-dashed';
              cardBorder = 'border-indigo-600 animate-pulse';
            } else {
              cardBg = 'bg-slate-200/50';
              cardBorder = 'border-slate-300';
            }

            return (
              <motion.div
                key={idx}
                layout
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className={`rounded-2xl border-4 p-4 h-[120px] flex flex-col justify-between select-none relative overflow-hidden transition-all ${cardBg} ${cardBorder}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] font-black border px-1.5 rounded-lg ${isTTSActive ? 'bg-slate-950 text-white border-slate-800' : 'bg-slate-100 text-slate-900 border-slate-300'}`}>
                    #{idx + 1}
                  </span>
                  {isRevealed && <Check className="w-4 h-4 text-emerald-700" />}
                  {isCurrentTarget && <span className="text-[8px] font-black uppercase tracking-wider text-indigo-700 animate-pulse">{strings.speakLabel}</span>}
                </div>
                <div className="text-center space-y-1">
                  {isRevealed || isTTSActive || gameState === 'playback' ? (
                    <>
                      <div className="text-xl">{word.emoji}</div>
                      <div className={`font-black uppercase tracking-tight text-sm ${isTTSActive ? 'text-white' : 'text-slate-900'}`}>{word.text}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-xl text-slate-300">❓</div>
                      <div className="font-extrabold text-[9px] text-slate-400 tracking-wider">{strings.memoryCard}</div>
                    </>
                  )}
                </div>
                <div className="text-center">
                  {isRevealed || isTTSActive || gameState === 'playback' ? (
                    <div className={`text-[8px] font-bold leading-none ${isTTSActive ? 'text-slate-200' : 'text-slate-500'}`}>{word.translation}</div>
                  ) : (
                    <div className="text-[8px] font-semibold text-slate-300 italic">?</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {tryAgainTip && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border-8 border-rose-600 bg-rose-50 p-4 shadow-[6px_6px_0_0_rgba(225,29,72,1)] flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">❌</span>
            <div>
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">{strings.tryAgain}</h4>
              <p className="text-xs font-bold text-slate-700">{strings.missedAt} <span className="text-rose-600 font-extrabold">"{tryAgainTip.text}"</span> ({tryAgainTip.translation}). {strings.startOver}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black bg-white border-2 border-rose-600 px-2.5 py-1 shadow-[2px_2px_0_0_rgba(225,29,72,1)]">{strings.phonetic}: {tryAgainTip.phonetic}</span>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-[2rem] border-8 border-slate-900 bg-white p-4 shadow-[6px_6px_0_0_rgba(15,23,42,1)] flex flex-col justify-between min-h-[140px]">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-indigo-600" /> {strings.voiceFeed}
            </h4>
            <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 p-4 min-h-[60px] flex flex-col items-center justify-center text-center relative overflow-hidden">
              {gameState === 'recording' && isListening ? (
                <div className="space-y-1 w-full flex flex-col items-center">
                  {recentTranscript ? (
                    <p className="text-xs font-black text-slate-800 italic truncate max-w-[180px]">"{recentTranscript}"</p>
                  ) : (
                    <div className="flex items-end gap-1.5 h-6">
                      <motion.span animate={{ height: [6, 16, 6] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-1 bg-yellow-400 border border-slate-900" />
                      <motion.span animate={{ height: [8, 24, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-yellow-400 border border-slate-900" />
                      <motion.span animate={{ height: [5, 12, 5] }} transition={{ repeat: Infinity, duration: 0.3 }} className="w-1 bg-yellow-400 border border-slate-900" />
                      <motion.span animate={{ height: [10, 20, 10] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-yellow-400 border border-slate-900" />
                      <motion.span animate={{ height: [4, 14, 4] }} transition={{ repeat: Infinity, duration: 0.45 }} className="w-1 bg-yellow-400 border border-slate-900" />
                    </div>
                  )}
                  <span className="text-[8px] uppercase font-black text-slate-500 animate-pulse mt-1">{strings.sayNext}: #{userSpeechProgressIdx + 1}</span>
                </div>
              ) : (
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{strings.idle}</p>
              )}
            </div>
          </div>
          <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between text-[9px] font-black uppercase text-slate-400">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isListening ? strings.voiceActive : strings.muted}
            </span>
          </div>
        </div>

        <div className="md:col-span-2 rounded-[2rem] border-8 border-slate-900 bg-white p-4 shadow-[6px_6px_0_0_rgba(15,23,42,1)]">
          <div className="flex justify-between items-center mb-2.5">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-indigo-600" /> {strings.pronRef}
            </h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {level.pool.map((word, idx) => (
              <div key={idx} className="rounded-xl border-2 border-slate-200 bg-slate-50/50 p-2 flex flex-col justify-between select-none">
                <span className="text-xs font-black text-slate-800 tracking-tight">{word.emoji} "{word.text}"</span>
                <div className="flex justify-between items-center mt-1 w-full">
                  <span className="text-[8px] font-extrabold text-slate-400">{word.translation}</span>
                  <span className="text-[8px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1 rounded">{word.phonetic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {gameState === 'victory' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[2rem] border-8 border-slate-900 bg-white p-8 text-center space-y-6 shadow-[10px_10px_0_0_rgba(15,23,42,1)] max-w-xl mx-auto relative overflow-hidden">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-100 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full blur-2xl pointer-events-none" />
          <span className="text-5xl animate-bounce block">👑🏆👑</span>
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-900 bg-yellow-400 border-2 border-slate-900 px-2 py-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)] uppercase inline-block">{strings.supremeMaster}</span>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{strings.victory}</h3>
            <p className="text-sm font-bold text-slate-600 max-w-md mx-auto">{strings.victoryDesc}</p>
          </div>
          <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 p-5 text-left divide-y divide-slate-200 shadow-[4px_4px_0_0_rgba(15,23,42,1)]">
            <div className="flex justify-between py-2 text-xs font-bold text-slate-700"><span>{strings.finalScore}:</span><span className="font-black text-yellow-600">{stats.score} {strings.pts}</span></div>
            <div className="flex justify-between py-2 text-xs font-bold text-slate-700"><span>{strings.longestChainLabel}:</span><span className="font-black text-slate-900">{stats.longestChain} {strings.words}</span></div>
            <div className="flex justify-between py-2 text-xs font-bold text-slate-700"><span>{strings.totalAttemptsLabel}:</span><span className="font-black text-slate-900">{stats.totalAttempts}</span></div>
            <div className="flex justify-between py-2 text-xs font-bold text-slate-700"><span>{strings.correctRoundsLabel}:</span><span className="font-black text-emerald-600">{stats.correctRounds}</span></div>
          </div>
          <div className="flex justify-center gap-3">
            <button onClick={() => { playSound('click'); setStats({ score: 0, longestChain: 1, totalAttempts: 0, correctRounds: 0, failedWords: {} }); startLevel(0); }} className="rounded-2xl border-4 border-slate-900 bg-emerald-400 px-6 py-3 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0_0_rgba(15,23,42,1)]">{strings.replayAll}</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

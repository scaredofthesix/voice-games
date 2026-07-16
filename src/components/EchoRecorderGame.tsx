import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Mic, Volume2, VolumeX, Brain,
  RefreshCw, Check, Headphones, ArrowRight, Star, Trophy, Heart,
} from 'lucide-react';

const MAX_LIVES = 3;
const RETRY_GRACE_MS = 3500;
const NEXT_CHAIN_DELAY_MS = 1200;
import { BackToHubButton, CustomWordsSection, GameHeader, GameResultCard, GameSetupCard, ListenAndLearnSection, OptionPicker, PauseButton, WordSetPicker } from './GameUi';
import { useUiLanguage } from '../uiLanguage';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { BUILTIN_CATEGORIES } from '../data';
import type { WordCategory, WordData } from '../types';
import type { EchoGamePhase, EchoGameStats, EchoWord } from '../echoRecorder/types';
import { createGameAudioContext, speakWord } from '../voice/engine';
import { loadProgress, pickAdaptiveWordIndex, recordHighScore, recordSessionPlayed, recordWordSpoken, recordWordStruggled, saveProgress } from '../progress';

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

function containsWholePhrase(text: string, phrase: string): boolean {
  return Boolean(phrase) && ` ${text} `.includes(` ${phrase} `);
}

function checkPronunciationMatch(spoken: string, expected: string): boolean {
  const cleanSpoken = spoken.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  const cleanExpected = expected.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  if (!cleanSpoken || !cleanExpected) return false;

  if (containsWholePhrase(cleanSpoken, cleanExpected)) {
    return true;
  }

  const overlaps = RECOGNITION_OVERLAPS[cleanExpected];
  if (overlaps) {
    const expectedWordCount = cleanExpected.split(' ').length;
    for (const alt of overlaps) {
      const normalizedAlt = normalizeEchoText(alt);
      if (
        normalizedAlt.split(' ').length === expectedWordCount &&
        containsWholePhrase(cleanSpoken, normalizedAlt)
      ) {
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

function normalizeEchoText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Count sequence items actually present in one transcript, consuming each
 * matched phrase before checking the next. This prevents one short phrase from
 * being reused against every remaining card while still allowing a child to
 * repeat a complete multi-card chain in one utterance.
 */
export function countSequentialEchoMatches(
  spoken: string,
  sequence: readonly Pick<EchoWord, 'text'>[],
  startIndex: number,
): number {
  let remaining = normalizeEchoText(spoken);
  let matched = 0;

  for (let index = startIndex; index < sequence.length && remaining; index++) {
    const expected = normalizeEchoText(sequence[index].text);
    const exactIndex = expected ? ` ${remaining} `.indexOf(` ${expected} `) : -1;

    if (exactIndex >= 0) {
      remaining = remaining.slice(exactIndex + expected.length).trim();
      matched++;
      continue;
    }

    // Recognition variants may not contain an exact phrase. Apply the existing
    // tolerant match only to the current card and never reuse it for later ones.
    if (matched === 0 && checkPronunciationMatch(remaining, expected)) {
      matched = 1;
    }
    break;
  }

  return matched;
}

const ECHO_STRING_KEYS = ["title", "subtitle", "back", "start", "chooseTheme", "best", "howToPlay", "learnRules", "lobbyTitle", "lobbyIntro", "lobbyStepOne", "lobbyStepTwo", "lobbyStepThree", "listening", "speaking", "replay", "currentChain", "bestChain", "perfectMatch", "perfectDesc", "growChain", "proceed", "restart", "victory", "victoryDesc", "replayAll", "tryAgain", "retryListening", "memoryHidden", "missedAt", "startOver", "phonetic", "score", "completed", "chainWords", "pts", "word", "translation", "target", "memoryCard", "sayNext", "idle", "voiceActive", "muted", "guide", "words", "speakLabel", "voiceFeed", "pronRef", "supremeMaster", "finalScore", "longestChainLabel", "totalAttemptsLabel", "correctRoundsLabel"] as const;

interface EchoRecorderGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onAddCustomWord?: (word: string, translation: string) => void;
  onDeleteCustomWord?: (index: number) => void;
  onClearCustomWords?: () => void;
}

function toEchoWord(entry: { word: string; translation: string; translationRu?: string }): EchoWord {
  return { text: entry.word, translation: entry.translationRu || entry.translation };
}

type EchoTheme = 'studio' | 'forest' | 'space';

const ECHO_THEMES: readonly { id: EchoTheme; labelKey: string; panelClass: string; gameClass: string; accentClass: string }[] = [
  { id: 'studio', labelKey: 'echo.themes.studio', panelClass: 'bg-slate-100', gameClass: 'bg-gradient-to-br from-slate-100 via-violet-50 to-fuchsia-100', accentClass: 'text-violet-700' },
  { id: 'forest', labelKey: 'echo.themes.forest', panelClass: 'bg-emerald-100', gameClass: 'bg-gradient-to-br from-emerald-100 via-lime-50 to-amber-100', accentClass: 'text-emerald-700' },
  { id: 'space', labelKey: 'echo.themes.space', panelClass: 'bg-indigo-100', gameClass: 'bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-950', accentClass: 'text-violet-200' },
];

function EchoThemePreview({ theme }: { theme: (typeof ECHO_THEMES)[number] }) {
  const { t } = useUiLanguage();
  const previewClass =
    theme.id === 'space'
      ? 'bg-gradient-to-br from-indigo-950 to-violet-800 text-white'
      : theme.id === 'forest'
        ? 'bg-gradient-to-br from-emerald-200 to-lime-100 text-slate-900'
        : 'bg-gradient-to-br from-slate-100 to-violet-100 text-slate-900';
  const accent = theme.id === 'space' ? '🪐' : theme.id === 'forest' ? '🌲' : '🎧';

  return (
    <div className={`mt-3 overflow-hidden rounded-2xl border-4 border-slate-900 ${previewClass}`}>
      <div className="relative h-24 p-3">
        <div className="absolute left-3 top-3 text-2xl">{accent}</div>
        <div className="absolute right-3 top-3 flex h-8 items-end gap-1">
          <span className="h-3 w-1.5 rounded-full border border-slate-900 bg-yellow-300" />
          <span className="h-6 w-1.5 rounded-full border border-slate-900 bg-yellow-300" />
          <span className="h-4 w-1.5 rounded-full border border-slate-900 bg-yellow-300" />
          <span className="h-7 w-1.5 rounded-full border border-slate-900 bg-yellow-300" />
        </div>
        <div className="absolute bottom-3 left-3 right-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((idx) => (
            <div key={idx} className="rounded-xl border-2 border-slate-900 bg-white/90 px-2 py-1 text-center text-[9px] font-black uppercase text-slate-900 shadow-[2px_2px_0_0_rgba(15,23,42,1)]">
              {t('echo.previewWord')} {idx}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t-4 border-slate-900 bg-white/80 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-900">
        {t(theme.labelKey)}
      </div>
    </div>
  );
}

export default function EchoRecorderGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onAddCustomWord,
  onDeleteCustomWord,
  onClearCustomWords,
}: EchoRecorderGameProps) {
  const { t } = useUiLanguage();
  const strings = Object.fromEntries(
    ECHO_STRING_KEYS.map((key) => [key, t(`echo.${key}`)]),
  ) as Record<typeof ECHO_STRING_KEYS[number], string>;
  const [gameState, setGameState] = useState<EchoGamePhase>('start');
  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [theme, setTheme] = useState<EchoTheme>('studio');
  const [currentSequence, setCurrentSequence] = useState<EchoWord[]>([]);
  const [activeWordIdx, setActiveWordIdx] = useState(-1);
  const [userSpeechProgressIdx, setUserSpeechProgressIdx] = useState(0);
  const [tryAgainTip, setTryAgainTip] = useState<{ text: string; translation: string; phonetic?: string } | null>(null);
  const [recentTranscript, setRecentTranscript] = useState('');
  const [stats, setStats] = useState<EchoGameStats>({
    score: 0, longestChain: 1, totalAttempts: 0, correctRounds: 0, failedWords: {},
  });
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [paused, setPaused] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);
  const [retryListening, setRetryListening] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);

  const gameStateRef = useRef(gameState);
  const currentSequenceRef = useRef(currentSequence);
  const userSpeechProgressIdxRef = useRef(userSpeechProgressIdx);
  const activeCategoryRef = useRef(activeCategory);
  const customWordsRef = useRef(customWords);
  const statsRef = useRef(stats);
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTranscriptRef = useRef('');
  const pausedRef = useRef(false);
  const livesRef = useRef(MAX_LIVES);
  const showListeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackGenerationRef = useRef(0);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { currentSequenceRef.current = currentSequence; }, [currentSequence]);
  useEffect(() => { userSpeechProgressIdxRef.current = userSpeechProgressIdx; }, [userSpeechProgressIdx]);
  useEffect(() => { activeCategoryRef.current = activeCategory; }, [activeCategory]);
  useEffect(() => { customWordsRef.current = customWords; }, [customWords]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  const wordPool = useMemo((): EchoWord[] => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0
        ? customWords.map(toEchoWord)
        : BUILTIN_CATEGORIES[0].words.map(toEchoWord);
    }
    return activeCategory.words.map(toEchoWord);
  }, [activeCategory, customWords]);
  const activeTheme = ECHO_THEMES.find((item) => item.id === theme) || ECHO_THEMES[0];

  const playSound = (type: 'success' | 'fail' | 'flip' | 'click' | 'victory') => {
    if (!soundEnabled) return;
    try {
      const ctx = createGameAudioContext(1000);
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

  const cancelSequencePlayback = useCallback(() => {
    playbackGenerationRef.current++;
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }, []);

  const speakSequence = async (sequence: EchoWord[], pitch = 1.0, rate = 0.85) => {
    cancelSequencePlayback();
    const generation = playbackGenerationRef.current;

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      for (let i = 0; i < sequence.length; i++) {
        if (generation !== playbackGenerationRef.current) return;
        setActiveWordIdx(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (generation !== playbackGenerationRef.current) return;
      setActiveWordIdx(-1);
      lastTranscriptRef.current = '';
      setRetryListening(false);
      setTryAgainTip(null);
      gameStateRef.current = 'recording';
      setGameState('recording');
      return;
    }
    gameStateRef.current = 'playback';
    setGameState('playback');
    setActiveWordIdx(0);

    const speakItem = (index: number) => {
      if (generation !== playbackGenerationRef.current) return;
      if (index >= sequence.length) {
        setActiveWordIdx(-1);
        lastTranscriptRef.current = '';
        setRetryListening(false);
        setTryAgainTip(null);
        gameStateRef.current = 'recording';
        setGameState('recording');
        return;
      }
      setActiveWordIdx(index);
      const item = sequence[index];
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.lang = 'en-US';
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.onend = () => {
        if (generation !== playbackGenerationRef.current) return;
        playbackTimerRef.current = setTimeout(() => {
          playbackTimerRef.current = null;
          speakItem(index + 1);
        }, 400);
      };
      utterance.onerror = () => { speakItem(index + 1); };
      window.speechSynthesis.speak(utterance);
    };

    speakItem(0);
  };

  const extendChain = (current: EchoWord[], pool: EchoWord[]): EchoWord[] => {
    if (pool.length === 0) return current;
    const lastWord = current[current.length - 1];
    const previous = lastWord
      ? pool.findIndex((item) => item.text.toLocaleLowerCase() === lastWord.text.toLocaleLowerCase())
      : -1;
    const index = pickAdaptiveWordIndex(
      pool.map((item) => item.text),
      loadProgress()['echo-recorder'].words,
      previous,
    );
    return [...current, pool[index]];
  };

  const startGame = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLives(MAX_LIVES);
    livesRef.current = MAX_LIVES;
    const initialChain = extendChain([], wordPool);
    setStats({ score: 0, longestChain: 1, totalAttempts: 0, correctRounds: 0, failedWords: {} });
    setWordStudyStats({});
    saveProgress(recordSessionPlayed(loadProgress(), 'echo-recorder'));
    setCurrentSequence(initialChain);
    setUserSpeechProgressIdx(0);
    setTryAgainTip(null);
    setRetryListening(false);
    setRoundComplete(false);
    setRecentTranscript('');
    lastTranscriptRef.current = '';
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    gameStateRef.current = 'playback';
    setGameState('playback');
    speakSequence(initialChain);
  };

  const cancelFailTimer = () => {
    if (failTimerRef.current) {
      clearTimeout(failTimerRef.current);
      failTimerRef.current = null;
    }
  };

  const advanceToNextWord = useCallback((localProgressIdx: number) => {
    playSound('flip');
    setUserSpeechProgressIdx(localProgressIdx);
    userSpeechProgressIdxRef.current = localProgressIdx;
    setRecentTranscript('');
    setTryAgainTip(null);
    cancelFailTimer();

    if (localProgressIdx >= currentSequenceRef.current.length) {
      setRoundComplete(true);
      gameStateRef.current = 'playback';
      setGameState('playback');
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        transitionTimerRef.current = null;
        playSound('success');
        setStats(prev => ({
          ...prev,
          score: prev.score + currentSequenceRef.current.length * 20,
          longestChain: Math.max(prev.longestChain, currentSequenceRef.current.length),
          correctRounds: prev.correctRounds + 1,
          totalAttempts: prev.totalAttempts + 1,
        }));
        // Endless play: the chain just keeps growing until the player runs out of hearts.
        const cat = activeCategoryRef.current;
        const pool: EchoWord[] = cat.id === 'custom'
          ? (customWordsRef.current.length > 0
            ? customWordsRef.current.map(toEchoWord)
            : BUILTIN_CATEGORIES[0].words.map(toEchoWord))
          : cat.words.map(toEchoWord);
        const updatedSequence = extendChain(currentSequenceRef.current, pool);
        currentSequenceRef.current = updatedSequence;
        setCurrentSequence(updatedSequence);
        userSpeechProgressIdxRef.current = 0;
        setUserSpeechProgressIdx(0);
        setRecentTranscript('');
        setTryAgainTip(null);
        setRoundComplete(false);
        speakSequence(updatedSequence);
      }, NEXT_CHAIN_DELAY_MS);
    }
  }, []);

  const handleTranscript = useCallback((text: string) => {
    if (pausedRef.current) return;
    if (gameStateRef.current !== 'recording') return;
    const rawText = text.toLowerCase().trim();
    const initialProgressIdx = userSpeechProgressIdxRef.current;
    const transcriptKey = `${initialProgressIdx}:${rawText}`;
    if (!rawText || transcriptKey === lastTranscriptRef.current) return;
    lastTranscriptRef.current = transcriptKey;
    setRecentTranscript(text);

    const matchedCount = countSequentialEchoMatches(
      text,
      currentSequenceRef.current,
      initialProgressIdx,
    );
    const localProgressIdx = initialProgressIdx + matchedCount;

    if (matchedCount > 0) {
      setRetryListening(false);
      const matchedWords = currentSequenceRef.current.slice(initialProgressIdx, localProgressIdx);
      let progress = loadProgress();
      matchedWords.forEach((item) => {
        progress = recordWordSpoken(progress, 'echo-recorder', item.text);
      });
      saveProgress(progress);
      setWordStudyStats((previous) => {
        const next = { ...previous };
        matchedWords.forEach((item) => {
          next[item.text] = {
            spoken: (next[item.text]?.spoken || 0) + 1,
            struggled: next[item.text]?.struggled || 0,
          };
        });
        return next;
      });
      advanceToNextWord(localProgressIdx);
    } else {
      // A first imperfect/interim result is not a lost life. Keep listening for
      // a full retry window and cancel this timer as soon as the phrase matches.
      setRetryListening(true);
      if (failTimerRef.current) return;
      const attemptedProgressIdx = initialProgressIdx;
      failTimerRef.current = setTimeout(() => {
        failTimerRef.current = null;
        if (gameStateRef.current !== 'recording') return;
        const idx = userSpeechProgressIdxRef.current;
        if (idx !== attemptedProgressIdx) return;
        if (idx >= currentSequenceRef.current.length) return;
        const expectedWord = currentSequenceRef.current[idx];
        if (expectedWord) {
          playSound('fail');
          saveProgress(recordWordStruggled(loadProgress(), 'echo-recorder', expectedWord.text));
          setWordStudyStats((previous) => ({
            ...previous,
            [expectedWord.text]: {
              spoken: previous[expectedWord.text]?.spoken || 0,
              struggled: (previous[expectedWord.text]?.struggled || 0) + 1,
            },
          }));
          setStats(prev => {
            const nextFailed = { ...prev.failedWords };
            nextFailed[expectedWord.text] = (nextFailed[expectedWord.text] || 0) + 1;
            return { ...prev, totalAttempts: prev.totalAttempts + 1, failedWords: nextFailed };
          });
          const remainingLives = livesRef.current - 1;
          livesRef.current = remainingLives;
          setLives(remainingLives);
          setTryAgainTip({
            text: expectedWord.text,
            translation: expectedWord.translation,
            phonetic: expectedWord.phonetic,
          });
          setRecentTranscript('');
          setRetryListening(false);
          lastTranscriptRef.current = '';
          if (remainingLives <= 0) {
            // Out of hearts - end the endless run.
            window.scrollTo({ top: 0, behavior: 'smooth' });
            gameStateRef.current = 'victory';
            setGameState('victory');
          } else {
            // Still have hearts: replay the chain before the next attempt so
            // the transition and retry are both clear to the child.
            setUserSpeechProgressIdx(0);
            userSpeechProgressIdxRef.current = 0;
            speakSequence(currentSequenceRef.current);
          }
        }
      }, RETRY_GRACE_MS);
    }
  }, [advanceToNextWord]);

  const { status, start, stop } = useSpeechRecognition(handleTranscript);
  const isListening = status.status === 'listening';

  useEffect(() => {
    if (gameState === 'recording' && !paused) {
      start();
    } else {
      stop();
      cancelFailTimer();
      setRetryListening(false);
    }
    return cancelFailTimer;
  }, [gameState, paused, start, stop]);

  useEffect(() => stop, [stop]);

  const [showListening, setShowListening] = useState(false);

  useEffect(() => {
    if (isListening) {
      setShowListening(true);
      if (showListeningTimerRef.current) clearTimeout(showListeningTimerRef.current);
    } else {
      showListeningTimerRef.current = setTimeout(() => {
        setShowListening(false);
      }, 300);
    }
    return () => {
      if (showListeningTimerRef.current) clearTimeout(showListeningTimerRef.current);
    };
  }, [isListening]);

  const handleNextChainStep = () => {
    setUserSpeechProgressIdx(0);
    setRecentTranscript('');
    setTryAgainTip(null);
    setRetryListening(false);
    setRoundComplete(false);
    const updatedSequence = extendChain(currentSequence, wordPool);
    setCurrentSequence(updatedSequence);
    speakSequence(updatedSequence);
  };

  const replayCurrentSequence = () => {
    setUserSpeechProgressIdx(0);
    setRecentTranscript('');
    setTryAgainTip(null);
    setRetryListening(false);
    setRoundComplete(false);
    lastTranscriptRef.current = '';
    speakSequence(currentSequence);
  };

  const handleBackToHub = () => {
    cancelSequencePlayback();
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    if (stats.score > highScore) {
      onUpdateHighScore?.(stats.score);
    }
    onBackToHub();
  };

  const togglePause = () => {
    const nextPaused = !pausedRef.current;
    pausedRef.current = nextPaused;
    setPaused(nextPaused);
    if (nextPaused) {
      window.speechSynthesis?.pause();
      stop();
      cancelFailTimer();
    } else {
      window.speechSynthesis?.resume();
      if (gameState === 'recording') start();
    }
  };

  useEffect(() => {
    if (stats.score > highScore) {
      onUpdateHighScore?.(stats.score);
    }
    saveProgress(recordHighScore(loadProgress(), 'echo-recorder', stats.score));
  }, [stats.score, highScore, onUpdateHighScore]);

  useEffect(() => () => {
    cancelSequencePlayback();
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
  }, [cancelSequencePlayback]);

  if (gameState === 'start') {
    return (
      <section className="max-w-md mx-auto py-4 px-2">
        <BackToHubButton
        label={t('shared.backToHub')}
        onClick={handleBackToHub}
      />
        <GameSetupCard
          icon={<Headphones className="h-10 w-10 text-slate-900" />}
          title={strings.lobbyTitle}
          description={strings.subtitle}
          toneClass="bg-violet-50"
          iconClass="bg-yellow-300"
          shadowClass="bubble-shadow-purple"
        >
          <div className="rounded-2xl border-4 border-slate-900 bg-white p-3">
            <OptionPicker<EchoTheme>
              label={strings.chooseTheme}
              options={ECHO_THEMES.map((item) => ({ id: item.id, label: t(item.labelKey) }))}
              selected={theme}
              onSelect={setTheme}
            />
            <EchoThemePreview theme={activeTheme} />
          </div>

          <div className="rounded-2xl border-4 border-slate-900 bg-white p-3 text-left space-y-2">
            <p className="text-xs font-black text-rose-500 uppercase tracking-widest ml-1">{strings.howToPlay}</p>
            <p className="text-sm font-black text-slate-900">{strings.lobbyIntro}</p>
            <ol className="space-y-1.5 text-xs font-bold text-slate-600">
              {[strings.lobbyStepOne, strings.lobbyStepTwo, strings.lobbyStepThree].map((step, index) => (
                <li key={step} className="flex gap-2">
                  <span className="font-black text-violet-600">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
              <li className="flex gap-2">
                <span className="font-black text-rose-500">♥</span>
                <span>{t('echo.gameOverDesc')}</span>
              </li>
            </ol>
          </div>

          <WordSetPicker
            legend={t('shared.chooseWordSet')}
            myWordsLabel={t('shared.myWords')}
            activeCategoryId={activeCategory.id}
            customWords={customWords}
            onSelect={setActiveCategory}
          />

          <ListenAndLearnSection
            words={
              activeCategory.id === 'custom'
                ? (customWords.length > 0 ? customWords : BUILTIN_CATEGORIES[0].words)
                : activeCategory.words
            }
          />

          {onAddCustomWord && onDeleteCustomWord && onClearCustomWords && (
            <CustomWordsSection
              customWords={customWords}
              onAddWord={onAddCustomWord}
              onDeleteWord={onDeleteCustomWord}
              onClearAll={onClearCustomWords}
            />
          )}

          <button
            type="button"
            onClick={() => { playSound('click'); startGame(); }}
            className="w-full py-3 bg-emerald-400 hover:bg-emerald-500 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {strings.start} <ArrowRight className="h-4 w-4 stroke-[3]" />
          </button>
        </GameSetupCard>
      </section>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="max-w-md mx-auto py-4 px-2">
        <BackToHubButton
        label={t('shared.backToHub')}
        onClick={handleBackToHub}
      />
        <GameResultCard
          title={t('echo.gameOverTitle')}
          description={t('echo.gameOverDesc')}
          scoreLabel={strings.finalScore}
          score={stats.score}
          bestLabel={strings.best}
          best={Math.max(highScore, stats.score)}
          wordStats={wordStudyStats}
          words={wordPool.map((item) => ({ word: item.text, translation: item.translation, translationRu: item.translation }))}
          replayLabel={t('echo.playAgain')}
          onReplay={() => { playSound('click'); startGame(); }}
          icon={<span className="block text-5xl">💔🎧</span>}
          summary={(
            <div className="grid grid-cols-1 gap-2 rounded-2xl border-4 border-slate-900 bg-white p-3 text-[10px] font-black uppercase text-slate-700 sm:grid-cols-3">
              <p>{strings.longestChainLabel}<span className="block text-lg text-slate-900">{stats.longestChain}</span></p>
              <p>{strings.totalAttemptsLabel}<span className="block text-lg text-slate-900">{stats.totalAttempts}</span></p>
              <p>{strings.correctRoundsLabel}<span className="block text-lg text-emerald-700">{stats.correctRounds}</span></p>
            </div>
          )}
          toneClass="bg-yellow-50"
          shadowClass="bubble-shadow-amber"
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 rounded-[2.5rem] p-3 sm:p-5 transition-colors duration-500 ${activeTheme.gameClass}`}>
      <BackToHubButton
        label={t('shared.backToHub')}
        onClick={handleBackToHub}
      />

      <GameHeader
        icon={<Brain className="h-5 w-5 text-slate-900" />}
        title={strings.title}
        subtitle={t(`wordSets.${activeCategory.id}`)}
        stats={[
          { label: strings.score, value: stats.score, icon: <Star className="h-3.5 w-3.5 text-amber-500" />, tone: 'amber' },
          { label: strings.best, value: Math.max(highScore, stats.score), icon: <Trophy className="h-3.5 w-3.5 text-emerald-600" />, tone: 'emerald' },
        ]}
        action={
            <button
              type="button"
              onClick={() => { playSound('click'); setSoundEnabled(!soundEnabled); }}
              className={`rounded-2xl border-4 border-slate-900 p-2.5 shadow-[3px_3px_0_0_rgba(15,23,42,1)] ${soundEnabled ? 'bg-white text-slate-900' : 'bg-slate-200 text-slate-500'}`}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
        }
      />

      <PauseButton paused={paused} onToggle={togglePause} />

      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${activeTheme.accentClass}`}>
        <div className="rounded-xl border-4 border-slate-900 bg-amber-100 px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-900">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{strings.currentChain}</p>
          <p className="mt-1 text-base font-black text-slate-900">{currentSequence.length} {strings.words}</p>
        </div>
        <div className="rounded-xl border-4 border-slate-900 bg-rose-100 px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-900">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{t('echo.lives')}</p>
          <p className="mt-1 flex items-center justify-center gap-1" aria-label={`${t('echo.lives')}: ${lives}`}>
            {Array.from({ length: MAX_LIVES }).map((_, idx) => (
              <Heart
                key={idx}
                className={`h-4 w-4 ${idx < lives ? 'fill-rose-500 text-rose-600' : 'fill-slate-200 text-slate-300'}`}
              />
            ))}
          </p>
        </div>
        <div className="rounded-xl border-4 border-slate-900 bg-sky-100 px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-900">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{strings.bestChain}</p>
          <p className="mt-1 text-base font-black text-slate-900">{stats.longestChain} {strings.words}</p>
        </div>
      </div>

      {roundComplete && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-4 border-slate-900 bg-emerald-300 px-4 py-3 text-center shadow-[4px_4px_0_0_rgba(15,23,42,1)]"
        >
          <p className="text-sm font-black uppercase text-slate-900">{strings.perfectMatch}</p>
          <p className="mt-1 text-xs font-bold text-slate-700">{strings.perfectDesc}</p>
        </motion.div>
      )}

      {retryListening && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-4 border-amber-600 bg-amber-100 px-4 py-3 text-center shadow-[4px_4px_0_0_rgba(217,119,6,1)]"
        >
          <p className="text-sm font-black uppercase text-amber-900">{strings.tryAgain}</p>
          <p className="mt-1 text-xs font-bold text-amber-800">{strings.retryListening}</p>
        </motion.div>
      )}

      <div className={`relative rounded-[2rem] border-8 border-slate-900 ${activeTheme.panelClass} p-6 shadow-[10px_10px_0_0_rgba(15,23,42,1)] space-y-4`}>
        {paused && (
          <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[1.5rem] bg-slate-900/75">
            <span className="rounded-xl border-4 border-slate-900 bg-orange-400 px-5 py-3 text-sm font-black uppercase text-slate-900">{t('shared.paused')}</span>
          </div>
        )}
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
            const wasRepeated = userSpeechProgressIdx > idx;
            const showsWord = gameState === 'playback' || wasRepeated;
            const isCurrentTarget = userSpeechProgressIdx === idx && gameState === 'recording';

            let cardBg = 'bg-white';
            let cardBorder = 'border-slate-900';
            if (isTTSActive) {
              cardBg = 'bg-indigo-600';
              cardBorder = 'border-slate-900 shadow-[4px_4px_0_0_rgba(15,23,42,1)] scale-105';
            } else if (wasRepeated) {
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
                aria-label={`${strings.memoryCard} #${idx + 1}`}
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
                  {wasRepeated && <Check className="w-4 h-4 text-emerald-700" />}
                  {isCurrentTarget && <span className="text-[8px] font-black uppercase tracking-wider text-indigo-700 animate-pulse">{strings.speakLabel}</span>}
                </div>
                <div className="text-center space-y-1">
                  {showsWord ? (
                    <>
                      {word.emoji && <div className="text-xl">{word.emoji}</div>}
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
                  {showsWord ? (
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
          {tryAgainTip.phonetic && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black bg-white border-2 border-rose-600 px-2.5 py-1 shadow-[2px_2px_0_0_rgba(225,29,72,1)]">{strings.phonetic}: {tryAgainTip.phonetic}</span>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-[2rem] border-8 border-slate-900 bg-white p-4 shadow-[6px_6px_0_0_rgba(15,23,42,1)] flex flex-col justify-between min-h-[140px]">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-indigo-600" /> {strings.voiceFeed}
            </h4>
            <div className="rounded-2xl border-4 border-slate-900 bg-slate-50 p-4 min-h-[60px] flex flex-col items-center justify-center text-center relative overflow-hidden">
              {gameState === 'recording' && showListening ? (
                <div className="space-y-1 w-full flex flex-col items-center">
                  <div className="flex items-end gap-1.5 h-6">
                    <motion.span animate={{ height: [6, 16, 6] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-1 bg-yellow-400 border border-slate-900" />
                    <motion.span animate={{ height: [8, 24, 8] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-yellow-400 border border-slate-900" />
                    <motion.span animate={{ height: [5, 12, 5] }} transition={{ repeat: Infinity, duration: 0.3 }} className="w-1 bg-yellow-400 border border-slate-900" />
                    <motion.span animate={{ height: [10, 20, 10] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-yellow-400 border border-slate-900" />
                    <motion.span animate={{ height: [4, 14, 4] }} transition={{ repeat: Infinity, duration: 0.45 }} className="w-1 bg-yellow-400 border border-slate-900" />
                  </div>
                  <span className="text-[8px] uppercase font-black text-slate-500 animate-pulse mt-1">{strings.sayNext}: #{userSpeechProgressIdx + 1}</span>
                </div>
              ) : (
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest" role="status" aria-live="polite">
                  {gameState === 'recording' && status.status === 'error' ? status.message : strings.idle}
                </p>
              )}
            </div>
          </div>
          <div className="border-t border-slate-200 pt-2 mt-2 flex items-center justify-between text-[9px] font-black uppercase text-slate-400">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${showListening ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {showListening ? t('shared.micListening') : strings.muted}
            </span>
          </div>
        </div>

        <div
          className="md:col-span-2 rounded-[2rem] border-8 border-slate-900 bg-white p-4 shadow-[6px_6px_0_0_rgba(15,23,42,1)]"
          data-testid="echo-pronunciation-reference"
        >
          <div className="flex justify-between items-center mb-2.5">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
              <Brain className="w-3.5 h-3.5 text-indigo-600" /> {strings.pronRef}
            </h4>
          </div>
          <p className="mb-2 text-[10px] font-bold leading-snug text-slate-500">
            {strings.memoryHidden}
          </p>
          <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
            {wordPool.map((word, idx) => (
              <div
                key={`${word.text}-${idx}`}
                className="flex min-h-16 select-none flex-col justify-between rounded-xl border-2 border-slate-200 bg-slate-50/50 p-2"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-black tracking-tight text-slate-800">
                    {word.emoji ? `${word.emoji} ` : ''}&quot;{word.text}&quot;
                  </span>
                  <button
                    type="button"
                    onClick={() => speakWord(word.text, 'en')}
                    aria-label={`${t('shared.hearWord')} ${word.text}`}
                    className="shrink-0 cursor-pointer rounded-lg border-2 border-slate-300 bg-white p-1 hover:bg-yellow-100"
                  >
                    <Volume2 className="h-3 w-3 text-indigo-600" />
                  </button>
                </div>
                <div className="mt-1 flex w-full items-center justify-between gap-1">
                  <span className="truncate text-[9px] font-extrabold text-slate-500">{word.translation}</span>
                  {word.phonetic && (
                    <span className="shrink-0 rounded bg-indigo-50 px-1 font-mono text-[8px] font-bold text-indigo-600">
                      {word.phonetic}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

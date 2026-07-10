import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Volume2,
  X,
  CheckCircle,
  AlertCircle,
  Car,
  Mic,
  Trophy,
  BookOpen,
  ArrowRight,
  Sparkle,
  Gamepad2,
  Star
} from 'lucide-react';

import { GameState, WordData, WordCategory, Lane, VoiceStatus, TrackStyle } from './types';
import { BUILTIN_CATEGORIES } from './data';
import { GameCanvas } from './components/GameCanvas';
import { AudioVisualizer } from './components/AudioVisualizer';
import { BubblePopperGame } from './components/BubblePopperGame';
import { BossFightGame } from './components/BossFightGame';
import { WordLadderGame } from './components/WordLadderGame';
import { SkateWordGame } from './components/SkateWordGame';
import { AsteWordGame } from './components/AsteWordGame';
import { TreasureHunterGame } from './components/TreasureHunterGame';
import { MagicWizardGame } from './components/MagicWizardGame';
import { CustomWordsSection, ListenAndLearnSection, OptionPicker, PauseButton, WordSetPicker } from './components/GameUi';
import { ProgressView } from './components/ProgressView';
import SentenceBirdGame from './components/SentenceBirdGame';
import EchoRecorderGame from './components/EchoRecorderGame';
import {
  createInitialRacerMovementState,
  speakWord,
  speakSound,
  matchesWord,
  isSpeechSynthesisActive,
  updateRacerMovement,
} from './voice/engine';
import { useUiLanguage } from './uiLanguage';
import { loadProgress, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, recordHighScore } from './progress';

export default function App() {
  const { language, setLanguage, t } = useUiLanguage();
  const [currentView, setCurrentView] = useState<'HUB' | 'VOICE_RACER' | 'BUBBLE_POPPER' | 'BOSS_FIGHT' | 'WORD_LADDER' | 'SKATE_WORD' | 'ASTE_WORD' | 'TREASURE_HUNTER' | 'SENTENCE_BIRD' | 'ECHO_RECORDER' | 'MAGIC_WIZARD' | 'PROGRESS'>('HUB');

  // Game states
  const [gameState, setGameState] = useState<GameState>('START_SCREEN');
  const [trackStyle, setTrackStyle] = useState<TrackStyle>('forest');
  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [customWords, setCustomWords] = useState<WordData[]>(() => {
    try {
      const saved = localStorage.getItem('voice_racer_custom_words');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('voice_racer_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [bubbleHighScore, setBubbleHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bubble_popper_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateBubbleHighScore = (newScore: number) => {
    setBubbleHighScore(newScore);
    localStorage.setItem('bubble_popper_highscore', newScore.toString());
    saveProgress(recordHighScore(loadProgress(), 'bubble-popper', newScore));
  };

  const [bossFightHighScore, setBossFightHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('boss_fight_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateBossFightHighScore = (newScore: number) => {
    setBossFightHighScore(newScore);
    localStorage.setItem('boss_fight_highscore', newScore.toString());
    saveProgress(recordHighScore(loadProgress(), 'boss-fight', newScore));
  };

  const [wordLadderHighScore, setWordLadderHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('word_ladder_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateWordLadderHighScore = (newScore: number) => {
    setWordLadderHighScore(newScore);
    localStorage.setItem('word_ladder_highscore', newScore.toString());
    saveProgress(recordHighScore(loadProgress(), 'word-ladder', newScore));
  };

  const [skateWordHighScore, setSkateWordHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('skate_word_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateSkateWordHighScore = (newScore: number) => {
    setSkateWordHighScore(newScore);
    localStorage.setItem('skate_word_highscore', newScore.toString());
    saveProgress(recordHighScore(loadProgress(), 'skate-word', newScore));
  };

  const [asteWordHighScore, setAsteWordHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aste_word_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateAsteWordHighScore = (newScore: number) => {
    setAsteWordHighScore(newScore);
    localStorage.setItem('aste_word_highscore', newScore.toString());
    saveProgress(recordHighScore(loadProgress(), 'aste-word', newScore));
  };

  const [treasureHunterHighScore, setTreasureHunterHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('treasure_hunter_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [sentenceBirdHighScore, setSentenceBirdHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sentence_bird_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [echoRecorderHighScore, setEchoRecorderHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('echo_recorder_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [magicWizardHighScore, setMagicWizardHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('magic_wizard_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateTreasureHunterHighScore = (newScore: number) => {
    setTreasureHunterHighScore(newScore);
    localStorage.setItem('treasure_hunter_highscore', newScore.toString());
    saveProgress(recordHighScore(loadProgress(), 'treasure-hunter', newScore));
  };

  const handleUpdateSentenceBirdHighScore = (newScore: number) => {
    setSentenceBirdHighScore(newScore);
    localStorage.setItem('sentence_bird_highscore', newScore.toString());
    saveProgress(recordHighScore(loadProgress(), 'sentence-bird', newScore));
  };

  const handleUpdateEchoRecorderHighScore = (newScore: number) => {
    setEchoRecorderHighScore(newScore);
    localStorage.setItem('echo_recorder_highscore', newScore.toString());
    saveProgress(recordHighScore(loadProgress(), 'echo-recorder', newScore));
  };

  const handleUpdateMagicWizardHighScore = (newScore: number) => {
    setMagicWizardHighScore(newScore);
    localStorage.setItem('magic_wizard_highscore', newScore.toString());
    saveProgress(recordHighScore(loadProgress(), 'magic-wizard', newScore));
  };

  const games = [
    {
      id: "voice-racer",
      title: t('games.voiceRacer.title'),
      description: t('games.voiceRacer.description'),
      icon: "🚗",
      accent: "bg-emerald-400",
      record: highScore,
      unlocked: true,
    },
    {
      id: "bubble-popper",
      title: t('games.bubblePopper.title'),
      description: t('games.bubblePopper.description'),
      icon: "🫧",
      accent: "bg-sky-450",
      record: bubbleHighScore,
      unlocked: true,
    },
    {
      id: "boss-fight",
      title: t('games.bossFight.title'),
      description: t('games.bossFight.description'),
      icon: "⚔️",
      accent: "bg-rose-400",
      record: bossFightHighScore,
      unlocked: true,
    },
    {
      id: "word-ladder",
      title: t('games.wordLadder.title'),
      description: t('games.wordLadder.description'),
      icon: "🚀",
      accent: "bg-indigo-400",
      record: wordLadderHighScore,
      unlocked: true,
    },
    {
      id: "skate-word",
      title: language === 'en' ? 'SkateWord' : 'СкейтВорд',
      description: language === 'en' 
        ? 'Jump over road obstacles by saying the approaching words out loud! 🛹' 
        : 'Перепрыгивай дорожные барьеры на скейте, произнося слова вслух! 🛹',
      icon: "🛹",
      accent: "bg-rose-400",
      record: skateWordHighScore,
      unlocked: true,
    },
    {
      id: "aste-word",
      title: language === 'en' ? 'AsteWord Destroyer' : 'АстеВорд Разрушитель',
      description: language === 'en' 
        ? 'Shoot laser beams at incoming asteroids by saying the words written on them!' 
        : 'Сбивай лазером летящие астероиды, произнося написанные на них слова!',
      icon: "☄️",
      accent: "bg-indigo-500",
      record: asteWordHighScore,
      unlocked: true,
    },
    {
      id: "treasure-hunter",
      title: language === 'en' ? 'Voice Treasure Hunter' : 'Поиск сокровищ',
      description: language === 'en'
        ? 'Navigate the submarine deeper to collect shiny treasure chests by saying the English words!'
        : 'Управляй подводной лодкой, собирая сияющие сундуки с сокровищами при произношении английских слов!',
      icon: "🐳",
      accent: "bg-cyan-400",
      record: treasureHunterHighScore,
      unlocked: true,
    },
    {
      id: "sentence-bird",
      title: t('games.sentenceBird.title'),
      description: t('games.sentenceBird.description'),
      icon: "🐦",
      accent: "bg-cyan-400",
      record: sentenceBirdHighScore,
      unlocked: true,
    },
    {
      id: "echo-recorder",
      title: t('games.echoRecorder.title'),
      description: t('games.echoRecorder.description'),
      icon: "🎤",
      accent: "bg-amber-400",
      record: echoRecorderHighScore,
      unlocked: true,
    },
    {
      id: "magic-wizard",
      title: language === 'en' ? 'Magic Wizard' : 'Магический Волшебник',
      description: language === 'en' 
        ? 'Defeat dark forces by casting elemental spells through correct pronunciation!' 
        : 'Побеждай темные силы, кастуя стихийные заклинания правильным произношением!',
      icon: "🧙‍♂️",
      accent: "bg-violet-400",
      record: magicWizardHighScore,
      unlocked: true,
    },
  ];

  const totalRecordSum = games.reduce((acc, g) => acc + g.record, 0);
  
  const [level, setLevel] = useState(1);
  const [bubbleScore, setBubbleScore] = useState(0);
  const [bubbleLevel, setBubbleLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [playerLane, setPlayerLane] = useState<Lane>(1); // 1 = Center
  const [racerMovementState, setRacerMovementState] = useState(() =>
    createInitialRacerMovementState(1),
  );
  const [vocabIndex, setVocabIndex] = useState(0);
  const [lastHeardTranscript, setLastHeardTranscript] = useState('');
  const [wordMatchFlash, setWordMatchFlash] = useState(false);
  const [struggleCounter, setStruggleCounter] = useState<Record<string, number>>({});
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>({
    status: 'idle',
    message: 'Click Start to turn on the microphone.',
  });

  // Bullet time states
  const [isBulletTime, setIsBulletTime] = useState(false);
  const [bulletTimeProgress, setBulletTimeProgress] = useState(100);
  const [racerPaused, setRacerPaused] = useState(false);

  // Current level words tracking
  const [currentLaneWords, setCurrentLaneWords] = useState<Record<Lane, string>>({
    0: '',
    1: '',
    2: '',
  });

  // Keep references for voice thread to prevent closure captures stale states
  const gameStateRef = useRef(gameState);
  const currentLaneRef = useRef(playerLane);
  const currentLaneWordsRef = useRef(currentLaneWords);
  const isBulletTimeRef = useRef(isBulletTime);
  const vocabIndexRef = useRef(vocabIndex);
  const racerPausedRef = useRef(racerPaused);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    currentLaneRef.current = playerLane;
  }, [playerLane]);

  useEffect(() => {
    currentLaneWordsRef.current = currentLaneWords;
  }, [currentLaneWords]);

  useEffect(() => {
    isBulletTimeRef.current = isBulletTime;
  }, [isBulletTime]);

  useEffect(() => {
    vocabIndexRef.current = vocabIndex;
  }, [vocabIndex]);

  useEffect(() => {
    racerPausedRef.current = racerPaused;
  }, [racerPaused]);

  // Speech Recognition hook
  const recognitionRef = useRef<any>(null);

  // Vocabulary arrays matching selection (either standard categories or user's custom lists)
  const getSelectedVocabularyList = useCallback(() => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0 ? customWords : BUILTIN_CATEGORIES[0].words;
    }
    return activeCategory.words;
  }, [activeCategory, customWords]);

  // Set up the approach of an obstacle -> Slow-motion bullet-time triggers!
  const handleApproachObstacle = useCallback((currentLane: Lane) => {
    setIsBulletTime(true);
    setBulletTimeProgress(100);
    
    const vocab = getSelectedVocabularyList();
    if (vocab.length === 0) return;

    // Pick 2 consecutive words from current vocabulary array using vocabIndexRef
    const idx = vocabIndexRef.current;
    const firstWord = vocab[idx % vocab.length].word;
    const secondWord = vocab[(idx + 1) % vocab.length].word;
    
    setVocabIndex(prev => prev + 2);

    // Place words strictly on opposite lanes (so player has options to swerve)
    const newWords: Record<Lane, string> = {
      0: currentLane === 0 ? '' : firstWord,
      1: currentLane === 1 ? '' : (currentLane === 0 ? firstWord : secondWord),
      2: currentLane === 2 ? '' : secondWord,
    };

    setCurrentLaneWords(newWords);
  }, [getSelectedVocabularyList]);

  // Perform the lane change dynamically
  const performLaneShift = useCallback((newLane: Lane) => {
    setRacerMovementState((prev) => updateRacerMovement(prev, newLane, Date.now(), 180));
    setStruggleCounter({}); // Reset struggle help on any shift!
  }, []);

  useEffect(() => {
    setPlayerLane(racerMovementState.lane);
  }, [racerMovementState.lane]);

  useEffect(() => {
    if (racerMovementState.pendingLane === null) return;
    const tick = window.setInterval(() => {
      setRacerMovementState((prev) => updateRacerMovement(prev, null, Date.now(), 180));
    }, 50);
    return () => window.clearInterval(tick);
  }, [racerMovementState.pendingLane]);

  // Trigger words initialize on playing start
  useEffect(() => {
    if (gameState === 'PLAYING') {
      setCurrentLaneWords({
        0: '',
        1: '',
        2: '',
      });
      setVocabIndex(0);
      setIsBulletTime(false);
    }
  }, [gameState]);

  // Setup Web Speech API Continuous Listener
  const startVoiceEngine = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus({
        status: 'unsupported',
        message: 'Google Chrome Voice API not detected. Please play inside Google Chrome!',
      });
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setVoiceStatus({
          status: 'listening',
          message: 'Voice engine live! Speak the English words aloud!',
        });
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setVoiceStatus({
            status: 'error',
            message: 'Microphone access block. Please allow mic in your browser address bar!',
          });
        } else {
          console.warn('Speech engine warning:', e.error);
        }
      };

      rec.onend = () => {
        // Automatically restart speech loop to keep continuous practice active,
        // unless the race is paused (then we keep the mic off until resume).
        if (gameStateRef.current === 'PLAYING' && !racerPausedRef.current) {
          try {
            rec.start();
          } catch {
            // avoid multiple starts collisions
          }
        } else {
          setVoiceStatus({
            status: 'idle',
            message: 'Engine stopped.',
          });
        }
      };

      rec.onresult = (event: any) => {
        if (isSpeechSynthesisActive()) {
          return;
        }

        let textResult = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (typeof event.results[i][0].transcript === 'string') {
            textResult += event.results[i][0].transcript;
          }
        }
        
        if (textResult) {
          setLastHeardTranscript(textResult);
          evaluateVoiceTrigger(textResult);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error('Failed to start Voice engine:', e);
    }
  }, []);

  // Evaluate if spoken transcript matches target adjacent lane words
  const evaluateVoiceTrigger = (spokenText: string) => {
    if (gameStateRef.current !== 'PLAYING') return;
    if (racerPausedRef.current) return;
    if (!isBulletTimeRef.current) return;

    const activeWords = currentLaneWordsRef.current;
    const laneKeys = Object.keys(activeWords).map(Number) as Lane[];
    
    for (const lane of laneKeys) {
      const target = activeWords[lane];
      if (!target) continue;

      if (matchesWord(spokenText, target, true)) {
        const matchedLane = lane;
        
        performLaneShift(matchedLane);
        setIsBulletTime(false);
        setCurrentLaneWords({0: '', 1: '', 2: ''});
        
        setScore(prev => prev + 15);
        setWordMatchFlash(true);
        setTimeout(() => setWordMatchFlash(false), 900);
        
        setWordStudyStats(prev => ({
          ...prev,
          [target]: {
            spoken: (prev[target]?.spoken || 0) + 1,
            struggled: prev[target]?.struggled || 0
          }
        }));
        saveProgress(recordWordSpoken(loadProgress(), 'voice-racer', target));

        speakSound.playAccelerate();
        setLastHeardTranscript('');
        break;
      }
    }
  };

  // High score checker & Levels up
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('voice_racer_highscore', score.toString());
      saveProgress(recordHighScore(loadProgress(), 'voice-racer', score));
    }
    
    // Level Up Progression calculation: Every 12 successful dodges (180 points)
    const calculatedLevel = Math.min(5, Math.floor(score / 185) + 1);
    if (calculatedLevel > level) {
      setLevel(calculatedLevel);
      speakSound.playSuccess();
    }
  }, [score, highScore, level]);

  // Custom Word Management triggers
  const handleAddNewWord = (word: string, translation: string) => {
    const freshWord: WordData = {
      word,
      translation,
      speakCount: 0,
      struggleCount: 0,
    };
    const updated = [...customWords, freshWord];
    setCustomWords(updated);
    localStorage.setItem('voice_racer_custom_words', JSON.stringify(updated));
  };

  const handleDeleteWord = (index: number) => {
    const updated = customWords.filter((_, idx) => idx !== index);
    setCustomWords(updated);
    localStorage.setItem('voice_racer_custom_words', JSON.stringify(updated));
  };

  const handleClearCustomWords = () => {
    setCustomWords([]);
    localStorage.removeItem('voice_racer_custom_words');
  };

  // Start the physical game loop
  const triggerPlayGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setLives(3);
    setLevel(1);
    setPlayerLane(1);
    setRacerMovementState(createInitialRacerMovementState(1));
    setVocabIndex(0);
    setLastHeardTranscript('');
    setWordStudyStats({});
    setRacerPaused(false);
    racerPausedRef.current = false;
    startVoiceEngine();
    saveProgress(recordSessionPlayed(loadProgress(), 'voice-racer'));
    speakSound.playCoin();
  };

  // Pause/resume the race: freeze the canvas + swerve timer and stop listening.
  const toggleRacerPause = () => {
    const next = !racerPausedRef.current;
    racerPausedRef.current = next;
    setRacerPaused(next);
    if (next) {
      // Stop the mic; onend will not auto-restart while paused.
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    } else {
      startVoiceEngine();
    }
  };

  // Bullet-time countdown timer loop
  useEffect(() => {
    if (!isBulletTime) {
      setBulletTimeProgress(100);
      return;
    }
    if (racerPaused) return; // freeze the swerve countdown while paused

    const maxInputTime = Math.max(2200, 5500 - level * 750);
    const startTimeStamp = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeStamp;
      const progress = Math.max(0, 100 - (elapsed / maxInputTime) * 100);
      setBulletTimeProgress(progress);

      if (elapsed >= maxInputTime) {
        clearInterval(interval);
        handleCarCollision();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isBulletTime, level, racerPaused]);

  // Collision damage event triggered by physical canvas detection or timeout
  const handleCarCollision = () => {
    if (lives <= 0 || gameState === 'GAME_OVER') return;
    speakSound.playCrash();
    
    setIsBulletTime(false);
    setCurrentLaneWords({
      0: '',
      1: '',
      2: '',
    });
    
    setLives(prev => {
      const remaining = prev - 1;
      if (remaining <= 0) {
        setGameState('GAME_OVER');
        if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        }
        return 0;
      } else {
        return remaining;
      }
    });
  };

  // Avoid block successfully
  const handleAvoidObstacle = (id: string) => {
    setScore(prev => prev + 15);
  };

  // Assist child pronunciation with quick vocal synthesis helper
  const triggerTTSHelp = (word: string) => {
    speakWord(word);
    setStruggleCounter(prev => ({
      ...prev,
      [word]: (prev[word] || 0) + 1
    }));
    setWordStudyStats(prev => ({
      ...prev,
      [word]: {
        spoken: prev[word]?.spoken || 0,
        struggled: (prev[word]?.struggled || 0) + 1
      }
    }));
    saveProgress(recordWordStruggled(loadProgress(), 'voice-racer', word));
  };

  // Clean elements on exit
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-sky-200 via-amber-100 to-amber-200 text-slate-900 flex flex-col justify-between font-sans transition-all duration-300 relative overflow-hidden select-none pb-4 ${
        wordMatchFlash ? 'bg-emerald-300/80' : ''
      }`}
    >
      {/* Decorative Floating Fluffy Cartoon Clouds */}
      <div className="absolute top-10 left-[8%] w-24 h-10 bg-white rounded-full opacity-60 blur-[1px] pointer-events-none animate-pulse" />
      <div className="absolute top-28 right-[10%] w-32 h-12 bg-white rounded-full opacity-60 blur-[1px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-20 left-[4%] w-28 h-10 bg-white rounded-full opacity-40 blur-[1px] pointer-events-none" />

      {/* HEADER BAR - hidden for the self-contained Sprint 2 games and Progress */}
      {currentView !== 'BOSS_FIGHT' && currentView !== 'WORD_LADDER' && currentView !== 'SKATE_WORD' && currentView !== 'ASTE_WORD' && currentView !== 'TREASURE_HUNTER' && currentView !== 'SENTENCE_BIRD' && currentView !== 'ECHO_RECORDER' && currentView !== 'MAGIC_WIZARD' && currentView !== 'PROGRESS' && (
      <header className="bg-yellow-400 border-b-8 border-slate-900 py-3.5 px-6 md:px-12 sticky top-0 z-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        {currentView === 'HUB' ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500 border-4 border-slate-900 flex items-center justify-center shadow-md animate-bounce">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl md:text-2xl font-black tracking-wider text-slate-900 uppercase drop-shadow-[0_2px_0_rgba(255,255,255,1)]">
                  {t('header.title')}
                </h1>
                <p className="text-[10px] text-purple-900 tracking-widest font-black uppercase bg-white/70 border-2 border-slate-900 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {t('header.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
                  aria-label={language === 'en' ? t('header.switchLabel') : t('header.switchLabel')}
                  className="bg-white border-4 border-slate-900 px-3 py-1.5 rounded-2xl text-slate-900 font-black text-xs uppercase tracking-wider shadow-md"
                >
                  {language === 'en' ? 'RU' : 'EN'}
                </button>
                <div className="bg-pink-100 border-4 border-slate-900 text-slate-900 px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-md hover:scale-105 transition-transform">
                  <Trophy className="w-5 h-5 text-yellow-600 fill-yellow-400 stroke-[2.5]" />
                  <span className="text-xs font-black">{t('header.totalRecord')}</span>
                  <span className="font-black text-sm text-yellow-700 font-mono tracking-tight">{totalRecordSum}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentView('PROGRESS')}
                  className="bg-purple-100 border-4 border-slate-900 text-slate-900 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-md hover:scale-105 transition-transform cursor-pointer"
                  aria-label={t('shared.openProgress')}
                >
                  <span className="text-sm">📊</span>
                  <span className="text-xs font-black uppercase tracking-wider">{t('shared.progress')}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  speakSound.playCoin();
                  if (recognitionRef.current) {
                    recognitionRef.current.onend = null;
                    recognitionRef.current.abort();
                  }
                  setCurrentView('HUB');
                }}
                className="bg-white hover:bg-slate-50 border-4 border-slate-900 px-3.5 py-1.5 rounded-2xl text-slate-900 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5 shadow-md uppercase tracking-wider animate-pulse"
                id="btn-back-to-hub-header"
              >
                ← {t('header.backToHub')}
              </button>
              <div className="w-10 h-10 rounded-xl bg-pink-500 border-4 border-slate-900 flex items-center justify-center shadow-md animate-bounce">
                <span className="text-xl" role="img" aria-label="game-icon">
                  {currentView === 'VOICE_RACER' ? '🚗' : currentView === 'ECHO_RECORDER' ? '🎤' : '🫧'}
                </span>
              </div>
              <div className="text-left">
                <h1 className="text-xs sm:text-sm md:text-base font-black tracking-wider text-slate-900 uppercase drop-shadow-[0_1px_0_rgba(255,255,255,1)] leading-none">
                  {currentView === 'VOICE_RACER' ? t('games.voiceRacer.title') : currentView === 'ECHO_RECORDER' ? t('games.echoRecorder.title') : t('games.bubblePopper.title')}
                </h1>
                <p className="text-[9px] text-purple-900 tracking-wider font-extrabold uppercase bg-white/70 border-2 border-slate-900 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                  {currentView === 'VOICE_RACER' ? `${t('header.level')} ${level}` : currentView === 'ECHO_RECORDER' ? t('games.echoRecorder.title') : `${t('header.level')} ${bubbleLevel}`}
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2">
              {/* CURRENT GAME SCORE */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'ru' : 'en')}
                aria-label={language === 'en' ? t('header.switchLabel') : t('header.switchLabel')}
                className="bg-white border-4 border-slate-900 text-slate-900 px-2.5 py-1 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-sm"
              >
                {language === 'en' ? 'RU' : 'EN'}
              </button>
              <div className="bg-pink-100 border-4 border-slate-900 text-slate-900 px-2.5 py-1 rounded-2xl flex items-center gap-1 border-dashed shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-600">{t('header.score')}</span>
                <span className="font-black text-xs text-pink-600 font-mono tracking-tight">
                  {currentView === 'VOICE_RACER' ? score : currentView === 'ECHO_RECORDER' ? echoRecorderHighScore : bubbleScore}
                </span>
              </div>

              {/* HIGH SCORE FOR THE GAME */}
              <div className="bg-amber-100 border-4 border-slate-900 text-slate-900 px-2.5 py-1 rounded-2xl flex items-center gap-1 shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-yellow-600 fill-yellow-400 stroke-[2.5]" />
                <span className="text-[10px] font-black uppercase text-slate-600">{t('header.best')}</span>
                <span className="font-black text-xs text-yellow-700 font-mono tracking-tight">
                  {currentView === 'VOICE_RACER' ? highScore : currentView === 'ECHO_RECORDER' ? echoRecorderHighScore : bubbleHighScore}
                </span>
              </div>
              
              {/* SUM OF ALL HIGH SCORES */}
              <div className="bg-purple-100 border-4 border-slate-900 text-slate-900 px-2.5 py-1 rounded-2xl flex items-center gap-1 shadow-md">
                <span className="text-[10px] font-black uppercase text-slate-600">{t('header.total')}</span>
                <span className="font-black text-xs text-purple-700 font-mono tracking-tight">
                  {totalRecordSum}
                </span>
              </div>
            </div>
          </>
        )}
      </header>
      )}

      {/* CORE DISPLAY WINDOW */}
      <main className="flex-grow p-4 md:p-8 max-w-4xl w-full mx-auto relative z-10">
        {currentView === 'HUB' ? (
          <div className="space-y-6 animate-scale-up animate-fade-in" id="game-selection-portal">
            {/* Playful Welcome Greeting */}
            <div className="text-center space-y-2">
              <div className="inline-flex gap-2 justify-center items-center mb-1">
                <div className="w-10 h-10 rounded-2xl bg-purple-500 border-4 border-slate-900 flex items-center justify-center animate-spin">
                  <span className="text-sm">⭐</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-yellow-400 border-4 border-slate-900 flex items-center justify-center animate-bounce">
                  <Mic className="w-6 h-6 text-slate-950 stroke-[3.5]" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-pink-500 border-4 border-slate-900 flex items-center justify-center animate-spin">
                  <Car className="w-5 h-5 text-white" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-wider text-slate-900 uppercase drop-shadow-[0_3px_0_rgba(255,255,255,1)]">
                {t('hub.title')}
              </h1>
              <p className="text-xs text-slate-700 font-extrabold max-w-md mx-auto leading-relaxed">
                {t('hub.subtitle')}
              </p>
            </div>

            {/* List of Game Rectangles */}
            <div className="space-y-4 max-w-3xl mx-auto">
              {games.map((g) => {
                const isColleague = g.id.startsWith('colleague');
                return (
                  <div
                    key={g.id}
                    className={`border-4 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                      isColleague
                        ? 'bg-slate-100 border-dashed border-slate-400 opacity-90'
                        : g.unlocked
                        ? 'bg-white border-slate-900 hover:translate-y-[-2px] hover:shadow-md bubble-shadow-pink col-active'
                        : 'bg-white/60 border-slate-300 opacity-80'
                    }`}
                    id={`arcade-card-${g.id}`}
                  >
                    {/* Left: Icon, Title & Description */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left flex-grow w-full">
                      <div
                        className={`w-14 h-14 rounded-2xl border-4 border-slate-950 ${
                          isColleague ? 'bg-slate-200 border-dashed border-slate-400' : g.accent
                        } flex items-center justify-center text-3xl shrink-0 ${
                          g.unlocked ? 'animate-bounce shadow-sm' : 'shadow-none'
                        }`}
                      >
                        {g.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h3 className={`text-base md:text-lg font-black uppercase tracking-wide ${
                            isColleague ? 'text-slate-500' : 'text-slate-950'
                          }`}>
                            {g.title}
                          </h3>
                          {!g.unlocked && (
                            <span className="bg-slate-300 text-slate-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-2 border-slate-300">
                              {t('hub.lockedBadge')} 🔒
                            </span>
                          )}
                        </div>
                        <p className={`text-xs leading-snug font-bold ${
                          isColleague ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {g.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Record Pocket and Action Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                      {/* Record Display */}
                      <div className={`border-4 px-3 py-1.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs w-full sm:w-auto ${
                        isColleague
                          ? 'bg-slate-200 border-slate-300 text-slate-500'
                          : 'bg-amber-100 border-slate-900 text-amber-900'
                      }`}>
                        <span>🏆 {t('hub.record')}</span>
                        <span className="font-mono text-sm tracking-tight">{g.record}</span>
                      </div>

                      {/* Action button */}
                      {g.unlocked ? (
                        <button
                          onClick={() => {
                            speakSound.playCoin();
                            if (g.id === 'voice-racer') {
                              setCurrentView('VOICE_RACER');
                              setGameState('START_SCREEN');
                            } else if (g.id === 'bubble-popper') {
                              setCurrentView('BUBBLE_POPPER');
                            } else if (g.id === 'boss-fight') {
                              setCurrentView('BOSS_FIGHT');
                            } else if (g.id === 'word-ladder') {
                              setCurrentView('WORD_LADDER');
                            } else if (g.id === 'skate-word') {
                              setCurrentView('SKATE_WORD');
                            } else if (g.id === 'aste-word') {
                              setCurrentView('ASTE_WORD');
                            } else if (g.id === 'treasure-hunter') {
                              setCurrentView('TREASURE_HUNTER');
                            } else if (g.id === 'sentence-bird') {
                              setCurrentView('SENTENCE_BIRD');
                            } else if (g.id === 'echo-recorder') {
                              setCurrentView('ECHO_RECORDER');
                            } else if (g.id === 'magic-wizard') {
                              setCurrentView('MAGIC_WIZARD');
                            }
                          }}
                          aria-label={g.id === 'sentence-bird' ? 'play sentence bird' : `${g.title} ${t('hub.playButton')}`}
                          className="w-full sm:w-32 py-2 bg-pink-500 hover:bg-pink-600 border-4 border-slate-900 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 uppercase tracking-wider transition-all select-none hover:scale-103 shadow-sm"
                          id={`btn-play-${g.id}`}
                        >
                          <Play className="w-3 h-3 fill-current stroke-[3.5]" /> {t('hub.playButton')} 🚀
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full sm:w-32 py-2 bg-slate-200 border-4 border-dashed border-slate-300 text-slate-400 font-black text-xs rounded-2xl cursor-not-allowed uppercase tracking-wider"
                        >
                          {t('hub.lockedBadge')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : currentView === 'VOICE_RACER' ? (
          <>
            {/* STATE A: GAME LOUNGE (KIDS BUBBLE THEMED INTERFACE) */}
            {gameState === 'START_SCREEN' && (
          <div className="max-w-md mx-auto py-4 px-2 flex flex-col items-center justify-center" id="voice-racer-arcade-lounge">
            
            {/* BIG BOUNCY BOX GREETINGS */}
            <div className="text-center mb-6 flex flex-col items-center animate-pulse">
              <div className="w-18 h-18 rounded-3xl bg-amber-400 border-4 border-slate-900 hover:rotate-12 transition-transform flex items-center justify-center shadow-lg mb-3">
                <Car className="w-10 h-10 text-slate-950 stroke-[3.5]" />
              </div>
              <h1 className="text-4xl font-black tracking-wider text-slate-900 uppercase drop-shadow-[0_3px_0_rgba(255,255,255,1)]">
                {t('games.voiceRacer.title')}
              </h1>
            </div>

            {/* MAIN ARCADE MENU CARD */}
            <div className="w-full bg-slate-50 rounded-4xl border-8 border-slate-900 p-6 space-y-5 bubble-shadow-purple">
              
              {/* Highway Theme Selection Mode */}
              <div className="space-y-2 text-left">
                <OptionPicker
                  label={t('shared.chooseRoadEnvironment')}
                  columns={2}
                  options={(['forest', 'night', 'desert', 'city'] as TrackStyle[]).map((style) => ({
                    id: style,
                    label: t(`themes.racer.${style}`),
                  }))}
                  selected={trackStyle}
                  onSelect={setTrackStyle}
                />

                {/* Mini-visual preview of selected highway theme */}
                <div className={`w-full h-24 rounded-2xl border-4 border-slate-900 relative overflow-hidden transition-all duration-300 flex items-center justify-center ${
                  trackStyle === 'forest' ? 'bg-gradient-to-b from-sky-300 to-emerald-400' :
                  trackStyle === 'night' ? 'bg-gradient-to-b from-slate-950 via-purple-950 to-indigo-900' :
                  trackStyle === 'desert' ? 'bg-gradient-to-b from-amber-200 via-orange-300 to-amber-500' :
                  'bg-gradient-to-b from-blue-950 via-purple-950 to-fuchsia-900'
                }`}>
                  {trackStyle === 'forest' && (
                    <>
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-emerald-500" />
                      <span className="absolute bottom-6 left-6 text-2xl animate-bounce">🌲</span>
                      <span className="absolute bottom-4 left-16 text-xl">🌸</span>
                      <span className="absolute bottom-5 right-8 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🌲</span>
                      <span className="absolute top-2 right-12 text-2xl animate-pulse">☀️</span>
                      {/* Mini moving road in the center */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-8 bg-slate-700 flex flex-col justify-between items-center py-1">
                        <div className="w-1 h-2 bg-yellow-400 animate-pulse" />
                        <div className="w-1 h-2 bg-yellow-400" />
                      </div>
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xl z-10 animate-bounce">🚗</span>
                    </>
                  )}
                  {trackStyle === 'night' && (
                    <>
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-indigo-950" />
                      <span className="absolute top-2 left-6 text-2xl animate-pulse">🌙</span>
                      <span className="absolute top-4 right-10 text-xs text-yellow-200 animate-ping">⭐</span>
                      <span className="absolute top-8 left-20 text-xs text-yellow-200 animate-pulse">⭐</span>
                      <span className="absolute bottom-5 left-10 text-xl">🛸</span>
                      <span className="absolute bottom-4 right-8 text-xl">🌌</span>
                      {/* Mini moving road */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-8 bg-slate-900 flex flex-col justify-between items-center py-1 border-x border-purple-500">
                        <div className="w-1 h-2 bg-purple-400 animate-pulse" />
                        <div className="w-1 h-2 bg-purple-400" />
                      </div>
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xl z-10 animate-bounce">🚀</span>
                    </>
                  )}
                  {trackStyle === 'desert' && (
                    <>
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-amber-600" />
                      <span className="absolute bottom-6 left-8 text-2xl animate-bounce">🌵</span>
                      <span className="absolute bottom-5 right-12 text-2xl">🌵</span>
                      <span className="absolute top-1 right-6 text-3xl animate-spin" style={{ animationDuration: '10s' }}>☀️</span>
                      <span className="absolute bottom-4 left-24 text-sm">🏜️</span>
                      {/* Mini moving road */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-8 bg-amber-900 flex flex-col justify-between items-center py-1">
                        <div className="w-1 h-2 bg-yellow-300 animate-pulse" />
                        <div className="w-1 h-2 bg-yellow-300" />
                      </div>
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xl z-10 animate-bounce">🐫</span>
                    </>
                  )}
                  {trackStyle === 'city' && (
                    <>
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-fuchsia-950" />
                      <span className="absolute bottom-8 left-4 text-2xl opacity-60">🏙️</span>
                      <span className="absolute bottom-8 right-6 text-2xl opacity-60">🏢</span>
                    <span className="absolute top-3 left-16 text-cyan-400 font-mono text-[10px] tracking-wider animate-pulse uppercase">{t('shared.neonGridActive')}</span>
                      {/* Mini moving road */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-8 bg-slate-950 flex flex-col justify-between items-center py-1 border-x border-cyan-400">
                        <div className="w-1 h-2 bg-cyan-400 animate-pulse" />
                        <div className="w-1 h-2 bg-cyan-400" />
                      </div>
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xl z-10 animate-bounce">🏎️</span>
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

              <ListenAndLearnSection words={activeCategory.id === 'custom' ? customWords : getSelectedVocabularyList()} />

              <CustomWordsSection
                customWords={customWords}
                onAddWord={handleAddNewWord}
                onDeleteWord={handleDeleteWord}
                onClearAll={handleClearCustomWords}
              />

              <button
                onClick={triggerPlayGame}
                className="w-full py-4 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 border-4 border-slate-900 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-102 active:translate-y-1.5 active:shadow-none bubble-shadow-green uppercase tracking-wide"
                id="btn-play-game-start"
              >
                <Play className="w-6 h-6 fill-current stroke-[3.5]" /> {t('shared.startHighwayRace')}
              </button>

            </div>

            {/* EXIT TO PORTAL BUTTON */}
            <button
              onClick={() => {
                speakSound.playCoin();
                setCurrentView('HUB');
              }}
              className="w-full mt-4 py-3.5 bg-purple-500 hover:bg-purple-600 border-4 border-slate-900 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:translate-y-1 active:shadow-none bubble-shadow-purple uppercase tracking-wider hover:scale-101 shadow-md"
              id="btn-quit-to-hub-start-screen"
            >
              🏯 EXIT TO GAMES PORTAL
            </button>

          </div>
        )}

        {/* STATE B: ACTIVE RACING GAME PLAYGROUND */}
        {gameState === 'PLAYING' && (
          <div className="w-full max-w-5xl mx-auto space-y-4 text-center" id="arcade-highway-centerage">
            
            {/* Play Score Header Info Strip */}
            <div className="flex items-center justify-between bg-yellow-300 border-4 border-slate-900 px-5 py-2.5 rounded-2xl shadow-md" id="game-minimal-header">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-ping" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
                  SAY WORD TO DODGE!
                </span>
              </div>
              
              <div className="text-xs font-black text-purple-900 uppercase tracking-wider bg-white border-2 border-slate-900 px-2.5 py-0.5 rounded-full">
                Topic: {activeCategory.name}
              </div>

              {/* Exit out button */}
              <button
                onClick={() => {
                  setGameState('START_SCREEN');
                  if (recognitionRef.current) {
                    recognitionRef.current.abort();
                  }
                }}
                className="bg-rose-500 hover:bg-rose-600 border-2 border-slate-950 px-3 py-1 rounded-xl text-white font-black text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                id="btn-quit-playing-state"
              >
                <X className="w-3.5 h-3.5 stroke-[3]" /> QUIT GAME
              </button>
            </div>

            <PauseButton
              paused={racerPaused}
              onToggle={toggleRacerPause}
              pauseLabel={t('shared.pause')}
              resumeLabel={t('shared.resume')}
              ariaPause="Pause the race"
              ariaResume="Resume the race"
            />

            {/* HIGHWAY PHYSICAL CANVAS */}
            <div className="relative h-[70vh] min-h-[460px] max-h-[760px] w-full border-8 border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
              <GameCanvas
                playerLane={playerLane}
                gameState={gameState}
                gameSpeed={Math.min(5.2, 2.5 + score * 0.0007)}
                onCollide={handleCarCollision}
                onAvoidObstacle={handleAvoidObstacle}
                lives={lives}
                isBulletTime={isBulletTime}
                paused={racerPaused}
                onApproach={handleApproachObstacle}
                score={score}
                level={level}
                trackStyle={trackStyle}
              />

              {/* Bullet-Time Obstacle Warning Prompt */}
              {isBulletTime && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[85%] bg-yellow-400 border-4 border-slate-900 px-4 py-3.5 rounded-3xl shadow-lg flex flex-col items-center gap-2 z-45 animate-bounce">
                  <span className="text-xs font-black tracking-widest text-slate-950 uppercase flex items-center gap-1">
                    SPEAK QUICKLY IN ORDER TO SWERVE!
                  </span>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border-2 border-slate-950">
                    <div
                      className="bg-pink-500 h-full rounded-full transition-all duration-75"
                      style={{ width: `${bulletTimeProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* GIANT DOCKS LANE WORD BUTTON HOOKS */}
              {isBulletTime && (
                <div className="absolute left-[16px] right-[16px] bottom-4 z-30 pointer-events-auto grid grid-cols-3 gap-3 md:gap-5" id="adjacent-word-triggers-board">
                  {([0, 1, 2] as Lane[]).map(lane => {
                    const targetWord = currentLaneWords[lane];
                    const isCurrent = playerLane === lane;
                    const laneName = lane === 0 ? 'LEFT LANE' : lane === 1 ? 'CENTER' : 'RIGHT LANE';

                    // Lane styled color boxes
                    const borderClass = lane === 0 
                      ? 'border-sky-500 bg-sky-100 bubble-shadow-pink text-sky-950' 
                      : lane === 2 
                      ? 'border-pink-500 bg-pink-100 bubble-shadow-pink text-pink-950' 
                      : 'border-yellow-500 bg-yellow-100 bubble-shadow-amber text-yellow-950';

                    const labelBgClass = lane === 0 ? 'bg-sky-400 text-white' : lane === 2 ? 'bg-pink-400 text-white' : 'bg-yellow-400 text-slate-900';

                    if (isCurrent) {
                      return (
                        <div
                          key={lane}
                          className="opacity-0 pointer-events-none h-28 md:h-32"
                          id={`steering-panel-lane-${lane}`}
                        />
                      );
                    }

                    return (
                      <div
                        key={lane}
                        className={`relative text-center p-2 rounded-2xl border-4 transition-all h-28 md:h-32 flex flex-col justify-between ${
                          targetWord
                            ? `border-slate-900 animate-pulse ${borderClass}`
                            : 'border-transparent opacity-0 pointer-events-none h-28 md:h-32'
                        }`}
                        id={`steering-panel-lane-${lane}`}
                      >
                        <span
                          className={`text-[8.5px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full inline-block mx-auto border-2 border-slate-900 ${labelBgClass}`}
                        >
                          {laneName}
                        </span>

                        {targetWord ? (
                          <div className="flex flex-col items-center my-auto z-10 w-full overflow-hidden justify-center px-1">
                            <span className={`${
                              targetWord.length > 25
                                ? 'text-[10px] md:text-xs font-black'
                                : targetWord.length > 15
                                ? 'text-xs md:text-sm font-black'
                                : 'text-sm md:text-lg font-black'
                            } text-slate-950 uppercase tracking-wider drop-shadow-[0_1.5px_0_rgba(255,255,255,1)] text-center leading-tight break-words max-h-12 overflow-hidden`}>
                              {targetWord}
                            </span>
                            <span className="text-[10px] text-slate-700 font-extrabold mt-0.5 truncate max-w-full">
                              {(() => {
                                const found = getSelectedVocabularyList().find(v => v.word.toLowerCase() === targetWord.toLowerCase());
                                return found?.translationRu || found?.translation || '';
                              })()}
                            </span>
                          </div>
                        ) : (
                <span className="text-[9px] text-slate-400 font-extrabold uppercase my-auto">{t('shared.clear')}</span>
                        )}

                        {targetWord && (
                          <div className="flex gap-1 justify-center w-full mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerTTSHelp(targetWord);
                              }}
                              className="text-[9px] text-slate-900 font-black hover:bg-yellow-300 bg-white border-2 border-slate-900 px-2 py-1 rounded-xl cursor-pointer flex items-center gap-0.5 shadow-sm active:translate-y-0.5 duration-100 shrink-0 animate-none"
                              aria-label={`Hear the word ${targetWord}`}
                            >
                              🔊 EN
                            </button>
                            {(() => {
                              const found = getSelectedVocabularyList().find(v => v.word.toLowerCase() === targetWord.toLowerCase());
                              return found?.translationRu ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (found?.translationRu) {
                                      speakWord(found.translationRu, 'ru');
                                    }
                                  }}
                                  className="text-[9px] text-blue-800 font-black hover:bg-blue-100 bg-white border-2 border-slate-900 px-2 py-1 rounded-xl cursor-pointer flex items-center gap-0.5 shadow-sm active:translate-y-0.5 duration-100 shrink-0 animate-none"
                              aria-label={t('shared.listenInRussian')}
                                >
                                  🔊 RU
                                </button>
                              ) : null;
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pause overlay over the racing canvas */}
              {racerPaused && (
                <div className="absolute inset-0 z-50 bg-slate-900/75 flex flex-col items-center justify-center gap-1">
                  <span className="text-5xl" aria-hidden="true">⏸️</span>
                  <span className="text-xl font-black uppercase tracking-widest text-white">
                    Paused
                  </span>
                </div>
              )}
            </div>

            {/* AUDIO EQUALIZER & MONITORING BALLOON */}
            <div className="space-y-3.5">
              <AudioVisualizer
                isListening={voiceStatus.status === 'listening'}
                isMatched={wordMatchFlash}
                errorMessage={voiceStatus.status === 'error' ? voiceStatus.message : undefined}
              />

              <div className="bg-white border-4 border-slate-900 p-4.5 rounded-3xl shadow-md text-left flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-500 border-2 border-slate-900 text-white flex items-center justify-center animate-bounce">
                    <Mic className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Your Words Heard:
                    </p>
                    
                    {/* Speech bubble bubble-gum effect */}
                    <div className="bg-purple-100 border-2 border-slate-900 text-slate-900 font-black text-sm px-3 py-1 rounded-xl relative mt-1 inline-block">
                      {lastHeardTranscript ? (
                        <span className="text-purple-900 italic font-black">"{lastHeardTranscript}"</span>
                      ) : (
                  <span className="text-slate-500 font-bold">{t('racer.sayToJump')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STATE C: CHILD STUDY CARD RECAP (GAME OVER) */}
        {gameState === 'GAME_OVER' && (
          <div className="max-w-md mx-auto py-6 animate-scale-up" id="game-over-console">
            <div className="bg-white border-8 border-slate-900 rounded-4xl p-6 text-center relative overflow-hidden bubble-shadow-rose">
              
              <span className="inline-flex items-center gap-1 bg-yellow-300 border-4 border-slate-900 px-4 py-1.5 rounded-full text-slate-900 text-xs font-black uppercase tracking-widest">
                Driving Finish Line!
              </span>

              <h2 className="text-3xl font-black text-slate-950 mt-6 mb-2 uppercase tracking-wide">
                SUPER COOPER DRIVING!
              </h2>
              <p className="text-xs text-slate-500 leading-normal font-bold">
                You drove amazingly! Click below to practice speaking words and beat your high record!
              </p>

              {/* Driving stats grid boxes */}
              <div className="grid grid-cols-2 gap-3.5 my-6">
                <div className="bg-sky-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                    <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">{t('racer.drivingScore')}</span>
                  <span className="text-lg font-black text-sky-900 mt-1 font-mono">{score} points</span>
                </div>
                <div className="bg-amber-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{t('racer.recordTarget')}</span>
                  <span className="text-lg font-black text-amber-800 mt-1 font-mono">{highScore} points</span>
                </div>
              </div>

              {/* SPEECH SUMMARY CARD */}
              <div className="bg-purple-100 border-4 border-slate-900 p-4 rounded-3xl text-left mb-6" id="vocabulary-study-scorecard">
                <div className="flex items-center gap-2 mb-2.5">
                  <BookOpen className="w-5 h-5 text-purple-700 stroke-[2.5]" />
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest">
                    Your English Practice Scorecard:
                  </h4>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {Object.keys(wordStudyStats).length === 0 ? (
                    <div className="text-center py-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
                      <p className="text-xs text-slate-500 font-extrabold leading-normal">
                        Spoken scorecard empty. Try driving again to gather speech stats!
                      </p>
                    </div>
                  ) : (
                    Object.keys(wordStudyStats).map((word, index) => {
                      const spoken = wordStudyStats[word].spoken;
                      const struggled = wordStudyStats[word].struggled;
                      
                      return (
                        <div
                          key={index}
                          className="bg-white border-2 border-slate-900 p-2.5 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-950 font-black text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-900">{word}</span>
                            <span className="text-slate-500 text-xs font-bold">
                              ➔ {getSelectedVocabularyList().find(v => v.word === word)?.translation || ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center text-[9px] text-emerald-800 bg-emerald-100 px-2 py-1.5 rounded-full font-black border border-emerald-300">
                              Heard: {spoken}m
                            </span>
                            {struggled > 0 && (
                              <span className="inline-flex items-center text-[9px] text-amber-800 bg-amber-100 px-2 py-1.5 rounded-full font-black border border-amber-350">
                                Clues: {struggled}m
                              </span>
                            )}
                            <button
                              onClick={() => speakWord(word)}
                              className="p-1 bg-yellow-100 hover:bg-yellow-200 border-2 border-slate-900 rounded-lg cursor-pointer"
                              aria-label={`Hear the word ${word}`}
                              title={t('shared.listen')}
                            >
                              <Volume2 className="w-3.5 h-3.5 text-slate-900" />
                            </button>
                            {(() => {
                              const found = getSelectedVocabularyList().find(v => v.word.toLowerCase() === word.toLowerCase());
                              return found?.translationRu ? (
                                <button
                                  onClick={() => found?.translationRu && speakWord(found.translationRu, 'ru')}
                                  className="p-1 bg-blue-100 hover:bg-blue-200 border-2 border-slate-900 rounded-lg cursor-pointer text-blue-850 text-[10px] font-bold shrink-0 animate-none"
                                  aria-label={t('shared.listenInRussian')}
                                >
                                  RU
                                </button>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Navigation CTAs */}
              <div className="flex flex-col gap-2.5 my-2 w-full">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={triggerPlayGame}
                    className="flex-1 bg-pink-500 hover:bg-pink-600 border-4 border-slate-900 text-white font-black text-xs px-6 py-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-1 active:shadow-none bubble-shadow-pink"
                    id="btn-play-again-failed"
                  >
                    <RotateCcw className="w-4 h-4 text-white stroke-[3]" /> PLAY HIGHWAY AGAIN!
                  </button>
                  <button
                    onClick={() => setGameState('START_SCREEN')}
                    className="flex-1 bg-white hover:bg-slate-50 border-4 border-slate-900 text-slate-800 font-black text-xs px-5 py-4 rounded-xl flex items-center justify-center cursor-pointer hover:scale-101 active:translate-y-1 transition-all"
                    id="btn-home-screen-failed"
                  >
                    Race Options
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    speakSound.playCoin();
                    setCurrentView('HUB');
                  }}
                  className="w-full bg-purple-500 hover:bg-purple-600 border-4 border-slate-900 text-white font-black text-xs px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-101 active:translate-y-1 shadow-md uppercase tracking-wider mt-1.5"
                  id="btn-quit-to-hub-gameover"
                >
                  🏰 EXIT TO GAMES PORTAL
                </button>
              </div>

            </div>
          </div>
        )}

          </>
        ) : currentView === 'BUBBLE_POPPER' ? (
          <BubblePopperGame
            onBackToHub={() => setCurrentView('HUB')}
            onUpdateHighScore={handleUpdateBubbleHighScore}
            highScore={bubbleHighScore}
            customWords={customWords}
            onAddCustomWord={handleAddNewWord}
            onDeleteCustomWord={handleDeleteWord}
            onClearCustomWords={handleClearCustomWords}
            onScoreChange={setBubbleScore}
            onLevelChange={setBubbleLevel}
          />
        ) : currentView === 'BOSS_FIGHT' ? (
          <BossFightGame
            onBackToHub={() => setCurrentView('HUB')}
            customWords={customWords}
            highScore={bossFightHighScore}
            onUpdateHighScore={handleUpdateBossFightHighScore}
            onAddCustomWord={handleAddNewWord}
            onDeleteCustomWord={handleDeleteWord}
            onClearCustomWords={handleClearCustomWords}
          />
        ) : currentView === 'WORD_LADDER' ? (
          <WordLadderGame
            onBackToHub={() => setCurrentView('HUB')}
            customWords={customWords}
            highScore={wordLadderHighScore}
            onUpdateHighScore={handleUpdateWordLadderHighScore}
            onAddCustomWord={handleAddNewWord}
            onDeleteCustomWord={handleDeleteWord}
            onClearCustomWords={handleClearCustomWords}
          />
        ) : currentView === 'SKATE_WORD' ? (
          <SkateWordGame
            onBackToHub={() => setCurrentView('HUB')}
            customWords={customWords}
            highScore={skateWordHighScore}
            onUpdateHighScore={handleUpdateSkateWordHighScore}
            onAddCustomWord={handleAddNewWord}
            onDeleteCustomWord={handleDeleteWord}
            onClearCustomWords={handleClearCustomWords}
          />
        ) : currentView === 'TREASURE_HUNTER' ? (
          <TreasureHunterGame
            onBackToHub={() => setCurrentView('HUB')}
            customWords={customWords}
            highScore={treasureHunterHighScore}
            onUpdateHighScore={handleUpdateTreasureHunterHighScore}
            onAddCustomWord={handleAddNewWord}
            onDeleteCustomWord={handleDeleteWord}
            onClearCustomWords={handleClearCustomWords}
          />
        ) : currentView === 'ASTE_WORD' ? (
          <AsteWordGame
            onBackToHub={() => setCurrentView('HUB')}
            customWords={customWords}
            highScore={asteWordHighScore}
            onUpdateHighScore={handleUpdateAsteWordHighScore}
            onAddCustomWord={handleAddNewWord}
            onDeleteCustomWord={handleDeleteWord}
            onClearCustomWords={handleClearCustomWords}
          />
        ) : currentView === 'SENTENCE_BIRD' ? (
          <SentenceBirdGame
            onBackToHub={() => setCurrentView('HUB')}
            customWords={customWords}
            highScore={sentenceBirdHighScore}
            onUpdateHighScore={handleUpdateSentenceBirdHighScore}
            onScoreChange={() => undefined}
            onAddCustomWord={handleAddNewWord}
            onDeleteCustomWord={handleDeleteWord}
            onClearCustomWords={handleClearCustomWords}
          />
        ) : currentView === 'ECHO_RECORDER' ? (
          <EchoRecorderGame
            onBackToHub={() => setCurrentView('HUB')}
            highScore={echoRecorderHighScore}
            onUpdateHighScore={handleUpdateEchoRecorderHighScore}
          />
        ) : currentView === 'MAGIC_WIZARD' ? (
          <MagicWizardGame
            onBackToHub={() => setCurrentView('HUB')}
            customWords={customWords}
            highScore={magicWizardHighScore}
            onUpdateHighScore={handleUpdateMagicWizardHighScore}
            onAddCustomWord={handleAddNewWord}
            onDeleteCustomWord={handleDeleteWord}
            onClearCustomWords={handleClearCustomWords}
          />
        ) : (
          <ProgressView onBackToHub={() => setCurrentView('HUB')} />
        )}
      </main>

      <footer className="relative z-10 pb-3 text-center text-xs font-bold text-slate-400 select-none">
        Voice Games v{__APP_VERSION__}
      </footer>
    </div>
  );
}

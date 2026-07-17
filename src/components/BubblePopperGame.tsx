import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadProgress, pickAdaptiveWordIndex, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, GameId } from '../progress';
import { Heart, Play } from 'lucide-react';

import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
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
import { speakWord, speakSound, matchesWord, isSpeechSynthesisActive } from '../voice/engine';
import { SUCCESS_RECOGNITION_DELAY_MS } from '../useSpeechRecognition';

type BubbleTheme = 'sky' | 'snow' | 'starry' | 'nebula';

interface Bubble {
  id: string;
  word: string;
  translation: string;
  translationRu?: string;
  x: number; // percentage X (0 to 100)
  y: number; // Y position in pixels
  radius: number;
  speed: number;
  hue: number;
  wobbleSpeed: number;
  wobbleAmount: number;
  wobbleTime: number;
  bursting: boolean;
  burstProgress: number; // 0 to 1
}

interface BubbleParticle {
  id: string;
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
}

interface BubblePopperGameProps {
  onBackToHub: () => void;
  onUpdateHighScore: (score: number) => void;
  highScore: number;
  customWords: WordData[];
  onAddCustomWord: (word: string, translation: string) => void;
  onDeleteCustomWord: (index: number) => void;
  onClearCustomWords: () => void;
  onScoreChange?: (score: number) => void;
  onLevelChange?: (level: number) => void;
}

export const BubblePopperGame: React.FC<BubblePopperGameProps> = ({
  onBackToHub,
  onUpdateHighScore,
  highScore,
  customWords,
  onAddCustomWord,
  onDeleteCustomWord,
  onClearCustomWords,
  onScoreChange,
  onLevelChange,
}) => {
  const [gameState, setGameState] = useState<'START_SCREEN' | 'PLAYING' | 'GAME_OVER'>('START_SCREEN');
  const [bubbleTheme, setBubbleTheme] = useState<BubbleTheme>('sky');
  const { t } = useUiLanguage();
  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);

  // Collapsible drawers
  const [isWarmupExpanded, setIsWarmupExpanded] = useState(false);
  const [isCustomWordsExpanded, setIsCustomWordsExpanded] = useState(false);

  // Score states (rendered in React UI, but driven authoritatively by s.score/s.lives to prevent async glitches)
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [paused, setPaused] = useState(false);

  // Synchronize score and level back to App.tsx
  useEffect(() => {
    if (onScoreChange) {
      onScoreChange(score);
    }
  }, [score, onScoreChange]);

  useEffect(() => {
    if (onLevelChange) {
      onLevelChange(level);
    }
  }, [level, onLevelChange]);

  // Recognition state feedbacks
  const [lastHeardTranscript, setLastHeardTranscript] = useState('');
  const [targetBubble, setTargetBubble] = useState<Bubble | null>(null);
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [struggleCounter, setStruggleCounter] = useState<Record<string, number>>({});
  const [voiceStatus, setVoiceStatus] = useState({
    status: 'idle',
    message: t('shared.voiceStartPrompt'),
  });

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetBubbleRef = useRef<Bubble | null>(null);

  // Web Speech ref
  const recognitionRef = useRef<any>(null);
  const recognitionRestartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Authoritative state reference to completely avoid stale closures in requestAnimationFrame loops
  const stateRef = useRef({
    gameState: 'START_SCREEN' as 'START_SCREEN' | 'PLAYING' | 'GAME_OVER',
    score: 0,
    level: 1,
    lives: 3,
    bubbles: [] as Bubble[],
    particles: [] as BubbleParticle[],
    lastSpawnTime: 0,
    canvasWidth: 400,
    canvasHeight: 520,
    theme: 'sky' as BubbleTheme,
    vocabIndex: -1,
    paused: false,
    vocabList: [] as { word: string; translation: string; translationRu?: string }[]
  });

  // Sync state transitions on variables triggered from React buttons and options
  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    stateRef.current.paused = paused;
  }, [paused]);

  useEffect(() => {
    stateRef.current.theme = bubbleTheme;
  }, [bubbleTheme]);

  // Read clean list based on chosen dropdowns
  const getVocabularyList = useCallback(() => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0 ? customWords : BUILTIN_CATEGORIES[0].words;
    }
    return activeCategory.words;
  }, [activeCategory, customWords]);

  const vocabularyList = getVocabularyList();
  const displayedBubble = targetBubble || vocabularyList[0];
  useEffect(() => {
    stateRef.current.vocabList = vocabularyList;
  }, [vocabularyList]);

  // Update high score when score advances
  useEffect(() => {
    if (score > highScore) {
      onUpdateHighScore(score);
    }
  }, [score, highScore, onUpdateHighScore]);

  // Speech Recognition continuous thread startup
  const startVoiceEngine = useCallback(() => {
    if (recognitionRestartTimerRef.current) {
      clearTimeout(recognitionRestartTimerRef.current);
      recognitionRestartTimerRef.current = null;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus({
        status: 'unsupported',
        message: t('shared.voiceUnsupported'),
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
          message: t('bubble.voiceEngineLive'),
        });
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setVoiceStatus({
            status: 'error',
          message: t('shared.micAccessBlocked'),
          });
        }
      };

      rec.onend = () => {
        // Automatically regain continuous speech streaming if the gamethread is
        // still live and not paused.
        if (stateRef.current.gameState === 'PLAYING' && !stateRef.current.paused) {
          try {
            rec.start();
          } catch {
            // catch collisions
          }
        } else {
          setVoiceStatus({
            status: 'idle',
            message: t('shared.voiceStopped'),
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
          const accepted = evaluateVoiceInput(textResult);
          if (!accepted) return;

          rec.onend = null;
          rec.onresult = null;
          try {
            rec.abort();
          } catch {
            // ignore abort races
          }
          if (recognitionRef.current === rec) recognitionRef.current = null;
          setVoiceStatus({
            status: 'idle',
            message: t('shared.processingNextWord'),
          });
          recognitionRestartTimerRef.current = setTimeout(() => {
            recognitionRestartTimerRef.current = null;
            if (stateRef.current.gameState === 'PLAYING' && !stateRef.current.paused) {
              startVoiceEngine();
            }
          }, SUCCESS_RECOGNITION_DELAY_MS);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      console.error('Failed to trigger Speech Recognition Engine:', err);
    }
  }, [t]);

  // Check if spoken word matches any floating bubble
  const evaluateVoiceInput = (speechText: string) => {
    const s = stateRef.current;
    if (s.gameState !== 'PLAYING' || s.paused) return false;

    // Search active unburst bubbles for matches
    let matchedIndex = -1;
    for (let i = 0; i < s.bubbles.length; i++) {
      const bubble = s.bubbles[i];
      if (bubble.bursting) continue;

      if (matchesWord(speechText, bubble.word, true)) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex !== -1) {
      const bubble = s.bubbles[matchedIndex];
      bubble.bursting = true;
      bubble.burstProgress = 0;

      if (targetBubbleRef.current?.id === bubble.id) {
        const nextTarget = s.bubbles.find((item) => item.id !== bubble.id && !item.bursting) || null;
        targetBubbleRef.current = nextTarget;
        setTargetBubble(nextTarget);
      }

      // Create burst droplets
      createSplashParticles(
        (bubble.x / 100) * s.canvasWidth,
        bubble.y,
        bubble.hue
      );

      // Play soft sound pop
      speakSound.playCorrect();

      // Award Score authoritatively
      s.score += 20;
      setScore(s.score);

      // Track study scorecard
      setWordStudyStats(prev => ({
        ...prev,
        [bubble.word]: {
          spoken: (prev[bubble.word]?.spoken || 0) + 1,
          struggled: prev[bubble.word]?.struggled || 0
        }
      }));
      saveProgress(recordWordSpoken(loadProgress(), 'bubble-popper', bubble.word));

      // reset transcript so buffer parses next values cleanly
      setLastHeardTranscript('');
      return true;
    }
    return false;
  };

  // Launch splattered watercolor bubble particle droplets on canvas
  const createSplashParticles = (x: number, y: number, hue: number) => {
    const s = stateRef.current;
    const colors = [
      `hsla(${hue}, 100%, 75%, 0.9)`,
      `hsla(${hue + 45}, 100%, 80%, 0.9)`,
      `hsla(${hue - 45}, 100%, 70%, 0.85)`,
      'rgba(255, 255, 255, 0.95)',
      'rgba(240, 248, 255, 0.8)'
    ];

    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 5.5 + 2.5;
      s.particles.push({
        id: Math.random().toString(),
        x,
        y,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 0.5,
        size: Math.random() * 3.5 + 2,
        life: 0,
        maxLife: Math.random() * 20 + 15,
      });
    }
  };

  // Trigger spoken phonetic guide for struggling children
  const triggerPhonemicHelp = (word: string) => {
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
    saveProgress(recordWordStruggled(loadProgress(), 'bubble-popper', word));
  };

  // Start active game state
  const startGame = () => {
    const s = stateRef.current;
    
    // Set baseline authoritative refs
    s.gameState = 'PLAYING';
    s.score = 0;
    s.level = 1;
    s.lives = 3;
    s.vocabIndex = -1;
    s.bubbles = [];
    s.particles = [];
    s.lastSpawnTime = Date.now();
    s.paused = false;

    // Set aligned React states
    setGameState('PLAYING');
    setScore(0);
    setLevel(1);
    setLives(3);
    setPaused(false);
    setLastHeardTranscript('');
    targetBubbleRef.current = null;
    setTargetBubble(null);
    setWordStudyStats({});
    setStruggleCounter({});

    startVoiceEngine();
    speakSound.playCoin();
    const updatedProgress = recordSessionPlayed(loadProgress(), 'bubble-popper');
    saveProgress(updatedProgress);
  };

  // Pause/resume: freeze the bubbles and stop listening while paused.
  const togglePause = () => {
    const s = stateRef.current;
    const next = !s.paused;
    s.paused = next;
    setPaused(next);
    if (next) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    } else {
      // Reset the spawn clock so the pause does not dump a burst of bubbles.
      s.lastSpawnTime = Date.now();
      startVoiceEngine();
    }
  };

  // Clean and exit voice recognition triggers during gameplay failures
  const handleGameOver = () => {
    setGameState('GAME_OVER');
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.abort();
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Convert click location into physical canvas dimensions
    const physicalX = (clickX / rect.width) * stateRef.current.canvasWidth;
    const physicalY = (clickY / rect.height) * stateRef.current.canvasHeight;

    const s = stateRef.current;
    for (let i = s.bubbles.length - 1; i >= 0; i--) {
      const b = s.bubbles[i];
      if (b.bursting) continue;

      const wobbleOffsetX = Math.sin(b.wobbleTime) * b.wobbleAmount;
      const bCx = (b.x / 100) * s.canvasWidth + wobbleOffsetX;

      // Calculate simple collision distance
      const dist = Math.hypot(physicalX - bCx, physicalY - b.y);
      if (dist <= b.radius) {
        // Speak word immediately
        triggerPhonemicHelp(b.word);
        break; // Trigger for top bubble only
      }
    }
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (recognitionRestartTimerRef.current) {
        clearTimeout(recognitionRestartTimerRef.current);
        recognitionRestartTimerRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Persistent Game Loop inside single useEffect to guarantee absolute frame rate performance and zero stale values
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number | null = null;

    // Auto resize callback
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth || 400;
        canvas.height = 512;
        stateRef.current.canvasWidth = canvas.width;
        stateRef.current.canvasHeight = canvas.height;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // High fidelity drawing functions with dynamic cartoon elements
    const drawThematicLoungeBackground = (c: CanvasRenderingContext2D, w: number, h: number, time: number) => {
      const theme = stateRef.current.theme;

      if (theme === 'sky') {
        // Soft blue to bright turquoise transition scale
        const skyGrad = c.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#2563EB'); // Deep high blue
        skyGrad.addColorStop(0.35, '#3B82F6'); // Summer blue Sky
        skyGrad.addColorStop(1, '#93C5FD'); // Light clouds line
        c.fillStyle = skyGrad;
        c.fillRect(0, 0, w, h);

        // Rotating Animated Yellow Sun with rays!
        const sunX = w - 45;
        const sunY = 45;
        c.save();
        c.translate(sunX, sunY);
        c.rotate(time / 2400);
        c.fillStyle = '#FBBF24'; // beautiful gold sun core
        c.beginPath();
        for (let r = 0; r < 12; r++) {
          c.rotate(Math.PI / 6);
          c.fillRect(-4, -28, 8, 14); // beautiful rays outward
        }
        c.restore();

        c.fillStyle = '#FCD34D';
        c.beginPath();
        c.arc(sunX, sunY, 18, 0, Math.PI * 2);
        c.fill();

        // Rainbow/Cute hot air balloon drifting slowly
        const balloonX = (time / 30) % (w + 160) - 85;
        const balloonY = h * 0.42 + Math.sin(time / 600) * 12;
        // balloon body
        c.fillStyle = '#EF4444';
        c.beginPath();
        c.arc(balloonX, balloonY, 15, 0, Math.PI * 2);
        c.fill();
        // yellow and blue pattern stripes
        c.fillStyle = '#3B82F6';
        c.fillRect(balloonX - 7, balloonY - 6, 14, 12);
        c.fillStyle = '#FBBF24';
        c.fillRect(balloonX - 3, balloonY - 6, 6, 12);
        // basket
        c.fillStyle = '#78350F';
        c.fillRect(balloonX - 4, balloonY + 18, 8, 5);
        c.strokeStyle = '#AF5B00';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(balloonX - 3, balloonY + 14);
        c.lineTo(balloonX - 3, balloonY + 18);
        c.moveTo(balloonX + 3, balloonY + 14);
        c.lineTo(balloonX + 3, balloonY + 18);
        c.stroke();

        // Fluffy stylized clouds drifting dynamically
        c.fillStyle = 'rgba(255, 255, 255, 0.48)';
        const drawCloud = (cx: number, cy: number, scale: number) => {
          c.beginPath();
          c.arc(cx, cy, 20 * scale, 0, Math.PI * 2);
          c.arc(cx + 18 * scale, cy - 8 * scale, 28 * scale, 0, Math.PI * 2);
          c.arc(cx + 38 * scale, cy, 22 * scale, 0, Math.PI * 2);
          c.arc(cx + 18 * scale, cy + 8 * scale, 20 * scale, 0, Math.PI * 2);
          c.closePath();
          c.fill();
        };

        const driftX1 = ((time / 35) % (w + 140)) - 70;
        const driftX2 = (((time / 55) + w/2) % (w + 140)) - 70;
        drawCloud(driftX1, h * 0.2, 0.9);
        drawCloud(driftX2, h * 0.55, 1.2);

        // Drifting birds flying across the sky
        c.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        c.lineWidth = 2.5;
        const birdDrift = ((time / 20) % (w + 100)) - 50;
        const drawBird = (bx: number, by: number, wingTime: number) => {
          const flap = Math.sin(wingTime) * 6;
          c.beginPath();
          c.moveTo(bx - 12, by + flap);
          c.quadraticCurveTo(bx - 6, by - 6, bx, by + 2);
          c.quadraticCurveTo(bx + 6, by - 6, bx + 12, by + flap);
          c.stroke();
        };
        drawBird(birdDrift, h * 0.35, time / 130);
        drawBird(birdDrift - 25, h * 0.38, (time / 130) + 1);

      } else if (theme === 'snow') {
        // Deep indigo polar atmosphere gradient
        const snowGrad = c.createLinearGradient(0, 0, 0, h);
        snowGrad.addColorStop(0, '#0F172A'); // Midnight deep gray
        snowGrad.addColorStop(0.5, '#1E293B'); // Cozy slate blue
        snowGrad.addColorStop(1, '#334155');
        c.fillStyle = snowGrad;
        c.fillRect(0, 0, w, h);

        // Aurora Borealis glowing magical ribbon wave
        c.lineWidth = 16;
        const auroraY = h * 0.2;
        const auroraGrad = c.createLinearGradient(0, auroraY, w, auroraY);
        auroraGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
        auroraGrad.addColorStop(0.3, 'rgba(52, 211, 153, 0.3)');
        auroraGrad.addColorStop(0.7, 'rgba(110, 231, 183, 0.24)');
        auroraGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        c.strokeStyle = auroraGrad;
        c.beginPath();
        c.moveTo(0, auroraY);
        for (let ix = 0; ix <= w; ix += 25) {
          c.lineTo(ix, auroraY + Math.sin(time / 800 + ix / 45) * 16);
        }
        c.stroke();

        // Draw multiple glowing star dots
        c.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 35; i++) {
          const sx = (Math.sin(i * 921) * 0.5 + 0.5) * w;
          const sy = (Math.cos(i * 442) * 0.5 + 0.25) * h;
          const starGlow = 0.55 + Math.sin(time / 200 + i) * 0.4;
          c.beginPath();
          c.arc(sx, sy, Math.max(0, 1.5 * starGlow), 0, Math.PI * 2);
          c.fill();
        }

        // Snowy hills
        c.fillStyle = '#475569';
        c.beginPath();
        c.moveTo(0, h);
        c.lineTo(w * 0.25, h * 0.72);
        c.lineTo(w * 0.65, h * 0.85);
        c.lineTo(w * 0.88, h * 0.76);
        c.lineTo(w, h);
        c.fill();

        c.fillStyle = '#CBD5E1';
        c.beginPath();
        c.moveTo(0, h);
        c.quadraticCurveTo(w * 0.4, h * 0.84, w, h * 0.88);
        c.lineTo(w, h);
        c.closePath();
        c.fill();

        // Snow falling lines
        c.fillStyle = 'rgba(255, 255, 255, 0.55)';
        for (let k = 0; k < 18; k++) {
          const sx = ((k * 311) % w);
          const sy = ((time / 14 + k * 85) % h);
          c.beginPath();
          c.arc(sx, sy, 2, 0, Math.PI * 2);
          c.fill();
        }

        // Draw evergreen pine trees capped with snow
        const drawPine = (tx: number, ty: number, scale: number) => {
          c.fillStyle = '#065F46'; // forest green
          c.beginPath();
          c.moveTo(tx, ty);
          c.lineTo(tx - 15 * scale, ty + 20 * scale);
          c.lineTo(tx + 15 * scale, ty + 20 * scale);
          c.closePath();
          c.fill();

          c.beginPath();
          c.moveTo(tx, ty + 8 * scale);
          c.lineTo(tx - 20 * scale, ty + 36 * scale);
          c.lineTo(tx + 20 * scale, ty + 36 * scale);
          c.closePath();
          c.fill();

          // snow cap
          c.fillStyle = 'white';
          c.beginPath();
          c.moveTo(tx, ty);
          c.lineTo(tx - 6 * scale, ty + 8 * scale);
          c.lineTo(tx + 6 * scale, ty + 8 * scale);
          c.closePath();
          c.fill();

          // simple trunk
          c.fillStyle = '#78350F';
          c.fillRect(tx - 4 * scale, ty + 36 * scale, 8 * scale, 10 * scale);
        };
        drawPine(w * 0.15, h * 0.8, 1);
        drawPine(w * 0.84, h * 0.83, 1.25);

      } else if (theme === 'starry') {
        // Starry Night atmosphere
        const starryGrad = c.createLinearGradient(0, 0, 0, h);
        starryGrad.addColorStop(0, '#05030A'); // Ultra absolute abyss dark
        starryGrad.addColorStop(0.4, '#0D0B21'); // Deep indigo starry vault
        starryGrad.addColorStop(1, '#1E1B4B'); // Soft purple misty horizon
        c.fillStyle = starryGrad;
        c.fillRect(0, 0, w, h);

        // Radiant Moon with soft radial glowing ring halo
        const moonX = w * 0.76;
        const moonY = 65;
        const moonRadius = 30;

        // moon aura glow
        const moonGlow = c.createRadialGradient(moonX, moonY, moonRadius * 0.8, moonX, moonY, moonRadius * 2.8);
        moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
        moonGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
        c.fillStyle = moonGlow;
        c.beginPath();
        c.arc(moonX, moonY, moonRadius * 2.8, 0, Math.PI * 2);
        c.fill();

        // Moon crescent
        c.fillStyle = '#FEF08A'; // glorious glowing yellow moon
        c.beginPath();
        c.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        c.fill();

        // subtract crescent shadow bite
        c.fillStyle = '#05030A';
        c.beginPath();
        c.arc(moonX - 8, moonY - 4, moonRadius - 1, 0, Math.PI * 2);
        c.fill();

        // Mars! Orange-red planet with small craters
        const marsX = w * 0.2;
        const marsY = h * 0.35;
        const marsRadius = 14;
        c.fillStyle = '#EA580C'; // Red planet base
        c.beginPath();
        c.arc(marsX, marsY, marsRadius, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#9A3412'; // Craters
        c.beginPath();
        c.arc(marsX - 4, marsY - 4, 3, 0, Math.PI * 2);
        c.arc(marsX + 5, marsY + 3, 2, 0, Math.PI * 2);
        c.arc(marsX - 1, marsY + 5, 2, 0, Math.PI * 2);
        c.fill();

        // Cute green glowing UFO saucer orbiting around Mars
        const ufoX = w * 0.45 + Math.sin(time / 1400) * 85;
        const ufoY = h * 0.42 + Math.cos(time / 1400) * 22;
        c.fillStyle = '#94A3B8'; // Metallic frame
        c.beginPath();
        c.ellipse(ufoX, ufoY, 14, 5, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#22D3EE'; // Glass bubble cockpit
        c.beginPath();
        c.arc(ufoX, ufoY - 2, 5, Math.PI, 0);
        c.fill();
        c.fillStyle = '#4ADE80'; // Flashing side dots
        c.fillRect(ufoX - 8, ufoY, 2, 2);
        c.fillRect(ufoX, ufoY, 2, 2);
        c.fillRect(ufoX + 6, ufoY, 2, 2);

        // Draw multiple beautiful twinkling diamond cross stars (Constellations!)
        const drawSparkleStar = (sx: number, sy: number, r: number, sparkleFreq: number) => {
          const glow = (Math.sin(time / 180 + sparkleFreq) * 0.5 + 0.5);
          c.strokeStyle = `rgba(255, 255, 255, ${0.45 + glow * 0.55})`;
          c.fillStyle = `rgba(255, 255, 255, ${0.6 + glow * 0.4})`;
          c.lineWidth = 1.2;

          c.beginPath();
          c.arc(sx, sy, Math.max(0, r), 0, Math.PI * 2);
          c.fill();

          // Cross rays
          const rayLen = (r * 4) * (0.6 + glow * 0.45);
          c.beginPath();
          c.moveTo(sx - rayLen, sy);
          c.lineTo(sx + rayLen, sy);
          c.moveTo(sx, sy - rayLen);
          c.lineTo(sx, sy + rayLen);
          c.stroke();
        };

        // Static high quality set of coordinate targets
        for (let i = 0; i < 40; i++) {
          const sx = ((i * 127 + 43) % w);
          const sy = ((i * 289 + 17) % (h * 0.65));
          drawSparkleStar(sx, sy, 1.2 + (i % 3) * 0.5, i);
        }

        // Dynamic Shooting Star tracers passing across the sky!
        const tracerSpeed = (time / 11) % (w + h + 200);
        c.strokeStyle = 'rgba(254, 240, 138, 0.45)';
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(tracerSpeed - 120, tracerSpeed * 0.5 - 40);
        c.lineTo(tracerSpeed, tracerSpeed * 0.5 + 20);
        c.stroke();

        c.fillStyle = 'rgba(254, 240, 138, 0.7)';
        c.beginPath();
        c.arc(tracerSpeed, tracerSpeed * 0.5 + 20, 2.5, 0, Math.PI * 2);
        c.fill();

      } else if (theme === 'nebula') {
        // Deep purple multi-grad galactic cosmos
        const spaceGrad = c.createLinearGradient(0, 0, w, h);
        spaceGrad.addColorStop(0, '#090514'); // Abyss black-blue
        spaceGrad.addColorStop(0.4, '#1E1B4B'); // Purple nebulas
        spaceGrad.addColorStop(0.75, '#311042'); // Pink stellar flame
        spaceGrad.addColorStop(1, '#020617'); // Pitch dark slate
        c.fillStyle = spaceGrad;
        c.fillRect(0, 0, w, h);

        // Uranus! Cyan ice giant with vertical thin rings
        const uraX = w * 0.32;
        const uraY = h * 0.55;
        const uraRadius = 14;
        c.fillStyle = '#22D3EE';
        c.beginPath();
        c.arc(uraX, uraY, uraRadius, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#E2E8F0'; // Uranus rings
        c.lineWidth = 1.8;
        c.save();
        c.translate(uraX, uraY);
        c.rotate(Math.PI / 2.3);
        c.beginPath();
        c.ellipse(0, 0, 22, 4, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        // Glowing comets passing across the purple nebula environment
        const cometProgress = (time / 16) % (w + h + 240);
        const cometX = cometProgress - 120;
        const cometY = cometProgress * 0.45;
        const comGrad = c.createLinearGradient(cometX, cometY, cometX - 52, cometY - 24);
        comGrad.addColorStop(0, 'rgba(236, 72, 153, 0.6)');
        comGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
        c.fillStyle = comGrad;
        c.beginPath();
        c.moveTo(cometX, cometY);
        c.lineTo(cometX - 52, cometY - 24);
        c.lineTo(cometX - 40, cometY - 32);
        c.closePath();
        c.fill();
        c.fillStyle = 'rgba(255, 255, 255, 0.9)';
        c.beginPath();
        c.arc(cometX, cometY, 2.8, 0, Math.PI * 2);
        c.fill();

        // Twinkling multi-colored cosmic stars sparks
        for (let j = 0; j < 48; j++) {
          const sx = ((j * 179 + 53) % w);
          const sy = ((j * 347 + 23) % h);
          const glow = (Math.sin(time / 220 + j) * 0.5 + 0.5);
          const hue = (j * 12) % 360;
          c.fillStyle = `hsla(${hue}, 100%, 80%, ${0.55 + glow * 0.45})`;
          c.beginPath();
          c.arc(sx, sy, Math.max(0, 1.5 + (j % 3)), 0, Math.PI * 2);
          c.fill();
        }

        // Draw huge cartoon Jupiter with stripes/bands
        const jupX = 65;
        const jupY = h * 0.28;
        const jupRadius = 38;

        c.fillStyle = '#FB923C'; // bright coral orange
        c.beginPath();
        c.arc(jupX, jupY, jupRadius, 0, Math.PI * 2);
        c.fill();

        // Jupiter gas stripes/bands using clip path
        c.save();
        c.beginPath();
        c.arc(jupX, jupY, jupRadius, 0, Math.PI * 2);
        c.clip();

        // Horizontal stripes
        c.fillStyle = '#FDBA74'; // light stripe
        c.fillRect(jupX - jupRadius, jupY - 18, jupRadius * 2, 8);
        c.fillStyle = '#EA580C'; // dark stripe
        c.fillRect(jupX - jupRadius, jupY, jupRadius * 2, 6);
        c.fillStyle = '#9A3412'; // deep brown spot
        c.beginPath();
        c.arc(jupX + 12, jupY + 12, 6, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // Draw dynamic Saturn styled with glowing loop ring!
        const satX = w - 75;
        const satY = h * 0.65;
        const satRadius = 26;

        c.fillStyle = '#FDE047'; // golden-yellow body
        c.beginPath();
        c.arc(satX, satY, satRadius, 0, Math.PI * 2);
        c.fill();

        // Ring loop stroke
        c.strokeStyle = '#F97316';
        c.lineWidth = 6;
        c.save();
        c.translate(satX, satY);
        c.rotate(Math.PI / 8); 
        c.beginPath();
        c.ellipse(0, 0, 48, 11, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();

        // Draw a tiny dynamic space rocket orbiting Saturn!
        const orbitAngle = time / 1000;
        const rx = satX + Math.cos(orbitAngle) * 55;
        const ry = satY + Math.sin(orbitAngle) * 25;

        // draw cute orange satellite orb
        c.fillStyle = '#EF4444';
        c.beginPath();
        c.arc(rx, ry, 6, 0, Math.PI * 2);
        c.fill();

        // blinking green antenna dot
        const blk = Math.sin(time / 100) > 0;
        c.fillStyle = blk ? '#10B981' : '#EF4444';
        c.beginPath();
        c.arc(rx, ry - 7, 2, 0, Math.PI * 2);
        c.fill();
      }
    };

    // Single unified loop frame handler
    let lastTime = performance.now();

    const frameLoop = () => {
      const s = stateRef.current;
      if (s.gameState !== 'PLAYING') return;

      const now = Date.now();
      const nowPerf = performance.now();
      let dt = nowPerf - lastTime;
      lastTime = nowPerf;

      // Frozen while paused: keep the last frame and the loop alive, but stop
      // spawning, floating and the danger-line checks until the player resumes.
      if (s.paused) {
        frameId = requestAnimationFrame(frameLoop);
        return;
      }

      if (dt > 100) dt = 16.67;
      const dtFactor = dt / (1000 / 160);

      const w = s.canvasWidth;
      const h = s.canvasHeight;

      // 1. Draw beautiful enriched background sky or cosmos
      drawThematicLoungeBackground(ctx, w, h, now);

      // 2. Alert Line Caution Border (danger line)
      const alertY = 100;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.16)';
      ctx.fillRect(0, 0, w, alertY);

      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(0, alertY);
      ctx.lineTo(w, alertY);
      ctx.stroke();
      ctx.setLineDash([]); // clear dash

      // Render cautionary label
      ctx.fillStyle = '#EF4444';
      ctx.font = '900 10.5px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🔴 ${t('bubble.dangerZone')}`, 12, alertY - 11);

      // 3. Spawning interval calculations
      const elapsed = now - s.lastSpawnTime;
      const spawnFrequencyDelay = Math.max(2000, 4200 - s.level * 450); // scales difficulty
      if (elapsed >= spawnFrequencyDelay) {
        const vocab = s.vocabList;
        if (vocab && vocab.length > 0) {
          const stats = loadProgress()['bubble-popper'].words;
          const nextIndex = pickAdaptiveWordIndex(
            vocab.map((item) => item.word),
            stats,
            s.vocabIndex,
          );
          const wordObj = vocab[nextIndex];
          s.vocabIndex = nextIndex;

          // Safe percentage positioning
          const minX = 14;
          const maxX = 86;
          const rx = minX + Math.random() * (maxX - minX);

          // Customize size & speed
          const bubbleRadius = Math.max(34, 45 - wordObj.word.length * 1.5);
          const upwardSpeed = (0.45 + s.level * 0.18) + Math.random() * 0.3;

          const newBubble: Bubble = {
            id: Math.random().toString(),
            word: wordObj.word,
            translation: wordObj.translation,
            translationRu: (wordObj as any).translationRu,
            x: rx,
            y: h + 45, // start just below physical canvas
            radius: bubbleRadius,
            speed: upwardSpeed,
            hue: Math.floor(Math.random() * 360),
            wobbleSpeed: 0.045 + Math.random() * 0.035,
            wobbleAmount: 4 + Math.random() * 4,
            wobbleTime: Math.random() * 30,
            bursting: false,
            burstProgress: 0,
          };
          s.bubbles.push(newBubble);
          if (!targetBubbleRef.current) {
            targetBubbleRef.current = newBubble;
            setTargetBubble(newBubble);
          }
        }
        s.lastSpawnTime = now;
      }

      // 4. Update and Draw active bubbles
      for (let i = s.bubbles.length - 1; i >= 0; i--) {
        const b = s.bubbles[i];

        if (b.bursting) {
          b.burstProgress += 0.14 * dtFactor;
          if (b.burstProgress >= 1) {
            s.bubbles.splice(i, 1);
            continue;
          }

          // Draw popping radial blast wave rings inside canvas
          ctx.strokeStyle = `hsla(${b.hue}, 100%, 75%, ${1 - b.burstProgress})`;
          ctx.lineWidth = 7 * (1 - b.burstProgress);
          ctx.beginPath();
          ctx.arc((b.x / 100) * w, b.y, b.radius * (1 + b.burstProgress * 0.4), 0, Math.PI * 2);
          ctx.stroke();
          continue;
        }

        // float physics upward
        b.y -= b.speed * dtFactor;
        b.wobbleTime += b.wobbleSpeed * dtFactor;
        const wobbleX = Math.sin(b.wobbleTime) * b.wobbleAmount;
        const cx = (b.x / 100) * w + wobbleX;

        // Render glassmorphic translucent gel gradient soap bubble spheres
        const rGrad = ctx.createRadialGradient(
          cx - b.radius * 0.28,
          b.y - b.radius * 0.28,
          b.radius * 0.08,
          cx,
          b.y,
          b.radius
        );
        rGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        rGrad.addColorStop(0.3, `hsla(${b.hue}, 90%, 85%, 0.15)`);
        rGrad.addColorStop(0.8, `hsla(${b.hue + 50}, 95%, 80%, 0.32)`);
        rGrad.addColorStop(1, `hsla(${b.hue + 110}, 100%, 72%, 0.55)`);

        ctx.fillStyle = rGrad;
        ctx.beginPath();
        ctx.arc(cx, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Accent reflective sheens stroke
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cx, b.y, b.radius - 4, Math.PI * 1.15, Math.PI * 1.65);
        ctx.stroke();

        // 3D glow core highlight dot
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(cx - b.radius * 0.38, b.y - b.radius * 0.38, b.radius * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Crisp border
        ctx.strokeStyle = `hsla(${b.hue}, 95%, 48%, 0.45)`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, b.y, b.radius - 0.5, 0, Math.PI * 2);
        ctx.stroke();

        // Drawing Text centered inside Soap Bubble
        ctx.fillStyle = '#0F172A'; // deep slate text color
        ctx.strokeStyle = 'rgba(255, 255, 255, 1)'; // stark layout contrast
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const trans = b.translationRu || b.translation;
        if (trans) {
          ctx.font = '900 13px sans-serif';
          ctx.strokeText(b.word.toUpperCase(), cx, b.y - 10);
          ctx.fillText(b.word.toUpperCase(), cx, b.y - 10);

          ctx.fillStyle = '#475569'; // slate-600/700
          ctx.font = 'bold 9px sans-serif';
          ctx.strokeText(trans, cx, b.y + 2);
          ctx.fillText(trans, cx, b.y + 2);

          // Sound icon
          ctx.fillStyle = `hsla(${b.hue}, 100%, 30%, 1)`;
          ctx.font = '11px Arial, sans-serif';
          ctx.fillText('🔊', cx, b.y + 14);
        } else {
          ctx.font = '900 15px sans-serif';
          ctx.strokeText(b.word.toUpperCase(), cx, b.y - 6);
          ctx.fillText(b.word.toUpperCase(), cx, b.y - 6);

          // Sound icon
          ctx.fillStyle = `hsla(${b.hue}, 100%, 30%, 1)`;
          ctx.font = '14px Arial, sans-serif';
          ctx.fillText('🔊', cx, b.y + 10);
        }

        // 5. Warning Red-Zone limits evaluation when crossing alertY boundary
        if (b.y - b.radius * 0.5 <= alertY) {
          s.bubbles.splice(i, 1);
          if (targetBubbleRef.current?.id === b.id) {
            const nextTarget = s.bubbles.find((item) => !item.bursting) || null;
            targetBubbleRef.current = nextTarget;
            setTargetBubble(nextTarget);
          }
          speakSound.playLose();
          saveProgress(recordWordStruggled(loadProgress(), 'bubble-popper', b.word));
          setWordStudyStats((previous) => ({
            ...previous,
            [b.word]: {
              spoken: previous[b.word]?.spoken || 0,
              struggled: (previous[b.word]?.struggled || 0) + 1,
            },
          }));

          // Authoritative count reduce to prevent dual frame lags collision
          s.lives -= 1;
          setLives(s.lives);

          if (s.lives <= 0) {
            handleGameOver();
          }
        }
      }

      // Update & Render splattered cartoon watercolor burst droplets particles
      for (let k = s.particles.length - 1; k >= 0; k--) {
        const p = s.particles[k];
        p.life += dtFactor;
        p.x += p.vx * dtFactor;
        p.y += p.vy * dtFactor;
        p.vy += 0.082 * dtFactor; // small gravitation pull

        ctx.fillStyle = p.color;
        ctx.beginPath();
        const particleRadius = Math.max(0, p.size * (1 - p.life / p.maxLife));
        ctx.arc(p.x, p.y, particleRadius, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          s.particles.splice(k, 1);
        }
      }

      // Automatically elevate difficulty levels at benchmarks
      const computedLvl = Math.min(5, Math.floor(s.score / 160) + 1);
      if (computedLvl > s.level) {
        s.level = computedLvl;
        setLevel(computedLvl);
      }

      frameId = requestAnimationFrame(frameLoop);
    };

    // Boot cycle
    frameId = requestAnimationFrame(frameLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [gameState, level, t]);

  return (
    <div className="w-full flex flex-col" id="soap-bubble-popper-root">
      <div className={`w-full mx-auto ${gameState === 'PLAYING' ? 'max-w-xl' : 'max-w-md px-2'}`}>
        <BackToHubButton label={t('shared.backToHub')} onClick={onBackToHub} />
      </div>

      {/* START LOUNGE SCREEN */}
      {gameState === 'START_SCREEN' && (
        <div className="max-w-md mx-auto w-full pb-2 px-2 flex flex-col items-center justify-center">
          <GameSetupCard
            icon={<span className="text-4xl" aria-hidden="true">🫧</span>}
            title={t('games.bubblePopper.title')}
            description={t('games.bubblePopper.description')}
            toneClass="bg-sky-50"
            iconClass="bg-sky-400"
            shadowClass="bubble-shadow-pink"
          >
            {/* Atmosphere Sky Theme Choice */}
            <div className="space-y-2 rounded-2xl border-4 border-slate-900 bg-white p-3 text-left">
              <OptionPicker
                label={t('bubble.chooseSkyAtmosphere')}
                columns={2}
                options={(['sky', 'snow', 'starry', 'nebula'] as BubbleTheme[]).map((theme) => ({
                  id: theme,
                  label: t(`themes.bubble.${theme}`),
                }))}
                selected={bubbleTheme}
                onSelect={setBubbleTheme}
              />

              {/* Dynamic visual preview of selected bubble theme */}
              <div className={`w-full h-24 rounded-2xl border-4 border-slate-900 relative overflow-hidden transition-all duration-300 flex items-center justify-center ${
                bubbleTheme === 'sky' ? 'bg-gradient-to-b from-sky-200 to-sky-450' :
                bubbleTheme === 'snow' ? 'bg-gradient-to-b from-blue-100 to-indigo-200' :
                bubbleTheme === 'starry' ? 'bg-gradient-to-b from-slate-900 to-indigo-950' :
                'bg-gradient-to-b from-purple-950 via-pink-950 to-indigo-900'
              }`}>
                {bubbleTheme === 'sky' && (
                  <>
                    <span className="absolute top-3 left-6 text-2xl opacity-80 animate-bounce">☁️</span>
                    <span className="absolute bottom-4 right-10 text-xl opacity-80">☁️</span>
                    <span className="absolute bottom-5 left-16 text-3xl animate-pulse">🫧</span>
                    <span className="absolute top-2 right-16 text-2xl">🎈</span>
                  </>
                )}
                {bubbleTheme === 'snow' && (
                  <>
                    <span className="absolute top-2 left-10 text-xl animate-spin" style={{ animationDuration: '8s' }}>❄️</span>
                    <span className="absolute bottom-3 right-6 text-3xl animate-pulse">⛄</span>
                    <span className="absolute bottom-4 left-12 text-2xl animate-bounce">🫧</span>
                    <span className="absolute top-4 right-16 text-xl">❄️</span>
                  </>
                )}
                {bubbleTheme === 'starry' && (
                  <>
                    <span className="absolute top-2 left-6 text-2xl animate-pulse">🌙</span>
                    <span className="absolute top-4 right-10 text-xs text-yellow-200 animate-ping">✨</span>
                    <span className="absolute bottom-4 left-20 text-3xl animate-bounce">🫧</span>
                    <span className="absolute bottom-5 right-20 text-xs text-yellow-200 animate-pulse">✨</span>
                  </>
                )}
                {bubbleTheme === 'nebula' && (
                  <>
                    <span className="absolute top-3 left-8 text-2xl animate-pulse">🪐</span>
                    <span className="absolute bottom-4 right-8 text-2xl">☄️</span>
                    <span className="absolute bottom-3 left-24 text-3xl animate-bounce">🫧</span>
                    <span className="absolute top-2 right-20 text-xl opacity-70">🌌</span>
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

            <ListenAndLearnSection words={activeCategory.id === 'custom' ? customWords : vocabularyList} />

            <CustomWordsSection
              customWords={customWords}
              onAddWord={onAddCustomWord}
              onDeleteWord={onDeleteCustomWord}
              onClearAll={onClearCustomWords}
            />

            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 border-4 border-slate-900 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-102 active:translate-y-1.5 active:shadow-none bubble-shadow-green uppercase tracking-wide"
              id="btn-start-bubble-popper"
            >
              <Play className="w-6 h-6 fill-current stroke-[3.5]" /> {t('shared.startPopping')}
            </button>
          </GameSetupCard>
        </div>
      )}

      {/* PLAYING STATE AREA */}
      {gameState === 'PLAYING' && (
        <div className="max-w-xl mx-auto w-full space-y-4 text-center">
          
          <GameHeader
            icon={<span className="text-2xl" aria-hidden="true">🫧</span>}
            title={t('games.bubblePopper.title')}
            subtitle={`${t('bubble.words')} ${
              activeCategory.id === 'custom'
                ? t('shared.myWords')
                : t(`wordSets.${activeCategory.id}`)
            }`}
            stats={[
              {
                label: t('shared.lives'),
                value: (
                  <span className="inline-flex items-center gap-0.5">
                    {[1, 2, 3].map((heart) => (
                      <Heart
                        key={heart}
                        className={`h-3.5 w-3.5 ${
                          heart <= lives
                            ? 'fill-rose-500 text-rose-600'
                            : 'fill-slate-200 text-slate-300'
                        }`}
                      />
                    ))}
                  </span>
                ),
                tone: 'violet',
              },
              { label: t('racer.scoreHud'), value: score, tone: 'amber' },
              { label: t('header.level'), value: level, tone: 'sky' },
            ]}
          />

          {/* Prominent pause / resume control */}
          <PauseButton
            paused={paused}
            onToggle={togglePause}
            pauseLabel={t('shared.pause')}
            resumeLabel={t('shared.resume')}
          />

          {/* Gameplay Canvas wrapper */}
          <div className="relative border-8 border-slate-900 rounded-3xl overflow-hidden shadow-2xl bg-indigo-950">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full block aspect-[3/4] sm:aspect-[4/5] bg-sky-200 cursor-pointer"
              style={{ maxHeight: '512px' }}
            />

            {/* Micro-Help Tips banner */}
            <div className="absolute top-2 w-full px-2 flex justify-center pointer-events-none">
              <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[9px] px-3 py-1 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1.5 shadow-sm">
                🎙️ {t('bubble.sayAnyWord')}
              </span>
            </div>

            {/* Pause overlay over the bubble canvas */}
            {paused && (
              <div className="absolute inset-0 z-50 bg-slate-900/75 flex flex-col items-center justify-center gap-1">
                <span className="text-5xl" aria-hidden="true">⏸️</span>
                <span className="text-xl font-black uppercase tracking-widest text-orange-400">
                  {t('shared.paused')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {displayedBubble && (
              <TargetWordCard
                ribbon={t('shared.targetRibbon')}
                word={displayedBubble.word}
                translation={displayedBubble.translationRu || displayedBubble.translation}
                translationRu={displayedBubble.translationRu}
                heard={lastHeardTranscript}
                heardLabel={t('shared.youSaidHeard')}
                onListenEn={() => triggerPhonemicHelp(displayedBubble.word)}
                onListenRu={() =>
                  displayedBubble.translationRu && speakWord(displayedBubble.translationRu, 'ru')
                }
              />
            )}

            <div role="status" aria-live="polite" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 bg-slate-100 px-3 py-1.5">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${voiceStatus.status === 'listening' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                {voiceStatus.status === 'listening' ? t('shared.micListening') : voiceStatus.message}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* GAME OVER CARD RECAP */}
      {gameState === 'GAME_OVER' && (
        <div className="max-w-md mx-auto w-full px-2 pb-4 animate-scale-up">
          <GameResultCard
            title={t('bubble.gameOverTitle')}
            description={t('bubble.gameOverSubtitle')}
            scoreLabel={t('bubble.poppingScore')}
            score={score}
            bestLabel={t('bubble.personalHigh')}
            best={Math.max(highScore, score)}
            wordStats={wordStudyStats}
            words={vocabularyList}
            replayLabel={t('bubble.playAgain')}
            onReplay={startGame}
            icon={<span className="block text-5xl" aria-hidden="true">🫧🏆</span>}
            summary={(
              <button
                type="button"
                onClick={() => setGameState('START_SCREEN')}
                className="w-full rounded-2xl border-4 border-slate-900 bg-white py-3 text-xs font-black uppercase tracking-wider text-slate-800 hover:bg-slate-50"
              >
                {t('bubble.bubbleOptions')}
              </button>
            )}
            toneClass="bg-sky-50"
            shadowClass="bubble-shadow-rose"
          />
        </div>
      )}

    </div>
  );
};

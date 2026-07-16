import { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';

import { loadProgress, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, pickAdaptiveWordIndex } from '../progress';
import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
import { matchesWord, speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';
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

interface TreasureHunterGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
  onAddCustomWord?: (word: string, translation: string) => void;
  onDeleteCustomWord?: (index: number) => void;
  onClearCustomWords?: () => void;
}

const LOCAL_LANG = {
  en: {
    title: 'Voice Treasure Hunter',
    description: 'Steer the submarine! Pronounce words correctly to dive deeper and collect treasure chests! 🐳',
    start: 'Start Diving',
    score: 'Chests',
    best: 'Best Score',
    paused: 'Paused',
    resume: 'Resume',
    pause: 'Pause',
    chooseSet: 'Choose Word Set',
    myWords: 'My Words',
    sayThis: '🎯 PRONOUNCE TO DIVE!:',
    chooseTheme: 'CHOOSE SUBMARINE COLOR:',
  },
  ru: {
    title: 'Поиск Сокровищ',
    description: 'Управляй подлодкой! Произноси слова правильно, чтобы погружаться глубже и собирать сундуки! 🐳',
    start: 'Начать погружение',
    score: 'Сундуки',
    best: 'Рекорд',
    paused: 'Пауза',
    resume: 'Продолжить',
    pause: 'Пауза',
    chooseSet: 'Выбрать набор слов',
    myWords: 'Мои слова',
    sayThis: '🎯 ПРОИЗНЕСИ ДЛЯ ПОГРУЖЕНИЯ!:',
    chooseTheme: 'ЦВЕТ ПОДВОДНОЙ ЛОДКИ:',
  }
};

interface BubbleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  growth: number;
}

interface SeaLife {
  x: number;
  y: number;
  type: 'fish' | 'jellyfish' | 'angler';
  speed: number;
  size: number;
  color: string;
  wobbleSpeed: number;
  wobbleRange: number;
}

type SubColor = 'yellow' | 'orange' | 'cyan' | 'neon';

export function TreasureHunterGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
  onAddCustomWord = () => undefined,
  onDeleteCustomWord = () => undefined,
  onClearCustomWords = () => undefined,
}: TreasureHunterGameProps) {
  const { language, t } = useUiLanguage();
  const strings = Object.fromEntries(
    Object.keys(LOCAL_LANG.en).map((key) => [key, t(`treasure.${key}`)]),
  ) as Record<keyof typeof LOCAL_LANG.en, string>;

  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [phase, setPhase] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [target, setTarget] = useState('');
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [feedback, setFeedback] = useState<'correct' | 'listening' | 'idle'>('idle');
  const [subColor, setSubColor] = useState<SubColor>('yellow');
  const [lastRecognized, setLastRecognized] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const phaseRef = useRef(phase);
  const pausedRef = useRef(paused);
  const livesRef = useRef(lives);
  const scoreRef = useRef(score);
  const targetRef = useRef(target);
  const subColorRef = useRef(subColor);
  const wordIndexRef = useRef(-1);

  // Prevention of double trigger (debouncing)
  const lastTTSPlayTime = useRef(0);
  const lastTriggerTime = useRef(0);

  // Submarine movement/states
  const subY = useRef(200);
  const subTargetY = useRef(200);
  const subAngle = useRef(0);
  const depth = useRef(0);
  const targetDepth = useRef(0);
  const timerProgress = useRef(100);

  const bubbles = useRef<BubbleParticle[]>([]);
  const seaLifes = useRef<SeaLife[]>([]);
  const chestX = useRef(550);
  const chestY = useRef(200);
  const chestCollected = useRef(false);
  const chestScale = useRef(1);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { subColorRef.current = subColor; }, [subColor]);

  // Score reporting
  useEffect(() => {
    onScoreChange?.(score);
    if (score > highScore) {
      onUpdateHighScore?.(score);
    }
  }, [score, highScore, onScoreChange, onUpdateHighScore]);

  const wordList = useCallback((): WordData[] => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0 ? customWords : (BUILTIN_CATEGORIES[0].words as WordData[]);
    }
    return activeCategory.words as WordData[];
  }, [activeCategory, customWords]);

  const playWordTTS = useCallback((word: string) => {
    lastTTSPlayTime.current = Date.now();
    speakWord(word);
  }, []);

  const nextWord = useCallback(() => {
    const list = wordList();
    if (list.length === 0) return;

    const words = list.map((w) => w.word);
    const wordStats = loadProgress()['treasure-hunter'].words;
    const nextIdx = pickAdaptiveWordIndex(words, wordStats, wordIndexRef.current);

    wordIndexRef.current = nextIdx;
    const word = list[nextIdx].word;
    setTarget(word);
    setFeedback('listening');
    setLastRecognized('');
    timerProgress.current = 100;
    chestCollected.current = false;
    chestScale.current = 1;
    
    // Choose new chest location ahead of submarine
    chestX.current = 500 + Math.random() * 80;
    chestY.current = 150 + Math.random() * 150;
    
    // Set target Y for sub to head towards chest
    subTargetY.current = chestY.current;
  }, [wordList]);

  const triggerDive = useCallback(() => {
    if (phaseRef.current === 'PLAYING' && !pausedRef.current) {
      chestCollected.current = true;
      speakSound.playCorrect();
      setFeedback('correct');

      // Create burst of bubbles!
      for (let i = 0; i < 30; i++) {
        bubbles.current.push({
          x: chestX.current + 20,
          y: chestY.current + 15,
          vx: (Math.random() - 0.5) * 6,
          vy: -1 - Math.random() * 4,
          size: 3 + Math.random() * 8,
          alpha: 1,
          growth: 0.05,
        });
      }
    }
  }, []);

  // Preview Loop for Start Screen
  useEffect(() => {
    if (phase !== 'START') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let lastTime = performance.now();

    // Helper for submarine drawing
    const drawRoundedRect = (ctx2d: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
      ctx2d.beginPath();
      ctx2d.moveTo(x + radius, y);
      ctx2d.lineTo(x + width - radius, y);
      ctx2d.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx2d.lineTo(x + width, y + height - radius);
      ctx2d.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx2d.lineTo(x + radius, y + height);
      ctx2d.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx2d.lineTo(x, y + radius);
      ctx2d.quadraticCurveTo(x, y, x + radius, y);
      ctx2d.closePath();
    };

    const previewLoop = () => {
      const now = performance.now();
      let dt = now - lastTime;
      lastTime = now;
      if (dt > 100) dt = 16.67;
      const dtFactor = dt / (1000 / 160);
      frame += dtFactor;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep sea background
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0ea5e9');
      grad.addColorStop(1, '#0369a1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bubbles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 5; i++) {
        const x = (Math.sin(frame * 0.02 + i) * 0.4 + 0.5) * canvas.width;
        const y = (Math.cos(frame * 0.05 + i * 2) * 0.2 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      const subYOffset = Math.sin(frame * 0.05) * 5;
      ctx.translate(canvas.width / 2 - 10, canvas.height / 2 + subYOffset - 10);
      
      // Color themes
      let subAccent = '#f59e0b';
      let windowRim = '#38bdf8';
      if (subColor === 'orange') {
        subAccent = '#ea580c';
        windowRim = '#fde047';
      } else if (subColor === 'cyan') {
        subAccent = '#06b6d4';
        windowRim = '#c084fc';
      } else if (subColor === 'neon') {
        subAccent = '#10b981';
        windowRim = '#f43f5e';
      }

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Light beam
      const beamGrad = ctx.createLinearGradient(60, 15, 200, 15);
      beamGrad.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
      beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(55, 10);
      ctx.lineTo(180, -20);
      ctx.lineTo(180, 50);
      ctx.closePath();
      ctx.fill();

      // Propeller tail
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-35, 10, 12, 10);
      ctx.strokeRect(-35, 10, 12, 10);

      const propSpin = Math.sin(frame) * 16;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-35, 15 - propSpin);
      ctx.lineTo(-35, 15 + propSpin);
      ctx.stroke();

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.5;

      // Body
      ctx.fillStyle = subAccent;
      drawRoundedRect(ctx, -25, -5, 80, 40, 20);
      ctx.fill();
      ctx.stroke();

      // Periscope
      ctx.fillStyle = '#64748b';
      ctx.fillRect(15, -22, 8, 18);
      ctx.strokeRect(15, -22, 8, 18);
      ctx.fillRect(23, -22, 8, 8);
      ctx.strokeRect(23, -22, 8, 8);

      // Window
      ctx.fillStyle = windowRim;
      ctx.beginPath();
      ctx.arc(35, 15, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.arc(35, 15, 8, 0, Math.PI * 2);
      ctx.fill();

      // Highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(38, 12, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      animId = requestAnimationFrame(previewLoop);
    };

    previewLoop();
    return () => cancelAnimationFrame(animId);
  }, [phase, subColor]);

  const handleTranscript = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'PLAYING' || pausedRef.current) return;
      setLastRecognized(text);
      const current = targetRef.current;
      if (!current) return;

      const now = Date.now();
      if (now - lastTTSPlayTime.current < 750) return;
      if (now - lastTriggerTime.current < 750) return;

      if (matchesWord(text, current, true) || checkLooseMatch(text, current)) {
        lastTriggerTime.current = now;
        triggerDive();
        setWordStudyStats((prevStats) => ({
          ...prevStats,
          [current]: {
            spoken: (prevStats[current]?.spoken || 0) + 1,
            struggled: prevStats[current]?.struggled || 0,
          },
        }));
        saveProgress(recordWordSpoken(loadProgress(), 'treasure-hunter', current));

        // Collect chest and increment score
        setTimeout(() => {
          setScore((s) => s + 1);
          targetDepth.current += 100; // dive deeper
          nextWord();
        }, 800);
      }
    },
    [nextWord, triggerDive]
  );

  const { status, isSupported, start, stop } = useSpeechRecognition(handleTranscript);

  const handleTimeout = useCallback(() => {
    if (livesRef.current <= 0) return;
    speakSound.playLose();
    const nextL = livesRef.current - 1;
    setLives(nextL);
    livesRef.current = nextL;

    // Red damage bubbles
    for (let i = 0; i < 20; i++) {
      bubbles.current.push({
        x: 150,
        y: subY.current + 15,
        vx: (Math.random() - 0.5) * 8,
        vy: -2 - Math.random() * 3,
        size: 4 + Math.random() * 6,
        alpha: 1,
        growth: 0.02,
      });
    }

    // Record struggle
    const current = targetRef.current;
    if (current) {
      setWordStudyStats((prevStats) => ({
        ...prevStats,
        [current]: {
          spoken: prevStats[current]?.spoken || 0,
          struggled: (prevStats[current]?.struggled || 0) + 1,
        },
      }));
      saveProgress(recordWordStruggled(loadProgress(), 'treasure-hunter', current));
    }

    if (nextL <= 0) {
      setTimeout(() => {
        setPhase('GAMEOVER');
        stop();
      }, 0);
    } else {
      nextWord();
    }
  }, [stop, nextWord]);

  // Start game loop
  const startGame = () => {
    saveProgress(recordSessionPlayed(loadProgress(), 'treasure-hunter'));
    setScore(0);
    setLives(3);
    livesRef.current = 3;
    depth.current = 0;
    targetDepth.current = 0;
    subY.current = 200;
    subTargetY.current = 200;
    setWordStudyStats({});
    setPhase('PLAYING');

    // Spawn some initial sealife
    const newLife: SeaLife[] = [];
    for (let i = 0; i < 8; i++) {
      newLife.push({
        x: Math.random() * 600,
        y: 50 + Math.random() * 300,
        type: Math.random() > 0.6 ? 'jellyfish' : 'fish',
        speed: 0.5 + Math.random() * 1.5,
        size: 15 + Math.random() * 20,
        color: `hsl(${Math.random() * 360}, 85%, 65%)`,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        wobbleRange: 5 + Math.random() * 10,
      });
    }
    seaLifes.current = newLife;
    bubbles.current = [];

    // Trigger Speech
    start();
    nextWord();
  };

  // Main game physics and loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const updateAndDraw = () => {
      if (phaseRef.current !== 'PLAYING') return;

      const w = canvas.width;
      const h = canvas.height;

      const now = performance.now();
      let dt = now - lastTime;
      lastTime = now;

      // Handle pause state
      if (pausedRef.current) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(strings.paused.toUpperCase(), w / 2, h / 2);
        
        animId = requestAnimationFrame(updateAndDraw);
        return;
      }

      if (dt > 100) dt = 16.67;
      const dtFactor = dt / (1000 / 160);

      // Smooth depth progression
      depth.current += (targetDepth.current - depth.current) * (1 - Math.pow(1 - 0.05, dtFactor));

      // BACKGROUND - changes depending on depth!
      // shallow (0-200) -> teal/cyan
      // mid (200-500) -> deep blue
      // deep (500+) -> purple/indigo/black
      const depthFactor = Math.min(1, depth.current / 800);
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      
      const r1 = Math.round(14 + (2 - 14) * depthFactor);
      const g1 = Math.round(116 - 100 * depthFactor);
      const b1 = Math.round(144 - 100 * depthFactor);

      const r2 = Math.round(8 - 5 * depthFactor);
      const g2 = Math.round(47 - 35 * depthFactor);
      const b2 = Math.round(73 - 55 * depthFactor);

      grad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
      grad.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Light ray effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(100, 0);
      ctx.lineTo(200, 0);
      ctx.lineTo(w, h * 0.7);
      ctx.lineTo(w - 200, h);
      ctx.closePath();
      ctx.fill();

      // UPDATE TIMER PROGRESS
      // Decrements progress. If hits 0, trigger timeout.
      if (!chestCollected.current) {
        timerProgress.current = Math.max(0, timerProgress.current - 0.25 * dtFactor);
        if (timerProgress.current <= 0) {
          handleTimeout();
        }
      }

      // Physics/movement of Submarine
      if (chestCollected.current) {
        // Move towards chest
        subTargetY.current = chestY.current;
        const dx = chestX.current - 150;
        const dy = chestY.current - subY.current;
        subY.current += dy * (1 - Math.pow(1 - 0.1, dtFactor));
        subAngle.current = Math.atan2(dy, dx + 100) * 0.5;
        
        // Propeller bubbles
        if (Math.random() < 0.6 * dtFactor) {
          bubbles.current.push({
            x: 100,
            y: subY.current + 15,
            vx: (-3 - Math.random() * 3) * dtFactor,
            vy: ((Math.random() - 0.5) * 2) * dtFactor,
            size: 2 + Math.random() * 4,
            alpha: 1,
            growth: 0.03 * dtFactor,
          });
        }
        
        chestScale.current = Math.max(0, chestScale.current - 0.05 * dtFactor);
      } else {
        // Standard idle bobbing
        const targetY = subTargetY.current + Math.sin(Date.now() / 250) * 8;
        subY.current += (targetY - subY.current) * (1 - Math.pow(1 - 0.06, dtFactor));
        subAngle.current = (targetY - subY.current) * 0.02;

        if (Math.random() < 0.3 * dtFactor) {
          bubbles.current.push({
            x: 100,
            y: subY.current + 15,
            vx: (-1 - Math.random() * 2) * dtFactor,
            vy: ((Math.random() - 0.5) * 1.5) * dtFactor,
            size: 1 + Math.random() * 3,
            alpha: 0.8,
            growth: 0.02 * dtFactor,
          });
        }
      }

      // DRAW PARTICLES / BUBBLES
      bubbles.current.forEach((b, index) => {
        b.x += b.vx;
        b.y += b.vy;
        b.size += b.growth;
        b.alpha = Math.max(0, b.alpha - 0.015 * dtFactor);
        if (b.alpha <= 0) {
          bubbles.current.splice(index, 1);
          return;
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * 0.6})`;
        ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 0.25})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // DRAW SEA LIFE IN BACKGROUND
      seaLifes.current.forEach((fish) => {
        fish.x -= fish.speed * dtFactor;
        if (fish.x < -100) {
          fish.x = w + 100;
          fish.y = 50 + Math.random() * 300;
        }

        ctx.save();
        ctx.translate(fish.x, fish.y);
        ctx.fillStyle = fish.color;
        ctx.globalAlpha = 0.35; // background blur look

        if (fish.type === 'jellyfish') {
          const wobble = Math.sin(Date.now() * fish.wobbleSpeed) * fish.wobbleRange;
          // cap
          ctx.beginPath();
          ctx.arc(0, wobble, fish.size, Math.PI, 0);
          ctx.fill();
          // tentacles
          ctx.strokeStyle = fish.color;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-fish.size / 2, wobble);
          ctx.quadraticCurveTo(-fish.size / 2 + wobble, wobble + 20, -fish.size / 2, wobble + 35);
          ctx.moveTo(0, wobble);
          ctx.quadraticCurveTo(wobble, wobble + 22, 0, wobble + 40);
          ctx.moveTo(fish.size / 2, wobble);
          ctx.quadraticCurveTo(fish.size / 2 + wobble, wobble + 20, fish.size / 2, wobble + 35);
          ctx.stroke();
        } else {
          // simple fish
          ctx.beginPath();
          ctx.ellipse(0, 0, fish.size, fish.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          // tail
          ctx.beginPath();
          ctx.moveTo(fish.size, 0);
          ctx.lineTo(fish.size + 10, -8);
          ctx.lineTo(fish.size + 10, 8);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });

      // DRAW CHEST (TARGET)
      if (chestScale.current > 0) {
        ctx.save();
        ctx.translate(chestX.current, chestY.current);
        ctx.scale(chestScale.current, chestScale.current);

        // Glow ring
        const glowRad = 35 + Math.sin(Date.now() / 150) * 5;
        const glowGrad = ctx.createRadialGradient(20, 15, 5, 20, 15, glowRad);
        glowGrad.addColorStop(0, 'rgba(253, 224, 71, 0.6)');
        glowGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(20, 15, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Target word card behind/above chest
        ctx.font = 'bold 16px sans-serif';
        const txtWidth = ctx.measureText(targetRef.current).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, 20 - txtWidth / 2 - 10, -42, txtWidth + 20, 28, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(targetRef.current, 20, -24);

        // Chest Body Drawing
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;

        // Base
        ctx.fillStyle = '#b45309';
        drawRoundedRect(ctx, 0, 10, 40, 25, 4);
        ctx.fill();
        ctx.stroke();

        // Lid
        ctx.fillStyle = chestCollected.current ? '#fde047' : '#d97706';
        ctx.beginPath();
        ctx.arc(20, 10, 20, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Golden details
        ctx.fillStyle = '#fde047';
        ctx.fillRect(17, 10, 6, 12);
        ctx.strokeRect(17, 10, 6, 12);

        // Lock
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(20, 18, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // DRAW SUBMARINE
      ctx.save();
      ctx.translate(150, subY.current);
      ctx.rotate(subAngle.current);

      // Color themes
      let subAccent = '#f59e0b'; // yellow base
      let windowRim = '#38bdf8'; // cyan rim
      if (subColorRef.current === 'orange') {
        subAccent = '#ea580c';
        windowRim = '#fde047';
      } else if (subColorRef.current === 'cyan') {
        subAccent = '#06b6d4';
        windowRim = '#c084fc';
      } else if (subColorRef.current === 'neon') {
        subAccent = '#10b981';
        windowRim = '#f43f5e';
      }

      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Light Cone from submarine nose
      const beamGrad = ctx.createLinearGradient(60, 15, w - 150, 15);
      beamGrad.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
      beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(55, 10);
      ctx.lineTo(w - 150, chestY.current - subY.current - 40);
      ctx.lineTo(w - 150, chestY.current - subY.current + 40);
      ctx.closePath();
      ctx.fill();

      // 2. Propeller tail mechanism
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-35, 10, 12, 10);
      ctx.strokeRect(-35, 10, 12, 10);

      // Spin rotation
      const propSpin = Math.sin(Date.now() / 50) * 16;
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-35, 15 - propSpin);
      ctx.lineTo(-35, 15 + propSpin);
      ctx.stroke();

      // 3. Submarine main body capsule
      ctx.fillStyle = subAccent;
      drawRoundedRect(ctx, -25, -5, 80, 40, 20);
      ctx.fill();
      ctx.stroke();

      // 4. Periscope
      ctx.fillStyle = '#64748b';
      ctx.fillRect(15, -22, 8, 18);
      ctx.strokeRect(15, -22, 8, 18);
      ctx.fillRect(20, -25, 12, 6);
      ctx.strokeRect(20, -25, 12, 6);

      // Lens glow
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(28, -24, 4, 4);

      // 5. Windows
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = windowRim;
      ctx.lineWidth = 3.5;

      const drawWindow = (wx: number) => {
        ctx.beginPath();
        ctx.arc(wx, 15, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // shine highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(wx - 3, 12, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e2e8f0';
      };

      drawWindow(5);
      drawWindow(32);

      // 6. Front spotlight headlight
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(52, 15, 6, -Math.PI / 2, Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // DEPTH TEXT DISPLAY
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${t('treasure.depth')}: ${Math.round(depth.current)}m`, 20, 30);

      // WORD TIME TIMER BAR - large and pinned to the top-center so the
      // countdown is obvious (was a small, easy-to-miss bar at the bottom).
      if (feedback === 'listening') {
        const barW = Math.min(320, w * 0.6);
        const barX = w / 2 - barW / 2;
        const barY = 50;
        const barH = 18;
        const danger = timerProgress.current <= 40;

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⏱ ${language === 'ru' ? 'ВРЕМЯ' : 'TIME'}`, w / 2, barY - 7);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, barX, barY, barW, barH, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = danger ? '#f43f5e' : '#10b981';
        const currentW = (barW - 6) * (timerProgress.current / 100);
        if (currentW > 0) {
          drawRoundedRect(ctx, barX + 3, barY + 3, currentW, barH - 6, 5);
          ctx.fill();
        }
        ctx.textAlign = 'left';
      }

      animId = requestAnimationFrame(updateAndDraw);
    };

    animId = requestAnimationFrame(updateAndDraw);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [phase, language, feedback]);

  const list = wordList();

  return (
    <section className="flex-1 flex flex-col justify-between p-2 sm:p-4 md:p-8 max-w-6xl w-full mx-auto select-none relative animate-fade-in">
      <div className={`w-full mx-auto ${phase === 'PLAYING' ? 'max-w-3xl' : 'max-w-md px-2'}`}>
        <BackToHubButton label={t('shared.backToHub')} onClick={() => { stop(); onBackToHub(); }} />
      </div>

      {/* Main Canvas view area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {phase === 'START' && (
          <div className="max-w-md mx-auto w-full px-2 pb-4 animate-scale-up">
            <GameSetupCard
              icon={<span className="text-3.5xl" aria-hidden="true">🐳</span>}
              title={strings.title}
              description={strings.description}
              toneClass="bg-cyan-50"
              iconClass="bg-cyan-400"
              shadowClass="bubble-shadow-cyan"
            >

              {/* CHOOSE SUBMARINE COLOR */}
              <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
                <OptionPicker
                  label={strings.chooseTheme}
                  columns={4}
                  options={(['yellow', 'orange', 'cyan', 'neon'] as SubColor[]).map((color) => ({
                    id: color,
                    label: t(`themes.treasure.${color}`),
                  }))}
                  selected={subColor}
                  onSelect={(color) => {
                    speakSound.playCoin();
                    setSubColor(color);
                  }}
                />
                
                {/* Active Animated Preview Canvas */}
                <div className="w-full h-24 rounded-2xl border-4 border-slate-900 relative overflow-hidden bg-white mt-3">
                  <canvas
                    ref={previewCanvasRef}
                    width={300}
                    height={100}
                    className="w-full max-w-[300px] aspect-[3/1] mx-auto block"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 border border-white/20 text-white font-black text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md z-10">
                    {t('shared.preview')}
                  </div>
                </div>
              </div>

              {/* CHOOSE WORD SET */}
              <WordSetPicker
                legend={strings.chooseSet}
                myWordsLabel={strings.myWords}
                activeCategoryId={activeCategory.id}
                customWords={customWords}
                onSelect={setActiveCategory}
              />

              <ListenAndLearnSection words={activeCategory.id === 'custom' ? customWords : wordList()} />

              <CustomWordsSection
                customWords={customWords}
                onAddWord={onAddCustomWord}
                onDeleteWord={onDeleteCustomWord}
                onClearAll={onClearCustomWords}
              />

              {!isSupported && (
                <p className="text-xs font-bold text-rose-600 text-center" role="alert">
                  {t('shared.voiceNeedsChrome')}
                </p>
              )}

              <button
                type="button"
                onClick={startGame}
                disabled={!isSupported}
                className="w-full py-3.5 bg-cyan-400 hover:bg-cyan-50 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current stroke-[3]" /> {strings.start}
              </button>
            </GameSetupCard>
          </div>
        )}

        {phase === 'PLAYING' && (
          <div className="w-full max-w-3xl flex flex-col gap-4 relative">
            <GameHeader
              icon={<span className="text-xl" aria-hidden="true">🐳</span>}
              title={strings.title}
              subtitle={`${
                activeCategory.id === 'custom'
                  ? strings.myWords
                  : t(`wordSets.${activeCategory.id}`)
              } - ${t(`themes.treasure.${subColor}`)}`}
              stats={[
                { label: '💰', value: `$${score * 100}`, tone: 'emerald' },
                { label: strings.score, value: score, tone: 'amber' },
                {
                  label: t('shared.lives'),
                  value: (
                    <span className="inline-flex items-center gap-0.5">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={idx < lives ? 'opacity-100' : 'opacity-25 grayscale'}
                          aria-hidden="true"
                        >
                          ❤️
                        </span>
                      ))}
                    </span>
                  ),
                  tone: 'violet',
                },
                { label: strings.best, value: Math.max(highScore, score), tone: 'sky' },
              ]}
            />

            <PauseButton
              paused={paused}
              onToggle={() => setPaused((current) => !current)}
              pauseLabel={strings.pause}
              resumeLabel={strings.resume}
            />

            <canvas
              ref={canvasRef}
              width={640}
              height={380}
              className="bg-sky-950 border-8 border-slate-900 rounded-3xl w-full aspect-[640/380] shadow-2xl block"
            />

            {(() => {
              const currentWordItem = list.find(
                (item) => item.word.toLowerCase() === target.toLowerCase(),
              );
              return (
                <TargetWordCard
                  ribbon={strings.sayThis}
                  word={target}
                  translation={currentWordItem?.translationRu || currentWordItem?.translation}
                  translationRu={currentWordItem?.translationRu}
                  heard={lastRecognized}
              heardLabel={t('shared.youSaidHeard')}
                  onListenEn={() => {
                    playWordTTS(target);
                    if (!target) return;
                    setWordStudyStats((previous) => ({
                      ...previous,
                      [target]: {
                        spoken: previous[target]?.spoken || 0,
                        struggled: (previous[target]?.struggled || 0) + 1,
                      },
                    }));
                    saveProgress(recordWordStruggled(loadProgress(), 'treasure-hunter', target));
                  }}
                  onListenRu={() =>
                    currentWordItem?.translationRu && speakWord(currentWordItem.translationRu, 'ru')
                  }
                />
              );
            })()}

            {/* Hearing status bar */}
            <div className="text-center font-extrabold text-[10px] uppercase tracking-widest text-slate-600 bg-slate-100/60 py-1.5 px-3 rounded-full inline-block mx-auto border-2 border-slate-300">
              {status.status === 'listening' ? (
                <span className="text-cyan-800 animate-pulse">
                  {t('shared.micListening')}
                </span>
              ) : (
                <span className="text-slate-500">{status.message}</span>
              )}
            </div>
          </div>
        )}

        {phase === 'GAMEOVER' && (
          <div className="w-full max-w-md mx-auto px-2 pb-4 animate-scale-up">
            <GameResultCard
              title={t('treasure.diveCompleted')}
              description={language === 'ru'
                ? 'Подлодка исчерпала запасы прочности, но сундуки с сокровищами найдены!'
                : 'The submarine ran out of strength, but you gathered incredible treasures!'}
              scoreLabel={t('treasure.totalChests')}
              score={score}
              bestLabel={t('treasure.bestRecord')}
              best={Math.max(highScore, score)}
              wordStats={wordStudyStats}
              words={list}
              replayLabel={strings.start}
              onReplay={startGame}
              icon={<span className="block text-5xl" aria-hidden="true">🐳💰</span>}
              toneClass="bg-cyan-50"
              shadowClass="bubble-shadow-cyan"
            />
          </div>
        )}
      </div>
    </section>
  );
}

// Loose match algorithm for voice speech variations
function checkLooseMatch(transcript: string, target: string): boolean {
  const cleanT = transcript.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const cleanTar = target.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  
  if (cleanT === cleanTar || cleanT.includes(cleanTar) || cleanTar.includes(cleanT)) {
    if (cleanTar.length > 2 && cleanT.length >= cleanTar.length - 1) {
      return true;
    }
  }

  const fullDist = getLevenshteinDistance(cleanT, cleanTar);
  if (cleanTar.length <= 4) {
    if (fullDist <= 1 && cleanT.length >= cleanTar.length - 1) return true;
  } else {
    if (fullDist <= 2 && cleanT.length >= cleanTar.length - 2) return true;
  }

  const words = cleanT.split(/\s+/);
  for (const w of words) {
    if (w === cleanTar) return true;
    if (w.includes(cleanTar) || cleanTar.includes(w)) {
      if (cleanTar.length > 2 && w.length >= cleanTar.length - 1) {
        return true;
      }
    }
    const dist = getLevenshteinDistance(w, cleanTar);
    if (cleanTar.length <= 4) {
      if (dist <= 1 && w.length >= cleanTar.length - 1) return true;
    } else {
      if (dist <= 2 && w.length >= cleanTar.length - 2) return true;
    }
  }
  return false;
}

function getLevenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

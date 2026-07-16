import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, pickAdaptiveWordIndex, GameId } from '../progress';
import { Play, Heart } from 'lucide-react';

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

interface AsteWordGameProps {
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
    title: 'AsteWord Destroyer',
    description: 'Destroy the slowly falling asteroids by saying the English words written on them! ☄️',
    start: 'Start Defense',
    score: 'Destroyed',
    best: 'Best Score',
    paused: 'Paused',
    resume: 'Resume',
    pause: 'Pause',
    chooseSet: 'Choose Word Set',
    myWords: 'My Words',
    chooseTheme: 'CHOOSE SPACE SECTOR THEME:',
    chooseDifficulty: 'CHOOSE DIFFICULTY LEVEL:',
    easy: 'Easy 🟢',
    medium: 'Medium 🟡',
    hard: 'Hard 🔴',
  },
  ru: {
    title: 'АстеВорд Разрушитель',
    description: 'Уничтожай медленно летящие астероиды, произнося написанные на них английские слова! ☄️',
    start: 'Начать оборону',
    score: 'Сбито',
    best: 'Рекорд',
    paused: 'Пауза',
    resume: 'Продолжить',
    pause: 'Пауза',
    chooseSet: 'Выбрать набор слов',
    myWords: 'Мои слова',
    chooseTheme: 'ВЫБЕРИ КОСМИЧЕСКИЙ СЕКТОР:',
    chooseDifficulty: 'ВЫБЕРИ УРОВЕНЬ СЛОЖНОСТИ:',
    easy: 'Легкий 🟢',
    medium: 'Средний 🟡',
    hard: 'Сложный 🔴',
  }
};

interface Asteroid {
  id: number;
  x: number;
  y: number;
  speed: number;
  word: string;
  /** Русский перевод, показывается под английским словом (issue #107). */
  translation?: string;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface Laser {
  tx: number;
  ty: number;
  life: number;
}

interface Shockwave {
  x: number;
  y: number;
  r: number;
  maxR: number;
  alpha: number;
}

type SpaceTheme = 'galaxy' | 'supernova' | 'aurora';

export function AsteWordGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
  onAddCustomWord = () => undefined,
  onDeleteCustomWord = () => undefined,
  onClearCustomWords = () => undefined,
}: AsteWordGameProps) {
  const { t } = useUiLanguage();
  const strings = Object.fromEntries(
    Object.keys(LOCAL_LANG.en).map((key) => [key, t(`aste.${key}`)]),
  ) as Record<keyof typeof LOCAL_LANG.en, string>;

  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [phase, setPhase] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [lives, setLives] = useState(3);
  const [theme, setTheme] = useState<SpaceTheme>('galaxy');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [lastRecognized, setLastRecognized] = useState<string>('');
  const [activeAsteroids, setActiveAsteroids] = useState<Asteroid[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const phaseRef = useRef(phase);
  const pausedRef = useRef(paused);
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const themeRef = useRef(theme);
  const difficultyRef = useRef(difficulty);

  // Кулдаун двойного выстрела
  const lastTriggerTime = useRef(0);

  // Объекты
  const asteroids = useRef<Asteroid[]>([]);
  const particles = useRef<Particle[]>([]);
  const laser = useRef<Laser | null>(null);
  const shockwaves = useRef<Shockwave[]>([]);

  const spawnTimer = useRef<number>(0);
  const astIdCounter = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { themeRef.current = theme; }, [theme]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  // Безопасное обновление счета (без React-крашей)
  useEffect(() => {
    onScoreChange?.(score);
    if (score > highScore) {
      onUpdateHighScore?.(score);
    }
  }, [score, highScore, onScoreChange, onUpdateHighScore]);

  // Keep the canvas backing store aligned with its responsive CSS size so the
  // game coordinates always match what the child sees on screen.
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const renderedWidth = Math.round(canvas.getBoundingClientRect().width) || 400;
      const renderedHeight = Math.round(renderedWidth * 0.75);
      if (canvas.width !== renderedWidth || canvas.height !== renderedHeight) {
        canvas.width = renderedWidth;
        canvas.height = renderedHeight;
      }
    };

    resizeCanvas();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [phase]);

  // Fill the start-screen preview frame and keep its drawing coordinates in
  // sync with the responsive 3:1 canvas size.
  useEffect(() => {
    if (phase !== 'START') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const renderedWidth = Math.round(bounds.width) || 300;
      const renderedHeight = Math.round(bounds.height) || Math.round(renderedWidth / 3);
      if (canvas.width !== renderedWidth || canvas.height !== renderedHeight) {
        canvas.width = renderedWidth;
        canvas.height = renderedHeight;
      }
    };

    resizeCanvas();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }

    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [phase]);

  const wordList = useCallback((): WordData[] => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0 ? customWords : (BUILTIN_CATEGORIES[0].words as WordData[]);
    }
    return activeCategory.words as WordData[];
  }, [activeCategory, customWords]);

  const shootLaserAt = (targetAst: Asteroid) => {
    speakSound.playCorrect();
    laser.current = { tx: targetAst.x, ty: targetAst.y, life: 12 };

    // Создаем ударную волну взрыва
    shockwaves.current.push({
      x: targetAst.x,
      y: targetAst.y,
      r: 10,
      maxR: 55,
      alpha: 1.0
    });

    for (let i = 0; i < 25; i++) {
      particles.current.push({
        x: targetAst.x,
        y: targetAst.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: 2 + Math.random() * 4,
        color: themeRef.current === 'supernova' 
          ? ['#f97316', '#ef4444', '#facc15', '#f43f5e'][Math.floor(Math.random() * 4)]
          : ['#06b6d4', '#3b82f6', '#ffd700', '#ec4899'][Math.floor(Math.random() * 4)],
        alpha: 1,
      });
    }

    const destroyedWord = targetAst.word;
    setWordStudyStats((prevStats) => ({
      ...prevStats,
      [destroyedWord]: {
        spoken: (prevStats[destroyedWord]?.spoken || 0) + 1,
        struggled: prevStats[destroyedWord]?.struggled || 0,
      },
    }));
    saveProgress(recordWordSpoken(loadProgress(), 'aste-word', destroyedWord));

    asteroids.current = asteroids.current.filter((a) => a.id !== targetAst.id);
    setActiveAsteroids([...asteroids.current]);
    setScore((s) => s + 1);
  };

  const handleTranscript = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'PLAYING' || pausedRef.current) return;
      setLastRecognized(text); // Display what was heard!

      const now = Date.now();
      // Lower cooldown (400ms) to allow rapid defense shooting
      if (now - lastTriggerTime.current < 400) return;

      const matched = asteroids.current.find((ast) => {
        return matchesWord(text, ast.word, true);
      });

      if (matched) {
        lastTriggerTime.current = now;
        shootLaserAt(matched);
      }
    },
    []
  );

  const { status, isSupported, start, stop } = useSpeechRecognition(handleTranscript);

  // Безопасная обработка удара по щиту
  const handleShieldHit = useCallback((index: number) => {
    if (livesRef.current <= 0) return;
    const missedWord = asteroids.current[index]?.word;
    if (missedWord) {
      setWordStudyStats((prevStats) => ({
        ...prevStats,
        [missedWord]: {
          spoken: prevStats[missedWord]?.spoken || 0,
          struggled: (prevStats[missedWord]?.struggled || 0) + 1,
        },
      }));
      saveProgress(recordWordStruggled(loadProgress(), 'aste-word', missedWord));
    }
    speakSound.playLose();
    const nextL = livesRef.current - 1;
    setLives(nextL);
    livesRef.current = nextL;

    if (nextL <= 0) {
      setTimeout(() => {
        setPhase('GAMEOVER');
        stop();
      }, 0);
    }
    asteroids.current.splice(index, 1);
    setActiveAsteroids([...asteroids.current]);
  }, [stop]);

  // Отрисовка тем космических фонов
  const drawThemeBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const activeTheme = themeRef.current;

    // Глубокий космос
    const spaceGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (activeTheme === 'galaxy') {
      spaceGrad.addColorStop(0, '#020617');
      spaceGrad.addColorStop(1, '#0f172a');
    } else if (activeTheme === 'supernova') {
      spaceGrad.addColorStop(0, '#0f0505');
      spaceGrad.addColorStop(1, '#1c0a0a');
    } else {
      spaceGrad.addColorStop(0, '#090514');
      spaceGrad.addColorStop(1, '#1e1b4b');
    }
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, width, height);

    // Рисуем светящиеся туманности (космическую пыль)
    ctx.globalAlpha = 0.08;
    if (activeTheme === 'galaxy') {
      ctx.fillStyle = '#22d3ee'; // Голубой
      ctx.beginPath(); ctx.arc(width * 0.25, height / 3, 140, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6366f1'; // Индиго
      ctx.beginPath(); ctx.arc(width * 0.8, height * 0.67, 160, 0, Math.PI * 2); ctx.fill();
    } else if (activeTheme === 'supernova') {
      ctx.fillStyle = '#ea580c'; // Оранжевый
      ctx.beginPath(); ctx.arc(width / 2, height / 2 - 50, 150, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; // Красный
      ctx.beginPath(); ctx.arc(width * 0.3, height * 0.73, 120, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#a21caf'; // Фуксия
      ctx.beginPath(); ctx.arc(width * 0.2, height * 0.27, 130, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#10b981'; // Изумрудный
      ctx.beginPath(); ctx.arc(width - 100, 210, 150, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Мерцание звезд
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 15; i++) {
      const sx = (Math.sin(i * 1234) * 0.5 + 0.5) * width;
      const sy = (Math.cos(i * 5678) * 0.5 + 0.5) * height;
      ctx.globalAlpha = 0.15 + Math.abs(Math.sin(Date.now() / 400 + i)) * 0.6;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // Для полярного сияния (Aurora) - рисуем колышущиеся неоновые волны
    if (activeTheme === 'aurora') {
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 12;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const y = 80 + Math.sin(Date.now() / 600 + x * 0.015) * 20;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 8;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const y = 110 + Math.sin(Date.now() / 450 + x * 0.01) * 25;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
  }, []);

  // Игровой цикл Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const gameLoop = () => {
      if (phaseRef.current !== 'PLAYING') return;

      const now = performance.now();
      let dt = now - lastTime;
      lastTime = now;

      if (pausedRef.current) {
        animId = requestAnimationFrame(gameLoop);
        return;
      }

      if (dt > 100) dt = 16.67;
      const dtFactor = dt / (1000 / 160);

      // 1. Медленный плавный спавн
      spawnTimer.current += dtFactor;

      // Pacing budget: a child needs ~3-4s per word including recognition
      // latency, so even Hard must leave that much time per asteroid.
      const diff = difficultyRef.current;
      let spawnDelay = Math.max(280, 440 - scoreRef.current * 5);
      let maxAsteroids = 2;
      let baseSpeed = 0.35 + scoreRef.current * 0.007;
      let speedRandomRange = 0.12;

      if (diff === 'easy') {
        spawnDelay = Math.max(360, 540 - scoreRef.current * 5);
        maxAsteroids = 1; // Only 1 asteroid at a time for extremely relaxed play
        baseSpeed = 0.2 + scoreRef.current * 0.004;
        speedRandomRange = 0.08;
      } else if (diff === 'medium') {
        spawnDelay = Math.max(280, 440 - scoreRef.current * 5);
        maxAsteroids = 2;
        baseSpeed = 0.35 + scoreRef.current * 0.007;
        speedRandomRange = 0.12;
      } else if (diff === 'hard') {
        spawnDelay = Math.max(220, 340 - scoreRef.current * 4);
        maxAsteroids = 3;
        baseSpeed = 0.55 + scoreRef.current * 0.012;
        speedRandomRange = 0.2;
      }

      if (spawnTimer.current >= spawnDelay && asteroids.current.length < maxAsteroids) {
        spawnTimer.current = 0;
        const list = wordList();
        if (list.length > 0) {
          const words = list.map((w) => w.word);
          const wordStats = loadProgress()['aste-word'].words;
          const randomWord = words[pickAdaptiveWordIndex(words, wordStats)];
          const wordItem = list.find((w) => w.word === randomWord);
          asteroids.current.push({
            id: astIdCounter.current++,
            x: 40 + Math.random() * (canvas.width - 80),
            y: -20,
            speed: baseSpeed + Math.random() * speedRandomRange,
            word: randomWord,
            translation: wordItem?.translationRu || wordItem?.translation,
            size: 20,
          });
          setActiveAsteroids([...asteroids.current]);
        }
      }

      // 2. Движение астероидов и шлейф пыли комет ☄️
      for (let index = asteroids.current.length - 1; index >= 0; index--) {
        const ast = asteroids.current[index];
        ast.y += ast.speed * dtFactor;

        if (Math.random() < 0.25 * dtFactor) {
          particles.current.push({
            x: ast.x + (Math.random() - 0.5) * 6,
            y: ast.y - 12,
            vx: ((Math.random() - 0.5) * 1) * dtFactor,
            vy: -ast.speed * 0.5 * dtFactor,
            size: 1 + Math.random() * 2,
            color: themeRef.current === 'supernova' ? '#ea580c' : '#22d3ee', 
            alpha: 0.8,
          });
        }

        if (ast.y > canvas.height - 35) {
          handleShieldHit(index);
        }
      }

      // 3. Обновление лазера
      if (laser.current) {
        laser.current.life -= dtFactor;
        if (laser.current.life <= 0) laser.current = null;
      }

      // 4. Обновление частиц
      for (let index = particles.current.length - 1; index >= 0; index--) {
        const p = particles.current[index];
        p.x += p.vx * dtFactor;
        p.y += p.vy * dtFactor;
        p.alpha -= 0.03 * dtFactor;
        if (p.alpha <= 0) {
          particles.current.splice(index, 1);
        }
      }

      // 5. Обновление ударных волн
      for (let index = shockwaves.current.length - 1; index >= 0; index--) {
        const sw = shockwaves.current[index];
        sw.r += 2.2 * dtFactor;
        sw.alpha -= 0.04 * dtFactor;
        if (sw.alpha <= 0) {
          shockwaves.current.splice(index, 1);
        }
      }

      // --- ОТРИСОВКА ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Динамический фон
      drawThemeBackground(ctx, canvas.width, canvas.height);

      // Отрисовка взрывов
      particles.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Отрисовка ударных волн взрыва ⚡
      shockwaves.current.forEach((sw) => {
        ctx.strokeStyle = `rgba(34, 211, 238, ${sw.alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Отрисовка неонового лазера
      if (laser.current) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = laser.current.life * 1.2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height - 15);
        ctx.lineTo(laser.current.tx, laser.current.ty);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = laser.current.life / 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height - 15);
        ctx.lineTo(laser.current.tx, laser.current.ty);
        ctx.stroke();
      }

      // Отрисовка астероидов (с увеличенным размером!)
      asteroids.current.forEach((ast) => {
        ctx.font = '42px sans-serif';
        ctx.fillText('☄️', ast.x - 20, ast.y + 12);

        ctx.font = 'bold 13px sans-serif';
        const textWidth = ctx.measureText(ast.word).width;

        // Русский перевод под английским словом (issue #107): бейдж
        // растёт вверх, чтобы не наехать на сам астероид.
        let ruWidth = 0;
        if (ast.translation) {
          ctx.font = 'bold 11px sans-serif';
          ruWidth = ctx.measureText(ast.translation).width;
        }

        const rw = Math.max(textWidth, ruWidth) + 16;
        const rh = ast.translation ? 36 : 21;
        const rx = ast.x - rw / 2;
        const ry = ast.y - 13 - rh;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;

        drawRoundedRect(ctx, rx, ry, rw, rh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px sans-serif';
        if (ast.translation) {
          ctx.fillText(ast.word, ast.x - textWidth / 2, ast.y - 35);
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#4f46e5';
          ctx.fillText(ast.translation, ast.x - ruWidth / 2, ast.y - 21);
        } else {
          ctx.fillText(ast.word, ast.x - textWidth / 2, ast.y - 20);
        }
      });

      // Светящийся щит на дне экрана (вспыхивает при падении астероидов)
      ctx.strokeStyle = themeRef.current === 'supernova' ? '#f43f5e' : '#22d3ee';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(10, canvas.height - 5);
      ctx.lineTo(canvas.width - 10, canvas.height - 5);
      ctx.stroke();

      // Энергетический купол пушки
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height, 25, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // Пушка 🗼
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height - 15);
      ctx.lineTo(canvas.width / 2, canvas.height - 35);
      ctx.stroke();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [phase, paused, stop, wordList, handleShieldHit, drawThemeBackground]);

  // Анимация петли превью-холста в Лобби
  useEffect(() => {
    if (phase !== 'START') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    
    let miniAsteroids = [
      { x: 50, y: 10, speed: 0.3, word: 'Star' },
      { x: 150, y: -20, speed: 0.2, word: 'Moon' },
      { x: 240, y: 20, speed: 0.25, word: 'Sky' },
    ];

    const previewLoop = () => {
      if (phaseRef.current !== 'START') return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawThemeBackground(ctx, canvas.width, canvas.height);

      // Двигаем и рисуем мини-астероиды
      miniAsteroids.forEach((ast) => {
        ast.y += ast.speed;
        if (ast.y > canvas.height) {
          ast.y = -20;
          ast.x = 20 + Math.random() * (canvas.width - 40);
        }

        ctx.font = '16px sans-serif';
        ctx.fillText('☄️', ast.x - 8, ast.y + 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText(ast.word, ast.x - 8, ast.y - 6);
      });

      // Мини пушка 🗼
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height, 15, Math.PI, 0);
      ctx.fill();

      animId = requestAnimationFrame(previewLoop);
    };

    animId = requestAnimationFrame(previewLoop);
    return () => cancelAnimationFrame(animId);
  }, [phase, theme, drawThemeBackground]);

  const startGame = useCallback(() => {
    speakSound.playCoin();
    const updatedProgress = recordSessionPlayed(loadProgress(), 'aste-word');
    saveProgress(updatedProgress);
    setScore(0);
    setWordStudyStats({});
    setLives(3);
    livesRef.current = 3;
    setPhase('PLAYING');
    setPaused(false);
    pausedRef.current = false;
    asteroids.current = [];
    setActiveAsteroids([]);
    particles.current = [];
    laser.current = null;
    shockwaves.current = [];
    spawnTimer.current = 999; 
    lastTriggerTime.current = 0;
    setLastRecognized('');
    start();
  }, [start]);

  const togglePause = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (next) stop();
      else start();
      return next;
    });
  }, [start, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const list = wordList();
  const primaryAsteroid = activeAsteroids.reduce<Asteroid | null>(
    (closest, asteroid) => (!closest || asteroid.y > closest.y ? asteroid : closest),
    null,
  );
  const displayedTargetWord = primaryAsteroid?.word || list[0]?.word;
  const primaryWord = displayedTargetWord
    ? list.find((item) => item.word.toLowerCase() === displayedTargetWord.toLowerCase())
    : undefined;

  return (
    <section className="w-full max-w-3xl mx-auto py-4 px-2" aria-label={strings.title}>
      <div className={`w-full mx-auto ${phase === 'PLAYING' ? 'max-w-3xl' : 'max-w-md px-2'}`}>
        <BackToHubButton label={t('shared.backToHub')} onClick={() => { stop(); onBackToHub(); }} />
      </div>

      {phase === 'START' && (
        <div className="w-full max-w-md mx-auto px-2">
          <GameSetupCard
          icon={<span className="text-3.5xl" aria-hidden="true">☄️</span>}
          title={strings.title}
          description={strings.description}
          toneClass="bg-indigo-50"
          iconClass="bg-indigo-400"
          shadowClass="bubble-shadow-purple"
        >

          {/* CHOOSE SPACE SECTOR ENVIRONMENT */}
          <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <OptionPicker
              label={strings.chooseTheme}
              options={(['galaxy', 'supernova', 'aurora'] as const).map((themeId) => ({
                id: themeId,
                label: t(`themes.aste.${themeId}`),
              }))}
              selected={theme}
              onSelect={(themeId) => {
                speakSound.playCoin();
                setTheme(themeId);
              }}
            />

            {/* Активный анимированный Preview Canvas */}
            <div className="w-full h-24 rounded-2xl border-4 border-slate-900 relative overflow-hidden bg-white">
              <canvas
                ref={previewCanvasRef}
                width={300}
                height={100}
                className="block w-full aspect-[3/1]"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 border border-white/20 text-white font-black text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md z-10">
                {t('shared.preview')}
              </div>
            </div>
          </div>

          <WordSetPicker
            legend={strings.chooseSet}
            myWordsLabel={strings.myWords}
            activeCategoryId={activeCategory.id}
            customWords={customWords}
            onSelect={setActiveCategory}
          />

          <ListenAndLearnSection words={activeCategory.id === 'custom' ? customWords : list} />

          <CustomWordsSection
            customWords={customWords}
            onAddWord={onAddCustomWord}
            onDeleteWord={onDeleteCustomWord}
            onClearAll={onClearCustomWords}
          />

          {/* CHOOSE DIFFICULTY */}
          <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <OptionPicker
              label={strings.chooseDifficulty}
              options={(['easy', 'medium', 'hard'] as const).map((diffId) => ({
                id: diffId,
                label: strings[diffId],
              }))}
              selected={difficulty}
              onSelect={(diffId) => {
                speakSound.playCoin();
                setDifficulty(diffId);
              }}
            />
          </div>

          {!isSupported && (
            <p className="text-xs font-bold text-rose-600 text-center" role="alert">
              {t('shared.voiceNeedsChrome')}
            </p>
          )}

          <button
            type="button"
            onClick={startGame}
            disabled={!isSupported}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current stroke-[3]" /> {strings.start}
          </button>
          </GameSetupCard>
        </div>
      )}

      {phase === 'PLAYING' && (
        <div className="space-y-4">
          <GameHeader
            icon={<span className="text-xl" aria-hidden="true">☄️</span>}
            title={strings.title}
            subtitle={`${
              activeCategory.id === 'custom'
                ? strings.myWords
                : t(`wordSets.${activeCategory.id}`)
            } - ${t(`themes.aste.${theme}`)} - ${strings[difficulty]}`}
            stats={[
              { label: strings.score, value: score, tone: 'amber' },
              {
                label: t('aste.shield'),
                value: (
                  <span className="inline-flex items-center gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`h-3.5 w-3.5 ${
                          i < lives
                            ? 'fill-cyan-400 text-cyan-500'
                            : 'fill-slate-200 text-slate-300'
                        }`}
                      />
                    ))}
                  </span>
                ),
                tone: 'sky',
              },
              { label: strings.best, value: Math.max(highScore, score), tone: 'emerald' },
            ]}
          />

          <PauseButton
            paused={paused}
            onToggle={togglePause}
            pauseLabel={strings.pause}
            resumeLabel={strings.resume}
          />

          <div className="relative border-8 border-slate-900 rounded-3xl overflow-hidden bg-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="block w-full aspect-[4/3]"
            />
            {paused && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-1">
                <span className="text-4xl" aria-hidden="true">⏸️</span>
                <span className="text-lg font-black uppercase tracking-widest text-orange-400">{strings.paused}</span>
              </div>
            )}
          </div>

          {displayedTargetWord && (
            <TargetWordCard
              ribbon={t('shared.targetRibbon')}
              word={displayedTargetWord}
              translation={primaryWord?.translationRu || primaryWord?.translation}
              translationRu={primaryWord?.translationRu}
              heard={lastRecognized}
              heardLabel={t('shared.youSaidHeard')}
              onListenEn={() => {
                speakWord(displayedTargetWord, 'en');
                setWordStudyStats((previous) => ({
                  ...previous,
                  [displayedTargetWord]: {
                    spoken: previous[displayedTargetWord]?.spoken || 0,
                    struggled: (previous[displayedTargetWord]?.struggled || 0) + 1,
                  },
                }));
                saveProgress(recordWordStruggled(loadProgress(), 'aste-word', displayedTargetWord));
              }}
              onListenRu={() =>
                primaryWord?.translationRu && speakWord(primaryWord.translationRu, 'ru')
              }
            />
          )}

          {/* Active Target Cards with Pronunciation */}
          <div className="bg-slate-50 border-4 border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <span className="block text-xs font-black uppercase tracking-widest text-indigo-500 mb-2.5">
              {t('aste.activeTargets')}
            </span>
            {activeAsteroids.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold py-1.5 text-center bg-white border-2 border-dashed border-slate-300 rounded-xl">
                {t('aste.waitingTargets')}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {activeAsteroids.map((ast) => {
                  const currentWordItem = list.find(
                    (item) => item.word.toLowerCase() === ast.word.toLowerCase(),
                  );
                  const translation = currentWordItem?.translationRu || currentWordItem?.translation;
                  return (
                    <div
                      key={ast.id}
                      className="bg-white border-2 border-slate-900 p-2 rounded-xl flex items-center justify-between shadow-sm animate-scale-up"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-black text-slate-900 block truncate">{ast.word}</span>
                        {translation && (
                          <span className="text-[10px] font-bold text-indigo-600 block truncate">{translation}</span>
                        )}
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            speakWord(ast.word, 'en');
                            setWordStudyStats((p) => ({
                              ...p,
                              [ast.word]: {
                                spoken: p[ast.word]?.spoken || 0,
                                struggled: (p[ast.word]?.struggled || 0) + 1,
                              },
                            }));
                            saveProgress(recordWordStruggled(loadProgress(), 'aste-word', ast.word));
                          }}
                          className="px-2 py-1 bg-yellow-50 hover:bg-yellow-200 border-2 border-slate-900 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 cursor-pointer shadow-sm active:translate-y-0.5"
                        >
                          EN 🔊
                        </button>
                        {currentWordItem?.translationRu && (
                          <button
                            onClick={() => {
                              speakWord(currentWordItem.translationRu, 'ru');
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-200 border-2 border-slate-900 rounded-lg text-[10px] font-black uppercase inline-flex items-center gap-1 cursor-pointer shadow-sm active:translate-y-0.5"
                          >
                            RU 🔊
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-center bg-slate-100 border-2 border-slate-900 rounded-xl py-2 px-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700 animate-pulse">
              {status.status === 'listening' ? t('shared.micListening') : status.message}
            </p>
          </div>
        </div>
      )}

      {phase === 'GAMEOVER' && (
        <div className="max-w-md mx-auto w-full px-2 pb-4 animate-scale-up">
          <GameResultCard
            title={t('aste.gameOver')}
            description={t('aste.report')}
            scoreLabel={t('aste.destroyedTotal')}
            score={score}
            bestLabel={t('aste.galaxyRecord')}
            best={Math.max(highScore, score)}
            wordStats={wordStudyStats}
            words={list}
            replayLabel={strings.start}
            onReplay={startGame}
            icon={<span className="block text-5xl" aria-hidden="true">☄️💥</span>}
            toneClass="bg-indigo-50"
            shadowClass="bubble-shadow-rose"
          />
        </div>
      )}
    </section>
  );
}

// Кроссбраузерное скругление прямоугольников на Canvas (100% защита от вылетов)
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


import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, pickAdaptiveWordIndex, GameId } from '../progress';
import { ArrowLeft, Play, Pause, RotateCcw, Heart, BookOpen, Volume2 } from 'lucide-react';

import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
import { matchesWord, speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { useUiLanguage } from '../uiLanguage';

interface AsteWordGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
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
    micListening: '🎤 Space defenses listening...',
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
    micListening: '🎤 Космо-оборона слушает...',
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
}: AsteWordGameProps) {
  const { language, t } = useUiLanguage();
  const strings = LOCAL_LANG[language as 'en' | 'ru'] || LOCAL_LANG.en;

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

  const wordList = useCallback((): WordData[] => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0 ? customWords : (BUILTIN_CATEGORIES[0].words as WordData[]);
    }
    return activeCategory.words as WordData[];
  }, [activeCategory, customWords]);

  const shootLaserAt = (targetAst: Asteroid) => {
    speakSound.playAccelerate(); 
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
    speakSound.playCrash(); 
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
      ctx.beginPath(); ctx.arc(100, 100, 140, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6366f1'; // Индиго
      ctx.beginPath(); ctx.arc(320, 200, 160, 0, Math.PI * 2); ctx.fill();
    } else if (activeTheme === 'supernova') {
      ctx.fillStyle = '#ea580c'; // Оранжевый
      ctx.beginPath(); ctx.arc(width / 2, height / 2 - 50, 150, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444'; // Красный
      ctx.beginPath(); ctx.arc(120, 220, 120, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#a21caf'; // Фуксия
      ctx.beginPath(); ctx.arc(80, 80, 130, 0, Math.PI * 2); ctx.fill();
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

    const gameLoop = () => {
      if (phaseRef.current !== 'PLAYING') return;

      if (!pausedRef.current) {
        // 1. Медленный плавный спавн
        spawnTimer.current++;

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
            asteroids.current.push({
              id: astIdCounter.current++,
              x: 40 + Math.random() * (canvas.width - 80),
              y: -20,
              speed: baseSpeed + Math.random() * speedRandomRange,
              word: randomWord,
              size: 20,
            });
            setActiveAsteroids([...asteroids.current]);
          }
        }

        // 2. Движение астероидов и шлейф пыли комет ☄️
        for (let index = asteroids.current.length - 1; index >= 0; index--) {
          const ast = asteroids.current[index];
          ast.y += ast.speed;

          if (Math.random() < 0.25) {
            particles.current.push({
              x: ast.x + (Math.random() - 0.5) * 6,
              y: ast.y - 12,
              vx: (Math.random() - 0.5) * 1,
              vy: -ast.speed * 0.5,
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
          laser.current.life--;
          if (laser.current.life <= 0) laser.current = null;
        }

        // 4. Обновление частиц
        for (let index = particles.current.length - 1; index >= 0; index--) {
          const p = particles.current[index];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;
          if (p.alpha <= 0) {
            particles.current.splice(index, 1);
          }
        }

        // 5. Обновление ударных волн
        for (let index = shockwaves.current.length - 1; index >= 0; index--) {
          const sw = shockwaves.current[index];
          sw.r += 2.2;
          sw.alpha -= 0.04;
          if (sw.alpha <= 0) {
            shockwaves.current.splice(index, 1);
          }
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

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;

        const rx = ast.x - textWidth / 2 - 8;
        const ry = ast.y - 34;
        const rw = textWidth + 16;
        const rh = 21;

        drawRoundedRect(ctx, rx, ry, rw, rh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(ast.word, ast.x - textWidth / 2, ast.y - 20);
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

  return (
    <section className="max-w-md mx-auto py-4 px-2" aria-label="AsteWord game">
      <button
        onClick={() => {
          stop();
          onBackToHub();
        }}
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 stroke-[3]" /> {t('shared.backToHub')}
      </button>

      {phase === 'START' && (
        <div className="space-y-4 p-6 border-8 border-slate-900 rounded-4xl bg-indigo-50 bubble-shadow-purple">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-18 h-18 rounded-3xl bg-indigo-400 border-4 border-slate-900 flex items-center justify-center animate-bounce">
              <span className="text-3.5xl">☄️</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-wider text-slate-900">
              {strings.title}
            </h1>
            <p className="text-xs font-bold text-slate-600 max-w-xs leading-relaxed">
              {strings.description}
            </p>
          </div>

          {/* CHOOSE SPACE SECTOR ENVIRONMENT */}
          <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <label className="block text-xs font-black text-indigo-500 uppercase tracking-widest ml-1">
              {strings.chooseTheme}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['galaxy', 'supernova', 'aurora'] as const).map((themeId) => (
                <button
                  key={themeId}
                  onClick={() => {
                    speakSound.playCoin();
                    setTheme(themeId);
                  }}
                  className={`px-2 py-2 border-4 rounded-xl text-[9px] font-black uppercase transition-all tracking-wider cursor-pointer text-center ${
                    theme === themeId
                      ? 'bg-indigo-400 border-slate-900 text-slate-900 shadow-sm -translate-y-0.5'
                      : 'bg-white border-slate-300 text-slate-650 hover:border-slate-900'
                  }`}
                >
                  {themeId === 'galaxy' ? 'GALAXY' : themeId === 'supernova' ? 'SUPERNOVA' : 'AURORA'}
                </button>
              ))}
            </div>

            {/* Активный анимированный Preview Canvas */}
            <div className="w-full h-24 rounded-2xl border-4 border-slate-900 relative overflow-hidden bg-white">
              <canvas
                ref={previewCanvasRef}
                width={300}
                height={100}
                className="w-full max-w-[300px] aspect-[3/1] mx-auto block"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 border border-white/20 text-white font-black text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-md z-10">
                Preview
              </div>
            </div>
          </div>

          <fieldset className="text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <legend className="text-xs font-black uppercase tracking-wider text-slate-700 px-1">
              {strings.chooseSet}
            </legend>
            <div className="flex flex-wrap gap-2">
              {BUILTIN_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl border-4 text-xs font-black uppercase tracking-wide cursor-pointer ${
                    activeCategory.id === cat.id
                      ? 'bg-indigo-400 border-slate-900 text-slate-900'
                      : 'bg-white border-slate-300 text-slate-650'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              <button
                onClick={() =>
                  setActiveCategory({
                    id: 'custom',
                    name: strings.myWords,
                    description: '',
                    icon: 'edit',
                    words: customWords,
                  })
                }
                className={`px-3 py-1.5 rounded-xl border-4 text-xs font-black uppercase tracking-wide cursor-pointer ${
                  activeCategory.id === 'custom'
                    ? 'bg-pink-400 border-slate-900 text-pink-900'
                    : 'bg-white border-slate-300 text-slate-650'
                }`}
              >
                {strings.myWords} ({customWords.length})
              </button>
            </div>
          </fieldset>

          {/* CHOOSE DIFFICULTY */}
          <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <label className="block text-xs font-black text-indigo-500 uppercase tracking-widest ml-1">
              {strings.chooseDifficulty}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((diffId) => (
                <button
                  key={diffId}
                  onClick={() => {
                    speakSound.playCoin();
                    setDifficulty(diffId);
                  }}
                  className={`px-2 py-2 border-4 rounded-xl text-[9px] font-black uppercase transition-all tracking-wider cursor-pointer text-center ${
                    difficulty === diffId
                      ? 'bg-indigo-400 border-slate-900 text-slate-900 shadow-sm -translate-y-0.5'
                      : 'bg-white border-slate-300 text-slate-650 hover:border-slate-900'
                  }`}
                >
                  {strings[diffId]}
                </button>
              ))}
            </div>
          </div>

          {!isSupported && (
            <p className="text-xs font-bold text-rose-600 text-center" role="alert">
              Voice control needs Google Chrome.
            </p>
          )}

          <button
            onClick={startGame}
            disabled={!isSupported}
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 border-4 border-slate-900 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current stroke-[3]" /> {strings.start}
          </button>
        </div>
      )}

      {phase === 'PLAYING' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 bg-white border-4 border-slate-900 rounded-2xl p-3">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">{strings.score}</span>
              <span className="text-xl font-black text-slate-900">☄️ {score}</span>
            </div>
            <div className="text-center border-x-4 border-slate-900 flex flex-col justify-center items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 block">SHIELD</span>
              <div className="flex gap-0.5 justify-center mt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < lives ? 'text-cyan-400 fill-cyan-400 animate-pulse' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">BEST</span>
              <span className="text-xl font-black text-emerald-600 block">{highScore}</span>
            </div>
          </div>

          <div className="relative border-8 border-slate-900 rounded-3xl overflow-hidden bg-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="w-full max-w-[400px] aspect-[4/3] mx-auto block"
            />
            {paused && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-1">
                <span className="text-4xl" aria-hidden="true">⏸️</span>
                <span className="text-lg font-black uppercase tracking-widest text-orange-400">{strings.paused}</span>
              </div>
            )}
          </div>

          {/* Active Target Cards with Pronunciation */}
          <div className="bg-slate-50 border-4 border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <span className="block text-xs font-black uppercase tracking-widest text-indigo-500 mb-2.5">
              {language === 'ru' ? '🎯 ТЕКУЩИЕ ЦЕЛИ (НАЖМИ ДЛЯ ОЗВУЧКИ):' : '🎯 ACTIVE TARGETS (CLICK TO HEAR):'}
            </span>
            {activeAsteroids.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold py-1.5 text-center bg-white border-2 border-dashed border-slate-300 rounded-xl">
                {language === 'ru' ? 'Ожидание появления астероидов...' : 'Waiting for asteroids to enter sector...'}
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

          {lastRecognized && (
            <div className="bg-indigo-50 border-4 border-slate-900 rounded-2xl p-3 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col items-center justify-center gap-1">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">
                {language === 'ru' ? 'Вы сказали / Слышу:' : 'You said / Heard:'}
              </span>
              <span className="text-sm font-black text-indigo-700 italic font-mono truncate max-w-xs">
                "{lastRecognized}"
              </span>
            </div>
          )}

          <button
            onClick={togglePause}
            className={`w-full py-3 border-4 border-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer ${
              paused ? 'bg-orange-400 hover:bg-orange-500 text-slate-900' : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {paused ? <Play className="w-4 h-4 fill-current stroke-[3]" /> : <Pause className="w-4 h-4 fill-current stroke-[3]" />}
            {paused ? strings.resume : strings.pause}
          </button>

          <div className="text-center bg-slate-100 border-2 border-slate-900 rounded-xl py-2 px-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-700 animate-pulse">
              {status.status === 'listening' ? strings.micListening : status.message}
            </p>
          </div>
        </div>
      )}

      {phase === 'GAMEOVER' && (
        <div className="max-w-md mx-auto w-full py-4 animate-scale-up">
          <div className="bg-white border-8 border-slate-900 rounded-4xl p-6 text-center relative overflow-hidden bubble-shadow-rose">
            
            <span className="inline-flex items-center gap-1 bg-rose-400 border-4 border-slate-900 px-4 py-1.5 rounded-full text-slate-900 text-xs font-black uppercase tracking-widest">
              {language === 'ru' ? 'СЕКТОР ЗАЩИЩЕН!' : 'SECTOR DEFENSE OVER!'}
            </span>

            <h2 className="text-3xl font-black text-slate-950 mt-6 mb-2 uppercase tracking-wide">
              {language === 'ru' ? 'КОНЕЦ ИГРЫ!' : 'GAME OVER!'}
            </h2>
            <p className="text-xs text-slate-500 leading-normal font-bold">
              {language === 'ru' ? 'Твой космический отчет по сбитым астероидам:' : 'Review your cosmic asteroid spelling stats below:'}
            </p>

            {/* Score logs */}
            <div className="grid grid-cols-2 gap-3.5 my-6">
              <div className="bg-sky-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest text-center">
                  {language === 'ru' ? 'СБИТО АСТЕРОИДОВ' : 'ASTEROIDS CRUSHED'}
                </span>
                <span className="text-lg font-black text-sky-900 mt-1 font-mono">☄️ {score}</span>
              </div>
              <div className="bg-amber-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">
                  {language === 'ru' ? 'РЕКОРД ГАЛАКТИКИ' : 'GALAXY RECORD'}
                </span>
                <span className="text-lg font-black text-amber-800 mt-1 font-mono">{highScore} lasers</span>
              </div>
            </div>

            {/* Historic word review logs */}
            <div className="bg-indigo-100 border-4 border-slate-900 p-4 rounded-3xl text-left mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <BookOpen className="w-5 h-5 text-indigo-700 stroke-[2.5]" />
                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">
                  {language === 'ru' ? 'Словарь космо-сектора:' : 'Your Spelling Scorecard:'}
                </h4>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {Object.keys(wordStudyStats).length === 0 ? (
                  <div className="text-center py-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
                    <p className="text-xs text-slate-500 font-extrabold leading-normal">
                      {language === 'ru' ? 'Астероидов не сбито. Защити планету в следующий раз!' : 'No asteroids destroyed yet. Fire those lasers!'}
                    </p>
                  </div>
                ) : (
                  Object.keys(wordStudyStats).map((word, idx) => {
                    const spoken = wordStudyStats[word].spoken;
                    const struggled = wordStudyStats[word].struggled;
                    
                    return (
                      <div
                        key={idx}
                        className="bg-white border-2 border-slate-900 p-2 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-slate-950 font-black text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-900 truncate">{word}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[8px] md:text-[9px] text-emerald-800 bg-emerald-100 px-1.5 py-1 rounded-full font-black border border-emerald-300">
                            {language === 'ru' ? 'Сбито:' : 'Kills:'} {spoken}
                          </span>
                          {struggled > 0 && (
                            <span className="text-[8px] md:text-[9px] text-amber-800 bg-amber-100 px-1.5 py-1 rounded-full font-black border border-amber-350">
                              {language === 'ru' ? 'Подсказок:' : 'Clues:'} {struggled}
                            </span>
                          )}
                          <button
                            onClick={() => speakWord(word)}
                            className="p-1 bg-yellow-50 hover:bg-yellow-200 border-2 border-slate-900 rounded-lg cursor-pointer"
                            aria-label={`Hear the word ${word}`}
                          >
                            <Volume2 className="w-3.5 h-3.5 text-slate-900" />
                          </button>
                          {(() => {
                            const matchedObj = list.find(
                              (item) => item.word.toLowerCase() === word.toLowerCase()
                            );
                            return matchedObj?.translationRu ? (
                              <button
                                onClick={() => matchedObj?.translationRu && speakWord(matchedObj.translationRu, 'ru')}
                                className="p-1 bg-blue-100 hover:bg-blue-200 border-2 border-slate-900 rounded-lg cursor-pointer text-blue-800 text-[10px] font-bold"
                                aria-label="Listen in Russian"
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

            {/* Loop Controls */}
            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={startGame}
                className="w-full bg-indigo-500 hover:bg-indigo-600 border-4 border-slate-900 text-white font-black text-xs py-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-1 shadow-md uppercase"
              >
                <RotateCcw className="w-4 h-4 text-white stroke-[3]" /> {strings.start}
              </button>
              
              <button
                onClick={() => {
                  stop();
                  onBackToHub();
                }}
                className="w-full bg-purple-500 hover:bg-purple-600 border-4 border-slate-900 text-white font-black text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md uppercase"
              >
                🏰 {language === 'ru' ? 'ВЫЙТИ В ХАБ' : 'EXIT TO PORTAL'}
              </button>
            </div>

          </div>
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


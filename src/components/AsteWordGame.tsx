import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Heart } from 'lucide-react';

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
  const [lives, setLives] = useState(3);
  const [theme, setTheme] = useState<SpaceTheme>('galaxy');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const phaseRef = useRef(phase);
  const pausedRef = useRef(paused);
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  const themeRef = useRef(theme);

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

    asteroids.current = asteroids.current.filter((a) => a.id !== targetAst.id);
    setScore((s) => s + 1);
  };

  const handleTranscript = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'PLAYING' || pausedRef.current) return;

      const now = Date.now();
      if (now - lastTriggerTime.current < 1000) return;

      const matched = asteroids.current.find((ast) => {
        return matchesWord(text, ast.word, true) || checkLooseMatch(text, ast.word);
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
        const spawnDelay = Math.max(140, 260 - scoreRef.current * 3);

        if (spawnTimer.current >= spawnDelay) {
          spawnTimer.current = 0;
          const list = wordList();
          if (list.length > 0) {
            const randomWord = list[Math.floor(Math.random() * list.length)].word;
            asteroids.current.push({
              id: astIdCounter.current++,
              x: 40 + Math.random() * (canvas.width - 80),
              y: -20,
              speed: 0.11 + scoreRef.current * 0.005 + Math.random() * 0.08,
              word: randomWord,
              size: 20,
            });
          }
        }

        // 2. Движение астероидов и шлейф пыли комет ☄️
        asteroids.current.forEach((ast, index) => {
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
        });

        // 3. Обновление лазера
        if (laser.current) {
          laser.current.life--;
          if (laser.current.life <= 0) laser.current = null;
        }

        // 4. Обновление частиц
        particles.current.forEach((p, index) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;
          if (p.alpha <= 0) {
            particles.current.splice(index, 1);
          }
        });

        // 5. Обновление ударных волн
        shockwaves.current.forEach((sw, index) => {
          sw.r += 2.2;
          sw.alpha -= 0.04;
          if (sw.alpha <= 0) {
            shockwaves.current.splice(index, 1);
          }
        });
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

      // Отрисовка астероидов
      asteroids.current.forEach((ast) => {
        ctx.font = '24px sans-serif';
        ctx.fillText('☄️', ast.x - 12, ast.y + 6);

        ctx.font = 'bold 11px sans-serif';
        const textWidth = ctx.measureText(ast.word).width;

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;

        const rx = ast.x - textWidth / 2 - 6;
        const ry = ast.y - 24;
        const rw = textWidth + 12;
        const rh = 17;

        drawRoundedRect(ctx, rx, ry, rw, rh, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(ast.word, ast.x - textWidth / 2, ast.y - 12);
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
    setScore(0);
    setLives(3);
    livesRef.current = 3;
    setPhase('PLAYING');
    setPaused(false);
    pausedRef.current = false;
    asteroids.current = [];
    particles.current = [];
    laser.current = null;
    shockwaves.current = [];
    spawnTimer.current = 150; 
    lastTriggerTime.current = 0;
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
                className="w-full h-full block"
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
              className="w-full h-[300px] block"
            />
            {paused && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-1">
                <span className="text-4xl" aria-hidden="true">⏸️</span>
                <span className="text-lg font-black uppercase tracking-widest text-white">{strings.paused}</span>
              </div>
            )}
          </div>

          <button
            onClick={togglePause}
            className={`w-full py-3 border-4 border-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer ${
              paused ? 'bg-emerald-400 hover:bg-emerald-500 text-slate-900' : 'bg-indigo-50 hover:bg-indigo-650 text-white'
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
        <div className="space-y-4 p-6 border-8 border-slate-900 rounded-4xl bg-slate-100 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
          <span className="text-5xl" aria-hidden="true">💥</span>
          <h2 className="text-3xl font-black uppercase tracking-wider text-slate-900">Shields Offline!</h2>
          <p className="text-sm font-bold text-slate-600">The asteroids destroyed the planetary shield! Practice words to increase laser battery speed!</p>
          <div className="flex gap-2">
            <button
              onClick={startGame}
              className="flex-1 py-3 bg-indigo-500 hover:bg-indigo-650 text-white font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[3]" /> {strings.start}
            </button>
            <button
              onClick={() => {
                stop();
                onBackToHub();
              }}
              className="flex-1 py-3 bg-white hover:bg-slate-50 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl cursor-pointer"
            >
              Exit
            </button>
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

// Хелперы нечеткого пословного сравнения
function checkLooseMatch(transcript: string, target: string): boolean {
  const cleanT = transcript.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const cleanTar = target.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  
  // 1. Полное совпадение без пробелов
  if (cleanT === cleanTar || cleanT.includes(cleanTar) || cleanTar.includes(cleanT)) {
    if (cleanTar.length > 2 && cleanT.length >= cleanTar.length - 1) {
      return true;
    }
  }

  // 2. Расстояние Левенштейна для всей фразы целиком
  const fullDist = getLevenshteinDistance(cleanT, cleanTar);
  if (cleanTar.length <= 4) {
    if (fullDist <= 1 && cleanT.length >= cleanTar.length - 1) return true;
  } else {
    if (fullDist <= 2 && cleanT.length >= cleanTar.length - 2) return true;
  }

  // 3. Пословное совпадение для длинных предложений
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, GameId } from '../progress';
import { ArrowLeft, Play, Pause, Volume2, Heart, RotateCcw, BookOpen } from 'lucide-react';

import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
import { matchesWord, speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { useUiLanguage } from '../uiLanguage';

interface SkateWordGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
}

const LOCAL_LANG = {
  en: {
    title: 'SkateWord Park',
    description: 'Ride through the park! Speak the words in time to jump and collect stars! 🛹',
    start: 'Start Skating',
    score: 'Stars',
    best: 'Best Score',
    paused: 'Paused',
    resume: 'Resume',
    pause: 'Pause',
    micListening: '🎤 Say the word out loud...',
    chooseSet: 'Choose Word Set',
    myWords: 'My Words',
    sayThis: '🎯 SPEAK TO DO A FLIP!:',
    chooseTheme: 'CHOOSE SKATE PARK ENVIRONMENT:',
  },
  ru: {
    title: 'СкейтВорд Парк',
    description: 'Катайся по парку! Произноси слова вовремя, чтобы делать прыжки и собирать звезды! 🛹',
    start: 'Встать на скейт',
    score: 'Звезды',
    best: 'Рекорд',
    paused: 'Пауза',
    resume: 'Продолжить',
    pause: 'Пауза',
    micListening: '🎤 Произнеси слово...',
    chooseSet: 'Выбрать набор слов',
    myWords: 'Мои слова',
    sayThis: '🎯 ПРОИЗНЕСИ ДЛЯ ТРЮКА!:',
    chooseTheme: 'ВЫБЕРИ ОКРУЖЕНИЕ ПАРКА:',
  }
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
  speed: number;
}

type SkateTheme = 'forest' | 'sunset' | 'cyber';

export function SkateWordGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
}: SkateWordGameProps) {
  const { language, t } = useUiLanguage();
  const strings = LOCAL_LANG[language as 'en' | 'ru'] || LOCAL_LANG.en;

  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [phase, setPhase] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [target, setTarget] = useState('');
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [feedback, setFeedback] = useState<'correct' | 'listening' | 'idle'>('idle');
  const [theme, setTheme] = useState<SkateTheme>('forest');
  const [lastRecognized, setLastRecognized] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const phaseRef = useRef(phase);
  const pausedRef = useRef(paused);
  const livesRef = useRef(lives);
  const scoreRef = useRef(score);
  const targetRef = useRef(target);
  const themeRef = useRef(theme);
  const wordIndexRef = useRef(-1);

  // Временное окно для фильтрации динамиков (TTS)
  const lastTTSPlayTime = useRef(0);
  const lastTriggerTime = useRef(0);

  // Состояние скейта
  const playerY = useRef(205);
  const playerVy = useRef(0);
  const isJumping = useRef(false);
  const isStoppedBeforeObstacle = useRef(false);
  const bgScrollX = useRef(0);
  const wheelAngle = useRef(0);
  const obstacleTimer = useRef(100);

  const clouds = useRef<Cloud[]>([
    { x: 100, y: 35, w: 60, speed: 0.15 },
    { x: 280, y: 55, w: 80, speed: 0.1 },
    { x: 450, y: 25, w: 50, speed: 0.2 },
  ]);

  const particles = useRef<Particle[]>([]);
  const obstacleX = useRef(650);
  const obstacleSpeed = useRef(2.5);
  const obstacleEmojiRef = useRef('🚧');

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  // Оповещение родителя об обновлении счета
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

    let nextIdx = wordIndexRef.current;
    if (list.length > 1) {
      while (nextIdx === wordIndexRef.current) {
        nextIdx = Math.floor(Math.random() * list.length);
      }
    } else {
      nextIdx = 0;
    }

    wordIndexRef.current = nextIdx;
    const word = list[nextIdx].word;
    setTarget(word);
    setFeedback('listening');
    setLastRecognized('');
  }, [wordList]);

  const triggerJump = useCallback(() => {
    if (phaseRef.current === 'PLAYING' && !pausedRef.current) {
      isStoppedBeforeObstacle.current = false;
      playerVy.current = -12.5;
      isJumping.current = true;
      speakSound.playAccelerate();
      setFeedback('correct');

      for (let i = 0; i < 20; i++) {
        particles.current.push({
          x: 110,
          y: playerY.current + 35,
          vx: -2 - Math.random() * 4,
          vy: -2 - Math.random() * 4,
          size: 3 + Math.random() * 4,
          color: themeRef.current === 'cyber' ? '#22d3ee' : '#f43f5e',
          alpha: 1,
        });
      }
    }
  }, []);

  const handleTranscript = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'PLAYING' || pausedRef.current) return;
      setLastRecognized(text); // Store the heard word for UI display!
      const current = targetRef.current;
      if (!current) return;

      const now = Date.now();
      
      // Блокируем микрофон на 750мс во время озвучки (слово произносит динамик)
      if (now - lastTTSPlayTime.current < 750) return;

      // Защита от дребезга / двойного прыжка (750мс)
      if (now - lastTriggerTime.current < 750) return;

      if (matchesWord(text, current, true) || checkLooseMatch(text, current)) {
        lastTriggerTime.current = now; 
        triggerJump();
        setWordStudyStats((prevStats) => ({
          ...prevStats,
          [current]: {
            spoken: (prevStats[current]?.spoken || 0) + 1,
            struggled: prevStats[current]?.struggled || 0,
          },
        }));
        saveProgress(recordWordSpoken(loadProgress(), 'skate-word', current));
        if (phaseRef.current === 'PLAYING') nextWord();
      }
    },
    [nextWord, triggerJump]
  );

  const { status, isSupported, start, stop } = useSpeechRecognition(handleTranscript);

  // Безопасный вызов конца игры
  const handleCollision = useCallback((canvasWidth: number) => {
    speakSound.playCrash();
    const nextL = livesRef.current - 1;
    setLives(nextL);
    livesRef.current = nextL;

    for (let i = 0; i < 25; i++) {
      particles.current.push({
        x: 110,
        y: playerY.current + 20,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: 3 + Math.random() * 5,
        color: '#ef4444',
        alpha: 1,
      });
    }

    if (nextL <= 0) {
      setTimeout(() => {
        setPhase('GAMEOVER');
        stop();
      }, 0);
    } else {
      obstacleX.current = canvasWidth + 150; 
      isStoppedBeforeObstacle.current = false;
      if (phaseRef.current === 'PLAYING') nextWord();
    }
  }, [stop, nextWord]);

  // Метод рисования темы
  const drawThemeBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, scrollX: number, groundY: number) => {
    const activeTheme = themeRef.current;

    if (activeTheme === 'forest') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#fef08a'; // Солнце
      ctx.beginPath();
      ctx.arc(width - 80, 50, 24 + Math.sin(Date.now() / 300) * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#86efac'; // Холмы
      ctx.beginPath();
      ctx.ellipse(width - scrollX, groundY + 10, 220, 80, 0, 0, Math.PI * 2);
      ctx.ellipse(width * 2 - scrollX, groundY + 10, 300, 100, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTheme === 'sunset') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#f97316'); // Оранжевый
      skyGrad.addColorStop(1, '#fbcfe8'); // Розовый
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#f43f5e'; // Солнце заката
      ctx.beginPath();
      ctx.arc(width - 120, 80, 30 + Math.sin(Date.now() / 400) * 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#be185d'; // Темно-розовые холмы
      ctx.beginPath();
      ctx.ellipse(width - scrollX, groundY + 15, 200, 70, 0, 0, Math.PI * 2);
      ctx.ellipse(width * 2 - scrollX, groundY + 15, 280, 90, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cyberpunk Neon City
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(1, '#3b0764');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#f43f5e'; // Розовая неоновая луна
      ctx.beginPath();
      ctx.arc(width - 80, 60, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(30, 27, 75, 0.4)'; // Силуэты зданий
      ctx.fillRect(width / 3 - scrollX * 0.2, 80, 80, groundY - 80);
      ctx.fillRect(width - scrollX * 0.2, 100, 110, groundY - 100);
      ctx.fillStyle = 'rgba(74, 4, 78, 0.4)';
      ctx.fillRect(width / 1.5 - scrollX * 0.2, 120, 90, groundY - 120);
    }
  }, []);

  // Игровой цикл Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const groundY = 250;

    const gameLoop = () => {
      if (phaseRef.current !== 'PLAYING') return;

      if (!pausedRef.current) {
        clouds.current.forEach((c) => {
          c.x -= c.speed;
          if (c.x < -c.w) c.x = canvas.width + 20;
        });

        const currentSpeed = isStoppedBeforeObstacle.current ? 0 : obstacleSpeed.current;
        bgScrollX.current = (bgScrollX.current + currentSpeed * 0.4) % canvas.width;
        wheelAngle.current = (wheelAngle.current + currentSpeed * 0.15) % (Math.PI * 2);

        // 1. Физика прыжка скейтера
        playerY.current += playerVy.current;
        playerVy.current += 0.45;

        if (playerY.current >= groundY - 45) {
          playerY.current = groundY - 45;
          playerVy.current = 0;
          isJumping.current = false;
        }

        // 2. Движение препятствия
        if (obstacleX.current > 200) {
          obstacleX.current -= obstacleSpeed.current;
          isStoppedBeforeObstacle.current = false;
          obstacleTimer.current = 100; 
        } else {
          if (!isJumping.current) {
            isStoppedBeforeObstacle.current = true;
            obstacleTimer.current -= 0.17; // Время на ответ ~16 секунд для ребенка

            if (obstacleTimer.current <= 0) {
              handleCollision(canvas.width);
            }
          } else {
            obstacleX.current -= obstacleSpeed.current;
          }
        }

        if (!isJumping.current && !isStoppedBeforeObstacle.current && Math.random() < 0.4) {
          particles.current.push({
            x: 105,
            y: groundY - 2,
            vx: -obstacleSpeed.current * 0.8 - Math.random() * 2,
            vy: -Math.random() * 1.5,
            size: 2 + Math.random() * 3,
            color: themeRef.current === 'cyber' ? '#22d3ee' : '#cbd5e1', 
            alpha: 0.8,
          });
        }

        // Эффект светящейся ауры во время ожидания (для красоты)
        if (isStoppedBeforeObstacle.current && Math.random() < 0.25) {
          particles.current.push({
            x: 80 + Math.random() * 50,
            y: groundY - 10,
            vx: (Math.random() - 0.5) * 1,
            vy: -1 - Math.random() * 1.5,
            size: 2 + Math.random() * 2,
            color: themeRef.current === 'cyber' ? '#f43f5e' : '#38bdf8', 
            alpha: 1,
          });
        }

        particles.current.forEach((p, index) => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.03;
          if (p.alpha <= 0) {
            particles.current.splice(index, 1);
          }
        });

        // 3. Сбор звездочки прыжком
        if (isJumping.current && Math.abs(obstacleX.current - 110) < 30 && playerY.current < groundY - 80) {
          if (obstacleX.current > 0) {
            speakSound.playSuccess();
            setScore((s) => s + 1);
            for (let i = 0; i < 15; i++) {
              particles.current.push({
                x: obstacleX.current + 20,
                y: groundY - 90,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                size: 2 + Math.random() * 4,
                color: '#f59e0b', 
                alpha: 1,
              });
            }
            obstacleX.current = -100; 
          }
        }

        if (obstacleX.current < -50) {
          obstacleX.current = canvas.width + 100;
          const emojis = ['🚧', '🪨', '🪵', '📦', '🧱', '🗑️', '⚠️'];
          obstacleEmojiRef.current = emojis[Math.floor(Math.random() * emojis.length)];
        }
      }

      // --- ОТРИСОВКА ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Динамический фон в зависимости от темы
      drawThemeBackground(ctx, canvas.width, canvas.height, bgScrollX.current, groundY);

      // Облака (только для лесного и закатного)
      if (themeRef.current !== 'cyber') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        clouds.current.forEach((c) => {
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.w / 2, c.w / 3, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Асфальт дороги
      ctx.fillStyle = themeRef.current === 'cyber' ? '#1e1b4b' : '#475569';
      ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();

      // Разметка дороги
      ctx.strokeStyle = themeRef.current === 'cyber' ? '#22d3ee' : '#fbbf24';
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(0, groundY + 22);
      ctx.lineTo(canvas.width, groundY + 22);
      ctx.stroke();
      ctx.setLineDash([]);

      // Частицы
      particles.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Конус 🚧 и звезда ⭐️
      if (obstacleX.current > -40 && obstacleX.current < canvas.width + 40) {
        ctx.font = '44px sans-serif';
        ctx.fillText(obstacleEmojiRef.current, obstacleX.current, groundY - 6);

        ctx.font = '28px sans-serif';
        ctx.fillText('⭐️', obstacleX.current + 8, groundY - 80);

        // Показываем микрофончик 🎤 во время ожидания над преградой
        if (isStoppedBeforeObstacle.current) {
          ctx.font = '24px sans-serif';
          ctx.fillText('🎤', obstacleX.current + 10, groundY - 140 + Math.sin(Date.now() / 150) * 5);

          // Таймер ожидания
          const barW = 80;
          const barX = obstacleX.current - 18;
          const barY = groundY - 110;

          ctx.font = '16px sans-serif';
          ctx.fillText('⏰', barX - 22, barY + 10);

          ctx.strokeStyle = '#0f172a';
          ctx.fillStyle = '#ffffff';
          ctx.lineWidth = 2;
          drawRoundedRect(ctx, barX, barY, barW, 10, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = obstacleTimer.current > 40 ? '#22c55e' : '#ef4444'; 
          const currentBarW = (barW - 4) * (obstacleTimer.current / 100);
          if (currentBarW > 0) {
            drawRoundedRect(ctx, barX + 2, barY + 2, currentBarW, 6, 2);
            ctx.fill();
          }
        }
      }

      // Скейтер 🛹 (Премиум векторный персонаж с крутящимися колесами и трюками!)
      const skaterX = 80;
      const sY = playerY.current;

      ctx.save();
      ctx.translate(skaterX + 24, sY + 14);
      
      // Наклон скейта при прыжке / трюке
      if (isJumping.current) {
        ctx.rotate(playerVy.current * 0.04);
      } else {
        ctx.rotate(Math.sin(Date.now() / 90) * 0.02); // легкая вибрация езды
      }

      // 1. Дека скейта (Зеленая или Розовая)
      ctx.fillStyle = themeRef.current === 'cyber' ? '#f43f5e' : '#10b981';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      drawRoundedRect(ctx, -24, 6, 48, 6, 3);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-20, 9);
      ctx.lineTo(20, 9);
      ctx.stroke();

      // 2. Вращающиеся колеса!
      if (!pausedRef.current && !isStoppedBeforeObstacle.current) {
        wheelAngle.current = (wheelAngle.current + 0.16) % (Math.PI * 2);
      }
      
      // Подвески (Trucks)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-15, 12, 4, 3);
      ctx.fillRect(11, 12, 4, 3);

      const drawSkateWheel = (wx: number, wy: number) => {
        ctx.save();
        ctx.translate(wx, wy);
        ctx.rotate(wheelAngle.current);
        // Резина
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        // Диск
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Рисунок протектора (чтобы было видно вращение)
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(0, 6);
        ctx.stroke();
        ctx.restore();
      };

      drawSkateWheel(-13, 15);
      drawSkateWheel(13, 15);

      // 3. Скейтбордист
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Левая нога
      ctx.beginPath();
      ctx.moveTo(-8, -10);
      ctx.lineTo(-10, 0);
      ctx.lineTo(-6, 6);
      ctx.stroke();

      // Правая нога
      ctx.beginPath();
      ctx.moveTo(6, -10);
      ctx.lineTo(8, 0);
      ctx.lineTo(6, 6);
      ctx.stroke();

      // Куртка
      ctx.fillStyle = themeRef.current === 'cyber' ? '#c084fc' : '#60a5fa';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3.5;
      drawRoundedRect(ctx, -9, -26, 18, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Голова
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(0, -33, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Очки
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2, -36, 8, 3.5);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-5, -34);
      ctx.lineTo(5, -34);
      ctx.stroke();

      // Красная бейсболка задом наперед
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, -39, 6.5, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-11, -40, 7, 2.5);

      // Руки (поднимаются вверх при прыжке!)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (isJumping.current) {
        ctx.moveTo(-7, -22);
        ctx.lineTo(-17, -30);
        ctx.moveTo(7, -22);
        ctx.lineTo(17, -28);
      } else {
        ctx.moveTo(-7, -22);
        ctx.lineTo(-13, -13);
        ctx.moveTo(7, -22);
        ctx.lineTo(13, -13);
      }
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [phase, paused, onScoreChange, highScore, onUpdateHighScore, handleCollision, drawThemeBackground]);

  // Анимация петли превью-холста в Лобби
  useEffect(() => {
    if (phase !== 'START') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let scrollX = 0;

    const previewLoop = () => {
      if (phaseRef.current !== 'START') return;

      scrollX = (scrollX + 0.8) % canvas.width;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawThemeBackground(ctx, canvas.width, canvas.height, scrollX, 80);

      // Маленькая дорожка
      ctx.fillStyle = themeRef.current === 'cyber' ? '#1e1b4b' : '#475569';
      ctx.fillRect(0, 80, canvas.width, canvas.height - 80);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 80);
      ctx.lineTo(canvas.width, 80);
      ctx.stroke();

      // Маленький скейтер 🛹
      ctx.font = '24px sans-serif';
      ctx.fillText('🛹', 40, 93);
      ctx.fillText('🧑‍🎤', 42, 77);

      animId = requestAnimationFrame(previewLoop);
    };

    animId = requestAnimationFrame(previewLoop);
    return () => cancelAnimationFrame(animId);
  }, [phase, theme, drawThemeBackground]);

  const startGame = useCallback(() => {
    speakSound.playCoin();
    const updatedProgress = recordSessionPlayed(loadProgress(), 'skate-word');
    saveProgress(updatedProgress);
    setScore(0);
    setWordStudyStats({});
    setLives(3);
    livesRef.current = 3;
    setPhase('PLAYING');
    setPaused(false);
    pausedRef.current = false;
    wordIndexRef.current = -1;
    obstacleX.current = 650;
    particles.current = [];
    lastTriggerTime.current = 0;
    isStoppedBeforeObstacle.current = false;
    setLastRecognized('');
    nextWord();
    start();
  }, [nextWord, start]);

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
    <section className="max-w-md mx-auto py-4 px-2" aria-label="SkateWord game">
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
        <div className="space-y-4 p-6 border-8 border-slate-900 rounded-4xl bg-rose-50 bubble-shadow-pink">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-18 h-18 rounded-3xl bg-rose-400 border-4 border-slate-900 flex items-center justify-center animate-bounce">
              <span className="text-3.5xl">🛹</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-wider text-slate-900">
              {strings.title}
            </h1>
            <p className="text-xs font-bold text-slate-600 max-w-xs leading-relaxed">
              {strings.description}
            </p>
          </div>

          {/* CHOOSE SKATE PARK ENVIRONMENT */}
          <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
            <label className="block text-xs font-black text-rose-500 uppercase tracking-widest ml-1">
              {strings.chooseTheme}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['forest', 'sunset', 'cyber'] as const).map((themeId) => (
                <button
                  key={themeId}
                  onClick={() => {
                    speakSound.playCoin();
                    setTheme(themeId);
                  }}
                  className={`px-2 py-2 border-4 rounded-xl text-[9px] font-black uppercase transition-all tracking-wider cursor-pointer text-center ${
                    theme === themeId
                      ? 'bg-rose-400 border-slate-900 text-slate-900 shadow-sm -translate-y-0.5'
                      : 'bg-white border-slate-300 text-slate-755 hover:border-slate-900'
                  }`}
                >
                  {themeId === 'forest' ? 'FOREST' : themeId === 'sunset' ? 'SUNSET' : 'NEON'}
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
                      ? 'bg-rose-400 border-slate-900 text-slate-900'
                      : 'bg-white border-slate-300 text-slate-600'
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
                    ? 'bg-pink-400 border-slate-900 text-slate-950'
                    : 'bg-white border-slate-300 text-slate-600'
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
            className="w-full py-3 bg-rose-400 hover:bg-rose-500 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
              <span className="text-xl font-black text-slate-900">⭐️ {score}</span>
            </div>
            <div className="text-center border-x-4 border-slate-900 flex flex-col justify-center items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block">LIVES</span>
              <div className="flex gap-0.5 justify-center mt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < lives ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-300'
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

          <div className="relative border-8 border-slate-900 rounded-3xl overflow-hidden bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <canvas
              ref={canvasRef}
              width={600}
              height={300}
              className="w-full h-[300px] block"
            />
            {paused && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-1">
                <span className="text-4xl" aria-hidden="true">⏸️</span>
                <span className="text-lg font-black uppercase tracking-widest text-orange-400">{strings.paused}</span>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border-4 border-slate-900 rounded-2xl p-5 text-center relative shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-500 border-2 border-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm animate-bounce">
              {strings.sayThis}
            </span>

            <p className="text-3xl font-black tracking-wide text-slate-900 leading-snug mt-1 animate-pulse">
              {target}
            </p>

            {(() => {
              const currentWordItem = list.find(
                (item) => item.word.toLowerCase() === target.toLowerCase(),
              );
              const translation = currentWordItem?.translationRu || currentWordItem?.translation;
              return translation ? (
                <p className="text-sm font-extrabold text-purple-600 mt-1">
                  {translation}
                </p>
              ) : null;
            })()}

            {lastRecognized && (
              <div className="mt-4 inline-flex flex-col items-center justify-center bg-indigo-50 border-2 border-indigo-200 rounded-xl px-4 py-1.5 max-w-full">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">
                  {language === 'ru' ? 'Вы сказали / Слышу:' : 'You said / Heard:'}
                </span>
                <span className="text-sm font-black text-indigo-700 italic font-mono truncate max-w-xs">
                  "{lastRecognized}"
                </span>
              </div>
            )}

            <div className="flex justify-center flex-wrap gap-2.5 mt-3.5">
              <button
                onClick={() => {
                  playWordTTS(target);
                  setWordStudyStats((p) => ({
                    ...p,
                    [target]: {
                      spoken: p[target]?.spoken || 0,
                      struggled: (p[target]?.struggled || 0) + 1,
                    },
                  }));
                  saveProgress(recordWordStruggled(loadProgress(), 'skate-word', target));
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white border-2 border-slate-900 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform active:translate-y-0.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-rose-500 stroke-[3]" /> Listen (EN)
              </button>
              {(() => {
                const currentWordItem = list.find(
                  (item) => item.word.toLowerCase() === target.toLowerCase(),
                );
                const translation = currentWordItem?.translationRu;
                return translation ? (
                  <button
                    onClick={() => speakWord(translation, 'ru')}
                    className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-700 hover:text-blue-900 bg-white border-2 border-slate-900 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform active:translate-y-0.5 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-blue-500 stroke-[3]" /> Слушать (RU)
                  </button>
                ) : null;
              })()}
            </div>
          </div>

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
              {language === 'ru' ? 'ЗАЕЗД ЗАВЕРШЕН!' : 'SKATE SESSION OVER!'}
            </span>

            <h2 className="text-3xl font-black text-slate-950 mt-6 mb-2 uppercase tracking-wide">
              {language === 'ru' ? 'КОНЕЦ ИГРЫ!' : 'GAME OVER!'}
            </h2>
            <p className="text-xs text-slate-500 leading-normal font-bold">
              {language === 'ru' ? 'Твой отчет о трюках на скейтборде:' : 'Review your skateboard spelling stats below:'}
            </p>

            {/* Score logs */}
            <div className="grid grid-cols-2 gap-3.5 my-6">
              <div className="bg-sky-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest text-center">
                  {language === 'ru' ? 'СОБРАНО ЗВЕЗД' : 'STARS COLLECTED'}
                </span>
                <span className="text-lg font-black text-sky-900 mt-1 font-mono">⭐️ {score}</span>
              </div>
              <div className="bg-amber-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">
                  {language === 'ru' ? 'РЕКОРД ПАРКА' : 'PARK RECORD'}
                </span>
                <span className="text-lg font-black text-amber-800 mt-1 font-mono">{highScore} stars</span>
              </div>
            </div>

            {/* Historic word review logs */}
            <div className="bg-purple-100 border-4 border-slate-900 p-4 rounded-3xl text-left mb-6">
              <div className="flex items-center gap-2 mb-2.5">
                <BookOpen className="w-5 h-5 text-purple-700 stroke-[2.5]" />
                <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest">
                  {language === 'ru' ? 'Словарь скейт-парка:' : 'Your Spelling Scorecard:'}
                </h4>
              </div>

              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {Object.keys(wordStudyStats).length === 0 ? (
                  <div className="text-center py-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
                    <p className="text-xs text-slate-500 font-extrabold leading-normal">
                      {language === 'ru' ? 'Трюков со словами не выполнено. Попробуй еще раз!' : 'No words flipped yet. Start skating to practice!'}
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
                            {language === 'ru' ? 'Трюков:' : 'Flips:'} {spoken}
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
                className="w-full bg-pink-500 hover:bg-pink-600 border-4 border-slate-900 text-white font-black text-xs py-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-1 shadow-md uppercase"
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
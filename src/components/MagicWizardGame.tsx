import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, saveProgress, recordSessionPlayed, recordWordSpoken, recordWordStruggled, pickAdaptiveWordIndex, GameId } from '../progress';
import { ArrowLeft, Play, Pause, Volume2, Heart, RotateCcw } from 'lucide-react';

import { WordCategory, WordData } from '../types';
import { BUILTIN_CATEGORIES } from '../data';
import { matchesWord, speakSound, speakWord } from '../utils';
import { useSpeechRecognition } from '../useSpeechRecognition';
import { useUiLanguage } from '../uiLanguage';

interface MagicWizardGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
}

const LOCAL_LANG = {
  en: {
    title: 'Magic Wizard',
    description: 'Cast powerful elemental spells! Pronounce target words correctly to defeat approaching monsters! 🧙‍♂️✨',
    start: 'Begin Spellcasting',
    score: 'Monsters Defeated',
    best: 'Best Score',
    paused: 'Paused',
    resume: 'Resume',
    pause: 'Pause',
    micListening: '🎤 Say the word out loud...',
    chooseSet: 'Choose Word Set',
    myWords: 'My Words',
    sayThis: '🎯 SPEAK TO CAST SPELL!:',
    chooseTheme: 'CHOOSE WIZARD SPELL ELEMENT:',
    gameOverTitle: 'WIZARD BATTLE OVER!',
    gameOverSubtitle: 'The magical portal has closed. Your wizard battle stats:',
    playAgain: 'Play Again',
  },
  ru: {
    title: 'Магический Волшебник',
    description: 'Произноси слова правильно, чтобы твой волшебник метал огненные шары, ледяные стрелы и молнии во врагов! 🧙‍♂️✨',
    start: 'Начать колдовство',
    score: 'Побеждено монстров',
    best: 'Рекорд',
    paused: 'Пауза',
    resume: 'Продолжить',
    pause: 'Пауза',
    micListening: '🎤 Произнеси слово...',
    chooseSet: 'Выбрать набор слов',
    myWords: 'Мои слова',
    sayThis: '🎯 ПРОИЗНЕСИ ДЛЯ ЗАКЛИНАНИЯ!:',
    chooseTheme: 'ВЫБЕРИ СТИХИЮ ВОЛШЕБНИКА:',
    gameOverTitle: 'БИТВА МАГОВ ЗАВЕРШЕНА!',
    gameOverSubtitle: 'Магический портал закрылся. Твои результаты:',
    playAgain: 'Сыграть снова',
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

interface SpellProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  element: WizardTheme;
}

interface Monster {
  x: number;
  y: number;
  emoji: string;
  maxHealth: number;
  health: number;
  color: string;
}

type WizardTheme = 'fire' | 'ice' | 'lightning';

export function MagicWizardGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
}: MagicWizardGameProps) {
  const { language } = useUiLanguage();
  const strings = LOCAL_LANG[language as 'en' | 'ru'] || LOCAL_LANG.en;

  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [phase, setPhase] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [target, setTarget] = useState('');
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [feedback, setFeedback] = useState<'correct' | 'listening' | 'idle'>('idle');
  const [theme, setTheme] = useState<WizardTheme>('fire');
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

  // Monsters & Spells ref
  const activeMonster = useRef<Monster | null>(null);
  const spellProjectiles = useRef<SpellProjectile[]>([]);
  const particles = useRef<Particle[]>([]);
  const monsterTimer = useRef(100); // 100% to 0% timer for attack
  const wizardPunchEffect = useRef(0); // Screen/Wizard shaking factor

  // Handle local state matching refs
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { targetRef.current = target; }, [target]);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  // Update highscores
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
    speakWord(word);
  }, []);

  const spawnMonster = useCallback(() => {
    const list = wordList();
    if (list.length === 0) return;

    const words = list.map((w) => w.word);
    const wordStats = loadProgress()['magic-wizard'].words;
    const nextIdx = pickAdaptiveWordIndex(words, wordStats, wordIndexRef.current);
    wordIndexRef.current = nextIdx;
    const word = list[nextIdx].word;
    setTarget(word);
    setFeedback('listening');
    setLastRecognized('');

    // Emojis for monsters
    const monsterEmojis = ['👹', '👾', '👻', '💀', '👽', '🧛', '🧟', '🦁', '🐉', '🐺'];
    const selectedEmoji = monsterEmojis[Math.floor(Math.random() * monsterEmojis.length)];
    const colors = ['#f43f5e', '#a855f7', '#10b981', '#3b82f6', '#f59e0b'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    activeMonster.current = {
      x: 520,
      y: 190,
      emoji: selectedEmoji,
      maxHealth: 1,
      health: 1,
      color: randomColor,
    };
    monsterTimer.current = 100;
  }, [wordList]);

  const handleCollision = useCallback(() => {
    if (livesRef.current <= 0) return;
    monsterTimer.current = 100; // Reset timer immediately to prevent multi-triggering
    speakSound.playCrash();
    const nextL = livesRef.current - 1;
    setLives(nextL);
    livesRef.current = nextL;
    wizardPunchEffect.current = 10; // Trigger shake effect

    // Hit sparks
    for (let i = 0; i < 20; i++) {
      particles.current.push({
        x: 80,
        y: 190,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: 3 + Math.random() * 4,
        color: '#ef4444',
        alpha: 1,
      });
    }

    if (nextL <= 0) {
      setTimeout(() => {
        setPhase('GAMEOVER');
      }, 500);
    } else {
      spawnMonster();
    }
  }, [spawnMonster]);

  const castSpell = useCallback(() => {
    if (phaseRef.current === 'PLAYING' && !pausedRef.current && activeMonster.current) {
      speakSound.playAccelerate();
      setFeedback('correct');

      // Add spell projectile
      spellProjectiles.current.push({
        x: 100,
        y: 190,
        vx: 8,
        vy: 0,
        targetX: activeMonster.current.x,
        targetY: activeMonster.current.y,
        element: themeRef.current,
      });

      // Sparks during casting
      const colorMap = {
        fire: '#f97316',
        ice: '#06b6d4',
        lightning: '#eab308',
      };
      const spellColor = colorMap[themeRef.current];

      for (let i = 0; i < 15; i++) {
        particles.current.push({
          x: 100,
          y: 190,
          vx: Math.random() * 4,
          vy: (Math.random() - 0.5) * 4,
          size: 2 + Math.random() * 3,
          color: spellColor,
          alpha: 1,
        });
      }
    }
  }, []);

  const handleTranscript = useCallback(
    (text: string) => {
      if (phaseRef.current !== 'PLAYING' || pausedRef.current) return;
      setLastRecognized(text);
      const current = targetRef.current;
      if (!current) return;

      if (matchesWord(text, current, true)) {
        castSpell();
        setWordStudyStats((prevStats) => ({
          ...prevStats,
          [current]: {
            spoken: (prevStats[current]?.spoken || 0) + 1,
            struggled: prevStats[current]?.struggled || 0,
          },
        }));
        saveProgress(recordWordSpoken(loadProgress(), 'magic-wizard', current));
      }
    },
    [castSpell]
  );

  const { status, isSupported, start, stop } = useSpeechRecognition(handleTranscript);

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setPhase('PLAYING');
    setPaused(false);
    spellProjectiles.current = [];
    particles.current = [];
    saveProgress(recordSessionPlayed(loadProgress(), 'magic-wizard'));
    
    // Defer spawning slightly to ensure refs initialize
    setTimeout(() => {
      spawnMonster();
    }, 50);
  }, [spawnMonster]);

  // Preview Loop
  useEffect(() => {
    if (phase !== 'START') return;
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const previewLoop = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark magical background
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sparkles
      ctx.fillStyle = theme === 'fire' ? 'rgba(249, 115, 22, 0.4)' : theme === 'ice' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(234, 179, 8, 0.4)';
      for (let i = 0; i < 5; i++) {
        const x = (Math.sin(frame * 0.02 + i) * 0.4 + 0.5) * canvas.width;
        const y = (Math.cos(frame * 0.05 + i * 2) * 0.2 + 0.5) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 2 + i % 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw preview Wizard emoji
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1.0;
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const wizardY = 50 + Math.sin(frame * 0.05) * 4;
      ctx.fillText('🧙‍♂️', 60, wizardY);

      // Wand sparkle
      ctx.font = '12px serif';
      const sparkColor = theme === 'fire' ? '💥' : theme === 'ice' ? '❄️' : '⚡';
      ctx.fillText(sparkColor, 75, wizardY - 5);

      // Title/Description preview text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Fredoka, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(theme.toUpperCase() + ' SPELLS', 110, 42);
      ctx.fillStyle = theme === 'fire' ? '#f97316' : theme === 'ice' ? '#06b6d4' : '#eab308';
      ctx.fillText(theme === 'fire' ? 'Cast blazing fireballs!' : theme === 'ice' ? 'Freeze enemies with ice!' : 'Zap with electric lightning!', 110, 62);

      animId = requestAnimationFrame(previewLoop);
    };

    previewLoop();
    return () => cancelAnimationFrame(animId);
  }, [phase, theme]);

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const gameLoop = () => {
      if (phaseRef.current !== 'PLAYING') return;

      if (!pausedRef.current) {
        // Shaking update
        if (wizardPunchEffect.current > 0) {
          wizardPunchEffect.current *= 0.85;
          if (wizardPunchEffect.current < 0.1) wizardPunchEffect.current = 0;
        }

        // Timer decrease
        monsterTimer.current -= 0.12; // Around 14 seconds to say the word
        if (monsterTimer.current <= 0) {
          handleCollision();
        }

        // Spells projectile updates
        for (let idx = spellProjectiles.current.length - 1; idx >= 0; idx--) {
          const proj = spellProjectiles.current[idx];
          proj.x += proj.vx;
          // Spawn spell sparks trail
          const colors = { fire: '#ea580c', ice: '#0891b2', lightning: '#ca8a04' };
          particles.current.push({
            x: proj.x,
            y: proj.y + (Math.random() - 0.5) * 6,
            vx: -2 - Math.random() * 2,
            vy: (Math.random() - 0.5) * 2,
            size: 2 + Math.random() * 2,
            color: colors[proj.element],
            alpha: 0.8,
          });

          // Check hit
          if (proj.x >= proj.targetX - 20) {
            spellProjectiles.current.splice(idx, 1);
            speakSound.playSuccess();
            setScore((s) => s + 1);

            // Explode monster particles
            const colorsMap = { fire: ['#f97316', '#ef4444', '#facc15'], ice: ['#06b6d4', '#3b82f6', '#93c5fd'], lightning: ['#eab308', '#ca8a04', '#fef08a'] };
            const mExplodeColor = colorsMap[proj.element];
            for (let i = 0; i < 25; i++) {
              particles.current.push({
                x: proj.targetX,
                y: proj.targetY,
                vx: (Math.random() - 0.5) * 7,
                vy: (Math.random() - 0.5) * 7,
                size: 2 + Math.random() * 4,
                color: mExplodeColor[Math.floor(Math.random() * mExplodeColor.length)],
                alpha: 1,
              });
            }
            activeMonster.current = null;
            setTimeout(() => {
              spawnMonster();
            }, 600);
          }
        }

        // Particles updates
        for (let idx = particles.current.length - 1; idx >= 0; idx--) {
          const p = particles.current[idx];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.02;
          if (p.alpha <= 0) {
            particles.current.splice(idx, 1);
          }
        }

        // Slow monsters approach (for tension)
        if (activeMonster.current) {
          const ratio = monsterTimer.current / 100;
          activeMonster.current.x = 130 + ratio * 390;
        }
      }

      // Drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background: Dark Forest Magic Arena
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#090514');
      grad.addColorStop(0.7, '#1e1b4b');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Magic circles/Arena grid
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.15)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 + 50, 160, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 + 50, 80, 0, Math.PI * 2);
      ctx.stroke();

      // Platform Floor
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 240, canvas.width, canvas.height - 240);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(0, 240, canvas.width, 4);

      // Timer Bar (Monster action countdown)
      if (activeMonster.current) {
        const timerPercent = Math.max(0, monsterTimer.current);
        ctx.fillStyle = timerPercent > 35 ? '#a855f7' : '#ef4444';
        ctx.fillRect(0, 0, (canvas.width * timerPercent) / 100, 6);
      }

      // Render wizard shakes
      const shakeX = (Math.random() - 0.5) * wizardPunchEffect.current;
      const shakeY = (Math.random() - 0.5) * wizardPunchEffect.current;

      // Draw Wizard
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1.0;
      ctx.font = '55px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧙‍♂️', 80 + shakeX, 190 + shakeY);

      // Wizard glowing aura
      const colorGlow = themeRef.current === 'fire' ? 'rgba(249, 115, 22, 0.15)' : themeRef.current === 'ice' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(234, 179, 8, 0.15)';
      ctx.fillStyle = colorGlow;
      ctx.beginPath();
      ctx.arc(80 + shakeX, 190 + shakeY, 40, 0, Math.PI * 2);
      ctx.fill();

      // Draw active Monster
      if (activeMonster.current) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1.0;
        ctx.font = '50px serif';
        ctx.fillText(activeMonster.current.emoji, activeMonster.current.x, activeMonster.current.y);

        // Monster shadow glow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(activeMonster.current.x, 230, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Monster target indicator
        ctx.strokeStyle = activeMonster.current.color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(activeMonster.current.x, activeMonster.current.y, 35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw spell projectiles
      spellProjectiles.current.forEach((proj) => {
        const spellColor = proj.element === 'fire' ? '#f97316' : proj.element === 'ice' ? '#06b6d4' : '#eab308';
        ctx.fillStyle = spellColor;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow
        ctx.fillStyle = proj.element === 'fire' ? 'rgba(249, 115, 22, 0.4)' : proj.element === 'ice' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(234, 179, 8, 0.4)';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 16, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw particles
      particles.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(gameLoop);
    };

    gameLoop();
    return () => cancelAnimationFrame(animId);
  }, [phase, spawnMonster, handleCollision]);

  // Auto trigger speech status handling
  useEffect(() => {
    if (phase === 'PLAYING' && !paused) {
      start();
    } else {
      stop();
    }
    return () => stop();
  }, [phase, paused, start, stop]);

  const list = wordList();

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
      {/* Header Navigation */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onBackToHub}
          className="flex items-center gap-2 px-4 py-2 text-sm font-black uppercase text-slate-700 bg-white hover:bg-slate-100 border-4 border-slate-900 rounded-2xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[3]" />
          {language === 'ru' ? 'Хаб' : 'Hub'}
        </button>

        <div className="flex gap-2">
          {phase === 'PLAYING' && (
            <button
              onClick={() => setPaused(!paused)}
              className="px-4 py-2 text-sm font-black uppercase text-slate-700 bg-white hover:bg-slate-100 border-4 border-slate-900 rounded-2xl flex items-center gap-2 cursor-pointer"
            >
              <Pause className="w-4 h-4 stroke-[3]" />
              {paused ? strings.resume : strings.pause}
            </button>
          )}
        </div>
      </div>

      {phase === 'START' && (
        <div className="max-w-md mx-auto w-full py-4 animate-scale-up">
          <div className="space-y-4 p-6 border-8 border-slate-900 rounded-4xl bg-violet-50 bubble-shadow-purple">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-18 h-18 rounded-3xl bg-violet-400 border-4 border-slate-900 flex items-center justify-center animate-bounce">
                <span className="text-3.5xl">🧙‍♂️</span>
              </div>
              <h1 className="text-4xl font-black uppercase tracking-wider text-slate-950">
                {strings.title}
              </h1>
              <p className="text-xs font-bold text-slate-700 max-w-xs leading-relaxed">
                {strings.description}
              </p>
            </div>

            {/* CHOOSE SPELL ELEMENT */}
            <div className="space-y-2 text-left bg-white border-4 border-slate-900 rounded-2xl p-3">
              <label className="block text-xs font-black text-violet-600 uppercase tracking-widest ml-1">
                {strings.chooseTheme}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['fire', 'ice', 'lightning'] as const).map((themeId) => (
                  <button
                    key={themeId}
                    onClick={() => {
                      speakSound.playCoin();
                      setTheme(themeId);
                    }}
                    className={`px-2 py-2 border-4 rounded-xl text-[9px] font-black uppercase transition-all tracking-wider cursor-pointer text-center ${
                      theme === themeId
                        ? 'bg-violet-400 border-slate-900 text-slate-955 shadow-sm -translate-y-0.5'
                        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-900'
                    }`}
                  >
                    {themeId === 'fire' ? '🔥 FIRE' : themeId === 'ice' ? '❄️ ICE' : '⚡ LIGHTNING'}
                  </button>
                ))}
              </div>

              {/* Active Animated Preview Canvas */}
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
                        ? 'bg-violet-400 border-slate-900 text-slate-900'
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
                      ? 'bg-violet-400 border-slate-900 text-slate-955'
                      : 'bg-white border-slate-300 text-slate-600'
                  }`}
                >
                  {strings.myWords} ({customWords.length})
                </button>
              </div>
            </fieldset>

            {!isSupported && (
              <p className="text-xs font-bold text-rose-600 text-center animate-pulse" role="alert">
                Voice control needs Google Chrome.
              </p>
            )}

            <button
              onClick={startGame}
              disabled={!isSupported}
              className="w-full py-3 bg-violet-400 hover:bg-violet-500 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current stroke-[3]" /> {strings.start}
            </button>
          </div>
        </div>
      )}

      {phase === 'PLAYING' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 bg-white border-4 border-slate-900 rounded-2xl p-3">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">{strings.score}</span>
              <span className="text-xl font-black text-slate-900">🧙‍♂️ {score}</span>
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
              className="w-full max-w-[600px] aspect-[2/1] mx-auto block"
            />
            {paused && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center gap-1">
                <span className="text-4xl" aria-hidden="true">⏸️</span>
                <span className="text-lg font-black uppercase tracking-widest text-orange-400">{strings.paused}</span>
              </div>
            )}
          </div>

          <div className="bg-violet-50 border-4 border-slate-900 rounded-2xl p-5 text-center relative shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-violet-600 border-2 border-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm animate-bounce">
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
                <p className="text-sm font-extrabold text-violet-700 mt-1">
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
                  saveProgress(recordWordStruggled(loadProgress(), 'magic-wizard', target));
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700 hover:text-slate-900 bg-white border-2 border-slate-900 px-3 py-1.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-transform active:translate-y-0.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-violet-600 stroke-[3]" /> Listen (EN)
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'GAMEOVER' && (
        <div className="max-w-md mx-auto w-full py-4 animate-scale-up">
          <div className="space-y-4 p-6 border-8 border-slate-900 rounded-4xl bg-violet-50 bubble-shadow-purple text-center">
            <h2 className="text-3xl font-black text-violet-700 uppercase tracking-wide">
              {strings.gameOverTitle}
            </h2>
            <p className="text-xs font-bold text-slate-700">
              {strings.gameOverSubtitle}
            </p>

            <div className="bg-white border-4 border-slate-900 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider">Score</span>
                <span className="text-slate-900">🧙‍♂️ {score}</span>
              </div>
              <div className="flex justify-between items-center font-bold border-t border-slate-100 pt-2">
                <span className="text-slate-500 uppercase text-[10px] tracking-wider">Highscore</span>
                <span className="text-slate-900">🏆 {Math.max(highScore, score)}</span>
              </div>
            </div>

            <button
              onClick={startGame}
              className="w-full py-3 bg-violet-400 hover:bg-violet-500 border-4 border-slate-900 text-slate-900 font-black uppercase tracking-wider rounded-2xl inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 stroke-[3]" />
              {strings.playAgain}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

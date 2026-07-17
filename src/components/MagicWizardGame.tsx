import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  Footprints,
  Gem,
  Map,
  Mic,
  Pause,
  Sparkles,
  Trophy,
  Volume2,
} from 'lucide-react';

import { BUILTIN_CATEGORIES } from '../data';
import {
  buildDoorChoices,
  createVoiceMaze,
  destinationForDirection,
  findSpokenDoor,
  getMazeCell,
  mazeCellKey,
  sameMazePosition,
  type DoorChoice,
  type MazeDirection,
  type MazePosition,
  type VoiceMaze,
} from '../magicWizardLogic';
import {
  loadProgress,
  recordSessionPlayed,
  recordWordSpoken,
  saveProgress,
} from '../progress';
import type { WordCategory, WordData } from '../types';
import { useUiLanguage } from '../uiLanguage';
import { speakSound, speakWord } from '../utils';
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
  WordSetPicker,
} from './GameUi';

interface MagicWizardGameProps {
  onBackToHub: () => void;
  customWords: WordData[];
  highScore?: number;
  onUpdateHighScore?: (score: number) => void;
  onScoreChange?: (score: number) => void;
  onAddCustomWord?: (word: string, translation: string) => void;
  onDeleteCustomWord?: (index: number) => void;
  onClearCustomWords?: () => void;
}

type MazeTheme = 'library' | 'garden' | 'crystal';
type MazeDifficulty = 'trail' | 'quest' | 'epic';
type GamePhase = 'START' | 'PLAYING' | 'FLOOR_CLEAR' | 'GAMEOVER';
type Feedback = 'ready' | 'correct' | 'retry' | 'silent' | 'crystal' | 'locked';

const SILENCE_TIMEOUT_MS = 12_000;
const MOVE_DELAY_MS = 460;
const MAZE_DIFFICULTY_STORAGE_KEY = 'voice_maze_difficulty';

const DIFFICULTY: Record<MazeDifficulty, { size: number; crystals: number }> = {
  trail: { size: 5, crystals: 2 },
  quest: { size: 7, crystals: 3 },
  epic: { size: 9, crystals: 4 },
};

function loadMazeDifficulty(): MazeDifficulty {
  try {
    const saved = localStorage.getItem(MAZE_DIFFICULTY_STORAGE_KEY);
    if (saved === 'trail' || saved === 'quest' || saved === 'epic') return saved;
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
  return 'trail';
}

const THEME_STYLE: Record<
  MazeTheme,
  {
    icon: string;
    stage: string;
    cell: string;
    visited: string;
    route: string;
    wall: string;
  }
> = {
  library: {
    icon: '📚',
    stage: 'from-violet-950 via-indigo-900 to-slate-950',
    cell: 'bg-violet-900/75',
    visited: 'bg-violet-300',
    route: 'bg-amber-200',
    wall: '#fbbf24',
  },
  garden: {
    icon: '🌿',
    stage: 'from-emerald-950 via-teal-900 to-slate-950',
    cell: 'bg-emerald-900/75',
    visited: 'bg-emerald-300',
    route: 'bg-lime-200',
    wall: '#86efac',
  },
  crystal: {
    icon: '💎',
    stage: 'from-cyan-950 via-blue-950 to-violet-950',
    cell: 'bg-cyan-900/75',
    visited: 'bg-cyan-300',
    route: 'bg-fuchsia-200',
    wall: '#67e8f9',
  },
};

const DIRECTION_ICON: Record<MazeDirection, string> = {
  north: '↑',
  east: '→',
  south: '↓',
  west: '←',
};

function previewRandom(): () => number {
  let state = 811;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function MagicWizardGame({
  onBackToHub,
  customWords,
  highScore = 0,
  onUpdateHighScore,
  onScoreChange,
  onAddCustomWord = () => undefined,
  onDeleteCustomWord = () => undefined,
  onClearCustomWords = () => undefined,
}: MagicWizardGameProps) {
  const { language, t } = useUiLanguage();
  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [phase, setPhase] = useState<GamePhase>('START');
  const [theme, setTheme] = useState<MazeTheme>('library');
  const [difficulty, setDifficulty] = useState<MazeDifficulty>(loadMazeDifficulty);
  const [maze, setMaze] = useState<VoiceMaze | null>(null);
  const [player, setPlayer] = useState<MazePosition>({ row: 0, col: 0 });
  const [choices, setChoices] = useState<DoorChoice[]>([]);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [crystals, setCrystals] = useState(0);
  const [floor, setFloor] = useState(1);
  const [floorsCleared, setFloorsCleared] = useState(0);
  const [steps, setSteps] = useState(0);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ttsActive, setTtsActive] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>('ready');
  const [lastRecognized, setLastRecognized] = useState('');
  const [wordStudyStats, setWordStudyStats] = useState<
    Record<string, { spoken: number; struggled: number }>
  >({});

  const phaseRef = useRef<GamePhase>('START');
  const mazeRef = useRef<VoiceMaze | null>(null);
  const playerRef = useRef<MazePosition>({ row: 0, col: 0 });
  const choicesRef = useRef<DoorChoice[]>([]);
  const visitedRef = useRef<Set<string>>(new Set());
  const collectedRef = useRef<Set<string>>(new Set());
  const crystalsRef = useRef(0);
  const scoreRef = useRef(0);
  const stepsRef = useRef(0);
  const pausedRef = useRef(false);
  const ttsActiveRef = useRef(false);
  const movingRef = useRef(false);
  const previousWordIndexRef = useRef(-1);
  const lastTranscriptRef = useRef('');
  const lastTranscriptAtRef = useRef(0);
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const previewMaze = useMemo(() => createVoiceMaze(5, 2, previewRandom()), []);
  const activeTheme = THEME_STYLE[theme];

  const selectDifficulty = (nextDifficulty: MazeDifficulty) => {
    setDifficulty(nextDifficulty);
    try {
      localStorage.setItem(MAZE_DIFFICULTY_STORAGE_KEY, nextDifficulty);
    } catch {
      // Keep the in-memory selection when storage is unavailable.
    }
  };

  const strings = useMemo(() => ({
    title: t('wizard.title'),
    description: t('wizard.description'),
    start: t('wizard.start'),
    score: t('wizard.score'),
    best: t('wizard.best'),
    chooseSet: t('wizard.chooseSet'),
    myWords: t('wizard.myWords'),
    chooseTheme: t('wizard.chooseTheme'),
    chooseDifficulty: t('wizard.chooseDifficulty'),
    gameOverTitle: t('wizard.gameOverTitle'),
    gameOverSubtitle: t('wizard.gameOverSubtitle'),
    playAgain: t('wizard.playAgain'),
    floor: t('wizard.floor'),
    moves: t('wizard.moves'),
    crystals: t('wizard.crystals'),
    map: t('wizard.map'),
    ready: t('wizard.ready'),
    correct: t('wizard.correct'),
    retry: t('wizard.retry'),
    silent: t('wizard.silent'),
    crystalFound: t('wizard.crystalFound'),
    portalLocked: t('wizard.portalLocked'),
    speakingTarget: t('wizard.speakingTarget'),
    preview: t('wizard.preview'),
    objective: t('wizard.objective'),
    sayDoor: t('wizard.sayDoor'),
    micActive: t('wizard.micActive'),
    micInactive: t('wizard.micInactive'),
    floorComplete: t('wizard.floorComplete'),
    floorCompleteText: t('wizard.floorCompleteText'),
    continue: t('wizard.continue'),
    finish: t('wizard.finish'),
    endless: t('wizard.endless'),
    floorsCleared: t('wizard.floorsCleared'),
    roomsExplored: t('wizard.roomsExplored'),
    youSaid: t('wizard.youSaid'),
    hazard: t('wizard.hazard'),
    hazardHint: t('wizard.hazardHint'),
    hazardLegend: t('wizard.hazardLegend'),
    crystalsMissing: t('wizard.crystalsMissing'),
  }), [t]);

  const wordList = useCallback((): WordData[] => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0
        ? customWords
        : (BUILTIN_CATEGORIES[0].words as WordData[]);
    }
    return activeCategory.words as WordData[];
  }, [activeCategory, customWords]);

  const updateStudyStats = useCallback((word: string) => {
    setWordStudyStats((current) => ({
      ...current,
      [word]: {
        spoken: (current[word]?.spoken || 0) + 1,
        struggled: current[word]?.struggled || 0,
      },
    }));
    saveProgress(recordWordSpoken(loadProgress(), 'magic-wizard', word));
  }, []);

  const award = useCallback((points: number) => {
    const nextScore = scoreRef.current + points;
    scoreRef.current = nextScore;
    setScore(nextScore);
    onScoreChange?.(nextScore);
    if (nextScore > highScore) onUpdateHighScore?.(nextScore);
  }, [highScore, onScoreChange, onUpdateHighScore]);

  const makeChoices = useCallback((nextMaze: VoiceMaze, nextPlayer: MazePosition) => {
    const result = buildDoorChoices(
      nextMaze,
      nextPlayer,
      wordList(),
      loadProgress()['magic-wizard'].words,
      previousWordIndexRef.current,
    );
    previousWordIndexRef.current = result.lastWordIndex;
    choicesRef.current = result.choices;
    setChoices(result.choices);
  }, [wordList]);

  const beginFloor = useCallback((nextFloor: number) => {
    const base = DIFFICULTY[difficulty];
    const growth = Math.floor((nextFloor - 1) / 2);
    const nextMaze = createVoiceMaze(
      base.size,
      Math.min(5, base.crystals + growth),
    );
    const nextVisited = new Set<string>([mazeCellKey(nextMaze.start)]);

    mazeRef.current = nextMaze;
    playerRef.current = nextMaze.start;
    visitedRef.current = nextVisited;
    collectedRef.current = new Set();
    crystalsRef.current = 0;
    movingRef.current = false;
    lastTranscriptRef.current = '';
    phaseRef.current = 'PLAYING';

    setMaze(nextMaze);
    setPlayer(nextMaze.start);
    setVisited(nextVisited);
    setCollected(new Set());
    setCrystals(0);
    setFloor(nextFloor);
    setPaused(false);
    setTtsActive(false);
    setFeedback('ready');
    setLastRecognized('');
    setPhase('PLAYING');
    makeChoices(nextMaze, nextMaze.start);
  }, [difficulty, makeChoices]);

  const handleTranscript = useCallback((text: string) => {
    if (
      phaseRef.current !== 'PLAYING'
      || pausedRef.current
      || ttsActiveRef.current
      || movingRef.current
    ) return;

    const normalized = text.trim().toLocaleLowerCase();
    const now = Date.now();
    if (
      !normalized
      || (normalized === lastTranscriptRef.current && now - lastTranscriptAtRef.current < 700)
    ) return;
    lastTranscriptRef.current = normalized;
    lastTranscriptAtRef.current = now;
    setLastRecognized(text);

    const selectedDoor = findSpokenDoor(text, choicesRef.current);
    if (!selectedDoor) {
      setFeedback('retry');
      return;
    }

    const currentMaze = mazeRef.current;
    if (!currentMaze) return;
    movingRef.current = true;
    setFeedback('correct');
    updateStudyStats(selectedDoor.target.word);

    moveTimerRef.current = setTimeout(() => {
      const destination = selectedDoor.destination;
      const destinationKey = mazeCellKey(destination);
      const destinationCell = getMazeCell(currentMaze, destination);
      if (!destinationCell) {
        movingRef.current = false;
        return;
      }

      const firstVisit = !visitedRef.current.has(destinationKey);
      const nextVisited = new Set(visitedRef.current);
      nextVisited.add(destinationKey);
      visitedRef.current = nextVisited;
      playerRef.current = destination;
      stepsRef.current += 1;
      setVisited(nextVisited);
      setPlayer(destination);
      setSteps(stepsRef.current);
      award(firstVisit ? 12 : 3);

      const nextCollected = new Set(collectedRef.current);
      let nextCrystals = crystalsRef.current;
      if (!nextCollected.has(destinationKey) && destinationCell.item === 'crystal') {
        nextCollected.add(destinationKey);
        nextCrystals += 1;
        crystalsRef.current = nextCrystals;
        collectedRef.current = nextCollected;
        setCollected(nextCollected);
        setCrystals(nextCrystals);
        setFeedback('crystal');
        award(80);
        speakSound.playCoin();
      } else if (destinationCell.item === 'portal') {
        speakSound.playCorrect();
        if (nextCrystals >= currentMaze.crystalCount) {
          const floorBonus = 180 + floor * 30;
          award(floorBonus);
          setFloorsCleared((value) => value + 1);
          choicesRef.current = [];
          setChoices([]);
          phaseRef.current = 'FLOOR_CLEAR';
          setPhase('FLOOR_CLEAR');
          movingRef.current = false;
          return;
        }
        setFeedback('locked');
      } else {
        setFeedback('ready');
        speakSound.playCorrect();
      }

      lastTranscriptRef.current = '';
      setLastRecognized('');
      makeChoices(currentMaze, destination);
      movingRef.current = false;
    }, MOVE_DELAY_MS);
    return true;
  }, [award, floor, makeChoices, updateStudyStats]);

  const { status, isSupported, start, stop } = useSpeechRecognition(handleTranscript);

  useEffect(() => {
    phaseRef.current = phase;
    pausedRef.current = paused;
    ttsActiveRef.current = ttsActive;
  }, [paused, phase, ttsActive]);

  useEffect(() => {
    if (phase === 'PLAYING' && !paused && !ttsActive) start();
    else stop();
    return () => stop();
  }, [paused, phase, start, stop, ttsActive]);

  useEffect(() => {
    if (phase !== 'PLAYING' || paused || ttsActive || movingRef.current) return undefined;
    const positionKey = mazeCellKey(player);
    const silenceTimer = setTimeout(() => {
      if (
        phaseRef.current === 'PLAYING'
        && !pausedRef.current
        && !ttsActiveRef.current
        && mazeCellKey(playerRef.current) === positionKey
        && !movingRef.current
      ) setFeedback('silent');
    }, SILENCE_TIMEOUT_MS);
    return () => clearTimeout(silenceTimer);
  }, [paused, phase, player, ttsActive]);

  useEffect(() => () => {
    if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
    if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const startGame = useCallback(() => {
    scoreRef.current = 0;
    stepsRef.current = 0;
    previousWordIndexRef.current = -1;
    setScore(0);
    setSteps(0);
    setFloorsCleared(0);
    setWordStudyStats({});
    onScoreChange?.(0);
    saveProgress(recordSessionPlayed(loadProgress(), 'magic-wizard'));
    beginFloor(1);
  }, [beginFloor, onScoreChange]);

  const finishExpedition = useCallback(() => {
    stop();
    setPaused(false);
    phaseRef.current = 'GAMEOVER';
    setPhase('GAMEOVER');
    onUpdateHighScore?.(scoreRef.current);
  }, [onUpdateHighScore, stop]);

  const playHint = useCallback((choice: DoorChoice, hintLanguage: 'en' | 'ru') => {
    const hintText = hintLanguage === 'ru'
      ? choice.target.translationRu || choice.target.translation
      : choice.target.word;
    if (!hintText) return;
    if (ttsTimerRef.current) clearTimeout(ttsTimerRef.current);
    ttsActiveRef.current = true;
    setTtsActive(true);
    stop();
    window.speechSynthesis?.cancel();
    speakWord(hintText, hintLanguage);
    const duration = Math.min(4_000, Math.max(1_500, hintText.length * 120));
    ttsTimerRef.current = setTimeout(() => {
      ttsActiveRef.current = false;
      setTtsActive(false);
      setFeedback('ready');
      lastTranscriptRef.current = '';
    }, duration);
  }, [stop]);

  const handleBackToHub = () => {
    stop();
    window.speechSynthesis?.cancel();
    onBackToHub();
  };

  const translatedWord = (word: WordData) => language === 'ru'
    ? word.translationRu || word.translation
    : word.translation;

  const directionLabel = (direction: MazeDirection) => t(`wizard.directions.${direction}`);

  const hazardNearby = Boolean(maze && getMazeCell(maze, player)?.openings.some((direction) => (
    getMazeCell(maze, destinationForDirection(player, direction))?.item === 'hazard'
  )));

  const feedbackText = ttsActive
    ? strings.speakingTarget
    : feedback === 'correct'
      ? strings.correct
      : feedback === 'retry'
        ? strings.retry
        : feedback === 'silent'
          ? strings.silent
          : feedback === 'crystal'
            ? strings.crystalFound
            : feedback === 'locked'
              ? strings.portalLocked
              : status.status === 'listening'
                ? strings.ready
                : status.message;

  const renderMaze = (map: VoiceMaze, isPreview = false) => {
    const mapPlayer = isPreview ? map.start : player;
    const mapVisited = isPreview ? new Set([mazeCellKey(map.start)]) : visited;
    const mapCollected = isPreview ? new Set<string>() : collected;
    return (
      <div
        className="mx-auto grid w-full max-w-3xl overflow-hidden rounded-2xl border-4 border-slate-900 bg-slate-950 shadow-[5px_5px_0_0_rgba(15,23,42,1)]"
        style={{ gridTemplateColumns: `repeat(${map.size}, minmax(0, 1fr))` }}
        role="grid"
        aria-label={strings.map}
        data-testid={isPreview ? 'maze-preview' : 'voice-maze'}
        data-maze-size={map.size}
      >
        {map.cells.map((cell) => {
          const key = mazeCellKey(cell);
          const isPlayer = sameMazePosition(cell, mapPlayer);
          const wasVisited = mapVisited.has(key);
          const route = !isPreview
            ? choices.find((choice) => sameMazePosition(choice.destination, cell))
            : undefined;
          const collectedHere = mapCollected.has(key);
          const portalOpen = !isPreview && crystals >= map.crystalCount;
          const item = collectedHere ? null : cell.item;
          return (
            <div
              key={key}
              role="gridcell"
              aria-label={`${cell.row + 1}, ${cell.col + 1}`}
              className={`relative aspect-square min-w-0 transition-colors ${
                isPlayer
                  ? 'z-10 bg-yellow-300'
                  : item === 'hazard'
                    ? 'bg-red-600 shadow-[inset_0_0_0_4px_rgba(127,29,29,1)]'
                  : route
                    ? activeTheme.route
                    : wasVisited
                      ? activeTheme.visited
                      : activeTheme.cell
              }`}
              style={{
                borderColor: activeTheme.wall,
                borderStyle: 'solid',
                borderTopWidth: cell.openings.includes('north') ? 0 : isPreview ? 2 : 4,
                borderRightWidth: cell.openings.includes('east') ? 0 : isPreview ? 2 : 4,
                borderBottomWidth: cell.openings.includes('south') ? 0 : isPreview ? 2 : 4,
                borderLeftWidth: cell.openings.includes('west') ? 0 : isPreview ? 2 : 4,
              }}
            >
              {wasVisited && !isPlayer && (
                <span className="absolute left-1 top-1 text-[7px] opacity-50" aria-hidden="true">•</span>
              )}
              {item === 'crystal' && (
                <span
                  className={route
                    ? 'absolute right-0.5 top-0.5 z-40 text-[clamp(10px,2.4vw,20px)] drop-shadow'
                    : 'absolute inset-0 flex items-center justify-center text-[clamp(10px,3.2vw,24px)]'}
                  aria-label={strings.crystals}
                >
                  💎
                </span>
              )}
              {item === 'portal' && (
                <span
                  className={`absolute inset-0 z-10 flex items-center justify-center text-[clamp(26px,7vw,56px)] drop-shadow-[0_3px_1px_rgba(255,255,255,0.9)] ${portalOpen ? 'animate-pulse' : ''}`}
                  aria-label={portalOpen ? t('wizard.portalOpen') : t('wizard.portalClosed')}
                  data-testid="maze-portal"
                >
                  {portalOpen ? '🌀' : '🚪'}
                </span>
              )}
              {item === 'hazard' && (
                <>
                  <span className="absolute inset-[12%] z-10 rounded-full border-[clamp(2px,0.5vw,5px)] border-red-950 bg-slate-950 shadow-[inset_0_0_0_3px_rgba(69,10,10,0.85)]" aria-hidden="true" />
                  <span
                    className="absolute inset-0 z-20 flex items-center justify-center text-[clamp(13px,3vw,25px)] font-black text-white drop-shadow-[0_2px_0_#7f1d1d]"
                    aria-label={strings.hazard}
                    data-testid="maze-hazard"
                  >
                    !
                  </span>
                </>
              )}
              {route && !isPlayer && (
                <span data-testid="maze-door-word" className={`absolute left-1/2 top-1/2 z-30 flex min-h-[42%] max-h-[94%] w-[96%] -translate-x-1/2 -translate-y-1/2 items-center justify-center overflow-hidden break-words [overflow-wrap:anywhere] rounded-md border border-white/90 bg-slate-950/95 px-0.5 py-0.5 text-center font-black leading-[1.05] text-yellow-200 shadow-[0_2px_6px_rgba(0,0,0,0.8)] ${
                  route.target.word.length > 15
                    ? 'text-[clamp(7px,1.25vw,10px)]'
                    : route.target.word.length > 9
                      ? 'text-[clamp(8px,1.55vw,12px)]'
                      : 'text-[clamp(10px,1.9vw,15px)]'
                }`}>
                  {route.target.word}
                </span>
              )}
              {isPlayer && (
                <span className="absolute inset-0 z-20 flex items-center justify-center text-[clamp(13px,4vw,30px)] drop-shadow" aria-label={t('wizard.player')}>
                  🧭
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (phase === 'START') {
    const setupWords = activeCategory.id === 'custom' ? customWords : wordList();
    return (
      <section className="mx-auto max-w-md px-2 py-4">
        <BackToHubButton label={t('shared.backToHub')} onClick={handleBackToHub} />
        <GameSetupCard
          icon={<Map className="h-10 w-10 text-slate-900" />}
          title={strings.title}
          description={strings.description}
          toneClass="bg-violet-50"
        >
          <div className="space-y-3 rounded-2xl border-4 border-slate-900 bg-white p-3 text-left">
            <OptionPicker
              label={strings.chooseTheme}
              options={(Object.keys(THEME_STYLE) as MazeTheme[]).map((id) => ({
                id,
                label: t(`wizard.themes.${id}`),
              }))}
              selected={theme}
              onSelect={setTheme}
            />
            <OptionPicker
              label={strings.chooseDifficulty}
              options={(Object.keys(DIFFICULTY) as MazeDifficulty[]).map((id) => ({
                id,
                label: t(`wizard.difficulties.${id}`),
              }))}
              selected={difficulty}
              onSelect={selectDifficulty}
            />
            <div className={`rounded-2xl border-4 border-slate-900 bg-gradient-to-br ${activeTheme.stage} p-3 text-white`}>
              {renderMaze(previewMaze, true)}
              <p className="mt-3 text-center text-[10px] font-black uppercase tracking-wider">
                {strings.preview}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px] font-black uppercase">
                <span className="rounded-full bg-emerald-300 px-2 py-1 text-slate-950">💎 {strings.objective}</span>
                <span className="rounded-full bg-red-300 px-2 py-1 text-slate-950">⛔ {strings.hazardLegend}</span>
                <span className="rounded-full bg-fuchsia-300 px-2 py-1 text-slate-950">∞ {strings.endless}</span>
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
          <ListenAndLearnSection words={setupWords} />
          <CustomWordsSection
            customWords={customWords}
            onAddWord={onAddCustomWord}
            onDeleteWord={onDeleteCustomWord}
            onClearAll={onClearCustomWords}
          />
          {!isSupported && (
            <p className="text-center text-xs font-bold text-rose-600" role="alert">
              {t('shared.voiceNeedsChrome')}
            </p>
          )}
          <button
            type="button"
            onClick={startGame}
            disabled={!isSupported}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-slate-900 bg-violet-400 py-3 font-black uppercase tracking-wider text-slate-900 hover:bg-violet-500 disabled:opacity-50"
          >
            <Compass className="h-5 w-5 stroke-[3]" /> {strings.start}
          </button>
        </GameSetupCard>
      </section>
    );
  }

  if (phase === 'GAMEOVER') {
    return (
      <div className="mx-auto max-w-md px-2 py-4">
        <BackToHubButton label={t('shared.backToHub')} onClick={handleBackToHub} />
        <GameResultCard
          title={strings.gameOverTitle}
          description={strings.gameOverSubtitle}
          scoreLabel={strings.score}
          score={score}
          bestLabel={strings.best}
          best={Math.max(highScore, score)}
          wordStats={wordStudyStats}
          words={wordList()}
          replayLabel={strings.playAgain}
          onReplay={startGame}
          icon={<span className="block text-5xl">🧭💎🌀</span>}
          summary={(
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border-4 border-slate-900 bg-emerald-100 p-3">
                <p className="text-[10px] font-black uppercase text-emerald-800">{strings.floorsCleared}</p>
                <p className="text-2xl font-black">{floorsCleared}</p>
              </div>
              <div className="rounded-2xl border-4 border-slate-900 bg-sky-100 p-3">
                <p className="text-[10px] font-black uppercase text-sky-800">{strings.roomsExplored}</p>
                <p className="text-2xl font-black">{steps}</p>
              </div>
            </div>
          )}
        />
      </div>
    );
  }

  if (phase === 'FLOOR_CLEAR') {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
        <BackToHubButton label={t('shared.backToHub')} onClick={handleBackToHub} />
        <section className={`rounded-4xl border-8 border-slate-900 bg-gradient-to-br ${activeTheme.stage} p-6 text-center text-white shadow-[8px_8px_0_0_rgba(15,23,42,1)]`}>
          <div className="text-6xl" aria-hidden="true">🧭✨🌀</div>
          <h2 className="mt-3 text-3xl font-black uppercase">{strings.floorComplete}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-bold text-white/85">{strings.floorCompleteText}</p>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-3 text-slate-950">
            <div className="rounded-2xl border-4 border-slate-900 bg-amber-200 p-3">
              <p className="text-[10px] font-black uppercase">{strings.floor}</p>
              <p className="text-3xl font-black">{floor}</p>
            </div>
            <div className="rounded-2xl border-4 border-slate-900 bg-emerald-200 p-3">
              <p className="text-[10px] font-black uppercase">{strings.score}</p>
              <p className="text-3xl font-black">{score}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => beginFloor(floor + 1)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-slate-900 bg-fuchsia-400 py-3 font-black uppercase text-slate-950 hover:bg-fuchsia-300"
          >
            <Footprints className="h-5 w-5" /> {strings.continue}
          </button>
          <button
            type="button"
            onClick={finishExpedition}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-4 border-white/70 bg-slate-950/60 py-3 font-black uppercase text-white hover:bg-slate-950"
          >
            <Trophy className="h-5 w-5" /> {strings.finish}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 px-3 py-5">
      <BackToHubButton label={t('shared.backToHub')} onClick={handleBackToHub} />
      <GameHeader
        icon={<Compass className="h-7 w-7" />}
        title={strings.title}
        subtitle={strings.sayDoor}
        stats={[
          { label: strings.floor, value: floor, tone: 'violet' },
          { label: strings.crystals, value: `${crystals}/${maze?.crystalCount || 0}`, tone: 'emerald', icon: <Gem className="h-3 w-3" /> },
          { label: strings.score, value: score, tone: 'amber' },
        ]}
      />
      <PauseButton paused={paused} onToggle={() => setPaused((value) => !value)} />

      <section className={`relative overflow-hidden rounded-4xl border-8 border-slate-900 bg-gradient-to-br ${activeTheme.stage} p-3 shadow-[8px_8px_0_0_rgba(15,23,42,1)] sm:p-5`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-white/40 bg-slate-950/50 px-3 py-2 text-white">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider">
            <Gem className="h-4 w-4 text-cyan-300" /> {strings.objective}: {crystals}/{maze?.crystalCount || 0}
          </p>
          <p className="rounded-full bg-red-200 px-2 py-1 text-[10px] font-black uppercase text-red-950">
            ⛔ {strings.hazardLegend}
          </p>
          <p className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-black uppercase ${
            status.status === 'listening' && !ttsActive ? 'bg-emerald-300 text-emerald-950' : 'bg-amber-200 text-amber-950'
          }`}>
            <Mic className="h-3.5 w-3.5" />
            {status.status === 'listening' && !ttsActive ? strings.micActive : strings.micInactive}
          </p>
        </div>

        {hazardNearby && feedback !== 'locked' && (
          <div
            className="mb-3 rounded-2xl border-4 border-red-300 bg-red-950/90 px-4 py-3 text-center text-xs font-black text-white shadow-lg"
            role="status"
            aria-live="polite"
          >
            ⛔ {strings.hazardHint}
          </div>
        )}

        {feedback === 'locked' && maze && (
          <div
            className="mb-3 rounded-2xl border-4 border-yellow-200 bg-amber-500 px-4 py-3 text-center text-sm font-black text-slate-950 shadow-[4px_4px_0_0_rgba(15,23,42,1)]"
            role="alert"
            data-testid="portal-locked-notice"
          >
            <span className="block text-lg">🚪🔒 {strings.portalLocked}</span>
            <span className="mt-1 block text-xs uppercase tracking-wider">
              💎 {strings.crystalsMissing}: {Math.max(0, maze.crystalCount - crystals)}
            </span>
          </div>
        )}

        {maze && renderMaze(maze)}

        <div className="mx-auto mt-4 w-full max-w-4xl rounded-3xl border-4 border-slate-900 bg-white/95 p-3 sm:p-4" data-testid="available-routes">
          <div className="mb-3 flex items-center justify-center gap-2 text-center">
            <Sparkles className="h-5 w-5 text-violet-600" />
            <h3 className="text-sm font-black uppercase text-slate-900">{strings.sayDoor}</h3>
          </div>
          <div className={`grid gap-2 ${choices.length === 1 ? 'grid-cols-1' : choices.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
            {choices.map((choice) => (
              <div
                key={choice.direction}
                className="relative rounded-2xl border-4 border-slate-900 bg-amber-100 p-3 text-center shadow-[3px_3px_0_0_rgba(15,23,42,1)]"
                data-testid="door-choice"
              >
                <span className="block text-2xl font-black text-violet-700" aria-hidden="true">{DIRECTION_ICON[choice.direction]}</span>
                <span className="block text-[10px] font-black uppercase text-slate-500">{directionLabel(choice.direction)}</span>
                <span className="mt-1 block break-words [overflow-wrap:anywhere] text-base font-black leading-tight text-slate-950 sm:text-lg" data-testid="door-word">{choice.target.word}</span>
                <span className="mt-1 block break-words text-xs font-bold leading-tight text-violet-700">{translatedWord(choice.target)}</span>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => playHint(choice, 'en')}
                    className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-white px-2 py-1 text-[9px] font-black uppercase text-indigo-700"
                    aria-label={`${t('shared.hearWord')} ${choice.target.word}`}
                  >
                    <Volume2 className="h-3 w-3" /> {t('shared.listenEnglish')}
                  </button>
                  {(choice.target.translationRu || choice.target.translation) && (
                    <button
                      type="button"
                      onClick={() => playHint(choice, 'ru')}
                      className="inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-white px-2 py-1 text-[9px] font-black uppercase text-blue-700"
                      aria-label={`${t('shared.listenInRussian')}: ${choice.target.translationRu || choice.target.translation}`}
                    >
                      <Volume2 className="h-3 w-3" /> {t('shared.listenRussian')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-4 max-w-3xl rounded-3xl border-4 border-slate-900 bg-white/95 p-3 sm:p-4">
          <div
            className={`mt-4 rounded-2xl border-4 border-slate-900 p-3 text-center text-xs font-black ${
              feedback === 'correct' || feedback === 'crystal'
                ? 'bg-emerald-200 text-emerald-950'
                : feedback === 'retry' || feedback === 'silent' || feedback === 'locked'
                  ? 'bg-amber-200 text-amber-950'
                  : 'bg-indigo-100 text-indigo-950'
            }`}
            role="status"
            aria-live="polite"
          >
            {feedbackText}
            {lastRecognized && (
              <span className="mt-1 block text-[9px] uppercase opacity-70">
                {strings.youSaid}: "{lastRecognized}"
              </span>
            )}
          </div>
        </div>

        {paused && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-5 text-center text-white">
            <Pause className="h-12 w-12" />
            <span className="font-black uppercase tracking-widest">{t('shared.paused')}</span>
            <button
              type="button"
              onClick={() => setPaused(false)}
              className="w-full max-w-sm rounded-2xl border-4 border-white bg-orange-400 py-3 font-black uppercase text-slate-950"
            >
              {t('shared.resume')}
            </button>
            <button
              type="button"
              onClick={finishExpedition}
              className="w-full max-w-sm rounded-2xl border-4 border-white/70 bg-slate-800 py-3 font-black uppercase text-white"
            >
              {strings.finish}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

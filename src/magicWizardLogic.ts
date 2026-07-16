import { pickAdaptiveWordIndex, type WordStats } from './progress';
import type { WordData } from './types';
import { matchesWord } from './utils';

export type MazeDirection = 'north' | 'east' | 'south' | 'west';
export type MazeItem = 'crystal' | 'portal' | 'hazard' | null;

export interface MazePosition {
  row: number;
  col: number;
}

export interface MazeCell extends MazePosition {
  openings: MazeDirection[];
  item: MazeItem;
}

export interface VoiceMaze {
  size: number;
  cells: MazeCell[];
  start: MazePosition;
  exit: MazePosition;
  crystalCount: number;
}

export interface DoorChoice {
  direction: MazeDirection;
  destination: MazePosition;
  target: WordData;
  wordIndex: number;
}

export interface DoorChoiceResult {
  choices: DoorChoice[];
  lastWordIndex: number;
}

export const DIRECTION_ORDER: readonly MazeDirection[] = [
  'north',
  'east',
  'south',
  'west',
];

const DIRECTION_META: Record<
  MazeDirection,
  { row: number; col: number; opposite: MazeDirection }
> = {
  north: { row: -1, col: 0, opposite: 'south' },
  east: { row: 0, col: 1, opposite: 'west' },
  south: { row: 1, col: 0, opposite: 'north' },
  west: { row: 0, col: -1, opposite: 'east' },
};

export function mazeCellKey(position: MazePosition): string {
  return `${position.row}:${position.col}`;
}

export function sameMazePosition(a: MazePosition, b: MazePosition): boolean {
  return a.row === b.row && a.col === b.col;
}

export function getMazeCell(maze: VoiceMaze, position: MazePosition): MazeCell | undefined {
  if (
    position.row < 0
    || position.col < 0
    || position.row >= maze.size
    || position.col >= maze.size
  ) return undefined;
  return maze.cells[position.row * maze.size + position.col];
}

export function destinationForDirection(
  position: MazePosition,
  direction: MazeDirection,
): MazePosition {
  const delta = DIRECTION_META[direction];
  return { row: position.row + delta.row, col: position.col + delta.col };
}

function shuffled<T>(values: readonly T[], rng: () => number): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.min(index, Math.floor(rng() * (index + 1)));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function addOpening(
  cells: MazeCell[],
  size: number,
  position: MazePosition,
  direction: MazeDirection,
): void {
  const from = cells[position.row * size + position.col];
  const destination = destinationForDirection(position, direction);
  const to = cells[destination.row * size + destination.col];
  if (!from.openings.includes(direction)) from.openings.push(direction);
  const opposite = DIRECTION_META[direction].opposite;
  if (!to.openings.includes(opposite)) to.openings.push(opposite);
}

function validNeighbours(position: MazePosition, size: number): Array<{
  direction: MazeDirection;
  position: MazePosition;
}> {
  return DIRECTION_ORDER.map((direction) => ({
    direction,
    position: destinationForDirection(position, direction),
  })).filter(({ position: candidate }) => (
    candidate.row >= 0
    && candidate.col >= 0
    && candidate.row < size
    && candidate.col < size
  ));
}

function distancesFrom(maze: VoiceMaze, start: MazePosition): Map<string, number> {
  const distances = new Map<string, number>([[mazeCellKey(start), 0]]);
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift() as MazePosition;
    const distance = distances.get(mazeCellKey(current)) || 0;
    const cell = getMazeCell(maze, current);
    if (!cell) continue;

    cell.openings.forEach((direction) => {
      const destination = destinationForDirection(current, direction);
      const key = mazeCellKey(destination);
      if (!distances.has(key)) {
        distances.set(key, distance + 1);
        queue.push(destination);
      }
    });
  }

  return distances;
}

function reachableCountWithout(
  maze: VoiceMaze,
  start: MazePosition,
  blocked: MazePosition,
): number {
  const blockedKey = mazeCellKey(blocked);
  if (mazeCellKey(start) === blockedKey) return 0;
  const reached = new Set<string>([mazeCellKey(start)]);
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift() as MazePosition;
    const cell = getMazeCell(maze, current);
    if (!cell) continue;
    cell.openings.forEach((direction) => {
      const destination = destinationForDirection(current, direction);
      const key = mazeCellKey(destination);
      if (key !== blockedKey && !reached.has(key)) {
        reached.add(key);
        queue.push(destination);
      }
    });
  }

  return reached.size;
}

function shortestPathKeys(
  maze: VoiceMaze,
  start: MazePosition,
  goal: MazePosition,
): Set<string> {
  const startKey = mazeCellKey(start);
  const goalKey = mazeCellKey(goal);
  const parents = new Map<string, string | null>([[startKey, null]]);
  const queue = [start];

  while (queue.length > 0 && !parents.has(goalKey)) {
    const current = queue.shift() as MazePosition;
    const currentKey = mazeCellKey(current);
    const cell = getMazeCell(maze, current);
    cell?.openings.forEach((direction) => {
      const destination = destinationForDirection(current, direction);
      const key = mazeCellKey(destination);
      if (!parents.has(key)) {
        parents.set(key, currentKey);
        queue.push(destination);
      }
    });
  }

  const path = new Set<string>();
  let cursor: string | null | undefined = goalKey;
  while (cursor && parents.has(cursor)) {
    path.add(cursor);
    cursor = parents.get(cursor);
  }
  path.delete(startKey);
  path.delete(goalKey);
  return path;
}

/**
 * Create a connected visual maze. A depth-first maze supplies the main puzzle,
 * while a few extra passages keep backtracking friendly for younger players.
 */
export function createVoiceMaze(
  requestedSize = 7,
  requestedCrystals = 3,
  rng: () => number = Math.random,
): VoiceMaze {
  const size = Math.max(3, Math.min(11, Math.floor(requestedSize)));
  const cells: MazeCell[] = Array.from({ length: size * size }, (_, index) => ({
    row: Math.floor(index / size),
    col: index % size,
    openings: [],
    item: null,
  }));
  const start = { row: size - 1, col: 0 };
  const visited = new Set<string>([mazeCellKey(start)]);
  const stack: MazePosition[] = [start];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const unvisited = shuffled(validNeighbours(current, size), rng).filter(
      ({ position }) => !visited.has(mazeCellKey(position)),
    );
    if (unvisited.length === 0) {
      stack.pop();
      continue;
    }

    const next = unvisited[0];
    addOpening(cells, size, current, next.direction);
    visited.add(mazeCellKey(next.position));
    stack.push(next.position);
  }

  // Add a small number of loops. The map remains a puzzle, but a wrong turn
  // does not always force the child to retrace the entire corridor.
  const loopCandidates = shuffled(
    cells.flatMap((cell) => validNeighbours(cell, size)
      .filter(({ direction }) => (
        (direction === 'east' || direction === 'south')
        && !cell.openings.includes(direction)
      ))
      .map(({ direction }) => ({ position: { row: cell.row, col: cell.col }, direction }))),
    rng,
  );
  loopCandidates.slice(0, Math.max(1, Math.floor(size / 2))).forEach(({ position, direction }) => {
    addOpening(cells, size, position, direction);
  });

  const shell: VoiceMaze = {
    size,
    cells,
    start,
    exit: start,
    crystalCount: 0,
  };
  const distances = distancesFrom(shell, start);
  const ranked = cells
    .filter((cell) => !sameMazePosition(cell, start))
    .sort((a, b) => (
      (distances.get(mazeCellKey(b)) || 0) - (distances.get(mazeCellKey(a)) || 0)
    ));
  const exit = ranked[0] || cells[start.row * size + start.col];
  shell.exit = { row: exit.row, col: exit.col };
  exit.item = 'portal';

  // Put one visible hazard on a corridor that can safely be removed from the
  // walkable graph. Prefer the natural shortest route to the portal so the
  // child has to notice the blocked cell and discover an alternate way around it.
  const directExitPath = shortestPathKeys(shell, start, shell.exit);
  const safeHazardCandidates = shuffled(
    ranked.filter((cell) => (
      cell.item === null
      && cell.openings.length >= 2
      && reachableCountWithout(shell, start, cell) === cells.length - 1
    )),
    rng,
  ).sort((a, b) => (
    Number(directExitPath.has(mazeCellKey(b)))
      - Number(directExitPath.has(mazeCellKey(a)))
  ));
  const hazard = safeHazardCandidates[0];
  if (hazard) hazard.item = 'hazard';

  const crystalCount = Math.max(
    1,
    Math.min(Math.floor(requestedCrystals), Math.max(1, cells.length - 2)),
  );
  const collectibleCandidates = shuffled(
    ranked.filter((cell) => !sameMazePosition(cell, exit) && cell.item === null),
    rng,
  ).sort((a, b) => (
    (distances.get(mazeCellKey(b)) || 0) - (distances.get(mazeCellKey(a)) || 0)
  ));

  const crystals: MazeCell[] = [];
  const minimumSpacing = Math.max(2, Math.floor(size / 3));
  for (const candidate of collectibleCandidates) {
    if (crystals.length >= crystalCount) break;
    const farEnough = crystals.every((placed) => (
      Math.abs(placed.row - candidate.row) + Math.abs(placed.col - candidate.col)
    ) >= minimumSpacing);
    if (farEnough) crystals.push(candidate);
  }
  for (const candidate of collectibleCandidates) {
    if (crystals.length >= crystalCount) break;
    if (!crystals.includes(candidate)) crystals.push(candidate);
  }
  crystals.forEach((cell) => { cell.item = 'crystal'; });
  shell.crystalCount = crystals.length;

  return shell;
}

/** Build one unique adaptive word choice for every open corridor. */
export function buildDoorChoices(
  maze: VoiceMaze,
  position: MazePosition,
  words: readonly WordData[],
  wordStats: Record<string, WordStats>,
  previousWordIndex = -1,
  rng: () => number = Math.random,
): DoorChoiceResult {
  const cell = getMazeCell(maze, position);
  if (!cell || words.length === 0) {
    return { choices: [], lastWordIndex: -1 };
  }

  let candidateIndexes = words.map((_, index) => index);
  let previous = previousWordIndex;
  const choices: DoorChoice[] = [];

  const playableDirections = DIRECTION_ORDER.filter((item) => {
    if (!cell.openings.includes(item)) return false;
    const destination = getMazeCell(maze, destinationForDirection(position, item));
    return destination?.item !== 'hazard';
  });

  for (const direction of playableDirections) {
    if (candidateIndexes.length === 0) {
      candidateIndexes = words.map((_, index) => index);
    }
    const candidateWords = candidateIndexes.map((index) => words[index].word);
    const previousCandidate = candidateIndexes.indexOf(previous);
    const selectedCandidate = pickAdaptiveWordIndex(
      candidateWords,
      wordStats,
      previousCandidate,
      rng,
    );
    const selectedIndex = candidateIndexes[selectedCandidate];
    choices.push({
      direction,
      destination: destinationForDirection(position, direction),
      target: words[selectedIndex],
      wordIndex: selectedIndex,
    });
    previous = selectedIndex;
    candidateIndexes = candidateIndexes.filter((index) => index !== selectedIndex);
  }

  return { choices, lastWordIndex: previous };
}

/** Every visible door is valid. Speaking its word selects that route. */
export function findSpokenDoor(
  transcript: string,
  choices: readonly DoorChoice[],
): DoorChoice | null {
  return choices.find((choice) => matchesWord(transcript, choice.target.word, true)) || null;
}

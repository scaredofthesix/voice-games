import { describe, expect, test } from 'vitest';

import {
  buildDoorChoices,
  createVoiceMaze,
  destinationForDirection,
  findSpokenDoor,
  getMazeCell,
  mazeCellKey,
  type MazePosition,
} from './magicWizardLogic';
import type { WordData } from './types';

const WORDS: WordData[] = [
  { word: 'Apple', translation: 'Fruit', translationRu: 'Яблоко', speakCount: 0, struggleCount: 0 },
  { word: 'Banana', translation: 'Fruit', translationRu: 'Банан', speakCount: 0, struggleCount: 0 },
  { word: 'Cherry', translation: 'Fruit', translationRu: 'Вишня', speakCount: 0, struggleCount: 0 },
  { word: 'Dragon', translation: 'Creature', translationRu: 'Дракон', speakCount: 0, struggleCount: 0 },
  { word: 'Emerald', translation: 'Gem', translationRu: 'Изумруд', speakCount: 0, struggleCount: 0 },
  { word: 'Forest', translation: 'Place', translationRu: 'Лес', speakCount: 0, struggleCount: 0 },
];

function reachableCells(start: MazePosition, maze: ReturnType<typeof createVoiceMaze>): Set<string> {
  const reached = new Set<string>([mazeCellKey(start)]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift() as MazePosition;
    const cell = getMazeCell(maze, current);
    cell?.openings.forEach((direction) => {
      const next = destinationForDirection(current, direction);
      if (!reached.has(mazeCellKey(next))) {
        reached.add(mazeCellKey(next));
        queue.push(next);
      }
    });
  }
  return reached;
}

function reachablePlayableCells(
  start: MazePosition,
  maze: ReturnType<typeof createVoiceMaze>,
): Set<string> {
  const reached = new Set<string>([mazeCellKey(start)]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift() as MazePosition;
    const cell = getMazeCell(maze, current);
    cell?.openings.forEach((direction) => {
      const next = destinationForDirection(current, direction);
      const nextCell = getMazeCell(maze, next);
      if (nextCell?.item !== 'hazard' && !reached.has(mazeCellKey(next))) {
        reached.add(mazeCellKey(next));
        queue.push(next);
      }
    });
  }
  return reached;
}

describe('Voice Maze Quest generation', () => {
  test('creates a fully connected visual maze with an exit, crystals, and one bypassable hazard', () => {
    const maze = createVoiceMaze(7, 3, () => 0.42);

    expect(maze.cells).toHaveLength(49);
    expect(reachableCells(maze.start, maze)).toHaveLength(49);
    expect(maze.cells.filter((cell) => cell.item === 'portal')).toHaveLength(1);
    expect(maze.cells.filter((cell) => cell.item === 'crystal')).toHaveLength(3);
    expect(maze.cells.filter((cell) => cell.item === 'hazard')).toHaveLength(1);
    expect(reachablePlayableCells(maze.start, maze)).toHaveLength(48);
    expect(mazeCellKey(maze.exit)).not.toBe(mazeCellKey(maze.start));
  });

  test('every carved passage is open from both sides', () => {
    const maze = createVoiceMaze(9, 4, () => 0.17);
    const opposite = { north: 'south', east: 'west', south: 'north', west: 'east' } as const;

    maze.cells.forEach((cell) => {
      cell.openings.forEach((direction) => {
        const neighbour = getMazeCell(maze, destinationForDirection(cell, direction));
        expect(neighbour?.openings).toContain(opposite[direction]);
      });
    });
  });
});

describe('Voice Maze Quest doors', () => {
  test('assigns one different adaptive word to every open route', () => {
    const maze = createVoiceMaze(5, 2, () => 0.31);
    const position = maze.cells.find((cell) => cell.openings.filter((direction) => (
      getMazeCell(maze, destinationForDirection(cell, direction))?.item !== 'hazard'
    )).length >= 2) as MazePosition;
    const result = buildDoorChoices(
      maze,
      position,
      WORDS,
      { Banana: { spoken: 0, struggled: 1, reinforcement: 2 } },
      -1,
      () => 0.99,
    );

    const playableOpenings = getMazeCell(maze, position)?.openings.filter((direction) => (
      getMazeCell(maze, destinationForDirection(position, direction))?.item !== 'hazard'
    )) || [];
    expect(result.choices).toHaveLength(playableOpenings.length);
    expect(new Set(result.choices.map((choice) => choice.target.word)).size)
      .toBe(result.choices.length);
    expect(result.choices.map((choice) => choice.target.word)).toContain('Banana');
    result.choices.forEach((choice) => {
      expect(getMazeCell(maze, position)?.openings).toContain(choice.direction);
      expect(getMazeCell(maze, choice.destination)).toBeDefined();
    });
  });

  test('keeps a one-word custom list playable at a junction', () => {
    const maze = createVoiceMaze(5, 2, () => 0.73);
    const position = maze.cells.find((cell) => cell.openings.filter((direction) => (
      getMazeCell(maze, destinationForDirection(cell, direction))?.item !== 'hazard'
    )).length >= 2) as MazePosition;
    const result = buildDoorChoices(maze, position, WORDS.slice(0, 1), {}, -1, () => 0.5);

    expect(result.choices.length).toBeGreaterThan(1);
    expect(result.choices.every((choice) => choice.target.word === 'Apple')).toBe(true);
  });

  test('a child selects only a visible route by saying its word', () => {
    const maze = createVoiceMaze(5, 2, () => 0.24);
    const result = buildDoorChoices(maze, maze.start, WORDS, {}, -1, () => 0);
    const visible = result.choices[0];

    expect(findSpokenDoor(`I said ${visible.target.word}`, result.choices)).toEqual(visible);
    expect(findSpokenDoor('xylophone', result.choices)).toBeNull();
  });

  test('never offers a spoken route into the hazard cell', () => {
    const maze = createVoiceMaze(7, 3, () => 0.42);
    const hazard = maze.cells.find((cell) => cell.item === 'hazard');
    expect(hazard).toBeDefined();
    const neighbour = maze.cells.find((cell) => cell.openings.some((direction) => (
      mazeCellKey(destinationForDirection(cell, direction)) === mazeCellKey(hazard as MazePosition)
    ))) as MazePosition;

    const result = buildDoorChoices(maze, neighbour, WORDS, {}, -1, () => 0.2);
    expect(result.choices.some((choice) => (
      mazeCellKey(choice.destination) === mazeCellKey(hazard as MazePosition)
    ))).toBe(false);
    expect(result.choices.length).toBeGreaterThan(0);
  });
});

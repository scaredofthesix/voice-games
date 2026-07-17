import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { MagicWizardGame } from './MagicWizardGame';
import { UiLanguageProvider } from '../uiLanguage';
import {
  installMockSpeechRecognition,
  MockSpeechRecognition,
} from '../test/mockSpeechRecognition';
import {
  createVoiceMaze,
  destinationForDirection,
  getMazeCell,
  mazeCellKey,
  type MazeDirection,
  type MazePosition,
  type VoiceMaze,
} from '../magicWizardLogic';
import { speakSound, speakWord } from '../utils';

vi.mock('../utils', async () => {
  const actual = await vi.importActual('../utils');
  return {
    ...actual,
    speakWord: vi.fn(),
    speakSound: {
      playCorrect: vi.fn(),
      playLose: vi.fn(),
      playCoin: vi.fn(),
    },
  };
});

describe('Voice Maze Quest', () => {
  let cleanup: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem('ui_language', 'en');
    vi.spyOn(Math, 'random').mockReturnValue(0.42);
    cleanup = installMockSpeechRecognition();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('start screen previews a real maze and explains the endless objective', () => {
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    expect(screen.getByRole('button', { name: /start maze quest/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /voice maze quest/i })).toBeInTheDocument();
    expect(screen.getByTestId('maze-preview')).toBeInTheDocument();
    expect(screen.getByTestId('maze-hazard')).toBeInTheDocument();
    expect(screen.getByTestId('maze-portal')).toHaveClass('text-[clamp(26px,7vw,56px)]');
    expect(within(screen.getByTestId('maze-preview')).queryByText(/^exit$/i)).not.toBeInTheDocument();
    expect(screen.queryByText('🎁')).not.toBeInTheDocument();
    expect(screen.getByText(/endless floors/i)).toBeInTheDocument();
    expect(screen.getByText(/collect crystals and unlock the portal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /trail 5x5/i })).toHaveAttribute('aria-pressed', 'true');
  });

  test('passes the selected size to the generator and remembers it after reopening', () => {
    const firstRender = render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /quest 7x7/i }));
    fireEvent.click(screen.getByRole('button', { name: /start maze quest/i }));
    expect(screen.getByTestId('voice-maze')).toHaveAttribute('data-maze-size', '7');

    firstRender.unmount();
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );
    expect(screen.getByRole('button', { name: /quest 7x7/i })).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking back to hub calls the shared callback', () => {
    const handleBack = vi.fn();
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={handleBack} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /hub/i }));
    expect(handleBack).toHaveBeenCalledOnce();
  });

  test('Russian setup has the new localized maze and no rejected rune mechanic', () => {
    window.localStorage.setItem('ui_language', 'ru');
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    expect(screen.getByRole('heading', { name: /голосовой лабиринт/i })).toBeInTheDocument();
    expect(screen.getByText(/бесконечные этажи/i)).toBeInTheDocument();
    expect(screen.queryByText(/руна|проклят|шесть дверей/i)).not.toBeInTheDocument();
  });

  test('wrong speech keeps the player in place and offers the same routes again', () => {
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start maze quest/i }));

    const positionBefore = screen.getByLabelText('Maze explorer').parentElement?.getAttribute('aria-label');
    const routesBefore = screen.getAllByTestId('door-word').map((node) => node.textContent);
    act(() => MockSpeechRecognition.latest().emit('xylophone'));

    expect(screen.getByText(/did not match a door/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Maze explorer').parentElement).toHaveAttribute('aria-label', positionBefore);
    expect(screen.getAllByTestId('door-word').map((node) => node.textContent)).toEqual(routesBefore);
    expect(screen.queryByText(/lives/i)).not.toBeInTheDocument();
    expect(vi.mocked(speakSound.playLose)).not.toHaveBeenCalled();
  });

  test('saying any visible door word moves the explorer and awards points', () => {
    vi.useFakeTimers();
    const onScoreChange = vi.fn();
    render(
      <UiLanguageProvider>
        <MagicWizardGame
          onBackToHub={() => {}}
          customWords={[]}
          onScoreChange={onScoreChange}
        />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start maze quest/i }));

    expect(screen.getAllByTestId('maze-door-word')[0]).toHaveClass(
      'left-1/2',
      'top-1/2',
      '-translate-x-1/2',
      '-translate-y-1/2',
      'bg-slate-950/95',
      'text-yellow-200',
    );
    expect(screen.getByTestId('available-routes').compareDocumentPosition(screen.getByTestId('voice-maze')))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.getAllByTestId('door-word')[0]).toHaveClass('text-base', 'break-words');

    const positionBefore = screen.getByLabelText('Maze explorer').parentElement?.getAttribute('aria-label');
    const target = screen.getAllByTestId('door-word')[0].textContent || '';
    act(() => MockSpeechRecognition.latest().emit(target));
    expect(screen.getByText(/route chosen/i)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(500));

    const positionAfter = screen.getByLabelText('Maze explorer').parentElement?.getAttribute('aria-label');
    expect(positionAfter).not.toBe(positionBefore);
    expect(onScoreChange).toHaveBeenCalledWith(expect.any(Number));
    expect(onScoreChange.mock.calls.some(([value]) => value > 0)).toBe(true);
    expect(
      vi.mocked(speakSound.playCorrect).mock.calls.length
        + vi.mocked(speakSound.playCoin).mock.calls.length,
    ).toBe(1);
  });

  test('every route offers separate English and Russian pronunciation audio', () => {
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start maze quest/i }));

    fireEvent.click(screen.getAllByRole('button', { name: /listen in russian/i })[0]);
    expect(vi.mocked(speakWord)).toHaveBeenCalledWith(expect.any(String), 'ru');

    fireEvent.click(screen.getAllByRole('button', { name: /hear the word/i })[0]);
    expect(vi.mocked(speakWord)).toHaveBeenCalledWith(expect.any(String), 'en');
  });

  test('the child can finish an endless run from pause and see a unified result card', () => {
    vi.useFakeTimers();
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start maze quest/i }));
    const firstWord = screen.getAllByTestId('door-word')[0].textContent || '';
    act(() => MockSpeechRecognition.latest().emit(firstWord));
    act(() => vi.advanceTimersByTime(500));
    fireEvent.click(screen.getByRole('button', { name: /pause the game/i }));
    fireEvent.click(screen.getByRole('button', { name: /finish expedition/i }));

    expect(screen.getByRole('heading', { name: /expedition complete/i })).toBeInTheDocument();
    expect(screen.getByText(/floors cleared/i)).toBeInTheDocument();
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(/Words practised\s*1/i);
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(/Correct\s*1/i);
    expect(screen.getByRole('heading', { name: /word report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new expedition/i })).toBeInTheDocument();
  });

  test('collecting every crystal unlocks the portal and starts another generated floor', () => {
    vi.useFakeTimers();
    const generated = createVoiceMaze(5, 2, () => 0.42);
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start maze quest/i }));

    const goals = [
      ...generated.cells.filter((cell) => cell.item === 'crystal'),
      generated.exit,
    ];
    let position = generated.start;
    for (const goal of goals) {
      const route = shortestRoute(generated, position, goal);
      for (const direction of route) {
        const card = screen.getAllByTestId('door-choice').find((candidate) => (
          within(candidate).queryByText(DIRECTION_NAME[direction], { exact: true })
        ));
        expect(card).toBeDefined();
        const word = within(card as HTMLElement).getByTestId('door-word').textContent || '';
        act(() => MockSpeechRecognition.latest().emit(word));
        act(() => vi.advanceTimersByTime(700));
        position = destinationForDirection(position, direction);
      }
    }

    expect(screen.getByRole('heading', { name: /portal unlocked/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /next maze floor/i }));
    expect(screen.getByText('Floor:').parentElement).toHaveTextContent('2');
    expect(screen.getByTestId('voice-maze')).toBeInTheDocument();
  });

  test('reaching the locked portal clearly says how many crystals are still needed', () => {
    vi.useFakeTimers();
    const generated = createVoiceMaze(5, 2, () => 0.42);
    render(
      <UiLanguageProvider>
        <MagicWizardGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start maze quest/i }));

    let position = generated.start;
    const route = shortestRoute(generated, position, generated.exit);
    for (const direction of route) {
      const card = screen.getAllByTestId('door-choice').find((candidate) => (
        within(candidate).queryByText(DIRECTION_NAME[direction], { exact: true })
      ));
      expect(card).toBeDefined();
      const word = within(card as HTMLElement).getByTestId('door-word').textContent || '';
      act(() => MockSpeechRecognition.latest().emit(word));
      act(() => vi.advanceTimersByTime(700));
      position = destinationForDirection(position, direction);
    }

    expect(screen.getByTestId('portal-locked-notice')).toHaveTextContent(/portal is locked/i);
    expect(screen.getByTestId('portal-locked-notice')).toHaveTextContent(/crystals still needed: [1-9]/i);
  });
});

const DIRECTION_NAME: Record<MazeDirection, string> = {
  north: 'North',
  east: 'East',
  south: 'South',
  west: 'West',
};

function shortestRoute(
  maze: VoiceMaze,
  from: MazePosition,
  to: MazePosition,
): MazeDirection[] {
  const queue: Array<{ position: MazePosition; route: MazeDirection[] }> = [
    { position: from, route: [] },
  ];
  const visited = new Set<string>([mazeCellKey(from)]);
  while (queue.length > 0) {
    const current = queue.shift() as { position: MazePosition; route: MazeDirection[] };
    if (mazeCellKey(current.position) === mazeCellKey(to)) return current.route;
    const cell = getMazeCell(maze, current.position);
    cell?.openings.forEach((direction) => {
      const next = destinationForDirection(current.position, direction);
      const key = mazeCellKey(next);
      if (getMazeCell(maze, next)?.item !== 'hazard' && !visited.has(key)) {
        visited.add(key);
        queue.push({ position: next, route: [...current.route, direction] });
      }
    });
  }
  throw new Error('Maze goal is unreachable');
}

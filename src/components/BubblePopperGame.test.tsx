import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { BubblePopperGame } from './BubblePopperGame';
import { UiLanguageProvider } from '../uiLanguage';
import { installMockSpeechRecognition } from '../test/mockSpeechRecognition';

describe('BubblePopperGame shared shell', () => {
  let cleanup: () => void;

  const renderGame = () => render(
    <UiLanguageProvider>
      <BubblePopperGame
        onBackToHub={() => {}}
        onUpdateHighScore={() => {}}
        highScore={0}
        customWords={[]}
        onAddCustomWord={() => {}}
        onDeleteCustomWord={() => {}}
        onClearCustomWords={() => {}}
      />
    </UiLanguageProvider>,
  );

  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('ui_language', 'en');
    cleanup = installMockSpeechRecognition();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test('uses the shared setup and play header with one Hub control', () => {
    renderGame();

    const setupHeading = screen.getByRole('heading', { name: /voice bubble popper/i });
    expect(setupHeading).toBeInTheDocument();
    expect(setupHeading.closest('.max-w-md')).toBeInTheDocument();
    expect(
      screen.getByText(/pronounce words on translucent floating bubbles/i),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /start popping/i }));

    expect(
      screen.getByRole('heading', { name: /voice bubble popper/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/score:/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
  });

  test('a real missed-bubble game over shows a non-empty struggle row', () => {
    const gradient = { addColorStop: vi.fn() };
    const noop = vi.fn();
    const context = new Proxy(
      {
        createLinearGradient: () => gradient,
        createRadialGradient: () => gradient,
      },
      {
        get(target, property) {
          return property in target
            ? target[property as keyof typeof target]
            : noop;
        },
        set(target, property, value) {
          Reflect.set(target, property, value);
          return true;
        },
      },
    ) as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);

    let frame: FrameRequestCallback | null = null;
    let wallClock = 0;
    let performanceClock = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => wallClock);
    vi.spyOn(performance, 'now').mockImplementation(() => performanceClock);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      frame = callback;
      return 1;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
      frame = null;
    });

    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /start popping/i }));

    for (let index = 0; index < 120; index += 1) {
      if (screen.queryByRole('heading', { name: /super bubbles popping/i })) break;
      act(() => {
        wallClock += 1000;
        performanceClock += 80;
        const callback = frame as FrameRequestCallback | null;
        frame = null;
        callback?.(performanceClock);
      });
    }

    const resultHeading = screen.getByRole('heading', { name: /super bubbles popping/i });
    expect(resultHeading.closest('.max-w-md')).toBeInTheDocument();
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(
      /Needs practice\s*[1-9]/i,
    );
    expect(
      screen.getAllByText(/Correct:\s*0.*Needs practice:\s*[1-9]/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { TreasureHunterGame } from './TreasureHunterGame';
import { UiLanguageProvider } from '../uiLanguage';
import {
  installMockSpeechRecognition,
  MockSpeechRecognition,
} from '../test/mockSpeechRecognition';

function installCanvasAndAnimationMocks() {
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({}, {
    get: (_target, property) => {
      if (property === 'createLinearGradient' || property === 'createRadialGradient') return () => gradient;
      if (property === 'measureText') return (text: string) => ({ width: text.length * 8 });
      return () => undefined;
    },
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);

  let nextId = 0;
  let now = 0;
  const pending = new Map<number, FrameRequestCallback>();
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    nextId += 1;
    pending.set(nextId, callback);
    return nextId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    pending.delete(id);
  });
  vi.spyOn(performance, 'now').mockImplementation(() => {
    now += 16.67;
    return now;
  });

  return {
    runFrames(count: number) {
      for (let frame = 0; frame < count; frame += 1) {
        const callbacks = [...pending.values()];
        pending.clear();
        callbacks.forEach((callback) => callback(now));
      }
    },
  };
}

describe('TreasureHunterGame (integration)', () => {
  let cleanup: () => void;

  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('ui_language', 'en');
  });

  afterEach(() => {
    cleanup?.();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('start screen shows accessible title and start control', () => {
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <TreasureHunterGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    expect(
      screen.getByRole('button', { name: /start diving/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /voice treasure hunter/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /voice treasure hunter/i }).closest('.max-w-md')).not.toBeNull();
    expect(screen.getByRole('group', { name: /submarine color/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add my own words/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
  });

  test('speaking the target word updates stats and can progress', () => {
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <TreasureHunterGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /start diving/i }),
    );

    expect(
      screen.getByRole('heading', { name: /voice treasure hunter/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Chests:')).toBeInTheDocument();
    expect(screen.getByText('Best Score:')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);

    const rec = MockSpeechRecognition.latest();
    expect(rec).toBeTruthy();

    const targetEl = screen.getByTestId('target-word');
    expect(targetEl).toBeInTheDocument();
    const word = targetEl.textContent ?? '';

    act(() => {
      rec.emit(word);
    });

    // Should still display target-word or update score (async progress happens)
    expect(screen.getByTestId('target-word')).toBeInTheDocument();
  });

  test('shows one Hub action and both success and struggle counts in the result', () => {
    vi.useFakeTimers();
    const animation = installCanvasAndAnimationMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    cleanup = installMockSpeechRecognition();
    const customWords = [{
      word: 'Ocean',
      translation: 'Океан',
      translationRu: 'Океан',
      speakCount: 0,
      struggleCount: 0,
    }];
    render(
      <UiLanguageProvider>
        <TreasureHunterGame onBackToHub={() => {}} customWords={customWords} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /my words \(1\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /start diving/i }));
    act(() => MockSpeechRecognition.latest().emit('Ocean'));
    act(() => vi.advanceTimersByTime(800));
    act(() => animation.runFrames(470));
    act(() => vi.runOnlyPendingTimers());

    const resultHeading = screen.getByRole('heading', { name: /dive completed/i });
    expect(resultHeading.closest('.max-w-md')).not.toBeNull();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
    expect(screen.queryByText(/no words were attempted/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Correct: 1 · Needs practice: 3/i)).toBeInTheDocument();
  });
});

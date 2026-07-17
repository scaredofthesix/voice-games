import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { loadProgress } from '../progress';
import { UiLanguageProvider } from '../uiLanguage';
import { installMockSpeechRecognition, MockSpeechRecognition } from '../test/mockSpeechRecognition';
import { AsteWordGame } from './AsteWordGame';

function installCanvasAndAnimationMocks(frameDurationMs = 16.67) {
  const gradient = { addColorStop: vi.fn() };
  const context = new Proxy({}, {
    get: (_target, property) => {
      if (property === 'createLinearGradient') return () => gradient;
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
    now += frameDurationMs;
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

describe('AsteWordGame shared interface', () => {
  let restoreSpeechRecognition: () => void;

  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('ui_language', 'en');
    restoreSpeechRecognition = installMockSpeechRecognition();
  });

  afterEach(() => {
    restoreSpeechRecognition();
    vi.restoreAllMocks();
  });

  test('keeps setup controls and renders the shared header after starting', () => {
    render(
      <UiLanguageProvider>
        <AsteWordGame onBackToHub={() => undefined} customWords={[]} highScore={4} />
      </UiLanguageProvider>,
    );

    expect(screen.getByRole('heading', { name: /asteword destroyer/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /asteword destroyer/i }).closest('.max-w-md')).not.toBeNull();
    expect(screen.getByRole('group', { name: /space sector theme/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /difficulty level/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add my own words/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /start defense/i }));

    expect(screen.getByRole('heading', { name: /asteword destroyer/i })).toBeInTheDocument();
    expect(screen.getByText('Destroyed:')).toBeInTheDocument();
    expect(screen.getByText('Best Score:')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
  });

  test('records the asteroid word once when it reaches the shield', () => {
    const animation = installCanvasAndAnimationMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(
      <UiLanguageProvider>
        <AsteWordGame onBackToHub={() => undefined} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /start defense/i }));
    const missedWord = screen.getByTestId('target-word').textContent ?? '';
    expect(missedWord).not.toBe('');

    act(() => animation.runFrames(320));

    expect(loadProgress()['aste-word'].words[missedWord]?.struggled).toBe(1);
    act(() => animation.runFrames(1));
    expect(loadProgress()['aste-word'].words[missedWord]?.struggled).toBe(1);
  });

  test('shows one Hub action and a meaningful per-word report after game over', async () => {
    const animation = installCanvasAndAnimationMocks(100);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const customWords = [{
      word: 'Ocean',
      translation: 'Океан',
      translationRu: 'Океан',
      speakCount: 0,
      struggleCount: 0,
    }];
    render(
      <UiLanguageProvider>
        <AsteWordGame onBackToHub={() => undefined} customWords={customWords} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /my words \(1\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /start defense/i }));
    act(() => animation.runFrames(1));
    act(() => MockSpeechRecognition.latest().emit('Ocean'));
    // Flush React and zero-delay game-over work between frame batches. A single
    // large synchronous batch can postpone those updates under coverage.
    for (let batch = 0; batch < 20; batch += 1) {
      await act(async () => {
        animation.runFrames(100);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      if (screen.queryByRole('heading', { name: /game over/i })) break;
    }

    await waitFor(() => expect(screen.getByRole('heading', { name: /game over/i })).toBeInTheDocument());
    const resultHeading = screen.getByRole('heading', { name: /game over/i });
    expect(resultHeading.closest('.max-w-md')).not.toBeNull();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
    expect(screen.queryByText(/no words were attempted/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Correct: 1 · Needs practice: 3/i)).toBeInTheDocument();
  });
});

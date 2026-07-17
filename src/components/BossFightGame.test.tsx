import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { BossFightGame } from './BossFightGame';
import { UiLanguageProvider } from '../uiLanguage';
import { loadProgress } from '../progress';
import {
  installMockSpeechRecognition,
  MockSpeechRecognition,
} from '../test/mockSpeechRecognition';
import { SUCCESS_RECOGNITION_DELAY_MS } from '../useSpeechRecognition';

// Integration test: BossFightGame wired with the shared speech hook and the
// gameLogic boss reducer, driven through a fake SpeechRecognition. The boss
// is beaten by speaking the shown words fast enough that the per-word timer
// never expires within the synchronous test loop.

describe('BossFightGame (integration)', () => {
  let cleanup: () => void;

  beforeEach(() => {
    // Pin these mechanic tests to English so the accessible labels are
    // deterministic; the app itself defaults to Russian on launch (issue #84).
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
        <BossFightGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    expect(
      screen.getByRole('button', { name: /start fight/i }),
    ).toBeInTheDocument();
    const setupHeading = screen.getByRole('heading', { name: /boss fight/i });
    expect(setupHeading).toBeInTheDocument();
    expect(setupHeading.closest('.max-w-md')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /back to hub/i }),
    ).toHaveLength(1);
  });

  test('speaking words defeats bosses and the fight continues endlessly in Endless mode', () => {
    vi.useFakeTimers();
    window.localStorage.setItem('boss_fight_infinite_unlocked', 'true');
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <BossFightGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    // Select Endless mode
    fireEvent.click(screen.getByRole('button', { name: /endless/i }));

    fireEvent.click(
      screen.getByRole('button', { name: /start fight/i }),
    );

    expect(MockSpeechRecognition.latest()).toBeTruthy();

    // Speak far more correct words than the original 3-boss gauntlet ever
    // needed (22). In endless mode the fight never ends in victory: a fresh
    // target word is always shown and no win screen appears.
    for (let i = 0; i < 30; i++) {
      const targetEl = screen.queryByTestId('target-word');
      if (!targetEl) break;
      const word = targetEl.textContent ?? '';
      act(() => MockSpeechRecognition.latest().emit(word));
      act(() => vi.advanceTimersByTime(SUCCESS_RECOGNITION_DELAY_MS));
    }

    expect(screen.queryByText(/you won/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('target-word')).toBeInTheDocument();
  });

  test('shows the boss name in Russian when the Russian interface is selected', () => {
    window.localStorage.setItem('ui_language', 'ru');
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <BossFightGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /начать бой/i }));
    expect(screen.getByText(/Слизень/)).toBeInTheDocument();
    expect(screen.queryByText(/Slime/)).not.toBeInTheDocument();
  });

  test('records the actual target once when its timer expires', () => {
    vi.useFakeTimers();
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <BossFightGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /start fight/i }));
    const missedWord = screen.getByTestId('target-word').textContent ?? '';
    expect(missedWord).not.toBe('');

    for (let second = 0; second < 10; second += 1) {
      act(() => vi.advanceTimersByTime(1000));
    }

    expect(loadProgress()['boss-fight'].words[missedWord]?.struggled).toBe(1);
    act(() => vi.advanceTimersByTime(500));
    expect(loadProgress()['boss-fight'].words[missedWord]?.struggled).toBe(1);

    for (let second = 0; second < 25; second += 1) {
      if (screen.queryByRole('heading', { name: /^game over!?$/i })) break;
      act(() => vi.advanceTimersByTime(1000));
    }

    const resultHeading = screen.getByRole('heading', { name: /^game over!?$/i });
    expect(resultHeading.closest('.max-w-md')).toBeInTheDocument();
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(
      /Needs practice\s*[1-9]/i,
    );
    expect(
      screen.getAllByText(/Correct:\s*0.*Needs practice:\s*[1-9]/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
  });

  test('speaking words defeats 3 bosses and ends in victory in Normal mode', () => {
    vi.useFakeTimers();
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <BossFightGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    // Default mode is 3 bosses (Normal)
    fireEvent.click(
      screen.getByRole('button', { name: /start fight/i }),
    );

    expect(MockSpeechRecognition.latest()).toBeTruthy();

    // Speak words until all 3 bosses are defeated and win screen is shown
    for (let i = 0; i < 60; i++) {
      const targetEl = screen.queryByTestId('target-word');
      if (!targetEl) break;
      const word = targetEl.textContent ?? '';
      act(() => MockSpeechRecognition.latest().emit(word));
      act(() => vi.advanceTimersByTime(SUCCESS_RECOGNITION_DELAY_MS));
    }

    const resultHeading = screen.getByRole('heading', { name: /you won/i });
    expect(resultHeading).toBeInTheDocument();
    expect(resultHeading.closest('.max-w-md')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /word report/i })).toBeInTheDocument();
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(
      /Correct\s*[1-9]/i,
    );
    expect(
      screen.getAllByText(/Correct:\s*[1-9].*Needs practice:\s*\d+/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
    expect(screen.queryByTestId('target-word')).not.toBeInTheDocument();
    expect(window.localStorage.getItem('boss_fight_infinite_unlocked')).toBe('true');
  });
});

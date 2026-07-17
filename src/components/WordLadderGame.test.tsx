import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { WordLadderGame } from './WordLadderGame';
import { UiLanguageProvider } from '../uiLanguage';
import {
  installMockSpeechRecognition,
  MockSpeechRecognition,
} from '../test/mockSpeechRecognition';
import { SUCCESS_RECOGNITION_DELAY_MS } from '../useSpeechRecognition';

// Integration test: WordLadderGame wired together with the shared speech hook
// and the gameLogic climb reducer, driven through a fake SpeechRecognition.
// Backs quality requirement QR-1 (Functional Correctness) end to end and the
// accessibility checks behind QR-3.

describe('WordLadderGame (integration)', () => {
  let cleanup: () => void;

  beforeEach(() => {
    // Pin these mechanic tests to English so the accessible labels are
    // deterministic; the app itself defaults to Russian on launch (issue #84).
    window.localStorage.setItem('ui_language', 'en');
  });

  afterEach(() => {
    cleanup?.();
    vi.useRealTimers();
  });

  test('start screen shows accessible title and start control', () => {
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <WordLadderGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    expect(
      screen.getByRole('button', { name: /start launch/i }),
    ).toBeInTheDocument();
    const setupHeading = screen.getByRole('heading', { name: /voice rocket climb/i });
    expect(setupHeading).toBeInTheDocument();
    expect(setupHeading.closest('.max-w-md')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /back to hub/i }),
    ).toHaveLength(1);
  });

  test('speaking each shown word climbs the rocket to the top', () => {
    vi.useFakeTimers();
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <WordLadderGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /start launch/i }),
    );

    expect(MockSpeechRecognition.latest()).toBeTruthy();

    // Read the word currently on screen and speak it; repeat until the win
    // screen replaces the target word. Capped well above the 20 steps needed.
    for (let i = 0; i < 40; i++) {
      const targetEl = screen.queryByTestId('target-word');
      if (!targetEl) break;
      const word = targetEl.textContent ?? '';
      act(() => MockSpeechRecognition.latest().emit(word));
      act(() => vi.advanceTimersByTime(SUCCESS_RECOGNITION_DELAY_MS));
    }

    // The win banner renders the title as layered (outlined) copies, so match all.
    expect(screen.getAllByText(/orbit reached/i).length).toBeGreaterThan(0);
    const resultHeading = screen.getByRole('heading', { name: /orbit reached/i });
    expect(resultHeading.closest('.max-w-md')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /word report/i })).toBeInTheDocument();
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(
      /Correct\s*[1-9]/i,
    );
    expect(
      screen.getAllByText(/Correct:\s*[1-9].*Needs practice:\s*\d+/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
  });

  test('the win screen shows a friendly alien encounter', () => {
    vi.useFakeTimers();
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <WordLadderGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /start launch/i }),
    );

    for (let i = 0; i < 40; i++) {
      const targetEl = screen.queryByTestId('target-word');
      if (!targetEl) break;
      const word = targetEl.textContent ?? '';
      act(() => MockSpeechRecognition.latest().emit(word));
      act(() => vi.advanceTimersByTime(SUCCESS_RECOGNITION_DELAY_MS));
    }

    fireEvent.click(
      screen.getByRole('button', { name: /say hello to the alien/i }),
    );

    expect(screen.getByText(/the alien says/i)).toBeInTheDocument();
  });

  test('an unrelated transcript does not advance the climb', () => {
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <WordLadderGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /start launch/i }),
    );
    const rec = MockSpeechRecognition.latest();

    act(() => rec.emit('zzzzz qqqqq'));

    expect(screen.getByLabelText(/step 0 of 20/i)).toBeInTheDocument();
  });
});

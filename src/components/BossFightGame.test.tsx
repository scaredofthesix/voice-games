import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { BossFightGame } from './BossFightGame';
import { UiLanguageProvider } from '../uiLanguage';
import {
  installMockSpeechRecognition,
  MockSpeechRecognition,
} from '../test/mockSpeechRecognition';

// Integration test: BossFightGame wired with the shared speech hook and the
// gameLogic boss reducer, driven through a fake SpeechRecognition. The boss
// is beaten by speaking the shown words fast enough that the per-word timer
// never expires within the synchronous test loop.

describe('BossFightGame (integration)', () => {
  let cleanup: () => void;

  beforeEach(() => {
    // Pin these mechanic tests to English so the accessible labels are
    // deterministic; the app itself defaults to Russian on launch (issue #84).
    window.localStorage.setItem('ui_language', 'en');
  });

  afterEach(() => {
    cleanup?.();
  });

  test('start screen shows accessible title and start control', () => {
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <BossFightGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    expect(
      screen.getByRole('button', { name: /start the boss fight/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /boss fight/i }),
    ).toBeInTheDocument();
  });

  test('speaking words defeats bosses and the fight continues endlessly', () => {
    cleanup = installMockSpeechRecognition();
    render(
      <UiLanguageProvider>
        <BossFightGame onBackToHub={() => {}} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /start the boss fight/i }),
    );

    const rec = MockSpeechRecognition.latest();
    expect(rec).toBeTruthy();

    // Speak far more correct words than the original 3-boss gauntlet ever
    // needed (22). In endless mode the fight never ends in victory: a fresh
    // target word is always shown and no win screen appears.
    for (let i = 0; i < 30; i++) {
      const targetEl = screen.queryByTestId('target-word');
      if (!targetEl) break;
      const word = targetEl.textContent ?? '';
      act(() => rec.emit(word));
    }

    expect(screen.queryByText(/you won/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('target-word')).toBeInTheDocument();
  });
});

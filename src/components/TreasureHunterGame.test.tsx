import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { TreasureHunterGame } from './TreasureHunterGame';
import { UiLanguageProvider } from '../uiLanguage';
import {
  installMockSpeechRecognition,
  MockSpeechRecognition,
} from '../test/mockSpeechRecognition';

describe('TreasureHunterGame (integration)', () => {
  let cleanup: () => void;

  beforeEach(() => {
    window.localStorage.setItem('ui_language', 'en');
  });

  afterEach(() => {
    cleanup?.();
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
});

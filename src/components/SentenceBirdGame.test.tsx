import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import SentenceBirdGame from './SentenceBirdGame';
import { UiLanguageProvider } from '../uiLanguage';
import {
  installMockSpeechRecognition,
  MockSpeechRecognition,
} from '../test/mockSpeechRecognition';

vi.mock('../sentenceBird/audioSynth', () => ({
  synths: {
    playFlap: vi.fn(),
    playSentenceComplete: vi.fn(),
  },
}));

describe('SentenceBirdGame push-to-talk and timeout flow', () => {
  let cleanupSpeechRecognition: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    window.localStorage.setItem('ui_language', 'en');
    cleanupSpeechRecognition = installMockSpeechRecognition();
  });

  afterEach(() => {
    cleanupSpeechRecognition();
    vi.useRealTimers();
  });

  function renderAndStart() {
    render(
      <UiLanguageProvider>
        <SentenceBirdGame onBackToHub={() => undefined} customWords={[]} />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start flying/i }));
  }

  function livesValue(): string | null {
    return screen.getByText('Lives:').parentElement?.textContent || null;
  }

  test('uses the active word itself as the mic control without an extra button', () => {
    renderAndStart();

    expect(MockSpeechRecognition.instances).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /click & say/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /tap the word or press space/i }).at(-1)!);

    expect(MockSpeechRecognition.instances).toHaveLength(1);
    expect(MockSpeechRecognition.latest().start).toHaveBeenCalledOnce();
  });

  test('supports Space activation and does not lose a life for unrelated speech', () => {
    renderAndStart();

    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    expect(MockSpeechRecognition.instances).toHaveLength(1);

    act(() => MockSpeechRecognition.latest().emit('completely unrelated'));
    expect(livesValue()).toContain('Lives:3');
    expect(screen.getAllByText('"completely unrelated"').length).toBeGreaterThan(0);
    expect(screen.getByText('You said / Heard:')).toBeInTheDocument();
  });

  test('keeps the correctly recognized word visible through the flight animation', () => {
    renderAndStart();
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });
    const target = screen.getByTestId('target-word').textContent || '';

    act(() => MockSpeechRecognition.latest().emit(target));
    act(() => vi.advanceTimersByTime(1_000));

    expect(screen.getAllByText(`"${target}"`).length).toBeGreaterThan(0);
  });

  test('loses one life only when the visible per-word timer expires', () => {
    renderAndStart();

    expect(screen.getByText('8s')).toBeInTheDocument();
    expect(livesValue()).toContain('Lives:3');

    act(() => vi.advanceTimersByTime(8000));

    expect(livesValue()).toContain('Lives:2');
  });

  test('keeps the falling scene visible before showing defeat results', () => {
    renderAndStart();

    act(() => vi.advanceTimersByTime(8_000));
    act(() => vi.advanceTimersByTime(8_000));
    act(() => vi.advanceTimersByTime(8_000));
    expect(livesValue()).toContain('Lives:0');
    expect(screen.queryByText('Oh no, crashed!')).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1_000));
    expect(screen.getByText('Oh no, crashed!')).toBeInTheDocument();
  });
});

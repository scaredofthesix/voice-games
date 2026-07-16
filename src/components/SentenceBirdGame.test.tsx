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

  test('does not listen until the child presses the visible mic button', () => {
    renderAndStart();

    expect(MockSpeechRecognition.instances).toHaveLength(0);
    const micButton = screen.getByRole('button', { name: /click & say/i });
    expect(micButton).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(micButton);

    expect(MockSpeechRecognition.instances).toHaveLength(1);
    expect(MockSpeechRecognition.latest().start).toHaveBeenCalledOnce();
    expect(micButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText(/mic is listening/i).length).toBeGreaterThan(0);
  });

  test('turns the mic off after the push-to-talk window', () => {
    renderAndStart();
    const micButton = screen.getByRole('button', { name: /click & say/i });
    fireEvent.click(micButton);

    act(() => vi.advanceTimersByTime(4_000));

    expect(MockSpeechRecognition.latest().abort).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /click & say/i })).toHaveAttribute('aria-pressed', 'false');
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
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(/Words practised\s*1/i);
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(/Needs practice\s*3/i);
    expect(screen.getByRole('heading', { name: /word report/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
    expect(screen.getByText('Oh no, crashed!').closest('section')).toHaveClass('max-w-md');
  });
});

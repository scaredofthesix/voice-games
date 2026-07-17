import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { installMockSpeechRecognition, MockSpeechRecognition } from '../test/mockSpeechRecognition';
import { UiLanguageProvider } from '../uiLanguage';
import { SUCCESS_RECOGNITION_DELAY_MS, useSpeechRecognition } from './useVoiceGame';

function RecognitionHarness({ onAccepted }: { onAccepted: () => void }) {
  const { lastTranscript, start, status } = useSpeechRecognition((text) => {
    if (text.trim().toLocaleLowerCase() !== 'owl') return false;
    onAccepted();
    return true;
  });

  return (
    <div>
      <button type="button" onClick={start}>Start</button>
      <span data-testid="voice-status">{status.message}</span>
      <span data-testid="last-transcript">{lastTranscript}</span>
    </div>
  );
}

describe('useSpeechRecognition successful-result gate', () => {
  let cleanupRecognition: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    window.localStorage.setItem('ui_language', 'en');
    cleanupRecognition = installMockSpeechRecognition();
  });

  afterEach(() => {
    cleanupRecognition();
    vi.useRealTimers();
  });

  test('retires one accepted event and starts with a cleared buffer after the delay', () => {
    const onAccepted = vi.fn();
    render(
      <UiLanguageProvider>
        <RecognitionHarness onAccepted={onAccepted} />
      </UiLanguageProvider>,
    );

    act(() => screen.getByRole('button', { name: 'Start' }).click());
    const firstRecognizer = MockSpeechRecognition.latest();

    act(() => firstRecognizer.emit('owl'));
    expect(onAccepted).toHaveBeenCalledOnce();
    expect(firstRecognizer.abort).toHaveBeenCalledOnce();
    expect(screen.getByTestId('last-transcript')).toHaveTextContent('');
    expect(screen.getByTestId('voice-status')).toHaveTextContent(/preparing the next word/i);

    act(() => firstRecognizer.emit('owl'));
    expect(onAccepted).toHaveBeenCalledOnce();

    act(() => vi.advanceTimersByTime(SUCCESS_RECOGNITION_DELAY_MS - 1));
    expect(MockSpeechRecognition.instances).toHaveLength(1);

    act(() => vi.advanceTimersByTime(1));
    expect(MockSpeechRecognition.instances).toHaveLength(2);
    expect(MockSpeechRecognition.latest().start).toHaveBeenCalledOnce();
  });
});

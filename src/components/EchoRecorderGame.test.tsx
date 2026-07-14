import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import EchoRecorderGame, { countSequentialEchoMatches } from './EchoRecorderGame';
import { UiLanguageProvider } from '../uiLanguage';
import { installMockSpeechRecognition } from '../test/mockSpeechRecognition';

describe('countSequentialEchoMatches', () => {
  const sequence = [
    { text: 'Run fast' },
    { text: 'Fly high' },
    { text: 'Blue sky' },
  ];

  test('one correctly repeated phrase advances exactly one card', () => {
    expect(countSequentialEchoMatches('run fast', sequence, 0)).toBe(1);
  });

  test('consumes distinct phrases in order when a whole chain is repeated at once', () => {
    expect(countSequentialEchoMatches('run fast fly high blue sky', sequence, 0)).toBe(3);
  });

  test('does not reuse a short or fuzzy transcript for later cards', () => {
    expect(countSequentialEchoMatches('ran fast', sequence, 0)).toBe(1);
  });

  test('does not accept a partial phrase or a word embedded inside another word', () => {
    expect(countSequentialEchoMatches('run', sequence, 0)).toBe(0);
    expect(countSequentialEchoMatches('education', [{ text: 'cat' }], 0)).toBe(0);
  });
});

describe('EchoRecorderGame memory phase', () => {
  let cleanupSpeechRecognition: () => void;

  beforeEach(() => {
    window.localStorage.setItem('ui_language', 'en');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    cleanupSpeechRecognition = installMockSpeechRecognition();
  });

  afterEach(() => {
    cleanupSpeechRecognition();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('shows the sequence words on their cards while the game reads them aloud', () => {
    render(
      <UiLanguageProvider>
        <EchoRecorderGame onBackToHub={() => undefined} customWords={[]} />
      </UiLanguageProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /start level/i }));

    const firstMemoryCard = screen.getByLabelText(/memory card #1/i);
    expect(within(firstMemoryCard).queryByText('❓')).not.toBeInTheDocument();
    expect(firstMemoryCard).toHaveTextContent(/cat|dog|rabbit|lion|panda|monkey|tiger|horse|bear|elephant|fox|frog|giraffe|zebra|penguin|koala|kangaroo|dolphin|whale|wolf|owl|cow|sheep|deer|squirrel|hedgehog|mouse|pig|duck|goat/i);
  });

  test('turns the cards back into question marks when repetition starts', () => {
    vi.useFakeTimers();
    const utterances: Array<{ onend: (() => void) | null }> = [];

    class FakeUtterance {
      lang = '';
      pitch = 1;
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(public text: string) {}
    }

    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn((utterance: FakeUtterance) => utterances.push(utterance)),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
    });

    render(
      <UiLanguageProvider>
        <EchoRecorderGame onBackToHub={() => undefined} customWords={[]} />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start level/i }));
    const firstMemoryCard = screen.getByLabelText(/memory card #1/i);
    expect(within(firstMemoryCard).queryByText('❓')).not.toBeInTheDocument();

    act(() => {
      utterances[0].onend?.();
      vi.advanceTimersByTime(400);
    });

    expect(within(firstMemoryCard).getByText('❓')).toBeInTheDocument();
  });

  test('cancels queued sequence speech when the game is left', () => {
    vi.useFakeTimers();
    const utterances: Array<{ onend: (() => void) | null }> = [];

    class FakeUtterance {
      lang = '';
      pitch = 1;
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(public text: string) {}
    }

    const speak = vi.fn((utterance: FakeUtterance) => utterances.push(utterance));
    const cancel = vi.fn(() => utterances.at(-1)?.onend?.());
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.stubGlobal('speechSynthesis', { speak, cancel, pause: vi.fn(), resume: vi.fn() });

    const { unmount } = render(
      <UiLanguageProvider>
        <EchoRecorderGame onBackToHub={() => undefined} customWords={[]} />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start level/i }));
    expect(speak).toHaveBeenCalledOnce();

    unmount();
    act(() => vi.advanceTimersByTime(500));

    expect(cancel).toHaveBeenCalled();
    expect(speak).toHaveBeenCalledOnce();
  });
});

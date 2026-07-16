import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import EchoRecorderGame, { countSequentialEchoMatches } from './EchoRecorderGame';
import { UiLanguageProvider } from '../uiLanguage';
import { installMockSpeechRecognition, MockSpeechRecognition } from '../test/mockSpeechRecognition';

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
    const target = within(firstMemoryCard).getByText(
      /^(cat|dog|rabbit|lion|panda|monkey|tiger|horse|bear|elephant|fox|frog|giraffe|zebra|penguin|koala|kangaroo|dolphin|whale|wolf|owl|cow|sheep|deer|squirrel|hedgehog|mouse|pig|duck|goat)$/i,
    ).textContent || '';
    expect(MockSpeechRecognition.instances).toHaveLength(0);

    act(() => {
      utterances[0].onend?.();
      vi.advanceTimersByTime(400);
    });

    expect(within(firstMemoryCard).getByText('❓')).toBeInTheDocument();
    expect(within(firstMemoryCard).queryByText(target, { exact: true })).not.toBeInTheDocument();
    expect(screen.getByText(/chain cards stay hidden while you repeat/i)).toBeInTheDocument();
    const pronunciationReference = screen.getByTestId('echo-pronunciation-reference');
    expect(pronunciationReference).toHaveTextContent(target);
    expect(within(pronunciationReference).getByRole('button', { name: new RegExp(`hear the word ${target}`, 'i') })).toBeInTheDocument();
    expect(MockSpeechRecognition.latest().start).toHaveBeenCalled();
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

  test('keeps listening after an imperfect result and accepts a correction in the retry window', () => {
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
    const target = within(firstMemoryCard).getByText(
      /^(cat|dog|rabbit|lion|panda|monkey|tiger|horse|bear|elephant|fox|frog|giraffe|zebra|penguin|koala|kangaroo|dolphin|whale|wolf|owl|cow|sheep|deer|squirrel|hedgehog|mouse|pig|duck|goat)$/i,
    ).textContent || '';

    act(() => {
      utterances[0].onend?.();
      vi.advanceTimersByTime(400);
    });
    act(() => MockSpeechRecognition.latest().emit('not the phrase'));

    expect(screen.getByText(/microphone is still listening/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Lives: 3')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3_000);
      MockSpeechRecognition.latest().emit(target);
    });

    expect(screen.getByLabelText('Lives: 3')).toBeInTheDocument();
    expect(screen.getByText(/perfect memory echo/i)).toBeInTheDocument();
  });

  test('uses one life only after the full retry window and then replays the chain', () => {
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
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), pause: vi.fn(), resume: vi.fn() });

    render(
      <UiLanguageProvider>
        <EchoRecorderGame onBackToHub={() => undefined} customWords={[]} />
      </UiLanguageProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /start level/i }));
    act(() => {
      utterances[0].onend?.();
      vi.advanceTimersByTime(400);
    });
    act(() => MockSpeechRecognition.latest().emit('not the phrase'));
    act(() => vi.advanceTimersByTime(3_499));
    expect(screen.getByLabelText('Lives: 3')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));

    expect(screen.getByLabelText('Lives: 2')).toBeInTheDocument();
    expect(speak).toHaveBeenCalledTimes(2);
    expect(within(screen.getByLabelText(/memory card #1/i)).queryByText('❓')).not.toBeInTheDocument();
  });

  test('ends with the shared per-word result after three full failed retries', () => {
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

    for (let attempt = 0; attempt < 3; attempt += 1) {
      act(() => {
        utterances.at(-1)?.onend?.();
        vi.advanceTimersByTime(400);
      });
      act(() => MockSpeechRecognition.latest().emit(`wrong phrase ${attempt}`));
      act(() => vi.advanceTimersByTime(3_500));
    }

    expect(screen.getByRole('heading', { name: /game over/i })).toBeInTheDocument();
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(/Words practised\s*1/i);
    expect(screen.getByTestId('result-practice-summary')).toHaveTextContent(/Needs practice\s*3/i);
    expect(screen.getByRole('heading', { name: /word report/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /back to hub/i })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: /game over/i }).parentElement?.parentElement).toHaveClass('max-w-md');
  });
});

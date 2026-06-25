import { vi } from 'vitest';

/**
 * Minimal fake of the Web Speech API SpeechRecognition for integration tests.
 * Install it on window before rendering a game, grab the latest instance, then
 * call emit(transcript) to simulate the child speaking a word.
 */
export class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];

  continuous = false;
  interimResults = false;
  lang = '';
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onresult: ((event: unknown) => void) | null = null;

  start = vi.fn(() => {
    this.onstart?.();
  });
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  /** Simulate a recognized transcript reaching the game. */
  emit(transcript: string): void {
    this.onresult?.({
      resultIndex: 0,
      results: [[{ transcript }]],
    });
  }

  static latest(): MockSpeechRecognition {
    return MockSpeechRecognition.instances[
      MockSpeechRecognition.instances.length - 1
    ];
  }

  static reset(): void {
    MockSpeechRecognition.instances = [];
  }
}

/** Install the mock on window; returns a cleanup function. */
export function installMockSpeechRecognition(): () => void {
  MockSpeechRecognition.reset();
  const w = window as any;
  const prev = w.SpeechRecognition;
  const prevWebkit = w.webkitSpeechRecognition;
  w.SpeechRecognition = MockSpeechRecognition;
  w.webkitSpeechRecognition = MockSpeechRecognition;
  return () => {
    w.SpeechRecognition = prev;
    w.webkitSpeechRecognition = prevWebkit;
    MockSpeechRecognition.reset();
  };
}

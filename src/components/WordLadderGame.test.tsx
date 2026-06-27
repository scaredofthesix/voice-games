import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';

import { WordLadderGame } from './WordLadderGame';
import {
  installMockSpeechRecognition,
  MockSpeechRecognition,
} from '../test/mockSpeechRecognition';

// Integration test: WordLadderGame wired together with the shared speech hook
// and the gameLogic climb reducer, driven through a fake SpeechRecognition.
// Backs quality requirement QR-1 (Functional Correctness) end to end and the
// accessibility checks behind QR-3.

describe('WordLadderGame (integration)', () => {
  let cleanup: () => void;

  afterEach(() => {
    cleanup?.();
  });

  test('start screen shows accessible title and start control', () => {
    cleanup = installMockSpeechRecognition();
    render(<WordLadderGame onBackToHub={() => {}} customWords={[]} />);

    expect(
      screen.getByRole('button', { name: /start the rocket climb/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /voice rocket climb/i }),
    ).toBeInTheDocument();
  });

  test('speaking each shown word climbs the rocket to the top', () => {
    cleanup = installMockSpeechRecognition();
    render(<WordLadderGame onBackToHub={() => {}} customWords={[]} />);

    fireEvent.click(
      screen.getByRole('button', { name: /start the rocket climb/i }),
    );

    const rec = MockSpeechRecognition.latest();
    expect(rec).toBeTruthy();

    // Read the word currently on screen and speak it; repeat until the win
    // screen replaces the target word. Capped well above the 10 steps needed.
    for (let i = 0; i < 40; i++) {
      const targetEl = screen.queryByTestId('target-word');
      if (!targetEl) break;
      const word = targetEl.textContent ?? '';
      act(() => rec.emit(word));
    }

    expect(screen.getByText(/orbit reached/i)).toBeInTheDocument();
  });

  test('an unrelated transcript does not advance the climb', () => {
    cleanup = installMockSpeechRecognition();
    render(<WordLadderGame onBackToHub={() => {}} customWords={[]} />);

    fireEvent.click(
      screen.getByRole('button', { name: /start the rocket climb/i }),
    );
    const rec = MockSpeechRecognition.latest();

    act(() => rec.emit('zzzzz qqqqq'));

    expect(screen.getByLabelText(/step 0 of 10/i)).toBeInTheDocument();
  });
});

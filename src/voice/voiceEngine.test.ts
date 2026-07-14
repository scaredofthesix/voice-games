import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createGameAudioContext,
  createInitialRacerMovementState,
  matchesWord,
  stopAllAudio,
  updateRacerMovement,
} from './engine';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('voice engine helpers', () => {
  it('matches spoken input with tolerant word matching', () => {
    expect(matchesWord('apple', 'apple')).toBe(true);
    expect(matchesWord('i think it is apple', 'apple', true)).toBe(true);
    expect(matchesWord('panda', 'panda', true)).toBe(true);
    expect(matchesWord('panta', 'panda', true)).toBe(true);
    expect(matchesWord('banana', 'apple', true)).toBe(false);
  });

  it('keeps the current lane stable when duplicate lane requests arrive before the cadence', () => {
    const state = createInitialRacerMovementState(1);

    const queued = updateRacerMovement(state, 2, 100, 120);
    const duplicate = updateRacerMovement(queued, 2, 110, 120);

    expect(duplicate.lane).toBe(1);
    expect(duplicate.pendingLane).toBe(2);
  });

  it('applies lane changes on a fixed cadence and ignores duplicate jitter', () => {
    const state = {
      lane: 1 as 0 | 1 | 2,
      pendingLane: null as 0 | 1 | 2 | null,
      lastAppliedAt: 0,
    };

    const afterRequest = updateRacerMovement(state, 2, 100, 120);
    expect(afterRequest.pendingLane).toBe(2);
    expect(afterRequest.lane).toBe(1);

    const afterTick = updateRacerMovement(afterRequest, null, 250, 120);
    expect(afterTick.lane).toBe(2);
    expect(afterTick.pendingLane).toBeNull();

    const duplicate = updateRacerMovement(afterTick, 2, 300, 120);
    expect(duplicate.lane).toBe(2);
    expect(duplicate.pendingLane).toBeNull();
  });

  it('stops speech synthesis and generated Web Audio effects together', () => {
    const close = vi.fn().mockResolvedValue(undefined);
    class FakeAudioContext {
      close = close;
    }
    const cancel = vi.fn();

    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext,
    });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: { cancel },
    });

    createGameAudioContext();
    stopAllAudio();

    expect(cancel).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });
});

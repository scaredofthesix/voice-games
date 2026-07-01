import { describe, expect, it } from 'vitest';
import { matchesWord, updateRacerMovement } from './engine';

describe('voice engine helpers', () => {
  it('matches spoken input with tolerant word matching', () => {
    expect(matchesWord('apple', 'apple')).toBe(true);
    expect(matchesWord('i think it is apple', 'apple', true)).toBe(true);
    expect(matchesWord('panda', 'panda', true)).toBe(true);
    expect(matchesWord('panta', 'panda', true)).toBe(true);
    expect(matchesWord('banana', 'apple', true)).toBe(false);
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
});

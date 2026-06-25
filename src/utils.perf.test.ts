import { describe, expect, test } from 'vitest';
import { matchesWord } from './utils';

// Automated time-behaviour test backing quality requirement QR-2
// (Performance Efficiency / Time behaviour). The recognition match runs on
// every spoken transcript, so it must stay effectively instant. We assert the
// average match time stays well under the 5 ms budget that keeps voice
// feedback feeling immediate to a child. The bound is generous so the test is
// stable on slow CI runners while still catching an accidental blow-up to,
// for example, an O(n^2) regression.

describe('matchesWord time behaviour (QR-2)', () => {
  test('averages well under the 5 ms per-call budget', () => {
    const samples = [
      ['i think it is elephant', 'Elephant'],
      ['panta', 'Panda'],
      ['the apple please', 'Apple'],
      ['banana', 'Strawberry'],
      ['rocket', 'Rocket'],
    ] as const;

    const iterations = 5000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      const [spoken, target] = samples[i % samples.length];
      matchesWord(spoken, target, true);
    }
    const elapsed = performance.now() - start;
    const perCall = elapsed / iterations;

    expect(perCall).toBeLessThan(5);
  });
});

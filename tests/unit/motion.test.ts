import { describe, it, expect } from 'vitest';
import { seededRandom } from '../../src/core/motion/seeded-random.js';
import { Ease, Duration } from '../../src/core/motion/language.js';

describe('Motion System Primitives Unit Tests', () => {
  it('should verify seededRandom PRNG is deterministic', () => {
    const next1 = seededRandom('test-seed-123');
    const next2 = seededRandom('test-seed-123');

    const seq1 = Array.from({ length: 10 }, () => next1());
    const seq2 = Array.from({ length: 10 }, () => next2());

    expect(seq1).toEqual(seq2);

    // Verify different seed produces different sequence
    const next3 = seededRandom('different-seed');
    const seq3 = Array.from({ length: 10 }, () => next3());
    expect(seq1).not.toEqual(seq3);
  });

  it('should verify Ease and Duration constants are correctly defined', () => {
    expect(Ease.entrance).toBe('back.out(1.4)');
    expect(Ease.emphasis).toBe('elastic.out(1, 0.5)');
    expect(Ease.exit).toBe('power2.in');
    expect(Ease.smooth).toBe('power3.inOut');

    expect(Duration.fast).toBe(0.4);
    expect(Duration.base).toBe(0.7);
    expect(Duration.slow).toBe(1.2);
  });
});

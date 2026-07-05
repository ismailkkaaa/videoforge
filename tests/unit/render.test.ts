import { describe, it, expect } from 'vitest';

/**
 * Helper to compute total frames using the same logic as the capture core.
 */
function calculateTotalFrames(duration: number, fps: number): number {
  return Math.round(duration * fps);
}

describe('Frame Count Math Edge Cases', () => {
  it('should round standard durations correctly', () => {
    expect(calculateTotalFrames(3.0, 30)).toBe(90);
    expect(calculateTotalFrames(1.5, 30)).toBe(45);
  });

  it('should handle decimal durations that do not divide evenly', () => {
    // 2.345 seconds at 30 fps is 70.35 -> rounds to 70 frames
    expect(calculateTotalFrames(2.345, 30)).toBe(70);

    // 0.3333 seconds (like 1/3) at 30 fps is 9.999 -> rounds to 10 frames
    expect(calculateTotalFrames(1 / 3, 30)).toBe(10);

    // 0.1234 seconds at 60 fps is 7.404 -> rounds to 7 frames
    expect(calculateTotalFrames(0.1234, 60)).toBe(7);
  });

  it('should handle rounding up and down boundary cases', () => {
    // 1.015 * 30 = 30.45 -> rounds to 30
    expect(calculateTotalFrames(1.015, 30)).toBe(30);

    // 1.017 * 30 = 30.51 -> rounds to 31
    expect(calculateTotalFrames(1.017, 30)).toBe(31);
  });
});

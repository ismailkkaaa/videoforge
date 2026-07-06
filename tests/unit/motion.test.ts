// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { seededRandom } from '../../src/core/motion/seeded-random.js';
import { Ease, Duration } from '../../src/core/motion/language.js';
import { createCameraRig } from '../../src/core/motion/camera-rig.js';
import { mountBackground } from '../../src/templates-builtin/_shared/scene-background/index.js';

describe('Motion System Primitives Unit Tests', () => {
  beforeAll(() => {
    // Mock GSAP globally for unit tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gsap = {
      timeline: () => {
        const targets: any[] = [];
        const fromVarsList: any[] = [];
        const toVarsList: any[] = [];

        const tl = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fromTo: (target: any, fromVars: any, toVars: any) => {
            targets.push(target);
            fromVarsList.push(fromVars);
            toVarsList.push(toVars);
            return tl;
          },
          seek: (t: number) => {
            // Simple mock interpolation for testing transforms
            const progress = Math.min(1, Math.max(0, t / 4.0)); // assume 4s duration
            targets.forEach((target, idx) => {
              const fromVars = fromVarsList[idx];
              const toVars = toVarsList[idx];

              if (toVars.scale !== undefined) {
                const s = fromVars.scale + (toVars.scale - fromVars.scale) * progress;
                const x = fromVars.x + (toVars.x - fromVars.x) * progress;
                target.style.transform = `scale(${s}) translate(${x}px)`;
              } else if (toVars.y !== undefined) {
                const y = fromVars.y + (toVars.y - fromVars.y) * progress;
                target.style.transform = `translateY(${y}px)`;
              }
            });
          },
          kill: () => {},
        };
        return tl;
      },
    };
  });

  it('should verify seededRandom PRNG is deterministic', () => {
    const next1 = seededRandom('test-seed-123');
    const next2 = seededRandom('test-seed-123');

    const seq1 = Array.from({ length: 10 }, () => next1());
    const seq2 = Array.from({ length: 10 }, () => next2());

    expect(seq1).toEqual(seq2);

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

  it('should verify CameraRig transforms layers correctly and deterministically', () => {
    const bg = document.createElement('div');
    const fg = document.createElement('div');

    const rig = createCameraRig(
      { background: bg, foreground: fg },
      { duration: 4.0, preset: 'parallax' }
    );

    // Initial state
    rig.seek(0);
    expect(bg.style.transform).toBe('translateY(-15px)');
    expect(fg.style.transform).toBe('translateY(45px)');

    // Mid state
    rig.seek(2.0);
    expect(bg.style.transform).toBe('translateY(0px)');
    expect(fg.style.transform).toBe('translateY(0px)');

    // End state
    rig.seek(4.0);
    expect(bg.style.transform).toBe('translateY(15px)');
    expect(fg.style.transform).toBe('translateY(-45px)');

    // Determinism test: calling seek at same timestamp twice gives identical output
    rig.seek(2.0);
    expect(bg.style.transform).toBe('translateY(0px)');
    expect(fg.style.transform).toBe('translateY(0px)');
  });

  it('should verify particle-field positions are identical across two separate mounts using the same seed', () => {
    const theme = {
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      fontFamily: 'sans-serif',
      background: 'particle-field' as const,
    };

    const container1 = document.createElement('div');
    const container2 = document.createElement('div');

    const drawnPoints1: { x: number; y: number }[] = [];
    const drawnPoints2: { x: number; y: number }[] = [];

    // Mock HTMLCanvasElement.prototype.getContext to capture drawing
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
      if (type === '2d') {
        const dummyCtx = {
          clearRect: () => {},
          beginPath: () => {},
          arc: (x: number, y: number) => {
            drawnPoints1.push({ x, y });
          },
          fill: () => {},
        };
        return dummyCtx as any;
      }
      return originalGetContext.apply(this, args as any);
    } as any;

    const bg1 = mountBackground(container1, 'particle-field', theme, 'scene-abc');
    bg1.seek(1.5);

    // Swap capture target
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
      if (type === '2d') {
        const dummyCtx = {
          clearRect: () => {},
          beginPath: () => {},
          arc: (x: number, y: number) => {
            drawnPoints2.push({ x, y });
          },
          fill: () => {},
        };
        return dummyCtx as any;
      }
      return originalGetContext.apply(this, args as any);
    } as any;

    const bg2 = mountBackground(container2, 'particle-field', theme, 'scene-abc');
    bg2.seek(1.5);

    // Revert context mock
    HTMLCanvasElement.prototype.getContext = originalGetContext;

    expect(drawnPoints1.length).toBeGreaterThan(0);
    expect(drawnPoints1).toEqual(drawnPoints2);
  });
});

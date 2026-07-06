import type { Theme } from '../../../core/config/schema.js';
import { seededRandom } from '../../../core/motion/seeded-random.js';

export interface SceneBackground {
  seek(t: number): void;
  destroy?(): void;
}

/**
 * Mounts the atmospheric background variant inside the container.
 *
 * @param container The background container element.
 * @param variant The chosen background variant.
 * @param theme The current theme config.
 * @param seed The scene id used as the PRNG seed.
 */
export function mountBackground(
  container: HTMLElement,
  variant: 'none' | 'gradient-mesh' | 'particle-field' | 'grid-draw',
  theme: Theme,
  seed: string
): SceneBackground {
  const bgEl = document.createElement('div');
  bgEl.style.position = 'absolute';
  bgEl.style.top = '0';
  bgEl.style.left = '0';
  bgEl.style.width = '100%';
  bgEl.style.height = '100%';
  bgEl.style.pointerEvents = 'none';
  bgEl.style.overflow = 'hidden';
  bgEl.style.zIndex = '0';

  // Set default backing color
  bgEl.style.backgroundColor = theme.primaryColor || '#000000';
  container.appendChild(bgEl);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gsap = (window as any).gsap;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let timeline: any = null;

  let updateFn = (_t: number) => {};

  if (variant === 'gradient-mesh') {
    const colorA = theme.primaryColor || '#0f0f1b';
    const colorB = theme.secondaryColor || '#251b35';
    updateFn = (t: number) => {
      const angle = (t * 20) % 360;
      const shift = Math.sin(t * 1.5) * 15 + 50;
      bgEl.style.background = `linear-gradient(${angle}deg, ${colorA} 0%, ${colorB} ${shift}%, #000000 100%)`;
    };
  } else if (variant === 'particle-field') {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    bgEl.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const nextRand = seededRandom(seed);
    const particlesCount = 45;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: nextRand() * 1280,
        y: nextRand() * 720,
        size: 2 + nextRand() * 4,
        vx: (nextRand() - 0.5) * 30,
        vy: -(5 + nextRand() * 20), // move up
        alpha: 0.15 + nextRand() * 0.4,
      });
    }

    updateFn = (t: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, 1280, 720);
      ctx.fillStyle = '#ffffff';

      for (const p of particles) {
        const currentX = (p.x + p.vx * t) % 1280;
        let currentY = (p.y + p.vy * t) % 720;
        if (currentY < 0) currentY += 720;

        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    };
  } else if (variant === 'grid-draw') {
    // Render a high-tech SVG Grid lines background
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.opacity = '0.12';
    bgEl.appendChild(svg);

    const step = 80;
    const w = 1280;
    const h = 720;
    const paths: SVGPathElement[] = [];

    // Vertical lines
    for (let x = step; x < w; x += step) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x} 0 L ${x} ${h}`);
      path.setAttribute('stroke', theme.secondaryColor || '#ffffff');
      path.setAttribute('stroke-width', '1.5');
      svg.appendChild(path);
      paths.push(path);
    }

    // Horizontal lines
    for (let y = step; y < h; y += step) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M 0 ${y} L ${w} ${y}`);
      path.setAttribute('stroke', theme.secondaryColor || '#ffffff');
      path.setAttribute('stroke-width', '1.5');
      svg.appendChild(path);
      paths.push(path);
    }

    if (gsap) {
      timeline = gsap.timeline({ paused: true });
      paths.forEach((path, idx) => {
        const len = 1280; // approximate maximum line length
        path.style.strokeDasharray = String(len);
        timeline.fromTo(
          path,
          { strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' },
          idx * 0.05
        );
      });
    }
  }

  return {
    seek(t: number) {
      updateFn(t);
      if (timeline) {
        timeline.seek(t);
      }
    },
    destroy() {
      if (timeline) {
        timeline.kill();
      }
      if (bgEl.parentNode) {
        bgEl.parentNode.removeChild(bgEl);
      }
    },
  };
}

/**
 * Reusable premium animation library for VideoForge.
 * Provides Apple/Framer/Linear-quality animation presets,
 * particle and gradient backgrounds, text splitter effects,
 * glassmorphic styling, and parallax camera movements.
 */

// Premium Easing Library
export const Easing = {
  linear: (t: number) => t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeOutQuart: (t: number) => 1 - --t * t * t * t,
  easeOutQuint: (t: number) => 1 + --t * t * t * t * t,
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  elasticOut: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

// 30 Reusable Premium Animation Presets
// These presets inject animations directly into a GSAP timeline or apply styles based on progress
export const presets = {
  fadeIn: (target: HTMLElement, timeline: any, duration = 1.0, start = 0) => {
    timeline.fromTo(target, { opacity: 0 }, { opacity: 1, duration, ease: 'power2.out' }, start);
  },
  fadeOut: (target: HTMLElement, timeline: any, duration = 1.0, start = 0) => {
    timeline.to(target, { opacity: 0, duration, ease: 'power2.in' }, start);
  },
  slideUp: (target: HTMLElement, timeline: any, duration = 1.2, start = 0, distance = 40) => {
    timeline.fromTo(
      target,
      { opacity: 0, y: distance },
      { opacity: 1, y: 0, duration, ease: 'power3.out' },
      start
    );
  },
  slideDown: (target: HTMLElement, timeline: any, duration = 1.2, start = 0, distance = 40) => {
    timeline.fromTo(
      target,
      { opacity: 0, y: -distance },
      { opacity: 1, y: 0, duration, ease: 'power3.out' },
      start
    );
  },
  slideLeft: (target: HTMLElement, timeline: any, duration = 1.2, start = 0, distance = 50) => {
    timeline.fromTo(
      target,
      { opacity: 0, x: distance },
      { opacity: 1, x: 0, duration, ease: 'power3.out' },
      start
    );
  },
  slideRight: (target: HTMLElement, timeline: any, duration = 1.2, start = 0, distance = 50) => {
    timeline.fromTo(
      target,
      { opacity: 0, x: -distance },
      { opacity: 1, x: 0, duration, ease: 'power3.out' },
      start
    );
  },
  scaleUp: (target: HTMLElement, timeline: any, duration = 1.0, start = 0) => {
    timeline.fromTo(
      target,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration, ease: 'back.out(1.7)' },
      start
    );
  },
  scaleDown: (target: HTMLElement, timeline: any, duration = 1.0, start = 0) => {
    timeline.fromTo(
      target,
      { opacity: 0, scale: 1.15 },
      { opacity: 1, scale: 1, duration, ease: 'power3.out' },
      start
    );
  },
  popIn: (target: HTMLElement, timeline: any, duration = 1.1, start = 0) => {
    timeline.fromTo(
      target,
      { opacity: 0, scale: 0.3 },
      { opacity: 1, scale: 1, duration, ease: 'elastic.out(1, 0.75)' },
      start
    );
  },
  blurIn: (target: HTMLElement, timeline: any, duration = 1.0, start = 0) => {
    timeline.fromTo(
      target,
      { filter: 'blur(20px)', opacity: 0 },
      { filter: 'blur(0px)', opacity: 1, duration, ease: 'power2.out' },
      start
    );
  },
  blurOut: (target: HTMLElement, timeline: any, duration = 1.0, start = 0) => {
    timeline.to(target, { filter: 'blur(20px)', opacity: 0, duration, ease: 'power2.in' }, start);
  },
  wobble: (target: HTMLElement, timeline: any, duration = 1.5, start = 0) => {
    timeline.fromTo(
      target,
      { rotation: -12 },
      { rotation: 0, duration, ease: 'elastic.out(1.2, 0.4)' },
      start
    );
  },
  spin: (target: HTMLElement, timeline: any, duration = 1.5, start = 0) => {
    timeline.fromTo(
      target,
      { rotation: 180, scale: 0.8 },
      { rotation: 0, scale: 1, duration, ease: 'power4.out' },
      start
    );
  },
  widthGrow: (target: HTMLElement, timeline: any, duration = 1.0, start = 0) => {
    timeline.fromTo(
      target,
      { width: '0%' },
      { width: '100%', duration, ease: 'power3.inOut' },
      start
    );
  },
  heightGrow: (target: HTMLElement, timeline: any, duration = 1.0, start = 0) => {
    timeline.fromTo(
      target,
      { height: '0%' },
      { height: '100%', duration, ease: 'power3.inOut' },
      start
    );
  },
  clipSwipe: (target: HTMLElement, timeline: any, duration = 1.2, start = 0) => {
    timeline.fromTo(
      target,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration, ease: 'power4.inOut' },
      start
    );
  },
  maskReveal: (target: HTMLElement, timeline: any, duration = 1.2, start = 0) => {
    timeline.fromTo(
      target,
      { clipPath: 'circle(0% at 50% 50%)' },
      { clipPath: 'circle(150% at 50% 50%)', duration, ease: 'power3.inOut' },
      start
    );
  },
  shimmer: (target: HTMLElement, timeline: any, duration = 2.0, start = 0) => {
    target.style.position = 'relative';
    target.style.overflow = 'hidden';
    const shine = document.createElement('div');
    shine.style.position = 'absolute';
    shine.style.top = '0';
    shine.style.left = '-100%';
    shine.style.width = '50%';
    shine.style.height = '100%';
    shine.style.background =
      'linear-gradient(90deg, transparent, rgba(255,255,255,0.2) 50%, transparent)';
    shine.style.transform = 'skewX(-25deg)';
    target.appendChild(shine);
    timeline.to(shine, { left: '150%', duration, ease: 'power1.inOut' }, start);
  },
  glowPulse: (target: HTMLElement, timeline: any, duration = 2.0, start = 0) => {
    timeline.fromTo(
      target,
      { boxShadow: '0 0 0px rgba(233,69,96,0)' },
      {
        boxShadow: '0 0 25px rgba(233,69,96,0.6)',
        duration: duration / 2,
        yoyo: true,
        repeat: 1,
        ease: 'sine.inOut',
      },
      start
    );
  },
  float: (target: HTMLElement, timeline: any, duration = 3.0, start = 0) => {
    // Endless floating simulation inside timeline range
    timeline.to(
      target,
      {
        y: -15,
        duration: duration / 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
      },
      start
    );
  },
  breath: (target: HTMLElement, timeline: any, duration = 3.0, start = 0) => {
    timeline.to(
      target,
      {
        scale: 1.04,
        duration: duration / 2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: 1,
      },
      start
    );
  },
  typewriter: (target: HTMLElement, timeline: any, duration = 1.5, start = 0) => {
    const text = target.textContent || '';
    target.textContent = '';
    const obj = { count: 0 };
    timeline.to(
      obj,
      {
        count: text.length,
        duration,
        ease: 'steps(' + text.length + ')',
        onUpdate: () => {
          target.textContent = text.slice(0, Math.floor(obj.count));
        },
      },
      start
    );
  },
  drawBorder: (target: SVGPathElement, timeline: any, duration = 1.5, start = 0) => {
    const length = target.getTotalLength();
    target.style.strokeDasharray = String(length);
    timeline.fromTo(
      target,
      { strokeDashoffset: length },
      { strokeDashoffset: 0, duration, ease: 'power2.inOut' },
      start
    );
  },
  glitchSlight: (target: HTMLElement, timeline: any, duration = 0.4, start = 0) => {
    // Random translation shifts
    timeline.to(
      target,
      { x: -6, skewX: 5, duration: duration / 4, yoyo: true, repeat: 3, ease: 'steps(2)' },
      start
    );
  },
  flipX: (target: HTMLElement, timeline: any, duration = 1.2, start = 0) => {
    timeline.fromTo(
      target,
      { transform: 'perspective(600px) rotateX(90deg)' },
      { transform: 'perspective(600px) rotateX(0deg)', duration, ease: 'back.out(1.5)' },
      start
    );
  },
  flipY: (target: HTMLElement, timeline: any, duration = 1.2, start = 0) => {
    timeline.fromTo(
      target,
      { transform: 'perspective(600px) rotateY(90deg)' },
      { transform: 'perspective(600px) rotateY(0deg)', duration, ease: 'back.out(1.5)' },
      start
    );
  },
  rollIn: (target: HTMLElement, timeline: any, duration = 1.2, start = 0) => {
    timeline.fromTo(
      target,
      { rotation: -120, x: -100, opacity: 0 },
      { rotation: 0, x: 0, opacity: 1, duration, ease: 'power3.out' },
      start
    );
  },
  chromaticOffset: (target: HTMLElement, timeline: any, duration = 1.5, start = 0) => {
    // Creates red and cyan shadow layers simulating chromatic aberration
    target.style.textShadow = '-4px 0 rgba(255,0,0,0.5), 4px 0 rgba(0,255,255,0.5)';
    timeline.to(
      target,
      {
        textShadow: '-0px 0 rgba(255,0,0,0), 0px 0 rgba(0,255,255,0)',
        duration,
        ease: 'power3.out',
      },
      start
    );
  },
  staggerCards: (cards: HTMLElement[], timeline: any, duration = 1.0, start = 0, gap = 0.15) => {
    cards.forEach((card, index) => {
      timeline.fromTo(
        card,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration, ease: 'back.out(1.5)' },
        start + index * gap
      );
    });
  },
  parallaxDrift: (
    background: HTMLElement,
    foreground: HTMLElement,
    timeline: any,
    duration = 3.0,
    start = 0
  ) => {
    // Shifts background slower than foreground for parallax depth
    timeline.fromTo(background, { y: -20 }, { y: 20, duration, ease: 'linear' }, start);
    timeline.fromTo(foreground, { y: 30 }, { y: -30, duration, ease: 'linear' }, start);
  },
};

// Premium Particle Background Generator (100% Deterministic)
export class ParticleBackground {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Array<{
    x: number;
    y: number;
    size: number;
    vx: number;
    vy: number;
    alpha: number;
  }> = [];

  constructor(canvas: HTMLCanvasElement, count = 40) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // Seed particle generation deterministically using sine/cosine curves
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.abs(Math.sin(i * 45.67)) * canvas.width,
        y: Math.abs(Math.cos(i * 89.12)) * canvas.height,
        size: 2 + Math.abs(Math.sin(i * 123)) * 4,
        vx: Math.sin(i * 77) * 15,
        vy: -(5 + Math.abs(Math.cos(i * 99)) * 20), // float upwards
        alpha: 0.15 + Math.abs(Math.sin(i * 200)) * 0.4,
      });
    }
  }

  render(t: number): void {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#ffffff';

    for (const p of this.particles) {
      // Calculate new coordinates deterministically based on progression time t
      const currentX = (p.x + p.vx * t) % this.canvas.width;
      let currentY = (p.y + p.vy * t) % this.canvas.height;
      if (currentY < 0) currentY += this.canvas.height;

      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
  }
}

// Dynamic Animated Gradient utility
export function applyAnimatedGradient(
  element: HTMLElement,
  t: number,
  colorA = '#0f0f1b',
  colorB = '#251b35',
  colorC = '#1a102f'
) {
  // Rotate angle over time
  const angle = (t * 20) % 360;
  // Dynamic gradient stop shifts
  const shift = Math.sin(t * 1.5) * 15 + 50;
  element.style.background = `linear-gradient(${angle}deg, ${colorA} 0%, ${colorB} ${shift}%, ${colorC} 100%)`;
}

// Premium Typography Split-Character animation helper
export function splitTextToCharacters(element: HTMLElement): HTMLSpanElement[] {
  const text = element.textContent || '';
  element.textContent = '';
  const spans: HTMLSpanElement[] = [];

  for (const char of text) {
    const span = document.createElement('span');
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.display = 'inline-block';
    span.style.opacity = '0';
    span.style.transform = 'translateY(25px) scale(0.9)';
    span.style.transformOrigin = 'center bottom';
    element.appendChild(span);
    spans.push(span);
  }
  return spans;
}

// Glassmorphism Card style decorator
export function applyGlassmorphism(
  element: HTMLElement,
  bg = 'rgba(255, 255, 255, 0.03)',
  border = '1px solid rgba(255, 255, 255, 0.08)'
) {
  element.style.background = bg;
  element.style.border = border;
  element.style.backdropFilter = 'blur(16px)';
  (element.style as any).webkitBackdropFilter = 'blur(16px)';
  element.style.borderRadius = '16px';
  element.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.2)';
}

// Parallax/Ken Burns Camera Movement helper
export function applyCameraMovement(
  viewport: HTMLElement,
  t: number,
  totalDuration: number,
  mode: 'zoom' | 'pan' | 'drift' = 'zoom'
) {
  const progress = t / totalDuration;
  const ease = Easing.easeOutCubic(progress);

  if (mode === 'zoom') {
    const scale = 1.0 + ease * 0.05; // 5% zoom
    viewport.style.transform = `scale(${scale})`;
  } else if (mode === 'pan') {
    const x = ease * -30; // 30px horizontal shift
    viewport.style.transform = `translateX(${x}px)`;
  } else if (mode === 'drift') {
    const scale = 1.0 + ease * 0.04;
    const x = Math.sin(progress * Math.PI) * 15;
    viewport.style.transform = `scale(${scale}) translateX(${x}px)`;
  }
  viewport.style.transformOrigin = 'center center';
}

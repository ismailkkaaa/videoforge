import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import {
  applyAnimatedGradient,
  ParticleBackground,
  splitTextToCharacters,
  applyCameraMovement,
  presets,
} from '../../core/render/animations.js';

export class TitleCardTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 3;
  private wrapper!: HTMLElement;
  private particleBg: ParticleBackground | null = null;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 3;

    this.container.innerHTML = '';

    // Create background wrapper (the camera viewport)
    this.wrapper = document.createElement('div');
    this.wrapper.style.width = '100%';
    this.wrapper.style.height = '100%';
    this.wrapper.style.display = 'flex';
    this.wrapper.style.flexDirection = 'column';
    this.wrapper.style.justifyContent = 'center';
    this.wrapper.style.alignItems = 'center';
    this.wrapper.style.color = '#ffffff';
    this.wrapper.style.fontFamily = theme.fontFamily;
    this.wrapper.style.boxSizing = 'border-box';
    this.wrapper.style.padding = '40px';
    this.wrapper.style.position = 'relative';
    this.wrapper.style.overflow = 'hidden';

    // Particle canvas background
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    this.wrapper.appendChild(canvas);

    this.particleBg = new ParticleBackground(canvas, 45);

    // Content container
    const content = document.createElement('div');
    content.style.textAlign = 'center';
    content.style.position = 'relative';
    content.style.zIndex = '10';

    // Title
    const titleEl = document.createElement('h1');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'VideoForge';
    titleEl.style.fontSize = '80px';
    titleEl.style.margin = '0 0 20px 0';
    titleEl.style.fontWeight = '900';
    titleEl.style.letterSpacing = '-2px';
    titleEl.style.color = theme.secondaryColor;
    content.appendChild(titleEl);

    // Subtitle
    let subtitleEl: HTMLParagraphElement | null = null;
    if (data.subtitle) {
      subtitleEl = document.createElement('p');
      subtitleEl.textContent = String(data.subtitle);
      subtitleEl.style.fontSize = '36px';
      subtitleEl.style.margin = '0';
      subtitleEl.style.opacity = '0';
      subtitleEl.style.fontWeight = '500';
      subtitleEl.style.letterSpacing = '-0.5px';
      content.appendChild(subtitleEl);
    }

    this.wrapper.appendChild(content);
    this.container.appendChild(this.wrapper);

    // Premium staggered typography animation
    const chars = splitTextToCharacters(titleEl);

    // Initialize GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Stagger char animations (elastic springs)
      chars.forEach((char, index) => {
        this.timeline.fromTo(
          char,
          { opacity: 0, y: 40, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'back.out(1.8)' },
          index * 0.03
        );
      });

      // Slide up subtitle
      if (subtitleEl) {
        presets.slideUp(subtitleEl, this.timeline, 1.2, 0.4, 30);
      }

      // Keep holding frame
      this.timeline.to({}, { duration: Math.max(0, this.duration - 1.5) });
    }
  }

  getDuration(): number {
    return this.duration;
  }

  seek(timeSeconds: number): void {
    // Dynamic gradient shifts
    applyAnimatedGradient(this.wrapper, timeSeconds);

    // Deterministic particle positions updates
    if (this.particleBg) {
      this.particleBg.render(timeSeconds);
    }

    // Camera drift zoom
    applyCameraMovement(this.wrapper, timeSeconds, this.duration, 'drift');

    if (this.timeline) {
      this.timeline.seek(timeSeconds);
    }
  }

  destroy(): void {
    if (this.timeline) {
      this.timeline.kill();
    }
    this.container.innerHTML = '';
  }
}

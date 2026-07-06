import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import {
  applyAnimatedGradient,
  ParticleBackground,
  applyCameraMovement,
  applyGlassmorphism,
  presets,
} from '../../core/render/animations.js';

export class StatCounterTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 4;
  private wrapper!: HTMLElement;
  private particleBg: ParticleBackground | null = null;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 4;

    this.container.innerHTML = '';

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

    this.particleBg = new ParticleBackground(canvas, 30);

    // Create a glassmorphic container for the statistic
    const statCard = document.createElement('div');
    statCard.style.padding = '40px 60px';
    statCard.style.textAlign = 'center';
    statCard.style.position = 'relative';
    statCard.style.zIndex = '10';
    applyGlassmorphism(statCard);

    const numberEl = document.createElement('h1');
    const targetNumber = typeof data.number === 'number' ? data.number : 100;
    const suffix = typeof data.suffix === 'string' ? data.suffix : '';
    numberEl.textContent = '0' + suffix;
    numberEl.style.fontSize = '120px';
    numberEl.style.margin = '0 0 10px 0';
    numberEl.style.fontWeight = '900';
    numberEl.style.letterSpacing = '-3px';
    numberEl.style.color = theme.secondaryColor;
    statCard.appendChild(numberEl);

    const titleEl = document.createElement('h2');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'Downloads';
    titleEl.style.fontSize = '32px';
    titleEl.style.margin = '0 0 10px 0';
    titleEl.style.fontWeight = '700';
    titleEl.style.opacity = '0';
    statCard.appendChild(titleEl);

    let subtitleEl: HTMLParagraphElement | null = null;
    if (data.subtitle) {
      subtitleEl = document.createElement('p');
      subtitleEl.textContent = String(data.subtitle);
      subtitleEl.style.fontSize = '20px';
      subtitleEl.style.margin = '0';
      subtitleEl.style.opacity = '0';
      statCard.appendChild(subtitleEl);
    }

    this.wrapper.appendChild(statCard);
    this.container.appendChild(this.wrapper);

    // GSAP count up animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Spring reveal card
      presets.popIn(statCard, this.timeline, 1.1, 0);

      // Stat counting
      const countObj = { val: 0 };
      this.timeline.to(
        countObj,
        {
          val: targetNumber,
          duration: 1.5,
          ease: 'power2.out',
          onUpdate: () => {
            numberEl.textContent = Math.floor(countObj.val).toLocaleString() + suffix;
          },
        },
        0.2
      );

      // Slide up sub-texts
      presets.slideUp(titleEl, this.timeline, 0.8, 0.5, 20);
      if (subtitleEl) {
        presets.slideUp(subtitleEl, this.timeline, 0.8, 0.7, 20);
      }

      this.timeline.to(
        {},
        { duration: Math.max(0, this.duration - (this.timeline.duration() || 2.5)) }
      );
    }
  }

  getDuration(): number {
    return this.duration;
  }

  seek(timeSeconds: number): void {
    applyAnimatedGradient(this.wrapper, timeSeconds);

    if (this.particleBg) {
      this.particleBg.render(timeSeconds);
    }

    applyCameraMovement(this.wrapper, timeSeconds, this.duration, 'zoom');

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

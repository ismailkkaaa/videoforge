import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import {
  applyAnimatedGradient,
  ParticleBackground,
  applyCameraMovement,
  presets,
} from '../../core/render/animations.js';

export class LogoRevealTemplate implements VideoForgeTemplate {
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

    this.particleBg = new ParticleBackground(canvas, 40);

    const logoContainer = document.createElement('div');
    logoContainer.style.display = 'flex';
    logoContainer.style.flexDirection = 'column';
    logoContainer.style.alignItems = 'center';
    logoContainer.style.position = 'relative';
    logoContainer.style.zIndex = '10';

    let logoTarget: HTMLElement;

    if (theme.logoPath) {
      const img = document.createElement('img');
      img.src = '/logo';
      img.style.maxHeight = '160px';
      img.style.maxWidth = '320px';
      img.style.objectFit = 'contain';
      img.style.opacity = '0';
      logoContainer.appendChild(img);
      logoTarget = img;
    } else {
      const textLogo = document.createElement('div');
      textLogo.textContent = 'LOGO';
      textLogo.style.fontSize = '44px';
      textLogo.style.fontWeight = '900';
      textLogo.style.padding = '20px 45px';
      textLogo.style.border = `4px solid ${theme.secondaryColor}`;
      textLogo.style.borderRadius = '8px';
      textLogo.style.opacity = '0';
      logoContainer.appendChild(textLogo);
      logoTarget = textLogo;
    }

    const titleEl = document.createElement('h2');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'VideoForge';
    titleEl.style.fontSize = '42px';
    titleEl.style.margin = '25px 0 10px 0';
    titleEl.style.fontWeight = '800';
    titleEl.style.letterSpacing = '-1px';
    titleEl.style.opacity = '0';
    logoContainer.appendChild(titleEl);

    let subtitleEl: HTMLParagraphElement | null = null;
    if (data.subtitle) {
      subtitleEl = document.createElement('p');
      subtitleEl.textContent = String(data.subtitle);
      subtitleEl.style.fontSize = '22px';
      subtitleEl.style.margin = '0';
      subtitleEl.style.opacity = '0';
      logoContainer.appendChild(subtitleEl);
    }

    this.wrapper.appendChild(logoContainer);
    this.container.appendChild(this.wrapper);

    // GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Premium pop in spring for logo
      presets.popIn(logoTarget, this.timeline, 1.2, 0);

      // Slide up text elements
      presets.slideUp(titleEl, this.timeline, 1.0, 0.4, 25);
      if (subtitleEl) {
        presets.slideUp(subtitleEl, this.timeline, 1.0, 0.6, 25);
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

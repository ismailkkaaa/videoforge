import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import {
  applyAnimatedGradient,
  ParticleBackground,
  applyCameraMovement,
  splitTextToCharacters,
  presets,
} from '../../core/render/animations.js';

export class OutroTemplate implements VideoForgeTemplate {
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

    this.particleBg = new ParticleBackground(canvas, 40);

    const outroContainer = document.createElement('div');
    outroContainer.style.textAlign = 'center';
    outroContainer.style.position = 'relative';
    outroContainer.style.zIndex = '10';

    let logoImg: HTMLImageElement | null = null;
    if (theme.logoPath) {
      logoImg = document.createElement('img');
      logoImg.src = '/logo';
      logoImg.style.maxHeight = '120px';
      logoImg.style.maxWidth = '280px';
      logoImg.style.objectFit = 'contain';
      logoImg.style.marginBottom = '30px';
      logoImg.style.opacity = '0';
      outroContainer.appendChild(logoImg);
    }

    const taglineEl = document.createElement('h2');
    taglineEl.textContent =
      typeof data.tagline === 'string' ? data.tagline : 'Build Videos with VideoForge';
    taglineEl.style.fontSize = '48px';
    taglineEl.style.margin = '0 0 30px 0';
    taglineEl.style.fontWeight = '900';
    taglineEl.style.letterSpacing = '-1.5px';
    outroContainer.appendChild(taglineEl);

    let linkWrapper: HTMLDivElement | null = null;
    if (data.link) {
      const linkEl = document.createElement('a');
      linkEl.textContent = String(data.link);
      linkEl.href = '#';
      linkEl.style.fontSize = '20px';
      linkEl.style.color = '#ffffff';
      linkEl.style.textDecoration = 'none';
      linkEl.style.fontWeight = '700';

      linkWrapper = document.createElement('div');
      linkWrapper.style.display = 'inline-block';
      linkWrapper.style.padding = '12px 30px';
      linkWrapper.style.borderRadius = '30px';
      linkWrapper.style.backgroundColor = theme.secondaryColor;
      linkWrapper.style.color = '#000000';
      linkWrapper.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      linkWrapper.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
      linkWrapper.style.opacity = '0';
      linkWrapper.style.transform = 'translateY(25px)';

      // Put link text to black if background is yellow/secondary color
      linkEl.style.color = '#000000';

      linkWrapper.appendChild(linkEl);
      outroContainer.appendChild(linkWrapper);
    }

    this.wrapper.appendChild(outroContainer);
    this.container.appendChild(this.wrapper);

    // split typography character animation
    const chars = splitTextToCharacters(taglineEl);

    // GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      let offset = 0;
      if (logoImg) {
        presets.popIn(logoImg, this.timeline, 1.0, 0);
        offset = 0.3;
      }

      // Stagger tagline characters
      chars.forEach((char, index) => {
        this.timeline.fromTo(
          char,
          { opacity: 0, y: 30, scale: 0.85 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.6)' },
          offset + index * 0.035
        );
      });

      if (linkWrapper) {
        presets.slideUp(linkWrapper, this.timeline, 1.0, offset + chars.length * 0.035 + 0.1, 20);
      }

      this.timeline.to(
        {},
        { duration: Math.max(0, this.duration - (this.timeline.duration() || 3.0)) }
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

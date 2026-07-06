import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import {
  applyAnimatedGradient,
  ParticleBackground,
  applyCameraMovement,
  applyGlassmorphism,
  presets,
} from '../../core/render/animations.js';

export class FeatureGridTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 5;
  private wrapper!: HTMLElement;
  private particleBg: ParticleBackground | null = null;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 5;

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
    this.wrapper.style.padding = '60px';
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

    this.particleBg = new ParticleBackground(canvas, 35);

    const titleEl = document.createElement('h2');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'Key Features';
    titleEl.style.fontSize = '50px';
    titleEl.style.margin = '0 0 40px 0';
    titleEl.style.fontWeight = '800';
    titleEl.style.letterSpacing = '-1.5px';
    titleEl.style.color = theme.secondaryColor;
    titleEl.style.position = 'relative';
    titleEl.style.zIndex = '10';
    this.wrapper.appendChild(titleEl);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
    grid.style.gap = '30px';
    grid.style.width = '100%';
    grid.style.maxWidth = '1000px';
    grid.style.position = 'relative';
    grid.style.zIndex = '10';
    this.wrapper.appendChild(grid);

    const features = (Array.isArray(data.features) ? data.features : []) as {
      title?: string;
      description?: string;
    }[];
    const cardElements: HTMLElement[] = [];

    features.forEach((feature, index) => {
      const card = document.createElement('div');
      card.style.padding = '30px';

      // Apply premium glassmorphic styling
      applyGlassmorphism(card);

      const featTitle = document.createElement('h3');
      featTitle.textContent = feature.title || `Feature ${index + 1}`;
      featTitle.style.fontSize = '24px';
      featTitle.style.margin = '0 0 12px 0';
      featTitle.style.fontWeight = '700';
      featTitle.style.color = theme.secondaryColor;
      card.appendChild(featTitle);

      const featDesc = document.createElement('p');
      featDesc.textContent = feature.description || '';
      featDesc.style.fontSize = '16px';
      featDesc.style.margin = '0';
      featDesc.style.opacity = '0.75';
      featDesc.style.lineHeight = '1.6';
      card.appendChild(featDesc);

      grid.appendChild(card);
      cardElements.push(card);
    });

    this.container.appendChild(this.wrapper);

    // Initialize GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });
      presets.slideDown(titleEl, this.timeline, 1.0, 0, 30);

      if (cardElements.length > 0) {
        presets.staggerCards(cardElements, this.timeline, 1.0, 0.3, 0.15);
      }
      this.timeline.to(
        {},
        { duration: Math.max(0, this.duration - (this.timeline.duration() || 2)) }
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

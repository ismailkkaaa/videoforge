import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import {
  applyAnimatedGradient,
  ParticleBackground,
  applyCameraMovement,
  applyGlassmorphism,
  presets,
} from '../../core/render/animations.js';

export class QuoteTemplate implements VideoForgeTemplate {
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
    this.wrapper.style.padding = '80px';
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

    const quoteCard = document.createElement('div');
    quoteCard.style.maxWidth = '800px';
    quoteCard.style.padding = '50px 60px';
    quoteCard.style.textAlign = 'center';
    quoteCard.style.position = 'relative';
    quoteCard.style.zIndex = '10';
    applyGlassmorphism(
      quoteCard,
      'rgba(255, 255, 255, 0.04)',
      '1px solid rgba(255, 255, 255, 0.1)'
    );

    const quoteMarkStart = document.createElement('span');
    quoteMarkStart.textContent = '“';
    quoteMarkStart.style.fontSize = '140px';
    quoteMarkStart.style.position = 'absolute';
    quoteMarkStart.style.top = '-90px';
    quoteMarkStart.style.left = '20px';
    quoteMarkStart.style.opacity = '0.08';
    quoteMarkStart.style.fontFamily = 'Georgia, serif';
    quoteMarkStart.style.color = theme.secondaryColor;
    quoteCard.appendChild(quoteMarkStart);

    const quoteText = document.createElement('blockquote');
    quoteText.textContent =
      typeof data.quote === 'string'
        ? data.quote
        : 'The best way to predict the future is to invent it.';
    quoteText.style.fontSize = '34px';
    quoteText.style.lineHeight = '1.5';
    quoteText.style.margin = '0 0 35px 0';
    quoteText.style.fontWeight = '500';
    quoteText.style.fontStyle = 'italic';
    quoteText.style.color = '#ffffff';
    quoteText.style.opacity = '0';
    quoteCard.appendChild(quoteText);

    const authorEl = document.createElement('p');
    authorEl.textContent = typeof data.author === 'string' ? `— ${data.author}` : '— Alan Kay';
    authorEl.style.fontSize = '24px';
    authorEl.style.margin = '0';
    authorEl.style.fontWeight = '700';
    authorEl.style.color = theme.secondaryColor;
    authorEl.style.opacity = '0';
    quoteCard.appendChild(authorEl);

    if (data.title) {
      const authorTitle = document.createElement('span');
      authorTitle.textContent = `, ${data.title}`;
      authorTitle.style.fontWeight = '400';
      authorTitle.style.opacity = '0.7';
      authorTitle.style.fontSize = '20px';
      authorTitle.style.color = '#ffffff';
      authorEl.appendChild(authorTitle);
    }

    this.wrapper.appendChild(quoteCard);
    this.container.appendChild(this.wrapper);

    // GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Spring pop in of quoteCard
      presets.popIn(quoteCard, this.timeline, 1.2, 0);

      // Slide and fade text
      presets.slideUp(quoteText, this.timeline, 1.0, 0.3, 20);
      presets.slideUp(authorEl, this.timeline, 0.8, 0.7, 15);

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

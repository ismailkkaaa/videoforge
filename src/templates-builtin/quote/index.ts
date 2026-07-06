import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import { Ease, Duration as MotionDuration } from '../../core/motion/language.js';
import { createCameraRig, type CameraRig } from '../../core/motion/camera-rig.js';
import { mountBackground, type SceneBackground } from '../_shared/scene-background/index.js';

export class QuoteTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 5;
  private wrapper!: HTMLElement;
  private bgLayer!: HTMLElement;
  private fgLayer!: HTMLElement;

  private bg: SceneBackground | null = null;
  private cameraRig: CameraRig | null = null;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 5;

    this.container.innerHTML = '';

    this.wrapper = document.createElement('div');
    this.wrapper.style.width = '100%';
    this.wrapper.style.height = '100%';
    this.wrapper.style.position = 'relative';
    this.wrapper.style.overflow = 'hidden';
    this.wrapper.style.boxSizing = 'border-box';
    this.wrapper.style.fontFamily = theme.fontFamily;
    this.container.appendChild(this.wrapper);

    // Background Layer
    this.bgLayer = document.createElement('div');
    this.bgLayer.style.position = 'absolute';
    this.bgLayer.style.width = '100%';
    this.bgLayer.style.height = '100%';
    this.bgLayer.style.top = '0';
    this.bgLayer.style.left = '0';
    this.wrapper.appendChild(this.bgLayer);

    // Mount background
    this.bg = mountBackground(
      this.bgLayer,
      theme.background || 'none',
      theme,
      (data._sceneId as string) || 'quote'
    );

    // Foreground Layer
    this.fgLayer = document.createElement('div');
    this.fgLayer.style.position = 'absolute';
    this.fgLayer.style.width = '100%';
    this.fgLayer.style.height = '100%';
    this.fgLayer.style.top = '0';
    this.fgLayer.style.left = '0';
    this.fgLayer.style.display = 'flex';
    this.fgLayer.style.flexDirection = 'column';
    this.fgLayer.style.justifyContent = 'center';
    this.fgLayer.style.alignItems = 'center';
    this.fgLayer.style.color = '#ffffff';
    this.fgLayer.style.padding = '80px';
    this.fgLayer.style.boxSizing = 'border-box';
    this.wrapper.appendChild(this.fgLayer);

    // Camera Rig
    this.cameraRig = createCameraRig(
      { background: this.bgLayer, foreground: this.fgLayer },
      { duration: this.duration, preset: 'parallax' }
    );

    const quoteCard = document.createElement('div');
    quoteCard.style.maxWidth = '800px';
    quoteCard.style.padding = '50px 60px';
    quoteCard.style.textAlign = 'center';
    quoteCard.style.position = 'relative';
    quoteCard.style.zIndex = '10';

    // Apply Style Variants
    if (theme.style === 'glass') {
      quoteCard.style.background = 'rgba(255, 255, 255, 0.08)';
      quoteCard.style.backdropFilter = 'blur(16px)';
      (quoteCard.style as any).webkitBackdropFilter = 'blur(16px)';
      quoteCard.style.border = '1px solid rgba(255, 255, 255, 0.12)';
      quoteCard.style.borderRadius = '24px';
      quoteCard.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.3)';
    } else if (theme.style === 'bold-neon') {
      quoteCard.style.border = `2.5px solid ${theme.secondaryColor}`;
      quoteCard.style.boxShadow = `0 0 20px ${theme.secondaryColor}, inset 0 0 15px ${theme.secondaryColor}`;
      quoteCard.style.borderRadius = '12px';
      quoteCard.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    } else {
      // Default minimal quote container
      quoteCard.style.background = 'rgba(255, 255, 255, 0.04)';
      quoteCard.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      quoteCard.style.borderRadius = '16px';
    }

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

    this.fgLayer.appendChild(quoteCard);

    // GSAP animation
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Spring entrance using Ease.entrance
      this.timeline.fromTo(
        quoteCard,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: MotionDuration.base, ease: Ease.entrance },
        0
      );

      // Slide and fade text
      this.timeline.fromTo(
        quoteText,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
        0.3
      );

      this.timeline.fromTo(
        authorEl,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
        0.5
      );

      // Exit animations in final 20% of duration
      const exitTime = this.duration * 0.8;
      const exitDuration = this.duration * 0.2;

      this.timeline.to(
        quoteCard,
        {
          opacity: 0,
          scale: 0.9,
          y: -25,
          duration: exitDuration,
          ease: Ease.exit,
        },
        exitTime
      );
    }
  }

  getDuration(): number {
    return this.duration;
  }

  seek(timeSeconds: number): void {
    if (this.bg) {
      this.bg.seek(timeSeconds);
    }
    if (this.cameraRig) {
      this.cameraRig.seek(timeSeconds);
    }
    if (this.timeline) {
      this.timeline.seek(timeSeconds);
    }
  }

  destroy(): void {
    if (this.bg && this.bg.destroy) {
      this.bg.destroy();
    }
    if (this.cameraRig && this.cameraRig.destroy) {
      this.cameraRig.destroy();
    }
    if (this.timeline) {
      this.timeline.kill();
    }
    this.container.innerHTML = '';
  }
}

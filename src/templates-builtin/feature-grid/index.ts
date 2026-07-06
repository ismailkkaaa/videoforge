import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import { Ease, Duration as MotionDuration } from '../../core/motion/language.js';
import { createCameraRig, type CameraRig } from '../../core/motion/camera-rig.js';
import { mountBackground, type SceneBackground } from '../_shared/scene-background/index.js';

export class FeatureGridTemplate implements VideoForgeTemplate {
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
      (data._sceneId as string) || 'feature-grid'
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
    this.fgLayer.style.padding = '60px';
    this.fgLayer.style.boxSizing = 'border-box';
    this.wrapper.appendChild(this.fgLayer);

    // Camera Rig setup
    this.cameraRig = createCameraRig(
      { background: this.bgLayer, foreground: this.fgLayer },
      { duration: this.duration, preset: 'parallax' }
    );

    const titleEl = document.createElement('h2');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'Key Features';
    titleEl.style.fontSize = '50px';
    titleEl.style.margin = '0 0 40px 0';
    titleEl.style.fontWeight = '800';
    titleEl.style.letterSpacing = '-1.5px';
    titleEl.style.color = theme.secondaryColor;
    titleEl.style.position = 'relative';
    titleEl.style.zIndex = '10';
    if (theme.style === 'bold-neon') {
      titleEl.style.textShadow = `0 0 10px ${theme.secondaryColor}`;
    }
    this.fgLayer.appendChild(titleEl);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
    grid.style.gap = '30px';
    grid.style.width = '100%';
    grid.style.maxWidth = '1000px';
    grid.style.position = 'relative';
    grid.style.zIndex = '10';
    this.fgLayer.appendChild(grid);

    const features = (Array.isArray(data.features) ? data.features : []) as {
      title?: string;
      description?: string;
    }[];
    const cardElements: HTMLElement[] = [];

    features.forEach((feature, index) => {
      const card = document.createElement('div');
      card.style.padding = '30px';

      // Apply Style Variants
      if (theme.style === 'glass') {
        card.style.background = 'rgba(255, 255, 255, 0.08)';
        card.style.backdropFilter = 'blur(16px)';
        (card.style as any).webkitBackdropFilter = 'blur(16px)';
        card.style.border = '1px solid rgba(255, 255, 255, 0.12)';
        card.style.borderRadius = '20px';
        card.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.2)';
      } else if (theme.style === 'bold-neon') {
        card.style.border = `2px solid ${theme.secondaryColor}`;
        card.style.boxShadow = `0 0 15px ${theme.secondaryColor}`;
        card.style.borderRadius = '12px';
        card.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      } else {
        // Minimal/default
        card.style.background = 'rgba(255, 255, 255, 0.04)';
        card.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        card.style.borderRadius = '16px';
      }

      const featTitle = document.createElement('h3');
      featTitle.textContent = feature.title || `Feature ${index + 1}`;
      featTitle.style.fontSize = '24px';
      featTitle.style.margin = '0 0 12px 0';
      featTitle.style.fontWeight = '700';
      featTitle.style.color = theme.secondaryColor;
      if (theme.style === 'bold-neon') {
        featTitle.style.textShadow = `0 0 8px ${theme.secondaryColor}`;
      }
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

    // GSAP animation
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Title entrance
      this.timeline.fromTo(
        titleEl,
        { opacity: 0, y: -25 },
        { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
        0
      );

      // Stagger entrance of the grid cards using Ease.entrance
      cardElements.forEach((card, index) => {
        this.timeline.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: MotionDuration.base, ease: Ease.entrance },
          0.2 + index * 0.12
        );
      });

      // Exit animations in final 20% of duration
      const exitTime = this.duration * 0.8;
      const exitDuration = this.duration * 0.2;

      this.timeline.to(
        [titleEl, ...cardElements],
        {
          opacity: 0,
          scale: 0.9,
          y: -25,
          duration: exitDuration,
          ease: Ease.exit,
          stagger: 0.05,
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

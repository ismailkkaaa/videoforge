import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import { Ease, Duration as MotionDuration } from '../../core/motion/language.js';
import { createCameraRig, type CameraRig } from '../../core/motion/camera-rig.js';
import { mountBackground, type SceneBackground } from '../_shared/scene-background/index.js';

export class StatCounterTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 4;
  private wrapper!: HTMLElement;
  private bgLayer!: HTMLElement;
  private fgLayer!: HTMLElement;

  private bg: SceneBackground | null = null;
  private cameraRig: CameraRig | null = null;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 4;

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
      (data._sceneId as string) || 'stat-counter'
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
    this.fgLayer.style.padding = '40px';
    this.fgLayer.style.boxSizing = 'border-box';
    this.wrapper.appendChild(this.fgLayer);

    // Camera Rig setup
    this.cameraRig = createCameraRig(
      { background: this.bgLayer, foreground: this.fgLayer },
      { duration: this.duration, preset: 'parallax' }
    );

    const statCard = document.createElement('div');
    statCard.style.padding = '40px 60px';
    statCard.style.textAlign = 'center';
    statCard.style.position = 'relative';
    statCard.style.zIndex = '10';

    // Style Variants
    if (theme.style === 'glass') {
      statCard.style.background = 'rgba(255, 255, 255, 0.08)';
      statCard.style.backdropFilter = 'blur(16px)';
      (statCard.style as any).webkitBackdropFilter = 'blur(16px)';
      statCard.style.border = '1px solid rgba(255, 255, 255, 0.12)';
      statCard.style.borderRadius = '24px';
      statCard.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.3)';
    } else if (theme.style === 'bold-neon') {
      statCard.style.border = `2.5px solid ${theme.secondaryColor}`;
      statCard.style.boxShadow = `0 0 20px ${theme.secondaryColor}, inset 0 0 15px ${theme.secondaryColor}`;
      statCard.style.borderRadius = '12px';
      statCard.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    } else {
      // Default minimal
      statCard.style.background = 'rgba(255, 255, 255, 0.04)';
      statCard.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      statCard.style.borderRadius = '16px';
    }

    const numberEl = document.createElement('h1');
    const targetNumber = typeof data.number === 'number' ? data.number : 100;
    const suffix = typeof data.suffix === 'string' ? data.suffix : '';
    numberEl.textContent = '0' + suffix;
    numberEl.style.fontSize = '120px';
    numberEl.style.margin = '0 0 10px 0';
    numberEl.style.fontWeight = '900';
    numberEl.style.letterSpacing = '-3px';
    numberEl.style.color = theme.secondaryColor;
    if (theme.style === 'bold-neon') {
      numberEl.style.textShadow = `0 0 12px ${theme.secondaryColor}`;
    }
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

    this.fgLayer.appendChild(statCard);

    // GSAP Setup
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Spring reveal card
      this.timeline.fromTo(
        statCard,
        { opacity: 0, scale: 0.8 },
        { opacity: 1, scale: 1, duration: MotionDuration.base, ease: Ease.entrance },
        0
      );

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

      // Slide up sub-texts using smooth eases
      this.timeline.fromTo(
        titleEl,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
        0.4
      );

      if (subtitleEl) {
        this.timeline.fromTo(
          subtitleEl,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
          0.6
        );
      }

      // Exit animations in final 20% of duration
      const exitTime = this.duration * 0.8;
      const exitDuration = this.duration * 0.2;

      this.timeline.to(
        statCard,
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

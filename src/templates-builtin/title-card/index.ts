import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import { splitTextToCharacters } from '../../core/render/animations.js';
import { Ease, Duration as MotionDuration } from '../../core/motion/language.js';
import { createCameraRig, type CameraRig } from '../../core/motion/camera-rig.js';
import { mountBackground, type SceneBackground } from '../_shared/scene-background/index.js';

export class TitleCardTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 3;
  private wrapper!: HTMLElement;
  private bgLayer!: HTMLElement;
  private fgLayer!: HTMLElement;

  private bg: SceneBackground | null = null;
  private cameraRig: CameraRig | null = null;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 3;

    this.container.innerHTML = '';

    // Viewport wrapper
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

    // Mount atmospheric background
    this.bg = mountBackground(
      this.bgLayer,
      theme.background || 'none',
      theme,
      (data._sceneId as string) || 'title-card'
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

    // Setup Camera Rig
    this.cameraRig = createCameraRig(
      { background: this.bgLayer, foreground: this.fgLayer },
      { duration: this.duration, preset: 'ken-burns' }
    );

    // Content Box
    const contentBox = document.createElement('div');
    contentBox.style.textAlign = 'center';
    contentBox.style.padding = '30px 50px';
    contentBox.style.zIndex = '10';

    // Apply Style Variants
    if (theme.style === 'glass') {
      contentBox.style.background = 'rgba(255, 255, 255, 0.08)';
      contentBox.style.backdropFilter = 'blur(16px)';
      (contentBox.style as any).webkitBackdropFilter = 'blur(16px)';
      contentBox.style.border = '1px solid rgba(255, 255, 255, 0.12)';
      contentBox.style.borderRadius = '24px';
      contentBox.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.3)';
    } else if (theme.style === 'bold-neon') {
      contentBox.style.border = `2.5px solid ${theme.secondaryColor}`;
      contentBox.style.boxShadow = `0 0 20px ${theme.secondaryColor}, inset 0 0 15px ${theme.secondaryColor}`;
      contentBox.style.borderRadius = '12px';
      contentBox.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    }

    // Title
    const titleEl = document.createElement('h1');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'VideoForge';
    titleEl.style.fontSize = '80px';
    titleEl.style.margin = '0 0 20px 0';
    titleEl.style.fontWeight = '900';
    titleEl.style.letterSpacing = '-2.5px';
    titleEl.style.color = theme.secondaryColor;
    if (theme.style === 'bold-neon') {
      titleEl.style.textShadow = `0 0 12px ${theme.secondaryColor}`;
    }
    contentBox.appendChild(titleEl);

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
      contentBox.appendChild(subtitleEl);
    }

    this.fgLayer.appendChild(contentBox);

    // Split text animation
    const SplitTextClass = (window as any).SplitText;
    let chars: HTMLElement[] = [];
    if (SplitTextClass) {
      const split = new SplitTextClass(titleEl, { type: 'chars' });
      chars = split.chars;
    } else {
      chars = splitTextToCharacters(titleEl);
    }

    // GSAP Setup
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Stagger entrance using motion language presets
      chars.forEach((char, index) => {
        this.timeline.fromTo(
          char,
          { opacity: 0, y: 45, scale: 0.75 },
          { opacity: 1, y: 0, scale: 1, duration: MotionDuration.base, ease: Ease.entrance },
          index * 0.04
        );
      });

      if (subtitleEl) {
        this.timeline.fromTo(
          subtitleEl,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
          0.4
        );
      }

      // Exit animations in final 20% of duration
      const exitTime = this.duration * 0.8;
      const exitDuration = this.duration * 0.2;

      this.timeline.to(
        contentBox,
        {
          opacity: 0,
          scale: 0.9,
          y: -30,
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

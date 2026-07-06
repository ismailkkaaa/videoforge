import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import { Ease, Duration as MotionDuration } from '../../core/motion/language.js';
import { createCameraRig, type CameraRig } from '../../core/motion/camera-rig.js';
import { mountBackground, type SceneBackground } from '../_shared/scene-background/index.js';

export class LogoRevealTemplate implements VideoForgeTemplate {
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
      (data._sceneId as string) || 'logo-reveal'
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

    // Camera Rig
    this.cameraRig = createCameraRig(
      { background: this.bgLayer, foreground: this.fgLayer },
      { duration: this.duration, preset: 'ken-burns' }
    );

    const logoContainer = document.createElement('div');
    logoContainer.style.display = 'flex';
    logoContainer.style.flexDirection = 'column';
    logoContainer.style.alignItems = 'center';
    logoContainer.style.position = 'relative';
    logoContainer.style.zIndex = '10';
    logoContainer.style.padding = '35px 55px';

    // Style Variants
    if (theme.style === 'glass') {
      logoContainer.style.background = 'rgba(255, 255, 255, 0.08)';
      logoContainer.style.backdropFilter = 'blur(16px)';
      (logoContainer.style as any).webkitBackdropFilter = 'blur(16px)';
      logoContainer.style.border = '1px solid rgba(255, 255, 255, 0.12)';
      logoContainer.style.borderRadius = '24px';
      logoContainer.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.3)';
    } else if (theme.style === 'bold-neon') {
      logoContainer.style.border = `2.5px solid ${theme.secondaryColor}`;
      logoContainer.style.boxShadow = `0 0 20px ${theme.secondaryColor}, inset 0 0 15px ${theme.secondaryColor}`;
      logoContainer.style.borderRadius = '12px';
      logoContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    }

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
      if (theme.style === 'bold-neon') {
        textLogo.style.textShadow = `0 0 10px ${theme.secondaryColor}`;
      }
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

    this.fgLayer.appendChild(logoContainer);

    // GSAP animation
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Premium pop in spring for logo using entrance ease
      this.timeline.fromTo(
        logoTarget,
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: MotionDuration.base, ease: Ease.entrance },
        0
      );

      // Slide up text elements using Smooth ease
      this.timeline.fromTo(
        titleEl,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
        0.3
      );

      if (subtitleEl) {
        this.timeline.fromTo(
          subtitleEl,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
          0.5
        );
      }

      // Exit animations in final 20% of duration
      const exitTime = this.duration * 0.8;
      const exitDuration = this.duration * 0.2;

      this.timeline.to(
        logoContainer,
        {
          opacity: 0,
          scale: 0.9,
          y: -20,
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

import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import { splitTextToCharacters } from '../../core/render/animations.js';
import { Ease, Duration as MotionDuration } from '../../core/motion/language.js';
import { createCameraRig, type CameraRig } from '../../core/motion/camera-rig.js';
import { mountBackground, type SceneBackground } from '../_shared/scene-background/index.js';

export class OutroTemplate implements VideoForgeTemplate {
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

    // Mount background
    this.bg = mountBackground(
      this.bgLayer,
      theme.background || 'none',
      theme,
      (data._sceneId as string) || 'outro'
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
      { duration: this.duration, preset: 'ken-burns' }
    );

    // Content container
    const content = document.createElement('div');
    content.style.textAlign = 'center';
    content.style.padding = '30px 50px';
    content.style.zIndex = '10';

    // Style Variants
    if (theme.style === 'glass') {
      content.style.background = 'rgba(255, 255, 255, 0.08)';
      content.style.backdropFilter = 'blur(16px)';
      (content.style as any).webkitBackdropFilter = 'blur(16px)';
      content.style.border = '1px solid rgba(255, 255, 255, 0.12)';
      content.style.borderRadius = '24px';
      content.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.3)';
    } else if (theme.style === 'bold-neon') {
      content.style.border = `2.5px solid ${theme.secondaryColor}`;
      content.style.boxShadow = `0 0 20px ${theme.secondaryColor}, inset 0 0 15px ${theme.secondaryColor}`;
      content.style.borderRadius = '12px';
      content.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    }

    let logoImg: HTMLImageElement | null = null;
    if (theme.logoPath) {
      logoImg = document.createElement('img');
      logoImg.src = '/logo';
      logoImg.style.maxHeight = '120px';
      logoImg.style.maxWidth = '280px';
      logoImg.style.objectFit = 'contain';
      logoImg.style.marginBottom = '30px';
      logoImg.style.opacity = '0';
      content.appendChild(logoImg);
    }

    const taglineEl = document.createElement('h2');
    taglineEl.textContent =
      typeof data.tagline === 'string' ? data.tagline : 'Build Videos with VideoForge';
    taglineEl.style.fontSize = '48px';
    taglineEl.style.margin = '0 0 30px 0';
    taglineEl.style.fontWeight = '900';
    taglineEl.style.letterSpacing = '-1.5px';
    if (theme.style === 'bold-neon') {
      taglineEl.style.textShadow = `0 0 10px ${theme.secondaryColor}`;
    }
    content.appendChild(taglineEl);

    let linkWrapper: HTMLDivElement | null = null;
    if (data.link) {
      const linkEl = document.createElement('a');
      linkEl.textContent = String(data.link);
      linkEl.href = '#';
      linkEl.style.fontSize = '20px';
      linkEl.style.color = theme.style === 'minimal' ? '#000000' : '#ffffff';
      linkEl.style.textDecoration = 'none';
      linkEl.style.fontWeight = '700';

      linkWrapper = document.createElement('div');
      linkWrapper.style.display = 'inline-block';
      linkWrapper.style.padding = '12px 30px';
      linkWrapper.style.borderRadius = '30px';
      linkWrapper.style.backgroundColor = theme.secondaryColor;
      linkWrapper.style.border = '1px solid rgba(255, 255, 255, 0.2)';
      linkWrapper.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
      linkWrapper.style.opacity = '0';
      linkWrapper.style.transform = 'translateY(25px)';

      if (theme.style === 'glass') {
        linkWrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        linkWrapper.style.border = '1px solid rgba(255, 255, 255, 0.3)';
      }

      linkWrapper.appendChild(linkEl);
      content.appendChild(linkWrapper);
    }

    this.fgLayer.appendChild(content);

    // split typography character animation
    const SplitTextClass = (window as any).SplitText;
    let chars: HTMLElement[] = [];
    if (SplitTextClass) {
      const split = new SplitTextClass(taglineEl, { type: 'chars' });
      chars = split.chars;
    } else {
      chars = splitTextToCharacters(taglineEl);
    }

    // GSAP animation
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      let offset = 0.2;
      if (logoImg) {
        this.timeline.fromTo(
          logoImg,
          { opacity: 0, scale: 0.6 },
          { opacity: 1, scale: 1, duration: MotionDuration.base, ease: Ease.entrance },
          0
        );
        offset = 0.4;
      }

      // Stagger tagline characters
      chars.forEach((char, index) => {
        this.timeline.fromTo(
          char,
          { opacity: 0, y: 35, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: MotionDuration.base, ease: Ease.entrance },
          offset + index * 0.035
        );
      });

      if (linkWrapper) {
        this.timeline.fromTo(
          linkWrapper,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
          offset + chars.length * 0.035 + 0.1
        );
      }

      // Exit animations in final 20% of duration
      const exitTime = this.duration * 0.8;
      const exitDuration = this.duration * 0.2;

      this.timeline.to(
        content,
        {
          opacity: 0,
          scale: 0.95,
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

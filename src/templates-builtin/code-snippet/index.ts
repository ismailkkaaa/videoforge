import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import { Ease, Duration as MotionDuration } from '../../core/motion/language.js';
import { createCameraRig, type CameraRig } from '../../core/motion/camera-rig.js';
import { mountBackground, type SceneBackground } from '../_shared/scene-background/index.js';

export class CodeSnippetTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 6;
  private wrapper!: HTMLElement;
  private bgLayer!: HTMLElement;
  private fgLayer!: HTMLElement;

  private bg: SceneBackground | null = null;
  private cameraRig: CameraRig | null = null;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 6;

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
      (data._sceneId as string) || 'code-snippet'
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
    this.fgLayer.style.padding = '50px';
    this.fgLayer.style.boxSizing = 'border-box';
    this.wrapper.appendChild(this.fgLayer);

    // Camera Rig setup
    this.cameraRig = createCameraRig(
      { background: this.bgLayer, foreground: this.fgLayer },
      { duration: this.duration, preset: 'parallax' }
    );

    const header = document.createElement('div');
    header.style.width = '100%';
    header.style.maxWidth = '900px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.position = 'relative';
    header.style.zIndex = '10';

    if (data.title) {
      const titleEl = document.createElement('h3');
      titleEl.textContent = String(data.title);
      titleEl.style.fontSize = '32px';
      titleEl.style.margin = '0';
      titleEl.style.fontWeight = '800';
      titleEl.style.letterSpacing = '-0.8px';
      titleEl.style.color = '#ffffff';
      if (theme.style === 'bold-neon') {
        titleEl.style.textShadow = `0 0 10px ${theme.secondaryColor}`;
      }
      header.appendChild(titleEl);
    }

    const langBadge = document.createElement('div');
    langBadge.textContent = String(data.language || 'code').toUpperCase();
    langBadge.style.fontSize = '12px';
    langBadge.style.padding = '4px 10px';
    langBadge.style.borderRadius = '20px';
    langBadge.style.backgroundColor = theme.secondaryColor;
    langBadge.style.color = '#000000';
    langBadge.style.fontWeight = '800';
    header.appendChild(langBadge);

    this.fgLayer.appendChild(header);

    // IDE window frame
    const windowFrame = document.createElement('div');
    windowFrame.style.width = '100%';
    windowFrame.style.maxWidth = '900px';
    windowFrame.style.position = 'relative';
    windowFrame.style.zIndex = '10';

    // Style Variants for IDE Window
    if (theme.style === 'glass') {
      windowFrame.style.background = 'rgba(255, 255, 255, 0.08)';
      windowFrame.style.backdropFilter = 'blur(16px)';
      (windowFrame.style as any).webkitBackdropFilter = 'blur(16px)';
      windowFrame.style.border = '1px solid rgba(255, 255, 255, 0.12)';
      windowFrame.style.borderRadius = '20px';
      windowFrame.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.3)';
    } else if (theme.style === 'bold-neon') {
      windowFrame.style.border = `2px solid ${theme.secondaryColor}`;
      windowFrame.style.boxShadow = `0 0 15px ${theme.secondaryColor}`;
      windowFrame.style.borderRadius = '12px';
      windowFrame.style.backgroundColor = 'rgba(10, 10, 20, 0.85)';
    } else {
      // Minimal default
      windowFrame.style.background = 'rgba(15, 15, 27, 0.6)';
      windowFrame.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      windowFrame.style.borderRadius = '16px';
    }

    const titleBar = document.createElement('div');
    titleBar.style.display = 'flex';
    titleBar.style.alignItems = 'center';
    titleBar.style.padding = '14px 20px 8px 20px';
    titleBar.style.gap = '8px';

    const dots = ['#ff5f56', '#ffbd2e', '#27c93f'];
    dots.forEach((color) => {
      const dot = document.createElement('div');
      dot.style.width = '12px';
      dot.style.height = '12px';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = color;
      titleBar.appendChild(dot);
    });
    windowFrame.appendChild(titleBar);

    const preEl = document.createElement('pre');
    preEl.style.width = '100%';
    preEl.style.margin = '0';
    preEl.style.padding = '10px 24px 24px 24px';
    preEl.style.fontSize = '18px';
    preEl.style.lineHeight = '1.6';
    preEl.style.overflow = 'hidden';
    preEl.style.backgroundColor = 'transparent';
    preEl.style.fontFamily = 'monospace';

    const codeEl = document.createElement('code');
    const lang = typeof data.language === 'string' ? data.language : 'javascript';
    codeEl.className = `language-${lang}`;
    codeEl.textContent = typeof data.code === 'string' ? data.code : '';
    preEl.appendChild(codeEl);
    windowFrame.appendChild(preEl);
    this.fgLayer.appendChild(windowFrame);

    // Apply Prism highlighting
    const Prism = (window as any).Prism;
    if (Prism) {
      Prism.highlightElement(codeEl);
    }

    // GSAP animation
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      // Stagger in header and window
      this.timeline.fromTo(
        header,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: MotionDuration.base, ease: Ease.smooth },
        0
      );

      this.timeline.fromTo(
        windowFrame,
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: MotionDuration.base, ease: Ease.entrance },
        0.1
      );

      // Line or token reveal stagger
      const tokens = codeEl.querySelectorAll('span');
      if (tokens.length > 0) {
        this.timeline.fromTo(
          tokens,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.5,
            stagger: 0.015,
            ease: 'none',
          },
          0.5
        );
      }

      // Exit animations in final 20% of duration
      const exitTime = this.duration * 0.8;
      const exitDuration = this.duration * 0.2;

      this.timeline.to(
        [header, windowFrame],
        {
          opacity: 0,
          scale: 0.95,
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

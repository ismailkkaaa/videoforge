import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';
import {
  applyAnimatedGradient,
  ParticleBackground,
  applyCameraMovement,
  applyGlassmorphism,
  presets,
} from '../../core/render/animations.js';

export class CodeSnippetTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 6;
  private wrapper!: HTMLElement;
  private particleBg: ParticleBackground | null = null;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 6;

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
    this.wrapper.style.padding = '50px';
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

    this.wrapper.appendChild(header);

    // Create the macOS-style code IDE window
    const windowFrame = document.createElement('div');
    windowFrame.style.width = '100%';
    windowFrame.style.maxWidth = '900px';
    windowFrame.style.position = 'relative';
    windowFrame.style.zIndex = '10';
    applyGlassmorphism(windowFrame, 'rgba(15, 15, 27, 0.4)', '1px solid rgba(255, 255, 255, 0.12)');

    // Mac dots titlebar
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
    this.wrapper.appendChild(windowFrame);

    this.container.appendChild(this.wrapper);

    // Apply Prism highlighting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Prism = (window as any).Prism;
    if (Prism) {
      Prism.highlightElement(codeEl);
    }

    // GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });
      presets.slideDown(header, this.timeline, 0.8, 0, 20);
      presets.scaleUp(windowFrame, this.timeline, 1.0, 0.2);

      // Line or token reveal (simple fade in of all generated spans)
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
          0.6
        );
      }
      this.timeline.to(
        {},
        { duration: Math.max(0, this.duration - (this.timeline.duration() || 3)) }
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

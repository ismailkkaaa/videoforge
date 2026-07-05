import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';

export class TitleCardTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 3;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 3;

    // Clear container
    this.container.innerHTML = '';

    // Create background wrapper
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.backgroundColor = theme.primaryColor;
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.justifyContent = 'center';
    wrapper.style.alignItems = 'center';
    wrapper.style.color = theme.secondaryColor;
    wrapper.style.fontFamily = theme.fontFamily;
    wrapper.style.boxSizing = 'border-box';
    wrapper.style.padding = '40px';

    // Content container
    const content = document.createElement('div');
    content.style.textAlign = 'center';
    content.style.opacity = '0';
    content.style.transform = 'translateY(20px)';

    // Title
    const titleEl = document.createElement('h1');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'VideoForge';
    titleEl.style.fontSize = '64px';
    titleEl.style.margin = '0 0 20px 0';
    titleEl.style.fontWeight = 'bold';
    content.appendChild(titleEl);

    // Subtitle
    if (data.subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.textContent = String(data.subtitle);
      subtitleEl.style.fontSize = '32px';
      subtitleEl.style.margin = '0';
      subtitleEl.style.opacity = '0.8';
      content.appendChild(subtitleEl);
    }

    wrapper.appendChild(content);
    this.container.appendChild(wrapper);

    // Initialize GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });
      this.timeline.to(content, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        ease: 'power2.out',
      });
      // Hold state after animation finishes
      this.timeline.to({}, { duration: Math.max(0, this.duration - 1.0) });
    }
  }

  getDuration(): number {
    return this.duration;
  }

  seek(timeSeconds: number): void {
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

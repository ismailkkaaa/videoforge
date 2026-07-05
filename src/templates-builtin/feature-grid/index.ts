import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';

export class FeatureGridTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 5;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 5;

    this.container.innerHTML = '';

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
    wrapper.style.padding = '60px';

    const titleEl = document.createElement('h2');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'Key Features';
    titleEl.style.fontSize = '44px';
    titleEl.style.margin = '0 0 40px 0';
    titleEl.style.fontWeight = 'bold';
    titleEl.style.opacity = '0';
    titleEl.style.transform = 'translateY(-20px)';
    wrapper.appendChild(titleEl);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
    grid.style.gap = '30px';
    grid.style.width = '100%';
    grid.style.maxWidth = '1000px';
    wrapper.appendChild(grid);

    const features = (Array.isArray(data.features) ? data.features : []) as {
      title?: string;
      description?: string;
    }[];
    const cardElements: HTMLElement[] = [];

    features.forEach((feature, index) => {
      const card = document.createElement('div');
      card.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      card.style.border = `1px solid rgba(255, 255, 255, 0.1)`;
      card.style.borderRadius = '12px';
      card.style.padding = '30px';
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';

      const featTitle = document.createElement('h3');
      featTitle.textContent = feature.title || `Feature ${index + 1}`;
      featTitle.style.fontSize = '24px';
      featTitle.style.margin = '0 0 10px 0';
      featTitle.style.color = theme.secondaryColor;
      card.appendChild(featTitle);

      const featDesc = document.createElement('p');
      featDesc.textContent = feature.description || '';
      featDesc.style.fontSize = '16px';
      featDesc.style.margin = '0';
      featDesc.style.opacity = '0.7';
      featDesc.style.lineHeight = '1.5';
      card.appendChild(featDesc);

      grid.appendChild(card);
      cardElements.push(card);
    });

    this.container.appendChild(wrapper);

    // Initialize GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });
      this.timeline.to(titleEl, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      });

      if (cardElements.length > 0) {
        this.timeline.to(
          cardElements,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out',
          },
          '-=0.3'
        );
      }
      this.timeline.to({}, { duration: Math.max(0, this.duration - this.timeline.duration()) });
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

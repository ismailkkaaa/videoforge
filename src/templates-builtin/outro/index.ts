import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';

export class OutroTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 4;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 4;

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
    wrapper.style.padding = '40px';

    const outroContainer = document.createElement('div');
    outroContainer.style.textAlign = 'center';

    if (theme.logoPath) {
      const img = document.createElement('img');
      img.src = '/logo';
      img.style.maxHeight = '100px';
      img.style.maxWidth = '250px';
      img.style.objectFit = 'contain';
      img.style.marginBottom = '25px';
      img.style.opacity = '0';
      img.style.transform = 'scale(0.8)';
      outroContainer.appendChild(img);
    }

    const taglineEl = document.createElement('h2');
    taglineEl.textContent =
      typeof data.tagline === 'string' ? data.tagline : 'Build Videos with VideoForge';
    taglineEl.style.fontSize = '36px';
    taglineEl.style.margin = '0 0 20px 0';
    taglineEl.style.fontWeight = 'bold';
    taglineEl.style.opacity = '0';
    taglineEl.style.transform = 'translateY(15px)';
    outroContainer.appendChild(taglineEl);

    if (data.link) {
      const linkEl = document.createElement('a');
      linkEl.textContent = String(data.link);
      linkEl.href = '#'; // Headless Chromium doesn't click
      linkEl.style.fontSize = '24px';
      linkEl.style.color = theme.secondaryColor;
      linkEl.style.textDecoration = 'none';
      linkEl.style.opacity = '0.8';
      linkEl.style.fontWeight = '500';

      const linkWrapper = document.createElement('div');
      linkWrapper.style.opacity = '0';
      linkWrapper.style.transform = 'translateY(15px)';
      linkWrapper.appendChild(linkEl);
      outroContainer.appendChild(linkWrapper);
    }

    wrapper.appendChild(outroContainer);
    this.container.appendChild(wrapper);

    // GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      let offset = 0;
      if (theme.logoPath) {
        this.timeline.to(outroContainer.firstChild, {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: 'back.out(1.5)',
        });
        offset = 0.4;
      }

      this.timeline.to(
        taglineEl,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
        offset ? `-=${offset}` : undefined
      );

      if (data.link) {
        const linkElem = outroContainer.children[theme.logoPath ? 2 : 1];
        this.timeline.to(
          linkElem,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.4'
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

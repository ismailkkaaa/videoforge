import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';

export class LogoRevealTemplate implements VideoForgeTemplate {
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

    const logoContainer = document.createElement('div');
    logoContainer.style.display = 'flex';
    logoContainer.style.flexDirection = 'column';
    logoContainer.style.alignItems = 'center';

    if (theme.logoPath) {
      const img = document.createElement('img');
      img.src = '/logo';
      img.style.maxHeight = '150px';
      img.style.maxWidth = '300px';
      img.style.objectFit = 'contain';
      img.style.opacity = '0';
      img.style.transform = 'scale(0.5) rotate(-10deg)';
      logoContainer.appendChild(img);
    } else {
      const textLogo = document.createElement('div');
      textLogo.textContent = 'LOGO';
      textLogo.style.fontSize = '40px';
      textLogo.style.fontWeight = 'bold';
      textLogo.style.padding = '20px 40px';
      textLogo.style.border = `4px solid ${theme.secondaryColor}`;
      textLogo.style.opacity = '0';
      textLogo.style.transform = 'scale(0.5)';
      logoContainer.appendChild(textLogo);
    }

    const titleEl = document.createElement('h2');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'VideoForge';
    titleEl.style.fontSize = '36px';
    titleEl.style.margin = '20px 0 10px 0';
    titleEl.style.fontWeight = 'bold';
    titleEl.style.opacity = '0';
    titleEl.style.transform = 'translateY(20px)';
    logoContainer.appendChild(titleEl);

    if (data.subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.textContent = String(data.subtitle);
      subtitleEl.style.fontSize = '20px';
      subtitleEl.style.margin = '0';
      subtitleEl.style.opacity = '0';
      subtitleEl.style.transform = 'translateY(20px)';
      logoContainer.appendChild(subtitleEl);
    }

    wrapper.appendChild(logoContainer);
    this.container.appendChild(wrapper);

    // GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });
      const targetLogo = logoContainer.firstChild as HTMLElement;

      this.timeline.to(targetLogo, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 1.0,
        ease: 'back.out(1.7)',
      });

      this.timeline.to(
        titleEl,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.4'
      );

      if (logoContainer.children[2]) {
        this.timeline.to(
          logoContainer.children[2],
          {
            opacity: 0.8,
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

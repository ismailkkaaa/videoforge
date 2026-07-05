import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';

export class CodeSnippetTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;
  private duration: number = 6;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 6;

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
    wrapper.style.padding = '50px';

    const header = document.createElement('div');
    header.style.width = '100%';
    header.style.maxWidth = '900px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '15px';
    header.style.opacity = '0';
    header.style.transform = 'translateY(-10px)';

    if (data.title) {
      const titleEl = document.createElement('h3');
      titleEl.textContent = String(data.title);
      titleEl.style.fontSize = '28px';
      titleEl.style.margin = '0';
      titleEl.style.fontWeight = 'bold';
      header.appendChild(titleEl);
    }

    const langBadge = document.createElement('div');
    langBadge.textContent = String(data.language || 'code').toUpperCase();
    langBadge.style.fontSize = '12px';
    langBadge.style.padding = '4px 10px';
    langBadge.style.borderRadius = '20px';
    langBadge.style.backgroundColor = theme.secondaryColor;
    langBadge.style.color = theme.primaryColor;
    langBadge.style.fontWeight = 'bold';
    header.appendChild(langBadge);

    wrapper.appendChild(header);

    const preEl = document.createElement('pre');
    preEl.style.width = '100%';
    preEl.style.maxWidth = '900px';
    preEl.style.borderRadius = '12px';
    preEl.style.padding = '24px';
    preEl.style.margin = '0';
    preEl.style.fontSize = '18px';
    preEl.style.overflow = 'hidden';
    preEl.style.backgroundColor = '#1e1e1e';
    preEl.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    preEl.style.boxShadow = '0 10px 35px rgba(0, 0, 0, 0.4)';
    preEl.style.opacity = '0';
    preEl.style.transform = 'translateY(20px)';

    const codeEl = document.createElement('code');
    const lang = typeof data.language === 'string' ? data.language : 'javascript';
    codeEl.className = `language-${lang}`;
    codeEl.textContent = typeof data.code === 'string' ? data.code : '';
    preEl.appendChild(codeEl);
    wrapper.appendChild(preEl);

    this.container.appendChild(wrapper);

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
      this.timeline.to(header, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
      });

      this.timeline.to(
        preEl,
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
        },
        '-=0.3'
      );

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

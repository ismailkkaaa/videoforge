import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';

export class QuoteTemplate implements VideoForgeTemplate {
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
    wrapper.style.padding = '80px';

    const quoteContainer = document.createElement('div');
    quoteContainer.style.maxWidth = '800px';
    quoteContainer.style.textAlign = 'center';
    quoteContainer.style.position = 'relative';

    const quoteMarkStart = document.createElement('span');
    quoteMarkStart.textContent = '“';
    quoteMarkStart.style.fontSize = '120px';
    quoteMarkStart.style.position = 'absolute';
    quoteMarkStart.style.top = '-80px';
    quoteMarkStart.style.left = '-40px';
    quoteMarkStart.style.opacity = '0.15';
    quoteMarkStart.style.fontFamily = 'serif';
    quoteContainer.appendChild(quoteMarkStart);

    const quoteText = document.createElement('blockquote');
    quoteText.textContent =
      typeof data.quote === 'string'
        ? data.quote
        : 'The best way to predict the future is to invent it.';
    quoteText.style.fontSize = '36px';
    quoteText.style.lineHeight = '1.4';
    quoteText.style.margin = '0 0 30px 0';
    quoteText.style.fontWeight = '500';
    quoteText.style.fontStyle = 'italic';
    quoteText.style.opacity = '0';
    quoteText.style.transform = 'translateY(20px)';
    quoteContainer.appendChild(quoteText);

    const authorEl = document.createElement('p');
    authorEl.textContent = typeof data.author === 'string' ? `— ${data.author}` : '— Alan Kay';
    authorEl.style.fontSize = '24px';
    authorEl.style.margin = '0';
    authorEl.style.fontWeight = 'bold';
    authorEl.style.opacity = '0';
    authorEl.style.transform = 'translateY(15px)';
    quoteContainer.appendChild(authorEl);

    if (data.title) {
      const authorTitle = document.createElement('span');
      authorTitle.textContent = `, ${data.title}`;
      authorTitle.style.fontWeight = 'normal';
      authorTitle.style.opacity = '0.7';
      authorTitle.style.fontSize = '20px';
      authorEl.appendChild(authorTitle);
    }

    wrapper.appendChild(quoteContainer);
    this.container.appendChild(wrapper);

    // GSAP animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      this.timeline.to(quoteText, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      this.timeline.to(
        authorEl,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.4'
      );

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

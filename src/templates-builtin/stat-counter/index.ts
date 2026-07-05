import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';

export class StatCounterTemplate implements VideoForgeTemplate {
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

    const countContainer = document.createElement('div');
    countContainer.style.textAlign = 'center';

    const numberEl = document.createElement('h1');
    const targetNumber = typeof data.number === 'number' ? data.number : 100;
    const suffix = typeof data.suffix === 'string' ? data.suffix : '';
    numberEl.textContent = '0' + suffix;
    numberEl.style.fontSize = '120px';
    numberEl.style.margin = '0 0 10px 0';
    numberEl.style.fontWeight = 'bold';
    countContainer.appendChild(numberEl);

    const titleEl = document.createElement('h2');
    titleEl.textContent = typeof data.title === 'string' ? data.title : 'Downloads';
    titleEl.style.fontSize = '32px';
    titleEl.style.margin = '0 0 10px 0';
    titleEl.style.opacity = '0.9';
    titleEl.style.transform = 'translateY(15px)';
    titleEl.style.opacity = '0';
    countContainer.appendChild(titleEl);

    const subtitleEl = document.createElement('p');
    if (data.subtitle) {
      subtitleEl.textContent = String(data.subtitle);
      subtitleEl.style.fontSize = '20px';
      subtitleEl.style.margin = '0';
      subtitleEl.style.opacity = '0.6';
      subtitleEl.style.transform = 'translateY(15px)';
      subtitleEl.style.opacity = '0';
      countContainer.appendChild(subtitleEl);
    }

    wrapper.appendChild(countContainer);
    this.container.appendChild(wrapper);

    // GSAP count up animation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });

      const countObj = { val: 0 };
      this.timeline.to(countObj, {
        val: targetNumber,
        duration: 1.5,
        ease: 'power1.out',
        onUpdate: () => {
          numberEl.textContent = Math.floor(countObj.val).toLocaleString() + suffix;
        },
      });

      const revealTargets = [titleEl];
      if (data.subtitle) {
        revealTargets.push(subtitleEl);
      }

      this.timeline.to(
        revealTargets,
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.8'
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

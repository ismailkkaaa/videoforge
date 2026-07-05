# Authoring VideoForge Templates

This guide explains how to build and register custom templates for VideoForge.

## The Template Contract

Every template, whether built-in or registered as a third-party plugin, must implement the `VideoForgeTemplate` interface from `src/core/templates/types.ts`:

```typescript
export interface VideoForgeTemplate {
  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): Promise<void> | void;
  getDuration(): number;
  seek(timeSeconds: number): void;
  destroy?(): void;
}
```

### 1. `mount(container, data, theme)`
Called once when the scene begins.
- **container**: The HTML element where the scene must be rendered.
- **data**: Config-provided key-value parameters (e.g., text content, images, duration overrides).
- **theme**: The global project styling parameters (`primaryColor`, `secondaryColor`, `fontFamily`, `logoPath`).

### 2. `getDuration()`
Returns the default duration of the template in seconds, acting as a fallback if the scene configuration has no explicit duration.

### 3. `seek(timeSeconds)`
**Crucial Requirement: Must be deterministic and idempotent.**
This function seeks the animation state to a specific timestamp in seconds. Given a time `t`, seeking twice must produce identical pixels in the container.
- Do not use `Date.now()`, `Math.random()`, or non-deterministic asynchronous functions inside `seek()`.
- If using GSAP, create a paused timeline in `mount()`, and call `timeline.seek(timeSeconds)` inside `seek()`.

### 4. `destroy()`
(Optional) Perform cleanup (e.g. killing active GSAP timelines, removing event listeners, clearing DOM elements).

---

## Example Template: Solid Color Fade

Here is a fully worked example of a template that animates a title and subtitle over a colored background:

```typescript
import type { VideoForgeTemplate, Theme } from '../../core/templates/types.js';

export class SimplePromoTemplate implements VideoForgeTemplate {
  private container!: HTMLElement;
  private timeline: any = null;
  private duration: number = 4;

  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): void {
    this.container = container;
    this.duration = typeof data.duration === 'number' ? data.duration : 4;

    // Clear previous contents
    this.container.innerHTML = '';

    // Create wrapper
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

    // Title
    const titleEl = document.createElement('h1');
    titleEl.innerText = typeof data.title === 'string' ? data.title : 'Welcome';
    titleEl.style.fontSize = '60px';
    titleEl.style.opacity = '0'; // Initial state for animation
    wrapper.appendChild(titleEl);

    this.container.appendChild(wrapper);

    // GSAP Setup
    const gsap = (window as any).gsap;
    if (gsap) {
      this.timeline = gsap.timeline({ paused: true });
      this.timeline.to(titleEl, {
        opacity: 1,
        duration: 1.0,
        ease: 'power2.out'
      });
      // Keep hold frame at end
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
```

## Registering a Template

To use a custom template, import the register function from the library and register it before rendering:

```typescript
import { registerTemplate } from 'videoforge';
import { MyCustomTemplate } from './MyCustomTemplate.js';

registerTemplate('my-custom-template', MyCustomTemplate);
```

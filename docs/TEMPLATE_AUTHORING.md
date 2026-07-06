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

---

## 🎨 Motion System & Language Guidelines

To build premium, Apple-quality motion graphics that compile and render deterministically, all templates should follow these strict guidelines:

### 1. Eases and Durations
Instead of hardcoding easing strings and duration numbers, use the shared vocabulary from `src/core/motion/language.js`:
- `Ease.entrance`: Spring-like back entry for text and widgets (`'back.out(1.4)'`).
- `Ease.emphasis`: Spring bouncy response for pops and highlights (`'elastic.out(1, 0.5)'`).
- `Ease.exit`: Clean snap-out for scene exits (`'power2.in'`).
- `Ease.smooth`: Balanced ease in-out curve (`'power3.inOut'`).
- `Duration.fast`: Short transitions and small widget offsets (`0.4s`).
- `Duration.base`: Standard animation sequence time (`0.7s`).
- `Duration.slow`: Deep structural entrance transitions (`1.2s`).

### 2. Strictly Enforced Determinism
Every scene template must be 100% reproducible inside Playwright's frame capture.
*   **Banned**: Do not use `Math.random()`, `Date.now()`, or other system-level dynamic values.
*   **Seeded PRNG**: If you need variations (e.g. particle positions, offset shifts), import the seeded generator:
    ```typescript
    import { seededRandom } from '../../core/motion/seeded-random.js';
    const nextRand = seededRandom(sceneId); // Produces identical numbers every time for this scene
    ```
*   **No Real-Time Tickers**: Do not use `gsap.ticker`, `requestAnimationFrame`, `setInterval`, or accumulative loops. All animation positions must depend strictly on the time `t` passed into `seek(t)`.


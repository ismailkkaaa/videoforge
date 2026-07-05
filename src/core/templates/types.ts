import type { Theme } from '../config/schema.js';

export type { Theme };

/**
 * Every scene template, built-in or third-party, must implement this contract.
 * Crucial: seek() must be completely deterministic and idempotent.
 */
export interface VideoForgeTemplate {
  /**
   * Mounts the template into the provided DOM container, initializing elements and GSAP timelines.
   */
  mount(container: HTMLElement, data: Record<string, unknown>, theme: Theme): Promise<void> | void;

  /**
   * Returns the fallback duration in seconds if scene.duration is unset.
   */
  getDuration(): number;

  /**
   * Seeks the animation to the specific timestamp in seconds.
   * MUST be deterministic and idempotent.
   */
  seek(timeSeconds: number): void;

  /**
   * Optional cleanup function called when the template is unmounted or destroyed.
   */
  destroy?(): void;
}

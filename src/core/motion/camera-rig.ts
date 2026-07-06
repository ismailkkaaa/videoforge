export interface CameraRig {
  seek(t: number): void;
  destroy?(): void;
}

/**
 * Creates a CameraRig for managing camera motion effects across layers.
 *
 * @param layers The layered HTMLElements (background, midground, foreground).
 * @param options Rig duration and preset configuration.
 */
export function createCameraRig(
  layers: { background?: HTMLElement; midground?: HTMLElement; foreground?: HTMLElement },
  options: {
    duration: number;
    preset: 'ken-burns' | 'parallax';
  }
): CameraRig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gsap = (window as any).gsap;
  const timelines: any[] = [];

  if (gsap) {
    const { duration, preset } = options;

    if (preset === 'ken-burns') {
      const targets = [layers.background, layers.midground, layers.foreground].filter(
        Boolean
      ) as HTMLElement[];
      for (const target of targets) {
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(
          target,
          { scale: 1.0, x: 0, y: 0 },
          { scale: 1.08, x: -15, y: -8, duration, ease: 'power1.inOut' }
        );
        timelines.push(tl);
      }
    } else if (preset === 'parallax') {
      // background moves at ~0.3x foreground layer speed
      if (layers.background) {
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(layers.background, { y: -15 }, { y: 15, duration, ease: 'none' });
        timelines.push(tl);
      }
      if (layers.midground) {
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(layers.midground, { y: -5 }, { y: 5, duration, ease: 'none' });
        timelines.push(tl);
      }
      if (layers.foreground) {
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(layers.foreground, { y: 45 }, { y: -45, duration, ease: 'none' });
        timelines.push(tl);
      }
    }
  }

  return {
    seek(t: number) {
      for (const tl of timelines) {
        tl.seek(t);
      }
    },
    destroy() {
      for (const tl of timelines) {
        tl.kill();
      }
    },
  };
}

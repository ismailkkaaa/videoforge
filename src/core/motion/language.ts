export const Ease = {
  entrance: 'back.out(1.4)',
  emphasis: 'elastic.out(1, 0.5)',
  exit: 'power2.in',
  smooth: 'power3.inOut',
} as const;

export const Duration = {
  fast: 0.4,
  base: 0.7,
  slow: 1.2,
} as const;

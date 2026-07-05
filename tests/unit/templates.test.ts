// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { templateRegistry } from '../../src/core/templates/registry.js';
import type { Theme } from '../../src/core/config/schema.js';

describe('Built-in Templates Unit Tests', () => {
  const mockTheme: Theme = {
    primaryColor: '#1a1a2e',
    secondaryColor: '#e94560',
    fontFamily: 'sans-serif',
  };

  beforeAll(() => {
    // Mock GSAP globally on window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gsap = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      timeline: (_opts: any) => {
        const tl = {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          to: (_target: any, _vars: any, _position: any) => tl,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fromTo: (_target: any, _fromVars: any, _toVars: any, _position: any) => tl,
          _seek: (_time: number) => {},
          seek: (_time: number) => {},
          kill: () => {},
          duration: () => 3.0,
        };
        return tl;
      },
    };

    // Mock Prism globally on window
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Prism = {
      highlightElement: (_element: HTMLElement) => {},
    };
  });

  const templatesToTest = [
    {
      name: 'title-card',
      data: { title: 'Test Title', subtitle: 'Test Subtitle', duration: 3 },
    },
    {
      name: 'feature-grid',
      data: {
        title: 'Features',
        features: [
          { title: 'Feat 1', description: 'Desc 1' },
          { title: 'Feat 2', description: 'Desc 2' },
        ],
        duration: 5,
      },
    },
    {
      name: 'code-snippet',
      data: { title: 'Code snippet', code: 'const x = 5;', language: 'javascript', duration: 6 },
    },
    {
      name: 'logo-reveal',
      data: { title: 'Logo Reveal Title', subtitle: 'Logo Reveal Subtitle', duration: 4 },
    },
    {
      name: 'stat-counter',
      data: { number: 5000, suffix: '+', title: 'Downloads', subtitle: 'active', duration: 4 },
    },
    {
      name: 'quote',
      data: { quote: 'Hello World', author: 'Author', title: 'Title', duration: 5 },
    },
    {
      name: 'outro',
      data: { tagline: 'Build Videos', link: 'videoforge.dev', duration: 4 },
    },
  ];

  templatesToTest.forEach(({ name, data }) => {
    it(`should mount, get duration, and seek correctly for template: "${name}"`, () => {
      const TemplateClass = templateRegistry[name];
      expect(TemplateClass).toBeDefined();

      const instance = new TemplateClass();
      const container = document.createElement('div');

      // Test mount doesn't throw
      expect(() => instance.mount(container, data, mockTheme)).not.toThrow();

      // Test duration returns positive number
      const duration = instance.getDuration();
      expect(duration).toBeGreaterThan(0);

      // Test seek doesn't throw
      expect(() => instance.seek(0)).not.toThrow();
      expect(() => instance.seek(duration / 2)).not.toThrow();
      expect(() => instance.seek(duration)).not.toThrow();

      // Check DOM state changes between start and end by looking at contents
      let expectedText = 'VideoForge';
      if (name === 'quote') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expectedText = (data as any).quote;
      } else if (name === 'outro') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expectedText = (data as any).tagline;
      } else if (name === 'logo-reveal') {
        expectedText = 'LOGO';
      } else if (data.title) {
        expectedText = data.title;
      }
      expect(container.textContent).toContain(expectedText);

      // Test destroy doesn't throw
      if (instance.destroy) {
        expect(() => instance.destroy!()).not.toThrow();
      }
    });
  });
});

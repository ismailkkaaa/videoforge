// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import App from '../../ui/src/App.js';

describe('UI Studio Editor Unit Tests', () => {
  it('should render the Studio editor successfully and contain panels', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    await act(async () => {
      const root = createRoot(container);
      root.render(React.createElement(App));
    });

    expect(container.textContent).toContain('VideoForge Studio');
    expect(container.textContent).toContain('Animated Scenes');
    expect(container.textContent).toContain('Live Browser Preview');
    expect(container.textContent).toContain('Edit Scene');
  });
});

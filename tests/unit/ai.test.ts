import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateStoryboard } from '../../src/ai/storyboard-generator.js';
import { analyzeMarkdown } from '../../src/ai/analyzers/markdown.js';
import { analyzeGithubRepo } from '../../src/ai/analyzers/github-repo.js';
import { analyzeUrl } from '../../src/ai/analyzers/url.js';
import type { LLMProvider } from '../../src/ai/providers/types.js';
import { VideoForgeError } from '../../src/core/errors.js';
import fs from 'fs';
import path from 'path';

class MockLLMProvider implements LLMProvider {
  public generateCalled = 0;
  public responses: string[] = [];
  public lastPrompt = '';

  constructor(responses: string[]) {
    this.responses = responses;
  }

  async generate(prompt: string, _options?: unknown): Promise<string> {
    this.generateCalled++;
    this.lastPrompt = prompt;
    const response = this.responses.shift();
    if (!response) {
      throw new Error('No mock response configured');
    }
    return response;
  }
}

describe('AI Storyboard Generation & Analyzers Unit Tests', () => {
  const originalFetch = global.fetch;
  const tmpDir = path.resolve(process.cwd(), 'tmp', 'test-ai-analyzers');

  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });

    // Mock global fetch for URL and GitHub remote analyzers
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('package.json')) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve(JSON.stringify({ name: 'mock-pkg', description: 'mock-desc' })),
        } as unknown as Response);
      }
      if (url.includes('README.md')) {
        return Promise.resolve({
          ok: true,
          text: () =>
            Promise.resolve('# Mock Github Project\nMock features: fast rendering, easy setup'),
        } as unknown as Response);
      }
      // General web page mock
      return Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            '<html><head><title>Mock Title</title><meta name="description" content="Mock Meta Desc"></head><body></body></html>'
          ),
      } as unknown as Response);
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const validStoryboardResponse = JSON.stringify([
    {
      id: 'scene-1',
      template: 'title-card',
      duration: 3,
      data: { title: 'Mock Title', subtitle: 'Mock Subtitle' },
    },
    {
      id: 'scene-2',
      template: 'outro',
      duration: 4,
      data: { tagline: 'Mock Tagline', link: 'videoforge.dev' },
    },
  ]);

  it('should generate a valid storyboard from LLM output', async () => {
    const provider = new MockLLMProvider([validStoryboardResponse]);
    const facts = {
      title: 'Facts Title',
      description: 'Facts Description',
      features: ['Feat 1', 'Feat 2'],
    };

    const scenes = await generateStoryboard(facts, provider);
    expect(scenes.length).toBe(2);
    expect(scenes[0].template).toBe('title-card');
    expect(scenes[1].template).toBe('outro');
    expect(provider.generateCalled).toBe(1);
  });

  it('should enter repair loop and succeed on second attempt when JSON is malformed initially', async () => {
    // Malformed JSON first, then valid JSON
    const provider = new MockLLMProvider(['invalid-json-text', validStoryboardResponse]);
    const facts = {
      title: 'Facts Title',
      description: 'Facts Description',
      features: ['Feat 1'],
    };

    const scenes = await generateStoryboard(facts, provider);
    expect(scenes.length).toBe(2);
    expect(provider.generateCalled).toBe(2);
    expect(provider.lastPrompt).toContain('failed schema validation');
  });

  it('should throw VideoForgeError if repair loop fails on second attempt', async () => {
    const provider = new MockLLMProvider(['invalid-json-1', 'invalid-json-2']);
    const facts = {
      title: 'Facts Title',
      description: 'Facts Description',
      features: ['Feat 1'],
    };

    await expect(generateStoryboard(facts, provider)).rejects.toThrow(VideoForgeError);
    expect(provider.generateCalled).toBe(2);
  });

  it('should analyze markdown and return scenes list', async () => {
    const factsResponse = JSON.stringify({
      title: 'Markdown App',
      description: 'A markdown parsed project description',
      features: ['Highlight 1', 'Highlight 2'],
    });
    // First call extracts facts, second call generates storyboard from facts
    const provider = new MockLLMProvider([factsResponse, validStoryboardResponse]);

    const result = await analyzeMarkdown('# Product Name\nDescription: cool app', provider);
    expect(result.scenes.length).toBe(2);
    expect(provider.generateCalled).toBe(2);
  });

  it('should analyze local GitHub repo files and return scenes list', async () => {
    const repoPath = path.join(tmpDir, 'mock-repo');
    fs.mkdirSync(repoPath, { recursive: true });
    fs.writeFileSync(path.join(repoPath, 'README.md'), '# Local Repo\nAwesome features');
    fs.writeFileSync(
      path.join(repoPath, 'package.json'),
      JSON.stringify({ name: 'local-pkg', description: 'local-desc' })
    );

    const factsResponse = JSON.stringify({
      title: 'Local GitHub Repo',
      description: 'local-desc',
      features: ['Feature Local'],
    });
    const provider = new MockLLMProvider([factsResponse, validStoryboardResponse]);

    const result = await analyzeGithubRepo(repoPath, provider);
    expect(result.scenes.length).toBe(2);
  });

  it('should analyze remote GitHub repository URL and return scenes list', async () => {
    const factsResponse = JSON.stringify({
      title: 'Remote GitHub Repo',
      description: 'remote-desc',
      features: ['Feature Remote'],
    });
    const provider = new MockLLMProvider([factsResponse, validStoryboardResponse]);

    const result = await analyzeGithubRepo('https://github.com/videoforge/videoforge', provider);
    expect(result.scenes.length).toBe(2);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should analyze web URL and return scenes list', async () => {
    const factsResponse = JSON.stringify({
      title: 'Web URL App',
      description: 'Website metadata desc',
      features: ['Highlight 1', 'Highlight 2'],
    });
    const provider = new MockLLMProvider([factsResponse, validStoryboardResponse]);

    const result = await analyzeUrl('https://example.com/product', provider);
    expect(result.scenes.length).toBe(2);
    expect(global.fetch).toHaveBeenCalled();
  });
});

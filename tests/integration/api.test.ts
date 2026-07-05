import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/api/server.js';
import type { Application } from 'express';

// Mock the pipeline render function to prevent actual Playwright rendering in API tests
vi.mock('../../src/core/render/pipeline.js', () => ({
  renderProject: vi.fn().mockImplementation(async () => {
    // Artificial delay to test pending/rendering states
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { outputPath: '/mock/path/video.mp4', durationSeconds: 3.5 };
  }),
}));

// Mock Anthropic SDK globally to prevent real API calls and handle multiple sequential responses
const mockAnthropicResponses = [
  // First call (facts extraction)
  JSON.stringify({
    title: 'API Project',
    description: 'Mocked description for API',
    features: ['Highlight API 1', 'Highlight API 2'],
  }),
  // Second call (storyboard generation)
  JSON.stringify([
    {
      id: 'scene-1',
      template: 'title-card',
      duration: 3,
      data: { title: 'Mocked Title', subtitle: 'Mocked Subtitle' },
    },
  ]),
];

let anthropicCallCount = 0;

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class {
      messages = {
        create: vi.fn().mockImplementation(() => {
          const resp = mockAnthropicResponses[anthropicCallCount] || '[]';
          anthropicCallCount = (anthropicCallCount + 1) % mockAnthropicResponses.length;
          return Promise.resolve({
            content: [
              {
                type: 'text',
                text: resp,
              },
            ],
          });
        }),
      };
    },
  };
});

describe('REST API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    process.env.ANTHROPIC_API_KEY = 'mock-test-key';
    app = createApp();
  });

  const validConfig = {
    meta: { title: 'API Project' },
    theme: { primaryColor: '#000', secondaryColor: '#fff', fontFamily: 'Arial' },
    scenes: [
      {
        id: 's1',
        template: 'title-card',
        duration: 3,
        data: { title: 'API Slide' },
      },
    ],
  };

  it('should accept valid configurations for render and track status', async () => {
    const res = await request(app).post('/render').send(validConfig).expect(202);

    expect(res.body.jobId).toBeDefined();
    expect(res.body.status).toBe('pending');

    const jobId = res.body.jobId;

    // Check job status immediately
    const statusRes = await request(app).get(`/jobs/${jobId}`).expect(200);

    expect(statusRes.body.status).toMatch(/pending|rendering/);

    // Wait for async rendering completion
    await new Promise((resolve) => setTimeout(resolve, 100));

    const finalStatusRes = await request(app).get(`/jobs/${jobId}`).expect(200);

    expect(finalStatusRes.body.status).toBe('completed');
    expect(finalStatusRes.body.outputPath).toBe('/mock/path/video.mp4');
  });

  it('should reject invalid render configurations with 400', async () => {
    const invalidConfig = {
      theme: { primaryColor: '', secondaryColor: '', fontFamily: '' },
      scenes: [],
    };

    const res = await request(app).post('/render').send(invalidConfig).expect(400);

    expect(res.body.error).toBe('Invalid configuration');
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('should respond with 404 for non-existent jobs', async () => {
    const res = await request(app).get('/jobs/non-existent-id').expect(404);

    expect(res.body.error).toContain('not found');
  });

  it('should analyze content and return JSON storyboard', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({ type: 'markdown', source: '# Product Title\nDescription: info' })
      .expect(200);

    expect(res.body.scenes).toBeDefined();
    expect(res.body.scenes[0].template).toBe('title-card');
  });

  it('should generate configuration and start async rendering on POST /generate', async () => {
    const res = await request(app)
      .post('/generate')
      .send({
        type: 'markdown',
        source: '# Markdown Data',
        meta: { title: 'Generated API Project' },
      })
      .expect(202);

    expect(res.body.jobId).toBeDefined();
    expect(res.body.status).toBe('pending');
  });
});

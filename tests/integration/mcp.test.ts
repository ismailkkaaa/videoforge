import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createMcpServer } from '../../src/mcp/server.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import fs from 'fs';
import path from 'path';

// Mock the rendering pipeline
vi.mock('../../src/core/render/pipeline.js', () => ({
  renderProject: vi
    .fn()
    .mockResolvedValue({ outputPath: '/mock/mcp-video.mp4', durationSeconds: 8 }),
}));

// Mock Anthropic SDK globally to prevent real API calls and handle multiple sequential responses
const mockAnthropicResponses = [
  // First call (facts extraction)
  JSON.stringify({
    title: 'MCP Project',
    description: 'Mocked description for MCP',
    features: ['Highlight MCP 1', 'Highlight MCP 2'],
  }),
  // Second call (storyboard generation)
  JSON.stringify([
    {
      id: 'scene-1',
      template: 'title-card',
      duration: 3,
      data: { title: 'Mocked MCP Title', subtitle: 'Mocked MCP Subtitle' },
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

describe('MCP Server Integration Tests', () => {
  const tmpDir = path.resolve(process.cwd(), 'tmp', 'test-mcp');
  let server: Server;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sentMessages: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockTransport: any;

  beforeAll(async () => {
    process.env.ANTHROPIC_API_KEY = 'mock-test-key';
    fs.mkdirSync(tmpDir, { recursive: true });
    server = createMcpServer();

    // Create a mock transport to capture messages
    mockTransport = {
      start: async () => {},
      close: async () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      send: async (message: any) => {
        sentMessages.push(message);
      },
      onclose: () => {},
      onerror: () => {},
      onmessage: () => {},
    };

    await server.connect(mockTransport);
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should list all tools when receiving a tools/list request', async () => {
    sentMessages = [];

    // Simulate listing tools request
    await mockTransport.onmessage({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Check response
    const response = sentMessages.find((m) => m.id === 1);
    expect(response).toBeDefined();
    expect(response.result.tools).toBeDefined();

    const toolNames = response.result.tools.map((t: { name: string }) => t.name);
    expect(toolNames).toContain('init_project');
    expect(toolNames).toContain('analyze_content');
    expect(toolNames).toContain('render_video');
  });

  it('should execute init_project tool successfully', async () => {
    sentMessages = [];
    const targetPath = path.join(tmpDir, 'mcp-scaffold');

    await mockTransport.onmessage({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'init_project',
        arguments: {
          targetDir: targetPath,
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = sentMessages.find((m) => m.id === 2);
    expect(response).toBeDefined();
    expect(response.result.content[0].text).toContain('Successfully initialized project');
    expect(fs.existsSync(path.join(targetPath, 'videoforge.config.json'))).toBe(true);
  });

  it('should execute analyze_content tool successfully', async () => {
    sentMessages = [];

    await mockTransport.onmessage({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'analyze_content',
        arguments: {
          type: 'markdown',
          source: '# Markdown Header',
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = sentMessages.find((m) => m.id === 3);
    expect(response).toBeDefined();

    const content = JSON.parse(response.result.content[0].text);
    expect(content[0].template).toBe('title-card');
  });

  it('should execute render_video tool successfully', async () => {
    sentMessages = [];
    const directConfig = {
      meta: { title: 'MCP Render' },
      theme: { primaryColor: '#000', secondaryColor: '#fff', fontFamily: 'Arial' },
      scenes: [{ id: 's1', template: 'title-card', duration: 3, data: { title: 'MCP slide' } }],
    };

    await mockTransport.onmessage({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'render_video',
        arguments: {
          config: directConfig,
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = sentMessages.find((m) => m.id === 4);
    expect(response).toBeDefined();
    expect(response.result.content[0].text).toContain('Render complete!');
    expect(response.result.content[0].text).toContain('mcp-video.mp4');
  });

  it('should return error response for unknown tool execution', async () => {
    sentMessages = [];

    await mockTransport.onmessage({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'unknown_tool',
        arguments: {},
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 50));

    const response = sentMessages.find((m) => m.id === 5);
    expect(response).toBeDefined();
    expect(response.result.isError).toBe(true);
    expect(response.result.content[0].text).toContain('Tool execution failed');
  });
});

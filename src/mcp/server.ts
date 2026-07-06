import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initProject } from '../core/config/scaffold.js';
import { loadConfig } from '../core/config/loader.js';
import { renderProject } from '../core/render/pipeline.js';
import { GeminiProvider } from '../ai/providers/gemini.js';
import { analyzeMarkdown, type AnalyzerResult } from '../ai/analyzers/markdown.js';
import { analyzeGithubRepo } from '../ai/analyzers/github-repo.js';
import { analyzeUrl } from '../ai/analyzers/url.js';
import { VideoForgeConfigSchema, type VideoForgeConfig } from '../core/config/schema.js';
import path from 'path';

/**
 * Creates and configures the Model Context Protocol (MCP) Server.
 */
export function createMcpServer(): Server {
  const server = new Server(
    {
      name: 'videoforge',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'init_project',
          description:
            'Initialize a new VideoForge project directory with a default config, schema, and sample logo.',
          inputSchema: {
            type: 'object',
            properties: {
              targetDir: {
                type: 'string',
                description: 'Path to directory to initialize. Defaults to current directory.',
              },
            },
          },
        },
        {
          name: 'analyze_content',
          description:
            'Analyze raw markdown text, a local/remote GitHub repo, or a web URL using AI and output a JSON storyboard of scenes.',
          inputSchema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['markdown', 'github', 'url'],
                description: 'Type of content analyzer to use.',
              },
              source: {
                type: 'string',
                description:
                  'The raw text content (for markdown), local/remote repository path (for github), or website URL (for url).',
              },
            },
            required: ['type', 'source'],
          },
        },
        {
          name: 'render_video',
          description:
            'Render a motion graphics MP4 video from a configuration file path or a direct JSON configuration object.',
          inputSchema: {
            type: 'object',
            properties: {
              configPath: {
                type: 'string',
                description:
                  'Optional path to the configuration file (JSON/YAML) to load and render.',
              },
              config: {
                type: 'object',
                description: 'Optional direct VideoForge JSON configuration object.',
              },
            },
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'init_project') {
        const targetDir = String((args as { targetDir?: string } | undefined)?.targetDir || './');
        await initProject(targetDir);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully initialized project in ${path.resolve(targetDir)}`,
            },
          ],
        };
      }

      if (name === 'analyze_content') {
        const analyzeArgs = args as { type: string; source: string } | undefined;
        const type = String(analyzeArgs?.type);
        const source = String(analyzeArgs?.source);
        const provider = new GeminiProvider();
        let result: AnalyzerResult;

        if (type === 'markdown') {
          result = await analyzeMarkdown(source, provider);
        } else if (type === 'github') {
          result = await analyzeGithubRepo(source, provider);
        } else if (type === 'url') {
          result = await analyzeUrl(source, provider);
        } else {
          throw new Error(`Unknown analysis type: ${type}`);
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(result.scenes, null, 2) }],
        };
      }

      if (name === 'render_video') {
        const renderArgs = args as
          { configPath?: string; config?: Record<string, unknown> } | undefined;
        const configPath = renderArgs?.configPath;
        const directConfig = renderArgs?.config;

        let config: VideoForgeConfig;
        if (configPath) {
          config = loadConfig(path.resolve(configPath));
        } else if (directConfig) {
          config = VideoForgeConfigSchema.parse(directConfig);
        } else {
          throw new Error('Must provide either "configPath" or "config" argument.');
        }

        const renderRes = await renderProject(config);
        return {
          content: [
            {
              type: 'text',
              text: `Render complete!\nVideo saved to: ${path.resolve(renderRes.outputPath)}\nDuration: ${renderRes.durationSeconds} seconds`,
            },
          ],
        };
      }

      throw new Error(`Unknown tool: ${name}`);
    } catch (err) {
      const error = err as Error;
      return {
        isError: true,
        content: [{ type: 'text', text: `Tool execution failed: ${error.message}` }],
      };
    }
  });

  return server;
}

/**
 * Runs the MCP server listening on stdio.
 */
export async function runMcpServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('VideoForge MCP Server running on stdio');
}

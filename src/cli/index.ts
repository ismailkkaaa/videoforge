#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { loadConfig } from '../core/config/loader.js';
import { initProject } from '../core/config/scaffold.js';
import { renderProject } from '../core/render/pipeline.js';
import { AnthropicProvider } from '../ai/providers/anthropic.js';
import { analyzeMarkdown, type AnalyzerResult } from '../ai/analyzers/markdown.js';
import { analyzeGithubRepo } from '../ai/analyzers/github-repo.js';
import { analyzeUrl } from '../ai/analyzers/url.js';
import { VideoForgeConfigSchema } from '../core/config/schema.js';
import { VideoForgeError } from '../core/errors.js';

const program = new Command();

program
  .name('videoforge')
  .description('VideoForge: AI-assisted motion graphics video generator')
  .version('0.1.0');

program
  .command('init')
  .description('Scaffold a new VideoForge project directory')
  .argument('[targetDir]', 'Target directory to initialize', './')
  .action(async (targetDir) => {
    try {
      console.log(`Initializing VideoForge project in ${path.resolve(targetDir)}...`);
      await initProject(targetDir);
      console.log('Project initialized successfully!');
    } catch (err) {
      const error = err as Error;
      console.error(`Error during initialization: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('render')
  .description('Render a video from a JSON or YAML configuration file')
  .argument('<configPath>', 'Path to the configuration file')
  .option('-o, --output <path>', 'Override the output file path')
  .option('--fps <number>', 'Override the output frames per second')
  .option('--width <number>', 'Override the output resolution width')
  .option('--height <number>', 'Override the output resolution height')
  .action(async (configPath, options) => {
    try {
      console.log(`Loading configuration: ${configPath}...`);
      const config = loadConfig(path.resolve(configPath));

      if (options.output) {
        config.meta.outputPath = options.output;
      }
      if (options.fps) {
        config.meta.fps = parseInt(options.fps, 10);
      }
      if (options.width || options.height) {
        config.meta.resolution = {
          width: options.width ? parseInt(options.width, 10) : config.meta.resolution.width,
          height: options.height ? parseInt(options.height, 10) : config.meta.resolution.height,
        };
      }

      console.log('Starting render pipeline...');
      const result = await renderProject(config);
      console.log(`Render completed successfully!`);
      console.log(`Video saved to: ${path.resolve(result.outputPath)}`);
      console.log(`Duration: ${result.durationSeconds} seconds`);
    } catch (err) {
      const error = err as Error;
      console.error(`Render failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze content and print the generated storyboard JSON')
  .argument('<type>', 'Type of analysis: "markdown" | "github" | "url"')
  .argument('<source>', 'Source file path, URL or repo path')
  .action(async (type, source) => {
    try {
      const provider = new AnthropicProvider();
      let scenesList: AnalyzerResult;

      console.log(`Analyzing ${type} source: ${source}...`);
      if (type === 'markdown') {
        const filePath = path.resolve(source);
        if (!fs.existsSync(filePath)) {
          throw new VideoForgeError(`Markdown file does not exist: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        scenesList = await analyzeMarkdown(content, provider);
      } else if (type === 'github') {
        scenesList = await analyzeGithubRepo(source, provider);
      } else if (type === 'url') {
        scenesList = await analyzeUrl(source, provider);
      } else {
        throw new VideoForgeError(
          `Unknown analysis type: "${type}". Expected: markdown, github, or url.`
        );
      }

      console.log(JSON.stringify(scenesList.scenes, null, 2));
    } catch (err) {
      const error = err as Error;
      console.error(`Analysis failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Analyze content and render the video directly in one step')
  .argument('<type>', 'Type of analysis: "markdown" | "github" | "url"')
  .argument('<source>', 'Source file path, URL or repo path')
  .option('-o, --output <path>', 'Override the output file path')
  .option('--fps <number>', 'Override the output frames per second')
  .option('--width <number>', 'Override the output resolution width')
  .option('--height <number>', 'Override the output resolution height')
  .action(async (type, source, options) => {
    try {
      const provider = new AnthropicProvider();
      let scenesList: AnalyzerResult;

      console.log(`Analyzing ${type} source to generate storyboard...`);
      if (type === 'markdown') {
        const filePath = path.resolve(source);
        if (!fs.existsSync(filePath)) {
          throw new VideoForgeError(`Markdown file does not exist: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        scenesList = await analyzeMarkdown(content, provider);
      } else if (type === 'github') {
        scenesList = await analyzeGithubRepo(source, provider);
      } else if (type === 'url') {
        scenesList = await analyzeUrl(source, provider);
      } else {
        throw new VideoForgeError(
          `Unknown analysis type: "${type}". Expected: markdown, github, or url.`
        );
      }

      console.log(
        `Storyboard generated with ${scenesList.scenes.length} scenes. Formulating configuration...`
      );

      // Merge scenes with Zod schema defaults
      const rawConfig = {
        theme: {
          primaryColor: '#1a1a2e',
          secondaryColor: '#e94560',
          fontFamily: 'sans-serif',
        },
        scenes: scenesList.scenes,
      };

      const config = VideoForgeConfigSchema.parse(rawConfig);

      if (options.output) {
        config.meta.outputPath = options.output;
      }
      if (options.fps) {
        config.meta.fps = parseInt(options.fps, 10);
      }
      if (options.width || options.height) {
        config.meta.resolution = {
          width: options.width ? parseInt(options.width, 10) : config.meta.resolution.width,
          height: options.height ? parseInt(options.height, 10) : config.meta.resolution.height,
        };
      }

      console.log('Rendering video directly...');
      const result = await renderProject(config);
      console.log(`Generation and rendering completed successfully!`);
      console.log(`Video saved to: ${path.resolve(result.outputPath)}`);
    } catch (err) {
      const error = err as Error;
      console.error(`Generation failed: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('mcp')
  .description('Start the VideoForge MCP server on stdio transport')
  .action(async () => {
    try {
      const { runMcpServer } = await import('../mcp/server.js');
      await runMcpServer();
    } catch (err) {
      const error = err as Error;
      console.error(`Failed to start MCP server: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('studio')
  .description('Start the VideoForge Studio local storyboard editor')
  .option('-p, --port <number>', 'Port to run the studio server on', '3000')
  .action(async (options) => {
    try {
      const port = parseInt(options.port, 10);
      const { createApp } = await import('../api/server.js');
      const app = createApp();

      app.listen(port, '127.0.0.1', async () => {
        const url = `http://127.0.0.1:${port}`;
        console.log(`VideoForge Studio running at ${url}`);
        console.log('Opening studio in your browser...');

        const { exec } = await import('child_process');
        const start =
          process.platform === 'darwin'
            ? 'open'
            : process.platform === 'win32'
              ? 'start'
              : 'xdg-open';
        exec(`${start} ${url}`);
      });
    } catch (err) {
      const error = err as Error;
      console.error(`Failed to start studio: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

import express from 'express';
import fs from 'fs';
import path from 'path';
import { renderProject } from '../core/render/pipeline.js';
import { AnthropicProvider } from '../ai/providers/anthropic.js';
import { analyzeMarkdown, type AnalyzerResult } from '../ai/analyzers/markdown.js';
import { analyzeGithubRepo } from '../ai/analyzers/github-repo.js';
import { analyzeUrl } from '../ai/analyzers/url.js';
import { VideoForgeConfigSchema } from '../core/config/schema.js';

export interface Job {
  id: string;
  status: 'pending' | 'rendering' | 'completed' | 'failed';
  outputPath?: string;
  error?: string;
}

const jobs = new Map<string, Job>();

export function createApp(): express.Application {
  const app = express();
  app.use(express.json());

  // Serve static video outputs
  app.use('/output', express.static(path.resolve(process.cwd(), 'output')));

  // Serve built static UI storyboard editor
  let uiDistPath = path.resolve(process.cwd(), 'dist', 'ui');
  if (!fs.existsSync(uiDistPath)) {
    uiDistPath = path.resolve(process.cwd(), 'ui', 'dist');
  }
  if (fs.existsSync(uiDistPath)) {
    app.use(express.static(uiDistPath));
  }

  app.post('/render', (req, res) => {
    const parseResult = VideoForgeConfigSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issues = parseResult.error.errors.map(
        (e) => `${e.path.join('.') || 'root'}: ${e.message}`
      );
      return res.status(400).json({ error: 'Invalid configuration', details: issues });
    }

    const config = parseResult.data;
    const jobId = 'job-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

    const job: Job = { id: jobId, status: 'pending' };
    jobs.set(jobId, job);

    // Run rendering asynchronously in the background
    (async () => {
      job.status = 'rendering';
      try {
        const result = await renderProject(config);
        job.status = 'completed';
        job.outputPath = result.outputPath;
      } catch (err) {
        const error = err as Error;
        job.status = 'failed';
        job.error = error.message;
      }
    })();

    return res.status(202).json({ jobId, status: 'pending' });
  });

  app.get('/jobs/:id', (req, res) => {
    const job = jobs.get(req.params.id);
    if (!job) {
      return res.status(404).json({ error: `Job with ID "${req.params.id}" not found` });
    }
    return res.json(job);
  });

  app.post('/analyze', async (req, res) => {
    const { type, source } = req.body;
    if (!type || !source) {
      return res
        .status(400)
        .json({ error: 'Missing "type" or "source" parameters in request body' });
    }

    try {
      const provider = new AnthropicProvider();
      let result: AnalyzerResult;

      if (type === 'markdown') {
        result = await analyzeMarkdown(source, provider);
      } else if (type === 'github') {
        result = await analyzeGithubRepo(source, provider);
      } else if (type === 'url') {
        result = await analyzeUrl(source, provider);
      } else {
        return res
          .status(400)
          .json({ error: `Unknown analysis type: "${type}". Expected markdown, github, or url.` });
      }

      return res.json({ scenes: result.scenes });
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({ error: error.message });
    }
  });

  app.post('/generate', async (req, res) => {
    const { type, source, theme, meta } = req.body;
    if (!type || !source) {
      return res
        .status(400)
        .json({ error: 'Missing "type" or "source" parameters in request body' });
    }

    try {
      const provider = new AnthropicProvider();
      let result: AnalyzerResult;

      if (type === 'markdown') {
        result = await analyzeMarkdown(source, provider);
      } else if (type === 'github') {
        result = await analyzeGithubRepo(source, provider);
      } else if (type === 'url') {
        result = await analyzeUrl(source, provider);
      } else {
        return res.status(400).json({ error: `Unknown analysis type: "${type}"` });
      }

      const rawConfig = {
        meta: meta || {},
        theme: theme || {
          primaryColor: '#1a1a2e',
          secondaryColor: '#e94560',
          fontFamily: 'sans-serif',
        },
        scenes: result.scenes,
      };

      const parseResult = VideoForgeConfigSchema.safeParse(rawConfig);
      if (!parseResult.success) {
        const issues = parseResult.error.errors.map(
          (e) => `${e.path.join('.') || 'root'}: ${e.message}`
        );
        return res.status(400).json({ error: 'Invalid formulated configuration', details: issues });
      }

      const config = parseResult.data;
      const jobId = 'job-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

      const job: Job = { id: jobId, status: 'pending' };
      jobs.set(jobId, job);

      (async () => {
        job.status = 'rendering';
        try {
          const renderRes = await renderProject(config);
          job.status = 'completed';
          job.outputPath = renderRes.outputPath;
        } catch (err) {
          const error = err as Error;
          job.status = 'failed';
          job.error = error.message;
        }
      })();

      return res.status(202).json({ jobId, status: 'pending' });
    } catch (err) {
      const error = err as Error;
      return res.status(500).json({ error: error.message });
    }
  });

  return app;
}

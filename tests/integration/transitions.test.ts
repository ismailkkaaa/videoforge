import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { renderProject } from '../../src/core/render/pipeline.js';
import type { VideoForgeConfig } from '../../src/core/config/schema.js';

function getVideoMetadata(filePath: string) {
  try {
    const ffmpegPath = ffmpegInstaller.path;
    execSync(`"${ffmpegPath}" -i "${filePath}"`, { encoding: 'utf8', stdio: 'pipe' });
    return { duration: 0, width: 0, height: 0 };
  } catch (err) {
    const error = err as { stderr?: string; message?: string };
    const stderr = error.stderr || error.message || '';

    const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    let duration = 0;
    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseFloat(durationMatch[3]);
      duration = hours * 3600 + minutes * 60 + seconds;
    }

    const resolutionMatch = stderr.match(/,\s*(\d+)x(\d+)\s*,/);
    let width = 0;
    let height = 0;
    if (resolutionMatch) {
      width = parseInt(resolutionMatch[1], 10);
      height = parseInt(resolutionMatch[2], 10);
    }

    return { duration, width, height };
  }
}

describe('Transitions and Multitemplate Integration Tests', () => {
  const outputDir = path.resolve(process.cwd(), 'output');

  beforeAll(() => {
    fs.mkdirSync(outputDir, { recursive: true });
  });

  it('should render a project using all 7 templates and cross-fade transitions', async () => {
    const config: VideoForgeConfig = {
      meta: {
        title: 'All Templates Showreel',
        resolution: { width: 640, height: 360 }, // lower resolution to render faster in tests
        fps: 30,
        outputPath: path.join(outputDir, `transitions-test-${Date.now()}.mp4`),
      },
      theme: {
        primaryColor: '#0f172a',
        secondaryColor: '#38bdf8',
        fontFamily: 'sans-serif',
      },
      scenes: [
        {
          id: 'scene-1',
          template: 'title-card',
          duration: 3,
          data: { title: 'VideoForge Demo', subtitle: 'Showing all templates' },
          transition: { type: 'fade', duration: 1 },
        },
        {
          id: 'scene-2',
          template: 'feature-grid',
          duration: 4,
          data: {
            title: 'Features',
            features: [
              { title: 'Local-first', description: 'Runs offline' },
              { title: 'Deterministic', description: 'Perfect frames' },
            ],
          },
          transition: { type: 'fade', duration: 1 },
        },
        {
          id: 'scene-3',
          template: 'code-snippet',
          duration: 4,
          data: {
            title: 'Easy Schema',
            code: 'const x = zod.object({});',
            language: 'javascript',
          },
          transition: { type: 'fade', duration: 1 },
        },
        {
          id: 'scene-4',
          template: 'logo-reveal',
          duration: 3,
          data: { title: 'VideoForge Logo', subtitle: 'Sleek reveal' },
          transition: { type: 'fade', duration: 1 },
        },
        {
          id: 'scene-5',
          template: 'stat-counter',
          duration: 3,
          data: { number: 42, suffix: ' FPS', title: 'Speed', subtitle: 'rendered locally' },
          transition: { type: 'fade', duration: 1 },
        },
        {
          id: 'scene-6',
          template: 'quote',
          duration: 4,
          data: { quote: 'Simplicity is key.', author: 'John Doe', title: 'Developer' },
          transition: { type: 'fade', duration: 1 },
        },
        {
          id: 'scene-7',
          template: 'outro',
          duration: 4,
          data: { tagline: 'Get started today!', link: 'github.com/videoforge' },
        },
      ],
    };

    const result = await renderProject(config);
    expect(fs.existsSync(result.outputPath)).toBe(true);

    const metadata = getVideoMetadata(result.outputPath);
    expect(metadata.width).toBe(640);
    expect(metadata.height).toBe(360);

    // Sum of durations = 3 + 4 + 4 + 3 + 3 + 4 + 4 = 25s
    // 6 fade transitions of 1.0s each -> total duration = 25 - 6 = 19.0 seconds.
    // Allow ±1 frame (1/30 = 0.033s) tolerance
    expect(metadata.duration).toBeCloseTo(19.0, 1);

    // Cleanup
    try {
      fs.unlinkSync(result.outputPath);
    } catch {
      // Ignore
    }
  }, 60000); // 60s timeout for large multi-scene render
});

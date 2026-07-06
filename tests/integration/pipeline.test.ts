import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { loadConfig } from '../../src/core/config/loader.js';
import { renderProject } from '../../src/core/render/pipeline.js';
import { captureFrames } from '../../src/core/render/capture.js';

function getVideoMetadata(filePath: string) {
  try {
    const ffmpegPath = ffmpegInstaller.path;
    execSync(`"${ffmpegPath}" -i "${filePath}"`, { encoding: 'utf8', stdio: 'pipe' });
    return { duration: 0, width: 0, height: 0 };
  } catch (err) {
    const error = err as { stderr?: string; message?: string };
    const stderr = error.stderr || error.message || '';

    // Find Duration: 00:00:03.00
    const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
    let duration = 0;
    if (durationMatch) {
      const hours = parseInt(durationMatch[1], 10);
      const minutes = parseInt(durationMatch[2], 10);
      const seconds = parseFloat(durationMatch[3]);
      duration = hours * 3600 + minutes * 60 + seconds;
    }

    // Find 1280x720
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

describe('Pipeline Integration Tests', () => {
  const outputDir = path.resolve(process.cwd(), 'output');
  const sampleConfigPath = path.resolve(process.cwd(), 'examples/configs/sample-project.json');

  beforeAll(() => {
    fs.mkdirSync(outputDir, { recursive: true });
  });

  it('should render the sample project end-to-end', async () => {
    const config = loadConfig(sampleConfigPath);
    // Set unique output name for this test to avoid collision
    const testOutputPath = path.join(outputDir, `integration-test-${Date.now()}.mp4`);
    config.meta.outputPath = testOutputPath;

    const result = await renderProject(config);

    expect(result.outputPath).toBe(testOutputPath);
    expect(fs.existsSync(testOutputPath)).toBe(true);

    const metadata = getVideoMetadata(testOutputPath);
    expect(metadata.width).toBe(1280);
    expect(metadata.height).toBe(720);
    // 3.0 seconds duration, within ±1 frame tolerance at 30fps (0.034s)
    expect(metadata.duration).toBeCloseTo(3.0, 1);

    // Cleanup
    try {
      fs.unlinkSync(testOutputPath);
    } catch {
      // Ignore
    }
  }, 90000); // 90s timeout

  it('should be deterministic (seek(t) twice produces identical screenshots)', async () => {
    const config = loadConfig(sampleConfigPath);
    // We only need a short 1-scene 0.1-second config for determinism test to be fast
    const shortConfig = {
      ...config,
      scenes: [
        {
          id: 'det-scene',
          template: 'title-card',
          duration: 0.1, // 3 frames at 30fps
          data: { title: 'Determinism' },
        },
      ],
    };

    const runId1 = `test-det-1-${Date.now()}`;
    const runId2 = `test-det-2-${Date.now()}`;

    const scenes1 = await captureFrames(shortConfig, runId1);
    const scenes2 = await captureFrames(shortConfig, runId2);

    expect(scenes1.length).toBe(1);
    expect(scenes2.length).toBe(1);
    expect(scenes1[0].framePaths.length).toBe(3);
    expect(scenes2[0].framePaths.length).toBe(3);

    // Read files and check that they are byte-identical
    for (let i = 0; i < 3; i++) {
      const file1 = fs.readFileSync(scenes1[0].framePaths[i]);
      const file2 = fs.readFileSync(scenes2[0].framePaths[i]);
      expect(file1.equals(file2)).toBe(true);
    }

    // Cleanup captured frames
    fs.rmSync(path.resolve(process.cwd(), 'tmp', runId1), { recursive: true, force: true });
    fs.rmSync(path.resolve(process.cwd(), 'tmp', runId2), { recursive: true, force: true });
  }, 20000); // 20s timeout
});

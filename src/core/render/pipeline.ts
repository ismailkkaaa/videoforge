import fs from 'fs';
import path from 'path';
import { captureFrames } from './capture.js';
import { encodeScene, concatenateVideos } from './encoder.js';
import { RenderError } from '../errors.js';
import type { VideoForgeConfig } from '../config/schema.js';

export interface RenderOptions {
  keepFrames?: boolean;
}

/**
 * Orchestrates the full video generation pipeline: config validation, frame capture,
 * individual scene encoding, and concatenation of scenes into the final video file.
 *
 * @param config The validated VideoForgeConfig object.
 * @param options Pipeline render options (e.g. keepFrames).
 * @returns A promise resolving to the final outputPath and overall duration.
 */
export async function renderProject(
  config: VideoForgeConfig,
  options: RenderOptions = {}
): Promise<{ outputPath: string; durationSeconds: number }> {
  const runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const tmpDir = path.resolve(process.cwd(), 'tmp', runId);
  const fps = config.meta.fps ?? 30;

  const totalDuration = config.scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const intermediateMp4s: string[] = [];

  try {
    // 1. Capture frames from Playwright browser
    const capturedScenes = await captureFrames(config, runId);

    // 2. Encode each scene into an intermediate MP4
    for (const captured of capturedScenes) {
      const sceneDir = path.join(tmpDir, `scene-${captured.sceneId}`);
      const patternPath = path.join(sceneDir, 'frame-%06d.png');
      const intermediatePath = path.join(sceneDir, 'scene.mp4');

      await encodeScene(patternPath, intermediatePath, fps);
      intermediateMp4s.push(intermediatePath);
    }

    // 3. Concatenate all scene MP4s
    const finalOutputPath = path.resolve(process.cwd(), config.meta.outputPath);
    await concatenateVideos(intermediateMp4s, finalOutputPath);

    // 4. Clean up temporary frame folder on success if not explicitly instructed to keep it
    if (!options.keepFrames) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (err) {
        console.warn(`[VideoForge] Failed to clean up temp directory ${tmpDir}:`, err);
      }
    }

    return {
      outputPath: finalOutputPath,
      durationSeconds: totalDuration,
    };
  } catch (err) {
    const error = err as Error;
    // Note: We leave tmpDir directory intact on failure for debugging
    if (error instanceof RenderError) {
      throw error;
    }
    throw new RenderError(`Pipeline execution failed: ${error.message}`);
  }
}

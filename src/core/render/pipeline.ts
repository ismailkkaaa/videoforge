import fs from 'fs';
import path from 'path';
import { captureFrames } from './capture.js';
import { encodeScene, concatenateVideos } from './encoder.js';
import { processTransitions } from './transitions.js';
import { RenderError } from '../errors.js';
import type { VideoForgeConfig } from '../config/schema.js';

export interface RenderOptions {
  keepFrames?: boolean;
}

/**
 * Orchestrates the full video generation pipeline: config validation, frame capture,
 * transition processing, individual segment encoding, and concatenation into the final video.
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

  const intermediateMp4s: string[] = [];

  try {
    // 1. Capture frames from Playwright browser
    const capturedScenes = await captureFrames(config, runId);

    // 2. Process transitions to split/blend frames into final render segments
    const segments = await processTransitions(config, capturedScenes, runId);

    // 3. Encode each segment into an intermediate MP4
    for (const segment of segments) {
      const segmentDir = path.join(tmpDir, `segment-${segment.id}`);
      fs.mkdirSync(segmentDir, { recursive: true });

      // Copy frames to consecutive names in the segment directory
      const consecutiveFramePaths: string[] = [];
      segment.framePaths.forEach((originalPath, index) => {
        const consecutiveName = `frame-${String(index + 1).padStart(6, '0')}.png`;
        const destPath = path.join(segmentDir, consecutiveName);
        fs.copyFileSync(originalPath, destPath);
        consecutiveFramePaths.push(destPath);
      });

      const patternPath = path.join(segmentDir, 'frame-%06d.png');
      const intermediatePath = path.join(segmentDir, 'segment.mp4');

      await encodeScene(patternPath, intermediatePath, fps);
      intermediateMp4s.push(intermediatePath);
    }

    // 4. Concatenate all segment MP4s
    const finalOutputPath = path.resolve(process.cwd(), config.meta.outputPath);
    await concatenateVideos(intermediateMp4s, finalOutputPath);

    // Calculate total duration from actual written frames
    const totalFrames = segments.reduce((sum, seg) => sum + seg.framePaths.length, 0);
    const durationSeconds = totalFrames / fps;

    // 5. Clean up temporary frame folder on success if not explicitly instructed to keep it
    if (!options.keepFrames) {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch (err) {
        console.warn(`[VideoForge] Failed to clean up temp directory ${tmpDir}:`, err);
      }
    }

    return {
      outputPath: finalOutputPath,
      durationSeconds,
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

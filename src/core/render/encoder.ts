import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';
import { RenderError } from '../errors.js';

// Setup FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Encodes a folder of frame images into an intermediate MP4 video file.
 *
 * @param framePattern Path pattern for input frames (e.g., "tmp/runId/scene-id/frame-%06d.png").
 * @param outputPath Path where the output MP4 should be saved.
 * @param fps Frames per second.
 * @returns A promise that resolves when encoding is complete.
 */
export function encodeScene(framePattern: string, outputPath: string, fps: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // Ensure parent directory of output exists
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    ffmpeg()
      .input(framePattern)
      .inputOptions([`-r ${fps}`, '-start_number 1'])
      .output(outputPath)
      .outputOptions(['-c:v libx264', '-pix_fmt yuv420p', `-r ${fps}`])
      .on('end', () => resolve())
      .on('error', (err) => {
        reject(new RenderError(`FFmpeg scene encoding failed: ${err.message}`));
      })
      .run();
  });
}

/**
 * Concatenates multiple video files into a single output video file using the FFmpeg concat demuxer.
 *
 * @param videoPaths Array of absolute or relative paths to input video files.
 * @param outputPath Path where the final concatenated video should be saved.
 * @returns A promise that resolves when concatenation is complete.
 */
export function concatenateVideos(videoPaths: string[], outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (videoPaths.length === 0) {
      reject(new RenderError('No videos provided for concatenation'));
      return;
    }

    if (videoPaths.length === 1) {
      // If only one video, simply copy it to target
      try {
        const dir = path.dirname(outputPath);
        fs.mkdirSync(dir, { recursive: true });
        fs.copyFileSync(videoPaths[0], outputPath);
        resolve();
      } catch (err) {
        const error = err as Error;
        reject(new RenderError(`Failed to copy video to output path: ${error.message}`));
      }
      return;
    }

    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    const fileListPath = `${outputPath}.concat.txt`;
    try {
      // Concat demuxer file contents
      const content = videoPaths
        .map((p) => `file '${path.resolve(p).replace(/\\/g, '/')}'`)
        .join('\n');
      fs.writeFileSync(fileListPath, content);
    } catch (err) {
      const error = err as Error;
      reject(new RenderError(`Failed to write concatenation file list: ${error.message}`));
      return;
    }

    ffmpeg()
      .input(fileListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .output(outputPath)
      .outputOptions(['-c copy'])
      .on('end', () => {
        try {
          fs.unlinkSync(fileListPath);
        } catch {
          // Ignore
        }
        resolve();
      })
      .on('error', (err) => {
        try {
          fs.unlinkSync(fileListPath);
        } catch {
          // Ignore
        }
        reject(new RenderError(`FFmpeg concatenation failed: ${err.message}`));
      })
      .run();
  });
}

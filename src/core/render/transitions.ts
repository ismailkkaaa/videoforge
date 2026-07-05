import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import type { VideoForgeConfig } from '../config/schema.js';

export interface RenderSegment {
  id: string;
  framePaths: string[];
}

/**
 * Blends a list of frames in batch inside a headless Chromium page.
 */
async function blendFrameSequences(
  framesToBlend: { pathA: string; pathB: string; outputPath: string; alpha: number }[],
  width: number,
  height: number
): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const item of framesToBlend) {
    const base64A = fs.readFileSync(item.pathA, 'base64');
    const base64B = fs.readFileSync(item.pathB, 'base64');

    const resultBase64 = await page.evaluate(
      async ({ dataA, dataB, alpha, w, h }) => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get 2d context');

        const loadImg = (src: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = src;
          });
        };

        const imgA = await loadImg(dataA);
        const imgB = await loadImg(dataB);

        ctx.globalAlpha = 1.0;
        ctx.drawImage(imgA, 0, 0, w, h);

        ctx.globalAlpha = alpha;
        ctx.drawImage(imgB, 0, 0, w, h);

        return canvas.toDataURL('image/png');
      },
      {
        dataA: `data:image/png;base64,${base64A}`,
        dataB: `data:image/png;base64,${base64B}`,
        alpha: item.alpha,
        w: width,
        h: height,
      }
    );

    const buffer = Buffer.from(resultBase64.split(',')[1], 'base64');
    fs.mkdirSync(path.dirname(item.outputPath), { recursive: true });
    fs.writeFileSync(item.outputPath, buffer);
  }

  await browser.close();
}

/**
 * Processes scene transitions, splitting frames and generating cross-faded transition segments.
 *
 * @param config The VideoForgeConfig object.
 * @param capturedScenes The list of captured scene frame paths.
 * @param runId The current run ID.
 * @returns A list of render segments to encode and concatenate.
 */
export async function processTransitions(
  config: VideoForgeConfig,
  capturedScenes: { sceneId: string; framePaths: string[] }[],
  runId: string
): Promise<RenderSegment[]> {
  const segments: RenderSegment[] = [];
  const resolution = config.meta.resolution ?? { width: 1280, height: 720 };
  const fps = config.meta.fps ?? 30;

  const tmpDir = path.resolve(process.cwd(), 'tmp', runId);
  let currentSceneFrames = [...capturedScenes[0].framePaths];
  const framesToBlend: { pathA: string; pathB: string; outputPath: string; alpha: number }[] = [];

  for (let i = 0; i < capturedScenes.length - 1; i++) {
    const sceneA = config.scenes[i];
    const sceneB = config.scenes[i + 1];
    const captureB = capturedScenes[i + 1];

    const transition = sceneA.transition;

    if (transition && transition.type === 'fade' && transition.duration > 0) {
      const transitionFrames = Math.round(transition.duration * fps);
      const actualTransitionFrames = Math.min(
        transitionFrames,
        currentSceneFrames.length,
        captureB.framePaths.length
      );

      if (actualTransitionFrames > 0) {
        // 1. Scene A unique frames
        const uniqueAFrames = currentSceneFrames.slice(
          0,
          currentSceneFrames.length - actualTransitionFrames
        );
        if (uniqueAFrames.length > 0) {
          segments.push({
            id: `${sceneA.id}-unique`,
            framePaths: uniqueAFrames,
          });
        }

        // 2. Transition overlap frames
        const overlapA = currentSceneFrames.slice(
          currentSceneFrames.length - actualTransitionFrames
        );
        const overlapB = captureB.framePaths.slice(0, actualTransitionFrames);

        const transitionDir = path.join(tmpDir, `transition-${sceneA.id}-${sceneB.id}`);
        const transitionPaths: string[] = [];

        for (let j = 0; j < actualTransitionFrames; j++) {
          const alpha = j / (actualTransitionFrames - 1 || 1); // linear transition 0 -> 1
          const outPath = path.join(transitionDir, `frame-${String(j + 1).padStart(6, '0')}.png`);

          framesToBlend.push({
            pathA: overlapA[j],
            pathB: overlapB[j],
            outputPath: outPath,
            alpha,
          });
          transitionPaths.push(outPath);
        }

        segments.push({
          id: `transition-${sceneA.id}-${sceneB.id}`,
          framePaths: transitionPaths,
        });

        // 3. Prepare B's frames for the next scene transition check
        currentSceneFrames = captureB.framePaths.slice(actualTransitionFrames);
      } else {
        // Cut transition fallback
        segments.push({
          id: `${sceneA.id}-unique`,
          framePaths: currentSceneFrames,
        });
        currentSceneFrames = [...captureB.framePaths];
      }
    } else {
      // Cut transition (default)
      segments.push({
        id: `${sceneA.id}-unique`,
        framePaths: currentSceneFrames,
      });
      currentSceneFrames = [...captureB.framePaths];
    }
  }

  // Add the last scene's remaining frames
  if (currentSceneFrames.length > 0) {
    const lastScene = config.scenes[config.scenes.length - 1];
    segments.push({
      id: `${lastScene.id}-unique`,
      framePaths: currentSceneFrames,
    });
  }

  // Perform all blending operations in batch
  if (framesToBlend.length > 0) {
    await blendFrameSequences(framesToBlend, resolution.width, resolution.height);
  }

  return segments;
}

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
  framesToBlend: {
    pathA: string;
    pathB: string;
    outputPath: string;
    alpha: number;
    type: string;
  }[],
  width: number,
  height: number
): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const item of framesToBlend) {
    const base64A = fs.readFileSync(item.pathA, 'base64');
    const base64B = fs.readFileSync(item.pathB, 'base64');

    const resultBase64 = await page.evaluate(
      async ({ dataA, dataB, alpha, w, h, type }) => {
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

        // Reset canvas context states
        ctx.globalAlpha = 1.0;
        ctx.filter = 'none';

        if (type === 'fade') {
          ctx.drawImage(imgA, 0, 0, w, h);
          ctx.globalAlpha = alpha;
          ctx.drawImage(imgB, 0, 0, w, h);
        } else if (type === 'blur') {
          const maxBlur = 30; // max blur size in pixels
          const blurVal = Math.sin(alpha * Math.PI) * maxBlur;
          ctx.filter = `blur(${blurVal}px)`;
          ctx.drawImage(imgA, 0, 0, w, h);
          ctx.globalAlpha = alpha;
          ctx.drawImage(imgB, 0, 0, w, h);
        } else if (type === 'zoom') {
          // Zoom out/in transition
          const scaleA = 1.0 + alpha * 0.3;
          ctx.globalAlpha = 1.0 - alpha;
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.scale(scaleA, scaleA);
          ctx.drawImage(imgA, -w / 2, -h / 2, w, h);
          ctx.restore();

          const scaleB = 0.7 + alpha * 0.3;
          ctx.globalAlpha = alpha;
          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.scale(scaleB, scaleB);
          ctx.drawImage(imgB, -w / 2, -h / 2, w, h);
          ctx.restore();
        } else if (type === 'whip') {
          // Slide left with motion blur
          const ease = alpha < 0.5 ? 2 * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 2) / 2;
          const shift = ease * w;
          const blurVal = Math.sin(alpha * Math.PI) * 15;
          ctx.filter = blurVal > 0 ? `blur(${blurVal}px)` : 'none';

          ctx.drawImage(imgA, -shift, 0, w, h);
          ctx.drawImage(imgB, w - shift, 0, w, h);
        } else if (type === 'morph' || type === 'liquid') {
          // Smooth fluid scale-fade-blur morph
          const ease = alpha < 0.5 ? 2 * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 2) / 2;
          const blurVal = Math.sin(alpha * Math.PI) * 25;
          ctx.filter = `blur(${blurVal}px)`;

          ctx.save();
          ctx.translate(w / 2, h / 2);
          const scaleA = 1.0 + ease * 0.2;
          ctx.scale(scaleA, scaleA);
          ctx.globalAlpha = 1.0 - ease;
          ctx.drawImage(imgA, -w / 2, -h / 2, w, h);
          ctx.restore();

          ctx.save();
          ctx.translate(w / 2, h / 2);
          const scaleB = 0.8 + ease * 0.2;
          ctx.scale(scaleB, scaleB);
          ctx.globalAlpha = ease;
          ctx.drawImage(imgB, -w / 2, -h / 2, w, h);
          ctx.restore();
        } else if (type === 'glitch') {
          // Deterministic horizontal slice glitch offsets
          ctx.drawImage(imgA, 0, 0, w, h);
          ctx.globalAlpha = alpha;
          ctx.drawImage(imgB, 0, 0, w, h);

          const glitchPeak = Math.sin(alpha * Math.PI);
          if (glitchPeak > 0.15) {
            const numSlices = 12;
            const sliceHeight = h / numSlices;
            // Seed a deterministic pseudo-random offset based on alpha value
            for (let slice = 0; slice < numSlices; slice++) {
              const pseudoRand = Math.sin(alpha * 1000 + slice * 23.45);
              if (Math.abs(pseudoRand) > 0.4) {
                const offset = pseudoRand * 40 * glitchPeak;
                ctx.drawImage(
                  canvas,
                  0,
                  slice * sliceHeight,
                  w,
                  sliceHeight,
                  offset,
                  slice * sliceHeight,
                  w,
                  sliceHeight
                );
              }
            }
          }
        } else if (type === 'flash') {
          ctx.drawImage(imgA, 0, 0, w, h);
          ctx.globalAlpha = alpha;
          ctx.drawImage(imgB, 0, 0, w, h);

          const flashAlpha = Math.sin(alpha * Math.PI) * 0.8;
          if (flashAlpha > 0) {
            ctx.globalAlpha = flashAlpha;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          }
        } else if (type === '3d-cube') {
          // Horizontal cube flip simulation
          ctx.save();
          ctx.translate(w / 2, h / 2);
          if (alpha < 0.5) {
            const scaleX = 1.0 - alpha * 2;
            ctx.transform(scaleX, 0.08 * alpha, 0, 1, 0, 0);
            ctx.drawImage(imgA, -w / 2, -h / 2, w, h);
          } else {
            const scaleX = (alpha - 0.5) * 2;
            ctx.transform(scaleX, -0.08 * (1 - alpha), 0, 1, 0, 0);
            ctx.drawImage(imgB, -w / 2, -h / 2, w, h);
          }
          ctx.restore();
        } else if (type === 'push') {
          const ease = alpha < 0.5 ? 2 * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 2) / 2;
          const shift = ease * w;
          ctx.drawImage(imgA, -shift, 0, w, h);
          ctx.drawImage(imgB, w - shift, 0, w, h);
        } else if (type === 'swipe') {
          const ease = alpha < 0.5 ? 2 * alpha * alpha : 1 - Math.pow(-2 * alpha + 2, 2) / 2;
          const splitX = ease * w;
          ctx.drawImage(imgA, 0, 0, w, h);

          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, splitX, h);
          ctx.clip();
          ctx.drawImage(imgB, 0, 0, w, h);
          ctx.restore();
        } else {
          // Default fallback (fade)
          ctx.drawImage(imgA, 0, 0, w, h);
          ctx.globalAlpha = alpha;
          ctx.drawImage(imgB, 0, 0, w, h);
        }

        return canvas.toDataURL('image/png');
      },
      {
        dataA: `data:image/png;base64,${base64A}`,
        dataB: `data:image/png;base64,${base64B}`,
        alpha: item.alpha,
        w: width,
        h: height,
        type: item.type,
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
  const framesToBlend: {
    pathA: string;
    pathB: string;
    outputPath: string;
    alpha: number;
    type: string;
  }[] = [];

  for (let i = 0; i < capturedScenes.length - 1; i++) {
    const sceneA = config.scenes[i];
    const sceneB = config.scenes[i + 1];
    const captureB = capturedScenes[i + 1];

    const transition = sceneA.transition;

    if (transition && transition.type !== 'cut' && transition.duration > 0) {
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
          const alpha = j / (actualTransitionFrames - 1 || 1); // transition progression 0 -> 1
          const outPath = path.join(transitionDir, `frame-${String(j + 1).padStart(6, '0')}.png`);

          framesToBlend.push({
            pathA: overlapA[j],
            pathB: overlapB[j],
            outputPath: outPath,
            alpha,
            type: transition.type,
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

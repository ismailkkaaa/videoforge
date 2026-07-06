import { chromium, type Browser } from 'playwright';
import ts from 'typescript';
import fs from 'fs';
import path from 'path';
import { RenderError } from '../errors.js';
import type { VideoForgeConfig } from '../config/schema.js';

/**
 * Transpiles a TypeScript file to ESNext Javascript in memory.
 */
function transpileTS(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = ts.transpileModule(content, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      strict: false,
    },
  });
  return result.outputText;
}

export interface CapturedScene {
  sceneId: string;
  framePaths: string[];
}

/**
 * Renders each scene in the config frame-by-frame using Playwright and saves screenshots as PNGs.
 *
 * @param config The validated VideoForgeConfig object.
 * @param runId A unique run identifier.
 * @returns A promise that resolves to an array of captured scene details.
 */
export async function captureFrames(
  config: VideoForgeConfig,
  runId: string
): Promise<CapturedScene[]> {
  const { resolution, fps } = config.meta;
  const width = resolution?.width ?? 1280;
  const height = resolution?.height ?? 720;

  const tmpDir = path.resolve(process.cwd(), 'tmp', runId);
  fs.mkdirSync(tmpDir, { recursive: true });

  let browser: Browser | null = null;
  const capturedScenes: CapturedScene[] = [];

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-web-security'],
    });

    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });

    const page = await context.newPage();

    page.on('console', (msg) => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      console.error(`[Browser Page Error] ${err.message}`);
    });

    // Enable request interception to serve local renderer shell, GSAP, and templates
    await page.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname !== 'videoforge') {
        route.continue();
        return;
      }

      const pathname = url.pathname;

      if (pathname === '/renderer.html') {
        const html = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/node_modules/prismjs/themes/prism-tomorrow.css">
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: black;
    }
    #container {
      width: 100%;
      height: 100%;
      position: relative;
    }
  </style>
</head>
<body>
  <div id="container"></div>
  <script src="/node_modules/gsap/dist/gsap.min.js"></script>
  <script src="/node_modules/prismjs/prism.js"></script>
</body>
</html>`;
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: html,
        });
        return;
      }

      if (pathname === '/logo' && config.theme.logoPath) {
        const logoFullPath = path.resolve(process.cwd(), config.theme.logoPath);
        if (fs.existsSync(logoFullPath)) {
          const ext = path.extname(logoFullPath).toLowerCase();
          const mime =
            ext === '.png'
              ? 'image/png'
              : ext === '.jpg' || ext === '.jpeg'
                ? 'image/jpeg'
                : 'image/svg+xml';
          route.fulfill({
            status: 200,
            contentType: mime,
            body: fs.readFileSync(logoFullPath),
          });
          return;
        }
      }

      if (pathname.startsWith('/node_modules/')) {
        const relativePath = pathname.replace(/^\/node_modules\//, '');
        const fullPath = path.resolve(process.cwd(), 'node_modules', relativePath);
        if (fs.existsSync(fullPath)) {
          route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: fs.readFileSync(fullPath),
          });
          return;
        }
      }

      if (pathname.startsWith('/src/')) {
        const relativePath = pathname.replace(/^\/src\//, '');
        const tsPath = path.resolve(process.cwd(), 'src', relativePath.replace(/\.js$/, '.ts'));
        const jsPath = path.resolve(process.cwd(), 'src', relativePath);

        if (fs.existsSync(tsPath)) {
          const compiled = transpileTS(tsPath);
          route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: compiled,
          });
          return;
        } else if (fs.existsSync(jsPath)) {
          route.fulfill({
            status: 200,
            contentType: 'application/javascript',
            body: fs.readFileSync(jsPath),
          });
          return;
        }
      }

      route.fulfill({
        status: 404,
        body: 'Not Found',
      });
    });

    // Load the HTML shell
    await page.goto('http://videoforge/renderer.html');

    for (const scene of config.scenes) {
      const sceneDir = path.join(tmpDir, `scene-${scene.id}`);
      fs.mkdirSync(sceneDir, { recursive: true });

      // Load and mount the template for this scene
      const templatePath = `/src/templates-builtin/${scene.template}/index.js`;

      try {
        const evalStr = `
          (async () => {
            const path = ${JSON.stringify(templatePath)};
            const data = ${JSON.stringify(scene.data)};
            const theme = ${JSON.stringify(config.theme)};

            console.log("Starting mount for path:", path);
            const container = document.getElementById('container');
            if (!container) {
              throw new Error("No container element found!");
            }
            container.innerHTML = '';

            console.log("Importing module:", path);
            const mod = await import(path);
            console.log("Module imported. Keys:", Object.keys(mod));
            let TemplateClass = mod.default;
            if (!TemplateClass) {
              const keys = Object.keys(mod);
              for (const key of keys) {
                if (
                  typeof mod[key] === 'function' &&
                  mod[key].prototype &&
                  typeof mod[key].prototype.mount === 'function'
                ) {
                  TemplateClass = mod[key];
                  break;
                }
              }
            }

            if (!TemplateClass) {
              throw new Error("Could not find a valid template class in module " + path);
            }

            console.log("Instantiating and mounting template...");
            const instance = new TemplateClass();
            await instance.mount(container, data, theme);
            console.log("Template mounted. DOM populated.");
            window.__currentTemplate = instance;
          })()
        `;
        await page.evaluate(evalStr);
      } catch (err) {
        const error = err as Error;
        throw new RenderError(
          `Failed to mount template '${scene.template}' for scene '${scene.id}': ${error.message}`
        );
      }

      // Capture frames
      const totalFrames = Math.round(scene.duration * fps);
      const framePaths: string[] = [];

      for (let i = 0; i < totalFrames; i++) {
        const timeSeconds = i / fps;

        // Seek template animation and wait for frame
        await page.evaluate(async (t) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const instance = (window as any).__currentTemplate;
          if (instance && typeof instance.seek === 'function') {
            instance.seek(t);
          }
          // Wait for next requestAnimationFrame to ensure rendering is committed
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }, timeSeconds);

        const frameFileName = `frame-${String(i + 1).padStart(6, '0')}.png`;
        const framePath = path.join(sceneDir, frameFileName);

        const buffer = await page.screenshot({ type: 'png' });
        fs.writeFileSync(framePath, buffer);
        framePaths.push(framePath);
      }

      capturedScenes.push({
        sceneId: scene.id,
        framePaths,
      });

      // Cleanup scene template in page
      await page.evaluate(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const instance = (window as any).__currentTemplate;
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__currentTemplate = null;
      });
    }

    await browser.close();
    browser = null;

    return capturedScenes;
  } catch (err) {
    if (browser) {
      await browser.close();
    }
    const error = err as Error;
    throw new RenderError(`Frame capture failed: ${error.message}`);
  }
}

import fs from 'fs';
import path from 'path';

/**
 * Initializes a new VideoForge project in the target directory.
 * Writes a default config schema, a minimal starter config referencing that schema,
 * and an example SVG logo asset.
 *
 * @param targetDir Path to the target directory where the project will be initialized.
 */
export async function initProject(targetDir: string): Promise<void> {
  const resolvedTarget = path.resolve(process.cwd(), targetDir);
  fs.mkdirSync(resolvedTarget, { recursive: true });

  // 1. Write sample logo.svg
  const svgLogoContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="20" fill="#e94560"/>
  <text x="50" y="65" font-family="sans-serif" font-size="45" font-weight="bold" fill="#1a1a2e" text-anchor="middle">VF</text>
</svg>`;
  fs.writeFileSync(path.join(resolvedTarget, 'logo.svg'), svgLogoContent);

  // 2. Write JSON Schema file dynamically
  try {
    const { zodToJsonSchema } = await import('zod-to-json-schema');
    const { VideoForgeConfigSchema } = await import('./schema.js');
    const jsonSchema = zodToJsonSchema(VideoForgeConfigSchema, 'VideoForgeConfig');
    fs.writeFileSync(
      path.join(resolvedTarget, 'videoforge.config.schema.json'),
      JSON.stringify(jsonSchema, null, 2)
    );
  } catch {
    // Fallback: write a basic schema stub if dynamic generation fails
    fs.writeFileSync(
      path.join(resolvedTarget, 'videoforge.config.schema.json'),
      JSON.stringify({ type: 'object' }, null, 2)
    );
  }

  // 3. Write default JSON config file
  const defaultConfig = {
    $schema: './videoforge.config.schema.json',
    meta: {
      title: 'My VideoForge Project',
      resolution: { width: 1280, height: 720 },
      fps: 30,
      outputPath: './output/video.mp4',
    },
    theme: {
      primaryColor: '#1a1a2e',
      secondaryColor: '#e94560',
      fontFamily: 'sans-serif',
      logoPath: './logo.svg',
    },
    scenes: [
      {
        id: 'scene-1',
        template: 'title-card',
        duration: 3,
        data: {
          title: 'Welcome to VideoForge',
          subtitle: 'An open-source motion graphics generator',
        },
      },
    ],
  };

  fs.writeFileSync(
    path.join(resolvedTarget, 'videoforge.config.json'),
    JSON.stringify(defaultConfig, null, 2)
  );
}

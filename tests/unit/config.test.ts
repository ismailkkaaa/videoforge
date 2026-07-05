import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadConfig } from '../../src/core/config/loader.js';
import { ConfigValidationError } from '../../src/core/errors.js';

describe('Config Loader Unit Tests', () => {
  const tmpDir = path.resolve(process.cwd(), 'tmp', 'test-config-loader');

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should load a valid JSON config successfully', () => {
    const filePath = path.join(tmpDir, 'valid.json');
    const validJson = {
      meta: {
        title: 'Valid Project',
      },
      theme: {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        fontFamily: 'Arial',
      },
      scenes: [
        {
          id: 'scene-1',
          template: 'title-card',
          duration: 3,
          data: {},
        },
      ],
    };
    fs.writeFileSync(filePath, JSON.stringify(validJson));

    const config = loadConfig(filePath);
    expect(config.meta.title).toBe('Valid Project');
    expect(config.meta.fps).toBe(30); // Default value
    expect(config.meta.resolution?.width).toBe(1280); // Default value
    expect(config.meta.resolution?.height).toBe(720); // Default value
    expect(config.scenes[0].duration).toBe(3);
  });

  it('should load a valid YAML config successfully', () => {
    const filePath = path.join(tmpDir, 'valid.yaml');
    const yamlContent = `
meta:
  title: Valid YAML Project
theme:
  primaryColor: "#000"
  secondaryColor: "#fff"
  fontFamily: "Arial"
scenes:
  - id: scene-1
    template: title-card
    duration: 5
    data: {}
`;
    fs.writeFileSync(filePath, yamlContent);

    const config = loadConfig(filePath);
    expect(config.meta.title).toBe('Valid YAML Project');
    expect(config.scenes[0].duration).toBe(5);
  });

  it('should reject invalid JSON content', () => {
    const filePath = path.join(tmpDir, 'invalid-syntax.json');
    fs.writeFileSync(filePath, '{ invalid json');

    expect(() => loadConfig(filePath)).toThrow(ConfigValidationError);
    expect(() => loadConfig(filePath)).toThrow('Failed to parse JSON config file');
  });

  it('should reject config with missing required fields', () => {
    const filePath = path.join(tmpDir, 'missing-fields.json');
    const invalidJson = {
      meta: {
        title: 'Missing Title Card and Theme',
      },
      // missing theme
      scenes: [], // empty scenes
    };
    fs.writeFileSync(filePath, JSON.stringify(invalidJson));

    expect(() => loadConfig(filePath)).toThrow(ConfigValidationError);
    expect(() => loadConfig(filePath)).toThrow('At least one scene is required');
  });

  it('should reject config with negative/zero duration', () => {
    const filePath = path.join(tmpDir, 'negative-duration.json');
    const invalidJson = {
      meta: { title: 'Neg Duration' },
      theme: { primaryColor: '#000', secondaryColor: '#fff', fontFamily: 'Arial' },
      scenes: [
        {
          id: 'scene-1',
          template: 'title-card',
          duration: -5,
          data: {},
        },
      ],
    };
    fs.writeFileSync(filePath, JSON.stringify(invalidJson));

    expect(() => loadConfig(filePath)).toThrow(ConfigValidationError);
    expect(() => loadConfig(filePath)).toThrow('Scene duration must be a positive number');
  });

  it('should reject config with unregistered template', () => {
    const filePath = path.join(tmpDir, 'unknown-template.json');
    const invalidJson = {
      meta: { title: 'Unknown Template' },
      theme: { primaryColor: '#000', secondaryColor: '#fff', fontFamily: 'Arial' },
      scenes: [
        {
          id: 'scene-1',
          template: 'non-existent-template',
          duration: 3,
          data: {},
        },
      ],
    };
    fs.writeFileSync(filePath, JSON.stringify(invalidJson));

    expect(() => loadConfig(filePath)).toThrow(ConfigValidationError);
    expect(() => loadConfig(filePath)).toThrow('Unknown template "non-existent-template"');
  });

  it('should fill in defaults correctly for a minimal config', () => {
    const filePath = path.join(tmpDir, 'minimal.json');
    // Minimal config: meta is completely omitted, transitions omitted
    const minimalJson = {
      theme: {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        fontFamily: 'Arial',
      },
      scenes: [
        {
          id: 'scene-1',
          template: 'title-card',
          duration: 3,
        },
      ],
    };
    fs.writeFileSync(filePath, JSON.stringify(minimalJson));

    const config = loadConfig(filePath);
    expect(config.meta).toBeDefined();
    expect(config.meta.title).toBe('VideoForge Project');
    expect(config.meta.resolution.width).toBe(1280);
    expect(config.meta.resolution.height).toBe(720);
    expect(config.meta.fps).toBe(30);
    expect(config.meta.outputPath).toBe('./output/video.mp4');
    expect(config.scenes[0].transition).toEqual({ type: 'cut', duration: 0 });
  });

  it('should parse identical JSON and YAML contents to identical objects', () => {
    const jsonPath = path.join(tmpDir, 'parity.json');
    const yamlPath = path.join(tmpDir, 'parity.yaml');

    const configData = {
      meta: { title: 'Parity' },
      theme: { primaryColor: '#1', secondaryColor: '#2', fontFamily: 'F' },
      scenes: [{ id: 's1', template: 'title-card', duration: 2, data: { a: 1 } }],
    };

    fs.writeFileSync(jsonPath, JSON.stringify(configData));
    fs.writeFileSync(
      yamlPath,
      `
meta:
  title: Parity
theme:
  primaryColor: "#1"
  secondaryColor: "#2"
  fontFamily: "F"
scenes:
  - id: s1
    template: title-card
    duration: 2
    data:
      a: 1
`
    );

    const configJson = loadConfig(jsonPath);
    const configYaml = loadConfig(yamlPath);

    expect(configJson).toEqual(configYaml);
  });

  it('should contain offending field paths in error messages for multiple cases', () => {
    // Helper to assert field path in error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assertErrorPath = (configData: any, expectedPath: string) => {
      const filePath = path.join(tmpDir, 'error-temp.json');
      fs.writeFileSync(filePath, JSON.stringify(configData));
      try {
        loadConfig(filePath);
        expect.fail('Should have thrown an error');
      } catch (err) {
        const error = err as Error;
        expect(error.message).toContain(expectedPath);
      }
    };

    const baseConfig = {
      meta: { title: 'Base' },
      theme: { primaryColor: '#0', secondaryColor: '#1', fontFamily: 'A' },
      scenes: [{ id: 's1', template: 'title-card', duration: 3 }],
    };

    // Case 1: scenes[0].duration (negative number)
    assertErrorPath(
      {
        ...baseConfig,
        scenes: [{ id: 's1', template: 'title-card', duration: -1 }],
      },
      'scenes[0].duration'
    );

    // Case 2: meta.resolution.width (wrong type)
    assertErrorPath(
      {
        ...baseConfig,
        meta: { title: 'Base', resolution: { width: 'invalid-type' } },
      },
      'meta.resolution.width'
    );

    // Case 3: theme.primaryColor (missing/empty)
    assertErrorPath(
      {
        ...baseConfig,
        theme: { primaryColor: '', secondaryColor: '#1', fontFamily: 'A' },
      },
      'theme.primaryColor'
    );

    // Case 4: scenes[0].id (missing/empty)
    assertErrorPath(
      {
        ...baseConfig,
        scenes: [{ id: '', template: 'title-card', duration: 3 }],
      },
      'scenes[0].id'
    );

    // Case 5: scenes[0].transition.duration (negative number)
    assertErrorPath(
      {
        ...baseConfig,
        scenes: [
          {
            id: 's1',
            template: 'title-card',
            duration: 3,
            transition: { type: 'fade', duration: -2 },
          },
        ],
      },
      'scenes[0].transition.duration'
    );
  });
});

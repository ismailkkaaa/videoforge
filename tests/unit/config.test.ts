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
});

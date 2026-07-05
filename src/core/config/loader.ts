import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { z } from 'zod';
import { VideoForgeConfigSchema, type VideoForgeConfig } from './schema.js';
import { ConfigValidationError } from '../errors.js';
import { templateRegistry } from '../templates/registry.js';

/**
 * Format path array to a string representation (e.g. scenes[1].duration)
 */
function formatPath(pathArray: (string | number)[]): string {
  return pathArray.reduce<string>((acc, segment) => {
    if (typeof segment === 'number') {
      return `${acc}[${segment}]`;
    }
    return acc ? `${acc}.${segment}` : String(segment);
  }, '');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValueAtPath(obj: any, pathArray: (string | number)[]): any {
  let current = obj;
  for (const segment of pathArray) {
    if (current === null || current === undefined) return undefined;
    current = current[segment];
  }
  return current;
}

/**
 * Custom formatter for Zod issues to output actionable messages.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatZodIssue(issue: z.ZodIssue, parsed: any): string {
  const pathStr = formatPath(issue.path) || 'root';
  const rawVal = getValueAtPath(parsed, issue.path);
  let valStr = '';

  if (rawVal !== undefined) {
    valStr = typeof rawVal === 'object' ? JSON.stringify(rawVal) : String(rawVal);
  }

  if (issue.code === 'invalid_type') {
    const gotStr = valStr ? `, got ${valStr}` : `, got ${issue.received}`;
    return `${pathStr}: expected ${issue.expected}${gotStr}`;
  }

  const gotStr = valStr !== '' ? `, got ${valStr}` : '';
  return `${pathStr}: ${issue.message}${gotStr}`;
}

/**
 * Loads and validates a VideoForge configuration file from disk.
 * Supports both JSON and YAML formats based on file extension.
 *
 * @param filePath The absolute or relative path to the configuration file.
 * @returns The validated and default-filled VideoForgeConfig object.
 * @throws ConfigValidationError if the file cannot be read or fails validation.
 */
export function loadConfig(filePath: string): VideoForgeConfig {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    const error = err as Error;
    throw new ConfigValidationError(`Failed to read config file at ${filePath}: ${error.message}`);
  }

  let parsed: unknown;
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.yaml' || ext === '.yml') {
      parsed = yaml.parse(content);
    } else {
      parsed = JSON.parse(content);
    }
  } catch (err) {
    const error = err as Error;
    const formatName = ext === '.yaml' || ext === '.yml' ? 'YAML' : 'JSON';
    throw new ConfigValidationError(`Failed to parse ${formatName} config file: ${error.message}`);
  }

  const result = VideoForgeConfigSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => formatZodIssue(issue, parsed));
    throw new ConfigValidationError(`Configuration validation failed:\n- ${issues.join('\n- ')}`);
  }

  const config = result.data;

  // Validate that all referenced templates exist in registry
  const unregistered = config.scenes
    .filter((scene) => !(scene.template in templateRegistry))
    .map(
      (scene) =>
        `scenes[${config.scenes.indexOf(scene)}].template: Unknown template "${scene.template}"`
    );

  if (unregistered.length > 0) {
    throw new ConfigValidationError(
      `Configuration validation failed:\n- ${unregistered.join('\n- ')}`
    );
  }

  return config;
}

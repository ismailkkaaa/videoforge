import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

describe('CLI Integration Tests', () => {
  const tmpDir = path.resolve(process.cwd(), 'tmp', 'test-cli');
  const cliPath = path.resolve(process.cwd(), 'dist', 'cli', 'index.js');

  beforeAll(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync('npm run build', { stdio: 'ignore' });
  });

  afterAll(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should print help on --help', () => {
    const output = execSync(`node ${cliPath} --help`, { encoding: 'utf8' });
    expect(output).toContain('Usage: videoforge');
    expect(output).toContain('Options:');
  });

  it('should initialize a project when running init command', () => {
    const targetDir = path.join(tmpDir, 'new-project');
    execSync(`node ${cliPath} init ${targetDir}`, { encoding: 'utf8' });

    expect(fs.existsSync(path.join(targetDir, 'videoforge.config.json'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'logo.svg'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'videoforge.config.schema.json'))).toBe(true);
  });

  it('should exit with 1 on invalid command arguments', () => {
    expect(() => {
      execSync(`node ${cliPath} invalid-cmd`, { stdio: 'ignore' });
    }).toThrow();
  });
});

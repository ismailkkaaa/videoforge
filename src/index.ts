/**
 * VideoForge: Local-first, AI-assisted motion graphics video generator.
 */

export { loadConfig } from './core/config/loader.js';
export { initProject } from './core/config/scaffold.js';
export { VideoForgeConfigSchema } from './core/config/schema.js';
export type { VideoForgeConfig, Theme, Scene } from './core/config/schema.js';

export { renderProject } from './core/render/pipeline.js';
export type { RenderOptions } from './core/render/pipeline.js';

export { registerTemplate, getTemplate, templateRegistry } from './core/templates/registry.js';
export type { VideoForgeTemplate } from './core/templates/types.js';

export { VideoForgeError, ConfigValidationError, RenderError } from './core/errors.js';

export { AnthropicProvider } from './ai/providers/anthropic.js';
export type { LLMProvider } from './ai/providers/types.js';
export { generateStoryboard } from './ai/storyboard-generator.js';
export { analyzeMarkdown } from './ai/analyzers/markdown.js';
export { analyzeGithubRepo } from './ai/analyzers/github-repo.js';
export { analyzeUrl } from './ai/analyzers/url.js';

export const VERSION = '0.1.0';

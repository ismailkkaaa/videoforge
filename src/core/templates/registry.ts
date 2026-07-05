import { TitleCardTemplate } from '../../templates-builtin/title-card/index.js';
import { FeatureGridTemplate } from '../../templates-builtin/feature-grid/index.js';
import { CodeSnippetTemplate } from '../../templates-builtin/code-snippet/index.js';
import { LogoRevealTemplate } from '../../templates-builtin/logo-reveal/index.js';
import { StatCounterTemplate } from '../../templates-builtin/stat-counter/index.js';
import { QuoteTemplate } from '../../templates-builtin/quote/index.js';
import { OutroTemplate } from '../../templates-builtin/outro/index.js';
import type { VideoForgeTemplate } from './types.js';

/**
 * A registry map from template name -> class constructor implementing VideoForgeTemplate.
 */
export const templateRegistry: Record<string, new () => VideoForgeTemplate> = {
  'title-card': TitleCardTemplate,
  'feature-grid': FeatureGridTemplate,
  'code-snippet': CodeSnippetTemplate,
  'logo-reveal': LogoRevealTemplate,
  'stat-counter': StatCounterTemplate,
  quote: QuoteTemplate,
  outro: OutroTemplate,
};

/**
 * Register a custom template into the registry.
 *
 * @param name The unique name of the template.
 * @param templateClass The template class constructor.
 */
export function registerTemplate(name: string, templateClass: new () => VideoForgeTemplate): void {
  templateRegistry[name] = templateClass;
}

/**
 * Retrieves a template class constructor by name.
 *
 * @param name The template name.
 * @returns The template class constructor, or undefined if not found.
 */
export function getTemplate(name: string): (new () => VideoForgeTemplate) | undefined {
  return templateRegistry[name];
}

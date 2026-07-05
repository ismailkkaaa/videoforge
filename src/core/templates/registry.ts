import { TitleCardTemplate } from '../../templates-builtin/title-card/index.js';
import type { VideoForgeTemplate } from './types.js';

/**
 * A registry map from template name -> class constructor implementing VideoForgeTemplate.
 */
export const templateRegistry: Record<string, new () => VideoForgeTemplate> = {
  'title-card': TitleCardTemplate,
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

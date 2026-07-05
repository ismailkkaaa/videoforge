import { TitleCardTemplate } from '../../src/templates-builtin/title-card/index.js';
import { FeatureGridTemplate } from '../../src/templates-builtin/feature-grid/index.js';
import { CodeSnippetTemplate } from '../../src/templates-builtin/code-snippet/index.js';
import { LogoRevealTemplate } from '../../src/templates-builtin/logo-reveal/index.js';
import { StatCounterTemplate } from '../../src/templates-builtin/stat-counter/index.js';
import { QuoteTemplate } from '../../src/templates-builtin/quote/index.js';
import { OutroTemplate } from '../../src/templates-builtin/outro/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const templates: Record<string, any> = {
  'title-card': TitleCardTemplate,
  'feature-grid': FeatureGridTemplate,
  'code-snippet': CodeSnippetTemplate,
  'logo-reveal': LogoRevealTemplate,
  'stat-counter': StatCounterTemplate,
  quote: QuoteTemplate,
  outro: OutroTemplate,
};

export const templateNames = Object.keys(templates);

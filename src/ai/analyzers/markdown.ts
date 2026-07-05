import type { LLMProvider } from '../providers/types.js';
import { generateStoryboard } from '../storyboard-generator.js';
import { VideoForgeError } from '../../core/errors.js';
import type { Scene } from '../../core/config/schema.js';

export interface AnalyzerResult {
  scenes: Scene[];
}

/**
 * Analyzes markdown/text content using an LLM to extract product facts,
 * then generates a validated storyboard.
 *
 * @param content Raw markdown or plain text content.
 * @param provider LLM provider.
 * @returns A promise resolving to the generated scenes.
 */
export async function analyzeMarkdown(
  content: string,
  provider: LLMProvider
): Promise<AnalyzerResult> {
  const extractPrompt = `
Analyze the following text content and extract key product information.
Output the result ONLY as a JSON object matching this structure:
{
  "title": "A short descriptive name of the product or project",
  "description": "A 1-2 sentence summary of what the product/project does",
  "features": ["Feature highlight 1", "Feature highlight 2", ...] (up to 5 items)
}

Text content to analyze:
${content}
`;

  try {
    const rawResponse = await provider.generate(extractPrompt, {
      systemInstruction:
        'You are an information extraction assistant. You output only raw, valid JSON objects. Do not add markdown fences.',
    });

    let cleaned = rawResponse.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '');
      cleaned = cleaned.replace(/\n?```$/, '');
    }

    const facts = JSON.parse(cleaned.trim());

    if (!facts.title || !facts.description || !Array.isArray(facts.features)) {
      throw new VideoForgeError('Extracted facts from markdown are incomplete or invalid.');
    }

    const scenes = await generateStoryboard(facts, provider);
    return { scenes };
  } catch (err) {
    const error = err as Error;
    if (error instanceof VideoForgeError) throw error;
    throw new VideoForgeError(`Markdown analysis failed: ${error.message}`);
  }
}

import { z } from 'zod';
import { SceneSchema } from '../core/config/schema.js';
import type { LLMProvider } from './providers/types.js';
import { VideoForgeError } from '../core/errors.js';

const ScenesListSchema = z.array(SceneSchema);

/**
 * Removes potential markdown code blocks (e.g. ```json ... ```) wrapping the LLM response.
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '');
    cleaned = cleaned.replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

/**
 * Generates a prompt containing templates specification and extracted product facts.
 */
function constructPrompt(facts: {
  title: string;
  description: string;
  features: string[];
  colors?: { primary: string; secondary: string };
}): string {
  const templatesDesc = `
Available templates and their expected 'data' parameters:
1. title-card:
   data: { title: string, subtitle?: string }
2. feature-grid:
   data: { title: string, features: Array<{ title: string, description: string }> }
3. code-snippet:
   data: { title?: string, code: string, language: string }
4. logo-reveal:
   data: { title: string, subtitle?: string }
5. stat-counter:
   data: { number: number, suffix?: string, title: string, subtitle?: string }
6. quote:
   data: { quote: string, author: string, title?: string }
7. outro:
   data: { tagline: string, link: string }
`;

  return `
Create an animated storyboard (a JSON array of scenes) for a promo video based on the product description below.

Product Facts:
- Title: ${facts.title}
- Description: ${facts.description}
- Features:
${facts.features.map((f) => `  - ${f}`).join('\n')}

${templatesDesc}

Guidelines:
- Output a JSON array of scenes conforming to this schema structure for each scene:
  {
    "id": "unique-id",
    "template": "template-name",
    "duration": number_seconds,
    "data": { ...template_specific_data },
    "transition": { "type": "fade" | "cut", "duration": number } (optional)
  }
- Create a logical sequence of 3 to 5 scenes to tell a short story or promo for this product.
- Output ONLY the raw JSON array. Do not wrap in markdown tags or include any commentary.
`;
}

/**
 * Generates a list of storyboard scenes from product facts using an LLM.
 * Implements a validate-and-repair loop to handle schema validation failures.
 *
 * @param facts Extracted product facts.
 * @param provider Swappable LLM provider.
 * @returns A promise resolving to a validated list of scene configurations.
 */
export async function generateStoryboard(
  facts: {
    title: string;
    description: string;
    features: string[];
    colors?: { primary: string; secondary: string };
  },
  provider: LLMProvider
): Promise<z.infer<typeof ScenesListSchema>> {
  const prompt = constructPrompt(facts);
  const systemInstruction =
    'You are a professional storyboard director. You output only raw, valid JSON arrays conforming to the requested schema. Do not add markdown fences or other text.';

  let rawResponse: string;
  try {
    rawResponse = await provider.generate(prompt, { systemInstruction });
  } catch (err) {
    const error = err as Error;
    throw new VideoForgeError(`LLM generation request failed: ${error.message}`);
  }

  const cleanedResponse = cleanJsonResponse(rawResponse);
  let parsed: unknown;
  let validationErrors = '';
  let parseOrValidationFailed = false;

  try {
    parsed = JSON.parse(cleanedResponse);
    const result = ScenesListSchema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }
    parseOrValidationFailed = true;
    validationErrors = result.error.errors
      .map((e) => `- ${e.path.join('.') || 'root'}: ${e.message}`)
      .join('\n');
  } catch (err) {
    parseOrValidationFailed = true;
    validationErrors = `JSON parsing failed: ${(err as Error).message}`;
  }

  if (parseOrValidationFailed) {
    const repairPrompt = `
The previous JSON storyboard you generated failed schema validation or parsing with these errors:
${validationErrors}

Here is your previous output:
${cleanedResponse}

Please output the corrected JSON array conforming to the schema. Output ONLY valid raw JSON with no other text or explanation.
`;

    let repairResponse: string;
    try {
      repairResponse = await provider.generate(repairPrompt, { systemInstruction });
    } catch (err) {
      const error = err as Error;
      throw new VideoForgeError(`LLM generation repair request failed: ${error.message}`);
    }

    const cleanedRepair = cleanJsonResponse(repairResponse);
    try {
      const parsedRepair = JSON.parse(cleanedRepair);
      const resultRepair = ScenesListSchema.safeParse(parsedRepair);
      if (resultRepair.success) {
        return resultRepair.data;
      }
      const finalErrors = resultRepair.error.errors
        .map((e) => `${e.path.join('.') || 'root'}: ${e.message}`)
        .join('\n');
      throw new VideoForgeError(
        `Storyboard generation failed validation twice. Errors:\n${finalErrors}`
      );
    } catch (err) {
      if (err instanceof VideoForgeError) {
        throw err;
      }
      const error = err as Error;
      throw new VideoForgeError(
        `Failed to parse or repair LLM storyboard output: ${error.message}. Raw output: ${repairResponse}`
      );
    }
  }

  return parsed as z.infer<typeof ScenesListSchema>;
}

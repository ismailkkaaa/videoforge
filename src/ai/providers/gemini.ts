import { GoogleGenAI } from '@google/genai';
import type { LLMProvider } from './types.js';
import { VideoForgeError } from '../../core/errors.js';

/**
 * Google Gemini model provider implementation of LLMProvider.
 */
export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI | null = null;
  private model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new VideoForgeError(
        'Missing GEMINI_API_KEY environment variable. Please set it in your environment or in a .env file.'
      );
    }
    this.client = new GoogleGenAI({ apiKey });
    this.model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  async generate(prompt: string, options?: { systemInstruction?: string }): Promise<string> {
    if (!this.client) {
      throw new VideoForgeError('Gemini provider client is not initialized.');
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: options?.systemInstruction,
        },
      });

      if (response && response.text) {
        return response.text;
      }
      throw new VideoForgeError('No text response returned from Gemini.');
    } catch (err) {
      const error = err as Error;
      throw new VideoForgeError(`Gemini API call failed: ${error.message}`);
    }
  }
}

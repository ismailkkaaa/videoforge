import Anthropic from '@anthropic-ai/sdk';
import type { LLMProvider } from './types.js';
import { VideoForgeError } from '../../core/errors.js';

/**
 * Anthropic Claude model provider implementation of LLMProvider.
 */
export class AnthropicProvider implements LLMProvider {
  private client: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new VideoForgeError(
        'Missing ANTHROPIC_API_KEY environment variable. Please set it in your environment or in a .env file.'
      );
    }
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, options?: { systemInstruction?: string }): Promise<string> {
    if (!this.client) {
      throw new VideoForgeError('Anthropic provider client is not initialized.');
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4000,
        system: options?.systemInstruction,
        messages: [{ role: 'user', content: prompt }],
      });

      const contentBlock = response.content[0];
      if (contentBlock && contentBlock.type === 'text') {
        return contentBlock.text;
      }
      throw new VideoForgeError('No text block found in Anthropic response content.');
    } catch (err) {
      const error = err as Error;
      throw new VideoForgeError(`Anthropic API call failed: ${error.message}`);
    }
  }
}

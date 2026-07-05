/**
 * Interface representing a swappable LLM provider.
 */
export interface LLMProvider {
  /**
   * Generates a text response from the LLM given a prompt.
   *
   * @param prompt The user prompt.
   * @param options Swappable options (e.g. system instructions).
   * @returns A promise resolving to the string output of the LLM.
   */
  generate(prompt: string, options?: { systemInstruction?: string }): Promise<string>;
}

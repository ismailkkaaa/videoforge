import { analyzeMarkdown } from './markdown.js';
import type { LLMProvider } from '../providers/types.js';
import { VideoForgeError } from '../../core/errors.js';
import type { AnalyzerResult } from './markdown.js';

/**
 * Parses title, meta description, and OpenGraph tags from HTML source code.
 */
function extractMetadata(html: string): {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
} {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const getMetaContent = (nameOrProperty: string): string => {
    // Match standard: <meta name="X" content="Y">
    const regex = new RegExp(
      `<meta[^>]*(?:name|property)=["']${nameOrProperty}["'][^>]*content=["']([^"']*)["']`,
      'i'
    );
    const match = html.match(regex);
    if (match) return match[1].trim();

    // Match reversed: <meta content="Y" name="X">
    const reverseRegex = new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${nameOrProperty}["']`,
      'i'
    );
    const reverseMatch = html.match(reverseRegex);
    return reverseMatch ? reverseMatch[1].trim() : '';
  };

  const description = getMetaContent('description');
  const ogTitle = getMetaContent('og:title');
  const ogDescription = getMetaContent('og:description');

  return { title, description, ogTitle, ogDescription };
}

/**
 * Fetches a URL, extracts metadata (title, meta description, OpenGraph tags),
 * and delegates to the markdown analyzer.
 *
 * @param url The page URL to fetch.
 * @param provider LLM provider.
 * @returns A promise resolving to the generated scenes.
 */
export async function analyzeUrl(url: string, provider: LLMProvider): Promise<AnalyzerResult> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VideoForge-Analyzer/1.0',
      },
    });

    if (!response.ok) {
      throw new VideoForgeError(
        `Failed to fetch URL ${url}: ${response.statusText} (Status: ${response.status})`
      );
    }

    const html = await response.text();
    const meta = extractMetadata(html);

    const contentToAnalyze = `
Web URL: ${url}
Page Title: ${meta.title}
OpenGraph Title: ${meta.ogTitle || 'N/A'}
Meta Description: ${meta.description || 'N/A'}
OpenGraph Description: ${meta.ogDescription || 'N/A'}
`;

    return analyzeMarkdown(contentToAnalyze, provider);
  } catch (err) {
    const error = err as Error;
    if (error instanceof VideoForgeError) throw error;
    throw new VideoForgeError(`URL analysis failed: ${error.message}`);
  }
}

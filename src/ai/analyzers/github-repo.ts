import fs from 'fs';
import path from 'path';
import { analyzeMarkdown } from './markdown.js';
import type { LLMProvider } from '../providers/types.js';
import { VideoForgeError } from '../../core/errors.js';
import type { AnalyzerResult } from './markdown.js';

/**
 * Analyzes a GitHub repository (local path or remote URL).
 * Reads the README.md and package.json files, prepends metadata,
 * and passes the content to the markdown analyzer.
 *
 * @param repoPathOrUrl Local directory path or GitHub URL.
 * @param provider LLM provider.
 * @returns A promise resolving to the generated scenes.
 */
export async function analyzeGithubRepo(
  repoPathOrUrl: string,
  provider: LLMProvider
): Promise<AnalyzerResult> {
  let readmeContent = '';
  let packageJsonContent = '';

  const isUrl = repoPathOrUrl.startsWith('http://') || repoPathOrUrl.startsWith('https://');

  if (isUrl) {
    const match = repoPathOrUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      throw new VideoForgeError(`Invalid GitHub URL: ${repoPathOrUrl}`);
    }
    const owner = match[1];
    let repo = match[2];
    if (repo.endsWith('.git')) {
      repo = repo.substring(0, repo.length - 4);
    }

    // Attempt fetching from raw.githubusercontent.com on main then master branch
    const fetchRepoFile = async (fileName: string): Promise<string> => {
      for (const branch of ['main', 'master']) {
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fileName}`;
        try {
          const response = await fetch(url);
          if (response.ok) {
            return await response.text();
          }
        } catch {
          // Ignore and check next branch
        }
      }
      return '';
    };

    readmeContent = await fetchRepoFile('README.md');
    packageJsonContent = await fetchRepoFile('package.json');

    if (!readmeContent) {
      throw new VideoForgeError(
        `Could not fetch README.md from GitHub repository: ${repoPathOrUrl}`
      );
    }
  } else {
    const resolvedPath = path.resolve(process.cwd(), repoPathOrUrl);
    if (!fs.existsSync(resolvedPath)) {
      throw new VideoForgeError(`Local repository directory does not exist: ${resolvedPath}`);
    }

    const readmePath = path.join(resolvedPath, 'README.md');
    const packageJsonPath = path.join(resolvedPath, 'package.json');

    if (fs.existsSync(readmePath)) {
      readmeContent = fs.readFileSync(readmePath, 'utf8');
    } else {
      const readmeLowerPath = path.join(resolvedPath, 'readme.md');
      if (fs.existsSync(readmeLowerPath)) {
        readmeContent = fs.readFileSync(readmeLowerPath, 'utf8');
      } else {
        throw new VideoForgeError(`Could not find README.md in local repository: ${resolvedPath}`);
      }
    }

    if (fs.existsSync(packageJsonPath)) {
      packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    }
  }

  let contentToAnalyze = readmeContent;
  if (packageJsonContent) {
    try {
      const parsed = JSON.parse(packageJsonContent);
      const name = parsed.name || '';
      const desc = parsed.description || '';
      contentToAnalyze = `Product Name: ${name}\nDescription: ${desc}\n\n${readmeContent}`;
    } catch {
      // Ignore JSON parse error and fallback to readme content
    }
  }

  return analyzeMarkdown(contentToAnalyze, provider);
}

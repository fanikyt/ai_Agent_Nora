import { WorkspaceFile } from '../types';

export interface RelevantFileExcerpt {
  path: string;
  name: string;
  content: string;
  relevanceScore: number;
}

/**
 * Searches in-memory workspace files for the most relevant files based on user prompt,
 * file paths, and project structure (like BlazeClient, Client, main classes, gradle, etc.)
 */
export function findRelevantWorkspaceFiles(
  prompt: string,
  files: Map<string, WorkspaceFile>,
  activeFilePath: string | null,
  maxFiles = 10,
  maxContentLength = 8000
): RelevantFileExcerpt[] {
  if (files.size === 0) return [];

  // Extract keywords from prompt (ignore short stopwords)
  const stopWords = new Set([
    'что', 'как', 'где', 'когда', 'почему', 'сделай', 'напиши', 'добавь', 'исправь',
    'пожалуйста', 'проект', 'файл', 'файлы', 'папка', 'папку', 'клиент', 'клиенте',
    'this', 'that', 'with', 'from', 'have', 'make', 'create', 'code', 'file', 'folder'
  ]);

  const rawTokens = prompt
    .toLowerCase()
    .replace(/[^\w\u0400-\u04FF\.\-\/]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !stopWords.has(t));

  // Also extract CamelCase and path-like tokens from original prompt
  const camelTokens = prompt.match(/[A-Z][a-z0-9]+|[a-z0-9]+/g) || [];
  const allTokens = Array.from(new Set([...rawTokens, ...camelTokens.map((t) => t.toLowerCase())]));

  const scoredFiles: RelevantFileExcerpt[] = [];

  for (const [path, file] of files.entries()) {
    let score = 0;
    const lowerPath = path.toLowerCase();
    const lowerName = file.name.toLowerCase();

    // Active file bonus
    if (activeFilePath && path === activeFilePath) {
      score += 150;
    }

    // Key project entry files bonus
    if (
      lowerName === 'build.gradle' ||
      lowerName === 'pom.xml' ||
      lowerName === 'package.json' ||
      lowerName.includes('client') ||
      lowerName.includes('main')
    ) {
      score += 30;
    }

    // Match tokens in path/filename
    for (const token of allTokens) {
      if (lowerName.includes(token)) {
        score += 80;
      } else if (lowerPath.includes(token)) {
        score += 40;
      }
    }

    // Match tokens in file content (sample first 20KB for speed)
    if (score > 0 || allTokens.length > 0) {
      const sample = file.content.slice(0, 20000).toLowerCase();
      let contentMatches = 0;
      for (const token of allTokens) {
        if (sample.includes(token)) {
          contentMatches++;
          score += 25;
        }
      }
      if (contentMatches > 2) {
        score += 50;
      }
    }

    if (score > 0) {
      scoredFiles.push({
        path: file.path,
        name: file.name,
        content: file.content.slice(0, maxContentLength),
        relevanceScore: score,
      });
    }
  }

  // Sort descending by relevance score
  scoredFiles.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // If no files scored (e.g. generic prompt), pick main project files or active file
  if (scoredFiles.length === 0) {
    const defaultFiles: RelevantFileExcerpt[] = [];
    if (activeFilePath && files.has(activeFilePath)) {
      const f = files.get(activeFilePath)!;
      defaultFiles.push({
        path: f.path,
        name: f.name,
        content: f.content.slice(0, maxContentLength),
        relevanceScore: 100,
      });
    }

    for (const [path, file] of files.entries()) {
      if (defaultFiles.length >= maxFiles) break;
      const lower = file.name.toLowerCase();
      if (
        lower.endsWith('.java') ||
        lower.endsWith('.ts') ||
        lower.endsWith('.js') ||
        lower.endsWith('.py') ||
        lower === 'build.gradle'
      ) {
        if (!defaultFiles.some((df) => df.path === path)) {
          defaultFiles.push({
            path: file.path,
            name: file.name,
            content: file.content.slice(0, maxContentLength),
            relevanceScore: 50,
          });
        }
      }
    }
    return defaultFiles;
  }

  return scoredFiles.slice(0, maxFiles);
}

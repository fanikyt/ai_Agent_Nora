import JSZip from 'jszip';
import { WorkspaceFile, AttachedImage } from '../types';

export interface ProcessedUploadResult {
  images: AttachedImage[];
  newWorkspaceFiles: Map<string, WorkspaceFile>;
  summaryMessage: string;
}

const TEXT_FILE_EXTENSIONS = new Set([
  'java', 'py', 'scs', 'txt', 'md', 'json', 'ts', 'tsx', 'js', 'jsx',
  'html', 'css', 'scss', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs',
  'kt', 'kts', 'gradle', 'properties', 'xml', 'yml', 'yaml', 'sh', 'bat',
  'sql', 'env', 'gitignore', 'toml', 'cfg', 'ini', 'lua'
]);

export function isTextFileName(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? TEXT_FILE_EXTENSIONS.has(ext) : false;
}

export async function processUploadedFile(file: File): Promise<{
  image?: AttachedImage;
  files?: Array<{ path: string; content: string; size: number }>;
  notice: string;
}> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  // 1. Image
  if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|bmp)$/i.test(fileName)) {
    const dataUrl = await readFileAsDataUrl(file);
    const image: AttachedImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: fileName,
      mimeType: file.type || 'image/png',
      data: dataUrl,
      size: file.size,
    };
    return {
      image,
      notice: `Изображение прикреплено: ${fileName}`,
    };
  }

  // 2. ZIP Archive: unpack recursively with JSZip
  if (lowerName.endsWith('.zip')) {
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);
      const extracted: Array<{ path: string; content: string; size: number }> = [];

      for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
        if (zipEntry.dir) continue;
        if (relativePath.includes('__MACOSX/') || relativePath.endsWith('.DS_Store')) continue;

        // If file is text or code
        if (isTextFileName(relativePath) || zipEntry.name.includes('.')) {
          try {
            const content = await zipEntry.async('string');
            extracted.push({
              path: relativePath.replace(/\\/g, '/'),
              content,
              size: content.length,
            });
          } catch {
            // Binary or unreadable file in zip, skip text extraction
          }
        }
      }

      return {
        files: extracted,
        notice: `Распакован архив ${fileName}: извлечено ${extracted.length} файлов проекта`,
      };
    } catch (err: any) {
      return {
        notice: `Ошибка чтения архива ${fileName}: ${err.message}`,
      };
    }
  }

  // 3. RAR / 7Z archive fallback
  if (lowerName.endsWith('.rar') || lowerName.endsWith('.7z')) {
    return {
      notice: `Файл архива ${fileName} загружен. Для полного авто-извлечения рекомендуется формат .zip`,
    };
  }

  // 4. Code or Text File (.py, .java, .scs, .ts, etc.)
  try {
    const content = await file.text();
    return {
      files: [{
        path: fileName.replace(/\\/g, '/'),
        content,
        size: file.size,
      }],
      notice: `Файл ${fileName} добавлен в проект`,
    };
  } catch (err: any) {
    return {
      notice: `Не удалось прочитать файл ${fileName}: ${err.message}`,
    };
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

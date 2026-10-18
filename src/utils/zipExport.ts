import JSZip from 'jszip';
import { WorkspaceFile } from '../types';

export async function exportWorkspaceToZip(
  folderName: string,
  files: Map<string, WorkspaceFile>
): Promise<void> {
  const zip = new JSZip();

  for (const [path, file] of files.entries()) {
    zip.file(path, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  const cleanName = folderName.replace(/[^a-zA-Z0-9_\-\u0400-\u04FF]/g, '_') || 'project';
  a.download = `${cleanName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

export function downloadSingleFile(file: WorkspaceFile): void {
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

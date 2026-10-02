import fs from 'fs';
import path from 'path';

export interface StoredDocument {
  id: string;
  name: string;
  sizeBytes: number;
  extension: string;
  category: 'image' | 'pdf' | 'text' | 'spreadsheet' | 'document' | 'other';
  mimeType: string;
  updatedAt: string;
  downloadUrl: string;
  rawUrl: string;
}

const DEFAULT_STORAGE = path.join(process.cwd(), 'storage', 'documents');
const STORAGE_ROOT = process.env.FESTOS_STORAGE_PATH || DEFAULT_STORAGE;

export function getCommitteeStorageDir(committeeSlug: string): string {
  // Sanitize slug to prevent path traversal
  const cleanSlug = committeeSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const dir = path.join(STORAGE_ROOT, cleanSlug);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'EACCES') {
      const fallbackDir = path.join('/tmp', 'festos-storage', 'documents', cleanSlug);
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      return fallbackDir;
    }
    throw err;
  }
}

export function getFileCategory(ext: string): 'image' | 'pdf' | 'text' | 'spreadsheet' | 'document' | 'other' {
  const cleanExt = ext.toLowerCase().replace('.', '');
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(cleanExt)) return 'image';
  if (['pdf'].includes(cleanExt)) return 'pdf';
  if (['txt', 'json', 'md', 'log', 'yaml', 'yml'].includes(cleanExt)) return 'text';
  if (['csv', 'xlsx', 'xls', 'tsv'].includes(cleanExt)) return 'spreadsheet';
  if (['doc', 'docx', 'odt', 'rtf'].includes(cleanExt)) return 'document';
  return 'other';
}

export function getMimeType(ext: string): string {
  const cleanExt = ext.toLowerCase().replace('.', '');
  switch (cleanExt) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    case 'pdf': return 'application/pdf';
    case 'txt': return 'text/plain';
    case 'csv': return 'text/csv';
    case 'json': return 'application/json';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default: return 'application/octet-stream';
  }
}

export function listCommitteeDocuments(committeeSlug: string): StoredDocument[] {
  const dir = getCommitteeStorageDir(committeeSlug);
  try {
    const files = fs.readdirSync(dir);
    const docs: StoredDocument[] = [];

    for (const file of files) {
      if (file.startsWith('.')) continue; // ignore hidden files
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) continue;

        const ext = path.extname(file);
        docs.push({
          id: `${committeeSlug}_${file}`,
          name: file,
          sizeBytes: stat.size,
          extension: ext,
          category: getFileCategory(ext),
          mimeType: getMimeType(ext),
          updatedAt: stat.mtime.toISOString(),
          downloadUrl: `/api/documents/raw?committee=${encodeURIComponent(committeeSlug)}&file=${encodeURIComponent(file)}&download=true`,
          rawUrl: `/api/documents/raw?committee=${encodeURIComponent(committeeSlug)}&file=${encodeURIComponent(file)}`,
        });
      } catch {
        // Skip unreadable files
      }
    }

    return docs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

export async function saveCommitteeDocument(
  committeeSlug: string,
  fileName: string,
  buffer: Buffer
): Promise<StoredDocument> {
  const dir = getCommitteeStorageDir(committeeSlug);
  // Sanitize filename
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetPath = path.join(dir, cleanFileName);

  fs.writeFileSync(targetPath, buffer);
  const stat = fs.statSync(targetPath);
  const ext = path.extname(cleanFileName);

  return {
    id: `${committeeSlug}_${cleanFileName}`,
    name: cleanFileName,
    sizeBytes: stat.size,
    extension: ext,
    category: getFileCategory(ext),
    mimeType: getMimeType(ext),
    updatedAt: stat.mtime.toISOString(),
    downloadUrl: `/api/documents/raw?committee=${encodeURIComponent(committeeSlug)}&file=${encodeURIComponent(cleanFileName)}&download=true`,
    rawUrl: `/api/documents/raw?committee=${encodeURIComponent(committeeSlug)}&file=${encodeURIComponent(cleanFileName)}`,
  };
}

export function deleteCommitteeDocument(committeeSlug: string, fileName: string): boolean {
  const dir = getCommitteeStorageDir(committeeSlug);
  const cleanFileName = path.basename(fileName);
  const targetPath = path.join(dir, cleanFileName);

  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    return true;
  }
  return false;
}

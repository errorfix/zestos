import fs from 'fs';
import path from 'path';

export interface StoredFolder {
  name: string;
  path: string; // Relative path within committee storage (e.g. 'Rosters' or 'Contracts/2026')
  fileCount: number;
  updatedAt: string;
}

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
  folder?: string;
}

export interface CommitteeDirectoryContent {
  folders: StoredFolder[];
  documents: StoredDocument[];
  currentFolder: string;
  breadcrumbs: Array<{ name: string; path: string }>;
}

const DEFAULT_STORAGE = path.join(process.cwd(), 'storage', 'documents');
const STORAGE_ROOT = process.env.FESTOS_STORAGE_PATH || DEFAULT_STORAGE;

export function sanitizeSubfolder(subfolder?: string | null): string {
  if (!subfolder) return '';
  // Normalize and remove directory traversal attempts
  const parts = subfolder
    .replace(/\\/g, '/')
    .split('/')
    .map((p) => p.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '_'))
    .filter((p) => p && p !== '..' && p !== '.');
  return parts.join('/');
}

export function getCommitteeStorageDir(committeeSlug: string, subfolder?: string): string {
  // Sanitize slug to prevent path traversal
  const cleanSlug = committeeSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const safeSubfolder = sanitizeSubfolder(subfolder);
  const baseDir = path.join(STORAGE_ROOT, cleanSlug);
  const targetDir = safeSubfolder ? path.join(baseDir, safeSubfolder) : baseDir;

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
  } catch (err: unknown) {
    const error = err as { code?: string };
    if (error.code === 'EACCES') {
      const fallbackDir = safeSubfolder
        ? path.join('/tmp', 'festos-storage', 'documents', cleanSlug, safeSubfolder)
        : path.join('/tmp', 'festos-storage', 'documents', cleanSlug);
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

export function listCommitteeDirectory(committeeSlug: string, subfolder?: string): CommitteeDirectoryContent {
  const safeSub = sanitizeSubfolder(subfolder);
  const dir = getCommitteeStorageDir(committeeSlug, safeSub);

  // Build breadcrumbs
  const breadcrumbs: Array<{ name: string; path: string }> = [{ name: 'All Files (Root)', path: '' }];
  if (safeSub) {
    const parts = safeSub.split('/');
    let accum = '';
    for (const part of parts) {
      accum = accum ? `${accum}/${part}` : part;
      breadcrumbs.push({ name: part, path: accum });
    }
  }

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const folders: StoredFolder[] = [];
    const documents: StoredDocument[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue; // ignore hidden

      const fullPath = path.join(dir, entry.name);
      try {
        const stat = fs.statSync(fullPath);

        if (entry.isDirectory()) {
          const folderRelativePath = safeSub ? `${safeSub}/${entry.name}` : entry.name;
          let fileCount = 0;
          try {
            fileCount = fs.readdirSync(fullPath).filter((f) => !f.startsWith('.')).length;
          } catch {
            fileCount = 0;
          }

          folders.push({
            name: entry.name,
            path: folderRelativePath,
            fileCount,
            updatedAt: stat.mtime.toISOString(),
          });
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          const downloadParam = safeSub ? `&folder=${encodeURIComponent(safeSub)}` : '';

          documents.push({
            id: `${committeeSlug}_${safeSub ? safeSub + '_' : ''}${entry.name}`,
            name: entry.name,
            sizeBytes: stat.size,
            extension: ext,
            category: getFileCategory(ext),
            mimeType: getMimeType(ext),
            updatedAt: stat.mtime.toISOString(),
            folder: safeSub || undefined,
            downloadUrl: `/api/documents/raw?committee=${encodeURIComponent(committeeSlug)}&file=${encodeURIComponent(entry.name)}${downloadParam}&download=true`,
            rawUrl: `/api/documents/raw?committee=${encodeURIComponent(committeeSlug)}&file=${encodeURIComponent(entry.name)}${downloadParam}`,
          });
        }
      } catch {
        // Skip unreadable files
      }
    }

    folders.sort((a, b) => a.name.localeCompare(b.name));
    documents.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return {
      folders,
      documents,
      currentFolder: safeSub,
      breadcrumbs,
    };
  } catch {
    return {
      folders: [],
      documents: [],
      currentFolder: safeSub,
      breadcrumbs,
    };
  }
}

export function listCommitteeDocuments(committeeSlug: string, subfolder?: string): StoredDocument[] {
  return listCommitteeDirectory(committeeSlug, subfolder).documents;
}

export function createCommitteeFolder(
  committeeSlug: string,
  folderName: string,
  parentFolder?: string
): StoredFolder {
  const safeParent = sanitizeSubfolder(parentFolder);
  const cleanFolderName = folderName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '_');
  if (!cleanFolderName) {
    throw new Error('Invalid folder name');
  }

  const newFolderPath = safeParent ? `${safeParent}/${cleanFolderName}` : cleanFolderName;
  const targetDir = getCommitteeStorageDir(committeeSlug, newFolderPath);
  const stat = fs.statSync(targetDir);

  return {
    name: cleanFolderName,
    path: newFolderPath,
    fileCount: 0,
    updatedAt: stat.mtime.toISOString(),
  };
}

export function deleteCommitteeFolder(committeeSlug: string, folderPath: string): boolean {
  const safePath = sanitizeSubfolder(folderPath);
  if (!safePath) {
    throw new Error('Cannot delete root storage directory');
  }

  const baseDir = getCommitteeStorageDir(committeeSlug);
  const targetDir = path.join(baseDir, safePath);

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    return true;
  }
  return false;
}

export function moveCommitteeDocument(
  committeeSlug: string,
  fileName: string,
  sourceFolder?: string,
  targetFolder?: string
): boolean {
  const safeSource = sanitizeSubfolder(sourceFolder);
  const safeTarget = sanitizeSubfolder(targetFolder);
  const cleanFileName = path.basename(fileName);

  const sourceDir = getCommitteeStorageDir(committeeSlug, safeSource);
  const targetDir = getCommitteeStorageDir(committeeSlug, safeTarget);

  const sourcePath = path.join(sourceDir, cleanFileName);
  const targetPath = path.join(targetDir, cleanFileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file ${cleanFileName} does not exist`);
  }

  if (fs.existsSync(targetPath)) {
    throw new Error(`A file named "${cleanFileName}" already exists in the target folder`);
  }

  fs.renameSync(sourcePath, targetPath);
  return true;
}

export async function saveCommitteeDocument(
  committeeSlug: string,
  fileName: string,
  buffer: Buffer,
  subfolder?: string
): Promise<StoredDocument> {
  const safeSub = sanitizeSubfolder(subfolder);
  const dir = getCommitteeStorageDir(committeeSlug, safeSub);
  // Sanitize filename
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetPath = path.join(dir, cleanFileName);

  fs.writeFileSync(targetPath, buffer);
  const stat = fs.statSync(targetPath);
  const ext = path.extname(cleanFileName);
  const downloadParam = safeSub ? `&folder=${encodeURIComponent(safeSub)}` : '';

  return {
    id: `${committeeSlug}_${safeSub ? safeSub + '_' : ''}${cleanFileName}`,
    name: cleanFileName,
    sizeBytes: stat.size,
    extension: ext,
    category: getFileCategory(ext),
    mimeType: getMimeType(ext),
    updatedAt: stat.mtime.toISOString(),
    folder: safeSub || undefined,
    downloadUrl: `/api/documents/raw?committee=${encodeURIComponent(committeeSlug)}&file=${encodeURIComponent(cleanFileName)}${downloadParam}&download=true`,
    rawUrl: `/api/documents/raw?committee=${encodeURIComponent(committeeSlug)}&file=${encodeURIComponent(cleanFileName)}${downloadParam}`,
  };
}

export function deleteCommitteeDocument(committeeSlug: string, fileName: string, subfolder?: string): boolean {
  const safeSub = sanitizeSubfolder(subfolder);
  const dir = getCommitteeStorageDir(committeeSlug, safeSub);
  const cleanFileName = path.basename(fileName);
  const targetPath = path.join(dir, cleanFileName);

  if (fs.existsSync(targetPath)) {
    fs.unlinkSync(targetPath);
    return true;
  }
  return false;
}

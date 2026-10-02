'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  FileImage,
  File,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Folder,
  FolderPlus,
  ArrowRightLeft,
  ChevronRight,
  ArrowLeft,
  Lock,
} from 'lucide-react';

interface StoredFolder {
  name: string;
  path: string;
  fileCount: number;
  updatedAt: string;
}

interface StoredDocument {
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

interface DocumentStorageProps {
  committeeSlug?: string;
  committeeName?: string;
}

export default function DocumentStorage({ committeeSlug, committeeName }: DocumentStorageProps) {
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [folders, setFolders] = useState<StoredFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ name: string; path: string }>>([
    { name: 'All Files (Root)', path: '' },
  ]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<StoredDocument | null>(null);

  // Folder creation modal state
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // File move modal state
  const [moveTargetDoc, setMoveTargetDoc] = useState<StoredDocument | null>(null);
  const [selectedTargetFolder, setSelectedTargetFolder] = useState<string>('');
  const [movingFile, setMovingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async (targetFolder = currentFolder) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (committeeSlug) params.append('committee', committeeSlug);
      if (targetFolder) params.append('folder', targetFolder);

      const url = `/api/documents?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDocs(data.documents || []);
        setFolders(data.folders || []);
        setCurrentFolder(data.currentFolder || '');
        setBreadcrumbs(data.breadcrumbs || [{ name: 'All Files (Root)', path: '' }]);
      }
    } catch (err) {
      console.error('Error fetching docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs(currentFolder);
  }, [committeeSlug, currentFolder]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFileUpload = async (file: File, replaceFileName?: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (committeeSlug) formData.append('committee', committeeSlug);
      if (currentFolder) formData.append('folder', currentFolder);
      if (replaceFileName) formData.append('replaceFileName', replaceFileName);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload document');
      }

      showToast(replaceFileName ? `✓ Successfully replaced ${replaceFileName}` : `✓ Stored ${file.name}`);
      fetchDocs(currentFolder);
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (replaceInputRef.current) replaceInputRef.current.value = '';
      setReplaceTarget(null);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreatingFolder(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_FOLDER',
          committee: committeeSlug,
          folderName: newFolderName.trim(),
          parentFolder: currentFolder,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create folder');
      }

      showToast(`✓ Created folder "${newFolderName.trim()}"`);
      setNewFolderName('');
      setIsNewFolderOpen(false);
      fetchDocs(currentFolder);
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderPath: string, folderName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the folder "${folderName}" and all files inside it?`)) return;

    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_FOLDER',
          committee: committeeSlug,
          folderPath,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete folder');
      }

      showToast(`✓ Folder "${folderName}" deleted.`);
      fetchDocs(currentFolder);
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    }
  };

  const handleMoveFile = async () => {
    if (!moveTargetDoc) return;

    setMovingFile(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MOVE_FILE',
          committee: committeeSlug,
          fileName: moveTargetDoc.name,
          sourceFolder: currentFolder,
          targetFolder: selectedTargetFolder,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to move file');
      }

      showToast(`✓ Moved "${moveTargetDoc.name}"`);
      setMoveTargetDoc(null);
      fetchDocs(currentFolder);
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    } finally {
      setMovingFile(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${fileName}"?`)) return;

    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          folder: currentFolder,
          committee: committeeSlug,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete file');
      }

      showToast(`✓ Deleted ${fileName}`);
      fetchDocs(currentFolder);
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    }
  };

  const handlePreview = async (doc: StoredDocument) => {
    setPreviewDoc(doc);
    setPreviewContent(null);

    if (doc.category === 'text') {
      setLoadingPreview(true);
      try {
        const res = await fetch(doc.rawUrl);
        const text = await res.text();
        setPreviewContent(text);
      } catch {
        setPreviewContent('Failed to load text preview.');
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDocIcon = (cat: StoredDocument['category']) => {
    switch (cat) {
      case 'image':
        return <FileImage className="w-5 h-5 text-indigo-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'text':
        return <File className="w-5 h-5 text-amber-500" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredDocs = docs.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'all' || doc.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs animate-in fade-in-50 slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Control Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
              Document Vault
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {committeeName || committeeSlug || 'Committee Vault'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Document Storage &amp; Asset Vault
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Organize assets into custom folders, preview, download, and manage committee files (images, PDFs, rosters, contracts, riders, spreadsheets).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <input
            type="file"
            ref={replaceInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && replaceTarget) handleFileUpload(file, replaceTarget.name);
            }}
          />

          {/* New Folder Button */}
          <button
            type="button"
            onClick={() => setIsNewFolderOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-2xs transition-all cursor-pointer"
            title="Create a new folder in this directory"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>New Folder</span>
          </button>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload to {currentFolder ? `"${currentFolder.split('/').pop()}"` : 'Vault'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3.5 px-4 rounded-2xl border border-slate-200 shadow-2xs flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 flex-wrap">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.path || 'root'}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <button
                  type="button"
                  onClick={() => setCurrentFolder(crumb.path)}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                    isLast
                      ? 'bg-slate-100 text-slate-900 font-extrabold'
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {idx === 0 ? <FolderOpen className="w-3.5 h-3.5 text-indigo-600" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{crumb.name}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {currentFolder && (
          <button
            type="button"
            onClick={() => {
              const parts = currentFolder.split('/');
              parts.pop();
              setCurrentFolder(parts.join('/'));
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Up one level</span>
          </button>
        )}
      </div>

      {/* Subfolder Grid */}
      {folders.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
            Folders ({folders.length})
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {folders.map((folder) => (
              <div
                key={folder.path}
                className="group bg-white p-3.5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer"
                onClick={() => setCurrentFolder(folder.path)}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <Folder className="w-4 h-4 text-amber-600 fill-amber-500/20" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-indigo-600 transition-colors">
                      {folder.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.path, folder.name);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete Folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${currentFolder ? `in "${currentFolder.split('/').pop()}"` : 'documents'}...`}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Files' },
            { id: 'pdf', label: 'PDFs' },
            { id: 'image', label: 'Images' },
            { id: 'spreadsheet', label: 'Sheets' },
            { id: 'text', label: 'Text/JSON' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid / Table */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-semibold">Loading documents from storage...</p>
        </div>
      ) : filteredDocs.length === 0 && folders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {currentFolder ? `Folder "${currentFolder.split('/').pop()}" is empty` : 'No documents in this vault yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload files or create subfolders to group your committee assets efficiently.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewFolderOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-300 shadow-2xs hover:bg-slate-50"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Create Folder</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          No files matching your filter in this folder.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Document Name</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          {getDocIcon(doc.category)}
                        </div>
                        <div className="truncate max-w-xs sm:max-w-md">
                          <span className="font-bold text-slate-900 block truncate" title={doc.name}>
                            {doc.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {doc.extension.toUpperCase() || 'FILE'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                      {formatBytes(doc.sizeBytes)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {new Date(doc.updatedAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview */}
                        <button
                          type="button"
                          onClick={() => handlePreview(doc)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Preview in browser"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Move File */}
                        <button
                          type="button"
                          onClick={() => {
                            setMoveTargetDoc(doc);
                            setSelectedTargetFolder(currentFolder);
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Move to another folder"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>

                        {/* Replace File */}
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceTarget(doc);
                            replaceInputRef.current?.click();
                          }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Replace with updated version"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        {/* Download */}
                        <a
                          href={doc.downloadUrl}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Download file"
                        >
                          <Download className="w-4 h-4" />
                        </a>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.name)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Create New Folder</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewFolderOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Folder will be created in {currentFolder ? `"${currentFolder}"` : 'root directory'}.
            </p>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <input
                type="text"
                required
                autoFocus
                placeholder="Folder name (e.g. Rosters, Schedules)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {creatingFolder ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move File Modal */}
      {moveTargetDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Move Document</h3>
              </div>
              <button
                type="button"
                onClick={() => setMoveTargetDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Moving <strong className="text-slate-800 font-mono">{moveTargetDoc.name}</strong> to:
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedTargetFolder('')}
                className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                  selectedTargetFolder === ''
                    ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <FolderOpen className="w-4 h-4 text-indigo-600" />
                <span>All Files (Root Directory)</span>
              </button>

              {folders.map((f) => (
                <button
                  key={f.path}
                  type="button"
                  onClick={() => setSelectedTargetFolder(f.path)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                    selectedTargetFolder === f.path
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Folder className="w-4 h-4 text-amber-500" />
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMoveTargetDoc(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={movingFile}
                onClick={handleMoveFile}
                className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {movingFile ? 'Moving...' : 'Move File'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-Browser Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2.5 truncate">
                {getDocIcon(previewDoc.category)}
                <div className="truncate">
                  <h3 className="font-bold text-slate-900 text-sm truncate">{previewDoc.name}</h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatBytes(previewDoc.sizeBytes)} • {previewDoc.mimeType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.downloadUrl}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100/50 flex items-center justify-center min-h-[350px]">
              {previewDoc.category === 'image' && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.rawUrl}
                  alt={previewDoc.name}
                  className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-md"
                />
              )}

              {previewDoc.category === 'pdf' && (
                <iframe
                  src={previewDoc.rawUrl}
                  title={previewDoc.name}
                  className="w-full h-[70vh] rounded-xl border border-slate-200 shadow-inner bg-white"
                />
              )}

              {previewDoc.category === 'text' && (
                loadingPreview ? (
                  <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                ) : (
                  <pre className="w-full max-h-[70vh] overflow-auto bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono">
                    {previewContent}
                  </pre>
                )
              )}

              {previewDoc.category !== 'image' && previewDoc.category !== 'pdf' && previewDoc.category !== 'text' && (
                <div className="text-center p-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-xs">
                    {getDocIcon(previewDoc.category)}
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Direct Preview Not Supported</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    This file format cannot be rendered inline in the browser. Please download it to view or edit locally.
                  </p>
                  <a
                    href={previewDoc.downloadUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-slate-800"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download to Device</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

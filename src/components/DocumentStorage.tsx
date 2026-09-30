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
  ArrowUpDown,
  Lock,
} from 'lucide-react';

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
}

interface DocumentStorageProps {
  committeeSlug?: string;
  committeeName?: string;
}

export default function DocumentStorage({ committeeSlug, committeeName }: DocumentStorageProps) {
  const [docs, setDocs] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<StoredDocument | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<StoredDocument | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const url = committeeSlug ? `/api/documents?committee=${encodeURIComponent(committeeSlug)}` : '/api/documents';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.documents) {
        setDocs(data.documents);
      }
    } catch (err) {
      console.error('Error fetching docs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [committeeSlug]);

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
      fetchDocs();
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (replaceInputRef.current) replaceInputRef.current.value = '';
      setReplaceTarget(null);
    }
  };

  const handleDelete = async (fileName: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${fileName}"?`)) return;

    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, committee: committeeSlug }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete');
      }

      showToast(`✓ Removed ${fileName}`);
      fetchDocs();
      if (previewDoc?.name === fileName) setPreviewDoc(null);
    } catch (err) {
      showToast(`Error: ${(err as Error).message}`);
    }
  };

  const openPreview = async (doc: StoredDocument) => {
    setPreviewDoc(doc);
    setPreviewContent(null);

    if (doc.category === 'text' || doc.extension === '.csv') {
      setLoadingPreview(true);
      try {
        const res = await fetch(doc.rawUrl);
        const text = await res.text();
        setPreviewContent(text);
      } catch {
        setPreviewContent('Unable to preview text content directly.');
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
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getDocIcon = (cat: string) => {
    switch (cat) {
      case 'image':
        return <FileImage className="w-5 h-5 text-emerald-600" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="w-5 h-5 text-teal-600" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-600" />;
      case 'text':
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <File className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredDocs = docs.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || d.category === filterCategory;
    return matchesSearch && matchesCategory;
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

      {/* Header & Upload Controls */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5 text-indigo-700" />
              Isolated Document Vault
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {committeeName || committeeSlug || 'Committee Vault'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Document Storage &amp; Asset Vault
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Upload, preview, download, and replace committee assets (images, PDFs, rosters, contracts, riders, spreadsheets). Files are securely isolated and accessible only within this committee directory.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Uploading Asset...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload New Document</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by filename..."
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
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No documents in this vault yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload rulesheets, schedules, speaker riders, volunteer duty rosters, or stage designs.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
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
                        <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                          {getDocIcon(doc.category)}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openPreview(doc)}
                            className="font-bold text-slate-900 hover:text-blue-600 text-left block truncate max-w-xs sm:max-w-md cursor-pointer transition-colors"
                          >
                            {doc.name}
                          </button>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            {doc.extension}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {formatBytes(doc.sizeBytes)}
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-slate-500">
                      {new Date(doc.updatedAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPreview(doc)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Preview in browser"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={doc.downloadUrl}
                          download={doc.name}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setReplaceTarget(doc);
                            replaceInputRef.current?.click();
                          }}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors"
                          title="Replace with updated file"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.name)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* In-Browser Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[88vh] bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white border border-slate-200 shrink-0">
                  {getDocIcon(previewDoc.category)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {previewDoc.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatBytes(previewDoc.sizeBytes)} • {previewDoc.mimeType}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.downloadUrl}
                  download={previewDoc.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-100 flex items-center justify-center min-h-[350px]">
              {previewDoc.category === 'image' && (
                <img
                  src={previewDoc.rawUrl}
                  alt={previewDoc.name}
                  className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-md"
                />
              )}

              {previewDoc.category === 'pdf' && (
                <iframe
                  src={previewDoc.rawUrl}
                  title={previewDoc.name}
                  className="w-full h-[70vh] rounded-2xl border border-slate-300 bg-white"
                />
              )}

              {(previewDoc.category === 'text' || previewDoc.extension === '.csv') && (
                <div className="w-full max-h-[70vh] overflow-auto bg-white p-5 rounded-2xl border border-slate-300 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre shadow-xs">
                  {loadingPreview ? (
                    <div className="text-center py-10">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-400 mb-2" />
                      <span>Loading file preview...</span>
                    </div>
                  ) : previewDoc.extension === '.csv' && previewContent ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <tbody>
                          {previewContent.split('\n').filter(Boolean).map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-100 font-bold' : 'border-t border-slate-200'}>
                              {row.split(',').map((cell, cIdx) => (
                                <td key={cIdx} className="p-2 border border-slate-200">
                                  {cell.trim()}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    previewContent
                  )}
                </div>
              )}

              {!['image', 'pdf', 'text'].includes(previewDoc.category) && previewDoc.extension !== '.csv' && (
                <div className="text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3 max-w-md">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <File className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Direct in-browser preview not supported for {previewDoc.extension} files
                  </h4>
                  <p className="text-xs text-slate-500">
                    This file format is securely stored in your committee vault. Click below to download and view in your local application.
                  </p>
                  <a
                    href={previewDoc.downloadUrl}
                    download={previewDoc.name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
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

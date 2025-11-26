"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Trash2, Upload, Download, Eye, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { documentApi, Document } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = "http://localhost:8000";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DocumentsPage() {
    const { showToast } = useToast();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [processingDocs, setProcessingDocs] = useState<Set<number>>(new Set());

    // ========================================================================
    // DATA FETCHING
    // ========================================================================

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await documentApi.getAll();
            setDocuments(data);
            
            // Check processing status for recent uploads
            for (const doc of data) {
                try {
                    const response = await fetch(`${API_BASE}/documents/${doc.id}/status`);
                    const status = await response.json();
                    if (status.status === 'processing' || status.status === 'queued') {
                        setProcessingDocs(prev => new Set(prev).add(doc.id));
                    }
                } catch {
                    // Ignore status check errors
                }
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
            showToast('error', 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Poll for processing status
    useEffect(() => {
        if (processingDocs.size === 0) return;

        const checkStatus = async () => {
            const stillProcessing = new Set<number>();
            
            for (const docId of processingDocs) {
                try {
                    const response = await fetch(`${API_BASE}/documents/${docId}/status`);
                    const status = await response.json();
                    
                    if (status.status === 'processing' || status.status === 'queued') {
                        stillProcessing.add(docId);
                    } else if (status.status === 'completed') {
                        const doc = documents.find(d => d.id === docId);
                        if (doc) {
                            showToast('success', `${doc.original_filename} is ready!`);
                        }
                    }
                } catch {
                    // Ignore errors
                }
            }
            
            setProcessingDocs(stillProcessing);
        };

        const interval = setInterval(checkStatus, 5000);
        return () => clearInterval(interval);
    }, [processingDocs, documents, showToast]);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleFileUpload = useCallback(async (file: File) => {
        setUploading(true);
        try {
            const uploadedDoc = await documentApi.upload(file);
            showToast('success', 'Document uploaded! Processing...');
            setShowUpload(false);
            setProcessingDocs(prev => new Set(prev).add(uploadedDoc.id));
            fetchDocuments();
        } catch (error) {
            console.error("Failed to upload document", error);
            showToast('error', 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    }, [showToast, fetchDocuments]);

    const handleView = useCallback((id: number) => {
        window.open(`${API_BASE}/documents/${id}/view`, '_blank');
    }, []);

    const handleDownload = useCallback((id: number) => {
        window.open(`${API_BASE}/documents/${id}/download`, '_blank');
    }, []);

    const handleDelete = useCallback(async (id: number, filename: string) => {
        if (!confirm(`Delete "${filename}"?`)) return;

        try {
            await documentApi.delete(id);
            showToast('success', 'Document deleted');
            fetchDocuments();
        } catch (error) {
            console.error("Failed to delete document", error);
            showToast('error', 'Failed to delete document');
        }
    }, [showToast, fetchDocuments]);

    // ========================================================================
    // HELPERS
    // ========================================================================

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const filteredDocuments = documents.filter(doc =>
        doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-600 text-white">
                                <FileText size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
                                <p className="text-sm text-gray-500">{documents.length} documents uploaded</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={fetchDocuments}
                                variant="secondary"
                                size="sm"
                                className="gap-2"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </Button>
                            <Button
                                onClick={() => setShowUpload(!showUpload)}
                                size="sm"
                                className="gap-2"
                            >
                                <Upload size={16} />
                                Upload
                            </Button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search documents..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Upload Panel */}
                    {showUpload && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                            <FileUpload
                                onFileSelect={handleFileUpload}
                                accept=".pdf,.docx,.doc,.txt"
                                maxSizeMB={50}
                            />
                            {uploading && (
                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                    Uploading...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-6xl mx-auto p-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border">
                        <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                        <p className="text-gray-500">
                            {searchQuery ? 'No documents match your search' : 'No documents uploaded yet'}
                        </p>
                        {!searchQuery && (
                            <Button
                                onClick={() => setShowUpload(true)}
                                variant="secondary"
                                className="mt-4"
                            >
                                Upload Your First Document
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredDocuments.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 bg-white rounded-xl border hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                        <FileText size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900 truncate">
                                                {doc.original_filename}
                                            </h3>
                                            {processingDocs.has(doc.id) && (
                                                <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                                                    <div className="h-2 w-2 animate-spin rounded-full border border-orange-600 border-t-transparent" />
                                                    Processing
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                            <span className="uppercase text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                                                {doc.file_type}
                                            </span>
                                            <span>{formatFileSize(doc.file_size)}</span>
                                            <span>{formatDate(doc.uploaded_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-4">
                                    <Button
                                        onClick={() => handleView(doc.id)}
                                        variant="secondary"
                                        size="sm"
                                        title="View"
                                    >
                                        <Eye size={16} />
                                    </Button>
                                    <Button
                                        onClick={() => handleDownload(doc.id)}
                                        variant="secondary"
                                        size="sm"
                                        title="Download"
                                    >
                                        <Download size={16} />
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(doc.id, doc.original_filename)}
                                        variant="destructive"
                                        size="sm"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats */}
                {documents.length > 0 && (
                    <div className="mt-6 grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl border p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
                            <p className="text-sm text-gray-500">Documents</p>
                        </div>
                        <div className="bg-white rounded-xl border p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}
                            </p>
                            <p className="text-sm text-gray-500">Total Size</p>
                        </div>
                        <div className="bg-white rounded-xl border p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {new Set(documents.map(d => d.file_type)).size}
                            </p>
                            <p className="text-sm text-gray-500">File Types</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { FileText, Trash2, Upload, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { documentApi, Document } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface ProcessingStatus {
    [docId: number]: {
        status: 'queued' | 'processing' | 'completed' | 'failed';
        progress: number;
        message?: string;
    };
}

export default function DocumentsPage() {
    const { showToast } = useToast();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({});

    useEffect(() => {
        fetchDocuments();
    }, []);

    // Check processing status - single check after expected processing time
    useEffect(() => {
        const docsToCheck = documents.filter(doc => {
            const status = processingStatus[doc.id];
            return status && (status.status === 'processing' || status.status === 'queued');
        });

        if (docsToCheck.length === 0) return;

        const checkStatus = async () => {
            for (const doc of docsToCheck) {
                try {
                    const response = await fetch(`http://localhost:8000/documents/${doc.id}/status`);
                    const status = await response.json();
                    
                    setProcessingStatus(prev => ({
                        ...prev,
                        [doc.id]: status
                    }));

                    // Show notification when completed
                    if (status.status === 'completed') {
                        showToast('success', `${doc.original_filename} is ready!`);
                    } else if (status.status === 'failed') {
                        showToast('error', `Failed to process ${doc.original_filename}`);
                    } else if (status.status === 'processing') {
                        // Still processing, check again in 10 seconds
                        setTimeout(() => checkStatus(), 10000);
                    }
                } catch (error) {
                    console.error(`Failed to check status for doc ${doc.id}`, error);
                }
            }
        };

        // Wait 8 seconds before first check (typical processing time)
        const timeout = setTimeout(checkStatus, 8000);

        return () => clearTimeout(timeout);
    }, [documents, processingStatus, showToast]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const data = await documentApi.getAll();
            setDocuments(data);
            
            // Check status of all documents after loading
            for (const doc of data) {
                try {
                    const response = await fetch(`http://localhost:8000/documents/${doc.id}/status`);
                    const status = await response.json();
                    
                    // Only set status if it's actively processing or queued
                    if (status.status === 'processing' || status.status === 'queued') {
                        setProcessingStatus(prev => ({
                            ...prev,
                            [doc.id]: status
                        }));
                    }
                } catch (error) {
                    // Ignore errors - document might not have status yet
                }
            }
        } catch (error) {
            console.error("Failed to fetch documents", error);
            showToast('error', 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const uploadedDoc = await documentApi.upload(file);
            showToast('success', 'Document uploaded! Processing in background...');
            setShowUpload(false);
            
            // Mark as processing
            setProcessingStatus(prev => ({
                ...prev,
                [uploadedDoc.id]: { status: 'processing', progress: 0 }
            }));
            
            fetchDocuments();
        } catch (error) {
            console.error("Failed to upload document", error);
            showToast('error', 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const handleView = (id: number) => {
        // Open document in new tab for inline viewing
        const url = `http://localhost:8000/documents/${id}/view`;
        window.open(url, '_blank');
    };

    const handleDownload = (id: number) => {
        // Download document
        const url = `http://localhost:8000/documents/${id}/download`;
        window.open(url, '_blank');
    };

    const handleDelete = async (id: number, filename: string) => {
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;

        try {
            await documentApi.delete(id);
            showToast('success', 'Document deleted successfully');
            fetchDocuments();
        } catch (error) {
            console.error("Failed to delete document", error);
            showToast('error', 'Failed to delete document');
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="min-h-screen bg-muted/20 p-6">
            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Document Library</h1>
                            <p className="text-muted-foreground">Manage all uploaded HR documents</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowUpload(!showUpload)}
                        className="gap-2"
                    >
                        <Upload size={20} />
                        Upload Document
                    </Button>
                </div>

                {/* Upload Section */}
                {showUpload && (
                    <div className="mt-6 p-6 bg-card rounded-lg border">
                        <h3 className="text-lg font-semibold mb-4">Upload New Document</h3>
                        <FileUpload
                            onFileSelect={handleFileUpload}
                            accept=".pdf,.docx,.doc,.txt"
                            maxSizeMB={10}
                        />
                        {uploading && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                Uploading and processing document...
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Documents List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="space-y-3">
                    {documents.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-lg border">
                            <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                            <p className="text-muted-foreground">No documents uploaded yet.</p>
                            <Button
                                onClick={() => setShowUpload(true)}
                                variant="secondary"
                                className="mt-4"
                            >
                                Upload Your First Document
                            </Button>
                        </div>
                    ) : (
                        documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between p-4 bg-card rounded-lg border hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="p-2 rounded bg-primary/10 text-primary">
                                        <FileText size={24} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-card-foreground">{doc.original_filename}</h3>
                                            {processingStatus[doc.id] && processingStatus[doc.id].status !== 'completed' && (
                                                <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                                                    <div className="h-2 w-2 animate-spin rounded-full border border-orange-600 border-t-transparent"></div>
                                                    {processingStatus[doc.id].status}
                                                </span>
                                            )}
                                            {processingStatus[doc.id]?.status === 'completed' && (
                                                <span className="text-xs text-green-600 font-medium">✓ Ready</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            <span className="uppercase">{doc.file_type}</span>
                                            <span>{formatFileSize(doc.file_size)}</span>
                                            <span>{formatDate(doc.uploaded_at)}</span>
                                            {doc.category && (
                                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                                                    {doc.category.replace('_', ' & ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleView(doc.id)}
                                        variant="secondary"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Eye size={16} />
                                        View
                                    </Button>
                                    <Button
                                        onClick={() => handleDownload(doc.id)}
                                        variant="secondary"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Download size={16} />
                                        Download
                                    </Button>
                                    <Button
                                        onClick={() => handleDelete(doc.id, doc.original_filename)}
                                        variant="destructive"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Stats */}
            {documents.length > 0 && (
                <div className="mt-8 p-6 bg-card rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Library Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-2xl font-bold text-primary">{documents.length}</p>
                            <p className="text-sm text-muted-foreground">Total Documents</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">
                                {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}
                            </p>
                            <p className="text-sm text-muted-foreground">Total Size</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-primary">
                                {new Set(documents.map(d => d.file_type)).size}
                            </p>
                            <p className="text-sm text-muted-foreground">File Types</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

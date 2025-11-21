"use client";

import React, { useCallback, useState } from 'react';
import { Upload, File, X } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSizeMB?: number;
    className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    accept = '.pdf,.docx,.doc,.txt',
    maxSizeMB = 10,
    className = '',
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');

    const validateFile = (file: File): boolean => {
        setError('');

        // Check file size
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            return false;
        }

        // Check file type
        const allowedTypes = accept.split(',').map(t => t.trim());
        const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(fileExt)) {
            setError(`File type not supported. Allowed: ${accept}`);
            return false;
        }

        return true;
    };

    const handleFile = (file: File) => {
        if (validateFile(file)) {
            setSelectedFile(file);
            onFileSelect(file);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFile(file);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setError('');
    };

    return (
        <div className={className}>
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
          relative border-2 border-dashed rounded-lg p-8
          transition-all duration-200 cursor-pointer
          ${isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
        `}
            >
                <input
                    type="file"
                    accept={accept}
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex flex-col items-center justify-center text-center">
                    {selectedFile ? (
                        <>
                            <File className="text-primary mb-3" size={40} />
                            <p className="text-sm font-medium text-foreground mb-1">
                                {selectedFile.name}
                            </p>
                            <p className="text-xs text-muted-foreground mb-3">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearFile();
                                }}
                                className="text-sm text-destructive hover:underline"
                            >
                                Remove file
                            </button>
                        </>
                    ) : (
                        <>
                            <Upload className="text-muted-foreground mb-3" size={40} />
                            <p className="text-sm font-medium text-foreground mb-1">
                                Drop your file here or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Supported formats: {accept} (Max {maxSizeMB}MB)
                            </p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
        </div>
    );
};

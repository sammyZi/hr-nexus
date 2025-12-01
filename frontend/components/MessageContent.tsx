"use client";

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MessageContentProps {
    content: string;
    role: 'user' | 'assistant';
    isInitial?: boolean;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, role, isInitial = false }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Parse content to separate answer from sources
    const parts = content.split('📚 **Sources:**');
    const answer = parts[0];
    const sources = parts[1];

    // Format the answer with better markdown support
    const formatAnswer = (text: string) => {
        return text.split('\n').map((line, idx) => {
            const trimmed = line.trim();
            
            // Skip empty lines
            if (!trimmed) return <div key={idx} className="h-2" />;
            
            // Numbered lists
            if (/^\d+\.\s/.test(trimmed)) {
                return (
                    <div key={idx} className="flex gap-3 ml-2">
                        <span className="font-semibold text-blue-600 flex-shrink-0">{trimmed.match(/^\d+/)?.[0]}.</span>
                        <span className="text-sm leading-relaxed">{trimmed.replace(/^\d+\.\s/, '')}</span>
                    </div>
                );
            }
            
            // Bullet points
            if (/^[-•*]\s/.test(trimmed)) {
                return (
                    <div key={idx} className="flex gap-3 ml-2">
                        <span className="text-blue-600 flex-shrink-0">•</span>
                        <span className="text-sm leading-relaxed">{trimmed.replace(/^[-•*]\s/, '')}</span>
                    </div>
                );
            }
            
            // Bold text
            if (trimmed.includes('**')) {
                return (
                    <p key={idx} className="text-sm leading-relaxed">
                        {trimmed.split(/\*\*(.+?)\*\*/).map((part, i) => 
                            i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : part
                        )}
                    </p>
                );
            }
            
            // Regular text
            return <p key={idx} className="text-sm leading-relaxed">{trimmed}</p>;
        });
    };

    if (role === 'user') {
        return (
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {content}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Answer section */}
            <div className="space-y-2">
                {formatAnswer(answer)}
            </div>

            {/* Copy button - only for non-initial messages */}
            {!isInitial && (
                <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-all mt-2"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-green-600" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            Copy
                        </>
                    )}
                </button>
            )}

            {/* Sources section */}
            {sources && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-2">
                        <span>📚 Sources</span>
                        <span className="text-gray-400">({sources.split('\n').filter(l => l.includes('**')).length})</span>
                    </p>
                    <div className="space-y-2">
                        {(() => {
                            const sourceLines = sources.split('\n').filter(line => line.trim());
                            const uniqueSources = new Map();
                            
                            sourceLines.forEach((line) => {
                                const match = line.match(/\[(\d+)\]\s*\*\*(.+?)\*\*/);
                                if (match) {
                                    const [, num, filename] = match;
                                    if (!uniqueSources.has(filename)) {
                                        uniqueSources.set(filename, { num, filename, line });
                                    }
                                }
                            });
                            
                            return Array.from(uniqueSources.values()).map((source, idx) => (
                                <div key={idx} className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100 hover:border-blue-200 transition-all">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-semibold text-gray-800">[{source.num}] {source.filename}</span>
                                        <button
                                            onClick={() => window.open(`http://localhost:8000/documents/view-by-name/${encodeURIComponent(source.filename)}`, '_blank')}
                                            className="text-blue-600 hover:text-blue-700 hover:underline text-xs font-medium"
                                        >
                                            View
                                        </button>
                                    </div>
                                    {source.line.includes('Preview:') && (
                                        <p className="text-gray-600 text-xs italic mt-1">{source.line.split('Preview:')[1]?.trim()}</p>
                                    )}
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

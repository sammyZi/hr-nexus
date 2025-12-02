"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Upload, Bot, User, Trash2, FileText, X, Square, ArrowDown, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { useToast } from "@/components/ui/Toast";
import { MessageContent } from "@/components/MessageContent";

// ============================================================================
// TYPES
// ============================================================================

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    citations?: string[];
}

interface SessionState {
    messages: Message[];
    isActive: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const INITIAL_MESSAGE: Message = {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m your AI Assistant. Upload documents and ask me anything about them. I\'ll provide answers with precise citations.',
    timestamp: new Date(),
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIAssistantPage() {
    const { showToast } = useToast();
    
    // Session-based state (persists across navigation, cleared on browser close or manual clear)
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const [userScrolledUp, setUserScrolledUp] = useState(false);

    // Load chat history from sessionStorage on mount
    useEffect(() => {
        try {
            const savedMessages = sessionStorage.getItem('ai_chat_history');
            if (savedMessages) {
                const parsed = JSON.parse(savedMessages);
                const messagesWithDates = parsed.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
                setMessages(messagesWithDates);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }, []);

    // Save chat history to sessionStorage whenever messages change
    useEffect(() => {
        try {
            sessionStorage.setItem('ai_chat_history', JSON.stringify(messages));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }, [messages]);

    // Auto-scroll to bottom (only if user hasn't scrolled up)
    const scrollToBottom = useCallback(() => {
        if (!userScrolledUp) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [userScrolledUp]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Detect when user scrolls up
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        setUserScrolledUp(!isAtBottom);
    }, []);

    // Scroll to bottom helper
    const handleScrollToBottom = useCallback(() => {
        setUserScrolledUp(false);
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Cleanup on unmount (session end)
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleStopStreaming = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
        setIsStreaming(false);
        showToast('info', 'Response stopped');
    }, [showToast]);

    const handleClearChat = useCallback(() => {
        // Abort any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        // Reset to initial state
        setMessages([INITIAL_MESSAGE]);
        setInput('');
        setIsLoading(false);
        setIsStreaming(false);
        setUserScrolledUp(false);
        
        // Clear sessionStorage
        try {
            sessionStorage.removeItem('ai_chat_history');
        } catch (error) {
            console.error('Error clearing chat history:', error);
        }
        
        showToast('success', 'Chat cleared');
    }, [showToast]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading || isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input.trim();
        setInput('');
        setIsLoading(true);

        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            // Prepare conversation history (session-only)
            const conversationHistory = messages
                .filter(m => m.role !== 'assistant' || m.id !== '1') // Exclude initial message
                .slice(-10)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content
                }));

            const formData = new FormData();
            formData.append('query', currentInput);
            formData.append('stream', 'true');
            if (conversationHistory.length > 0) {
                formData.append('history', JSON.stringify(conversationHistory));
            }

            const response = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: formData,
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullAnswer = '';
            let assistantId = '';

            setIsLoading(false);
            setIsStreaming(true);

            if (reader) {
                let firstChunk = true;

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                
                                if (data.chunk) {
                                    // Create assistant message only on first chunk
                                    if (firstChunk) {
                                        firstChunk = false;
                                        assistantId = (Date.now() + 1).toString();
                                        fullAnswer = data.chunk;
                                        setMessages(prev => [...prev, {
                                            id: assistantId,
                                            role: 'assistant',
                                            content: fullAnswer,
                                            timestamp: new Date(),
                                        }]);
                                    } else {
                                        fullAnswer += data.chunk;
                                        setMessages(prev => prev.map(msg =>
                                            msg.id === assistantId
                                                ? { ...msg, content: fullAnswer }
                                                : msg
                                        ));
                                    }
                                }
                                
                                if (data.done) {
                                    setIsStreaming(false);
                                }
                            } catch {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('Request aborted');
                return;
            }
            
            console.error('Error:', error);
            showToast('error', 'Failed to get response');
            
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ Error: ${error.message || 'Failed to get response'}`,
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    }, [input, isLoading, isStreaming, messages, showToast]);

    const handleFileUpload = useCallback(async (file: File) => {
        setUploading(true);
        
        const uploadingMsg: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `📤 Uploading "${file.name}"...`,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, uploadingMsg]);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`${API_BASE}/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `✅ "${file.name}" uploaded successfully! Processing in background...`,
                timestamp: new Date(),
            }]);
            
            showToast('success', 'Document uploaded!');
            setShowUpload(false);
        } catch (error) {
            console.error('Upload error:', error);
            showToast('error', 'Failed to upload document');
            
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ Failed to upload "${file.name}". Please try again.`,
                timestamp: new Date(),
            }]);
        } finally {
            setUploading(false);
        }
    }, [showToast]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }, [handleSend]);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="px-6 py-4 border-b bg-white shadow-sm">
                <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-600 text-white">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
                            <p className="text-sm text-gray-500">Ask questions about your documents</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleClearChat}
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                        >
                            <Trash2 size={16} />
                            Clear Chat
                        </Button>
                        <Button
                            onClick={() => setShowUpload(!showUpload)}
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                        >
                            <Upload size={16} />
                            Upload
                        </Button>
                    </div>
                </div>

                {/* Upload Panel */}
                {showUpload && (
                    <div className="mt-4 max-w-5xl mx-auto">
                        <div className="p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-medium text-gray-900">Upload Document</h3>
                                <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>
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
                    </div>
                )}
            </header>

            {/* Messages */}
            <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto"
            >
                <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {message.role === 'assistant' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Bot size={16} className="text-blue-600" />
                                </div>
                            )}

                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                    message.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white border shadow-sm text-gray-800'
                                }`}
                            >
                                <MessageContent content={message.content} role={message.role} isInitial={message.id === '1'} />
                                
                                <p className={`text-xs mt-3 ${
                                    message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                                }`}>
                                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {message.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User size={16} className="text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Loading indicator - Show only one */}
                    {(isLoading || isStreaming) && (
                        <div className="flex gap-3 animate-slideIn">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Bot size={16} className="text-blue-600" />
                            </div>
                            <div className="bg-white border shadow-sm rounded-2xl px-4 py-3 flex-1">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium">
                                        {isLoading && !isStreaming ? 'Searching documents...' : 'Generating response...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Floating scroll to bottom button - shows when user scrolled up */}
            {userScrolledUp && (
                <button
                    onClick={handleScrollToBottom}
                    className="fixed bottom-32 right-8 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-50"
                    title="Scroll to bottom"
                >
                    <ArrowDown size={20} />
                </button>
            )}

            {/* Input */}
            <div className="border-t bg-white px-4 py-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask a question about your documents..."
                            className="flex-1 px-4 py-3 rounded-xl border bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                            disabled={isLoading || isStreaming}
                        />
                        {(isLoading || isStreaming) ? (
                            <button
                                onClick={handleStopStreaming}
                                className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-medium"
                            >
                                <StopCircle size={20} />
                                <span>Stop</span>
                            </button>
                        ) : (
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="px-4"
                            >
                                <Send size={20} />
                            </Button>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                        Session-based chat • Context cleared on page close or Clear Chat
                    </p>
                </div>
            </div>
        </div>
    );
}

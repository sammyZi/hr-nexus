"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Upload, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { chatApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ProcessingDoc {
    id: number;
    name: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
}

export default function AIAssistantPage() {
    const { showToast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [processingDocs, setProcessingDocs] = useState<ProcessingDoc[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load chat history from localStorage on mount
    useEffect(() => {
        const savedMessages = localStorage.getItem('chat_history');
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                // Convert timestamp strings back to Date objects
                const messagesWithDates = parsed.map((msg: any) => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }));
                setMessages(messagesWithDates);
            } catch (error) {
                console.error('Error loading chat history:', error);
                setMessages([{
                    id: '1',
                    role: 'assistant',
                    content: 'Hello! I\'m your HR Policy Assistant. Upload documents to add them to my knowledge base, then ask me anything about your HR policies!',
                    timestamp: new Date(),
                }]);
            }
        } else {
            setMessages([{
                id: '1',
                role: 'assistant',
                content: 'Hello! I\'m your HR Policy Assistant. Upload documents to add them to my knowledge base, then ask me anything about your HR policies!',
                timestamp: new Date(),
            }]);
        }
    }, []);

    // Clear chat history on page unload (when user closes tab or refreshes)
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Only clear if user is actually leaving/refreshing, not navigating
            const isNavigating = sessionStorage.getItem('navigating');
            if (!isNavigating) {
                localStorage.removeItem('chat_history');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chat_history', JSON.stringify(messages));
        }
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // Prepare conversation history (last 10 messages for context)
            const recentMessages = messages.slice(-10).map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Use streaming
            const formData = new FormData();
            formData.append('query', currentInput);
            formData.append('stream', 'true');
            if (recentMessages.length > 0) {
                formData.append('history', JSON.stringify(recentMessages));
            }

            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: formData,
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let fullAnswer = '';
            let assistantId = '';
            let firstChunk = true;

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                
                                // Create assistant message on first chunk
                                if (firstChunk && data.chunk) {
                                    firstChunk = false;
                                    setIsLoading(false); // Stop loading immediately
                                    assistantId = (Date.now() + 1).toString();
                                    const assistantMessage: Message = {
                                        id: assistantId,
                                        role: 'assistant',
                                        content: data.chunk,
                                        timestamp: new Date(),
                                    };
                                    setMessages(prev => [...prev, assistantMessage]);
                                    fullAnswer = data.chunk;
                                } else if (data.chunk && assistantId) {
                                    fullAnswer += data.chunk;
                                    // Update message in real-time
                                    setMessages(prev => prev.map(msg =>
                                        msg.id === assistantId
                                            ? { ...msg, content: fullAnswer }
                                            : msg
                                    ));
                                }
                            } catch (e) {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error('Error sending message:', error);
            const errorDetail = error.response?.data?.detail || 'Failed to get response from AI';
            showToast('error', errorDetail);

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Sorry, I encountered an error: ${errorDetail}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Poll for document processing status
    useEffect(() => {
        if (processingDocs.length === 0) return;

        const interval = setInterval(async () => {
            const updatedDocs = await Promise.all(
                processingDocs.map(async (doc) => {
                    if (doc.status === 'completed' || doc.status === 'failed') {
                        return doc;
                    }

                    try {
                        const response = await fetch(`http://localhost:8000/documents/${doc.id}/status`);
                        const status = await response.json();
                        return { ...doc, status: status.status };
                    } catch (error) {
                        return doc;
                    }
                })
            );

            setProcessingDocs(updatedDocs);

            // Check for newly completed documents
            updatedDocs.forEach((doc) => {
                const oldDoc = processingDocs.find(d => d.id === doc.id);
                if (oldDoc?.status !== 'completed' && doc.status === 'completed') {
                    const completeMessage: Message = {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: `✅ Document "${doc.name}" is now fully processed and searchable! You can ask me questions about it.`,
                        timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, completeMessage]);
                    showToast('success', `${doc.name} ready!`);
                }
            });

            // Remove completed/failed docs after notification
            setProcessingDocs(prev => prev.filter(d => d.status !== 'completed' && d.status !== 'failed'));
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [processingDocs, showToast]);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        
        // Add uploading message
        const uploadingMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `📤 Uploading "${file.name}"...`,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, uploadingMessage]);
        
        try {
            // Upload via chat endpoint to process immediately
            const response = await chatApi.sendMessage('Document uploaded', file);
            
            // Extract document ID from response if available
            const docId = Date.now(); // In real app, get from response
            
            // Add to processing queue
            setProcessingDocs(prev => [...prev, {
                id: docId,
                name: file.name,
                status: 'processing'
            }]);
            
            // Update message to show processing
            const processingMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `✅ "${file.name}" uploaded successfully!\n\n🔄 Processing in background... You can continue using the app.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, processingMessage]);
            
            showToast('success', 'Document uploaded! Processing...');
            setShowUpload(false);
            
        } catch (error) {
            console.error('Error uploading file:', error);
            showToast('error', 'Failed to upload document');
            
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ Failed to upload "${file.name}". Please try again.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-muted/20">
            {/* Header */}
            <header className="p-6 border-b bg-card">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <Bot size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">AI Policy Assistant</h1>
                            <p className="text-sm text-gray-600">
                                Ask questions about your HR policies and documents
                                {processingDocs.length > 0 && (
                                    <span className="ml-2 text-orange-600 font-medium">
                                        • {processingDocs.length} document{processingDocs.length > 1 ? 's' : ''} processing...
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => {
                                localStorage.removeItem('chat_history');
                                setMessages([{
                                    id: '1',
                                    role: 'assistant',
                                    content: 'Hello! I\'m your HR Policy Assistant. Upload documents to add them to my knowledge base, then ask me anything about your HR policies!',
                                    timestamp: new Date(),
                                }]);
                                showToast('success', 'Chat history cleared');
                            }}
                            variant="secondary"
                            className="gap-2"
                        >
                            Clear Chat
                        </Button>
                        <Button
                            onClick={() => setShowUpload(!showUpload)}
                            variant="secondary"
                            className="gap-2"
                        >
                            <Upload size={20} />
                            Upload Document
                        </Button>
                    </div>
                </div>

                {/* Processing Status */}
                {processingDocs.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Processing Documents:</h3>
                        <div className="space-y-2">
                            {processingDocs.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-2 text-sm">
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                    <span className="text-blue-800">{doc.name}</span>
                                    <span className="text-blue-600">({doc.status})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upload Section */}
                {showUpload && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <FileUpload
                            onFileSelect={handleFileUpload}
                            accept=".pdf,.docx,.doc,.txt"
                            maxSizeMB={10}
                        />
                        {uploading && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                Uploading document...
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.role === 'assistant' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot size={18} className="text-primary" />
                            </div>
                        )}

                        <div
                            className={`max-w-[70%] rounded-lg p-4 ${message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card border'
                                }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                }`}>
                                {message.timestamp.toLocaleTimeString()}
                            </p>
                        </div>

                        {message.role === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User size={18} className="text-foreground" />
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot size={18} className="text-primary" />
                        </div>
                        <div className="bg-card border rounded-lg p-4">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t bg-card">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question about your HR policies..."
                        className="flex-1 px-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="gap-2"
                    >
                        <Send size={20} />
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}

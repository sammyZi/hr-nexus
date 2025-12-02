"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToastInternal = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, type, message }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 5000);
    }, []);

    // Set global reference for standalone function
    React.useEffect(() => {
        globalShowToast = (message: string, type: ToastType) => {
            showToastInternal(type, message);
        };
        return () => {
            globalShowToast = null;
        };
    }, [showToastInternal]);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast: (type, message) => showToastInternal(type, message) }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

// Standalone showToast function for use outside of React components
let globalShowToast: ((message: string, type: ToastType) => void) | null = null;

export const showToast = (message: string, type: ToastType = 'info') => {
    if (globalShowToast) {
        globalShowToast(message, type);
    } else {
        console.warn('Toast provider not initialized');
    }
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const styles = {
        success: {
            icon: <CheckCircle className="text-green-600" size={20} />,
            bg: 'bg-green-50/80 backdrop-blur-sm',
            border: 'border border-green-200/50',
            text: 'text-green-900',
            button: 'text-green-600 hover:bg-green-100/50',
        },
        error: {
            icon: <XCircle className="text-red-600" size={20} />,
            bg: 'bg-red-50/80 backdrop-blur-sm',
            border: 'border border-red-200/50',
            text: 'text-red-900',
            button: 'text-red-600 hover:bg-red-100/50',
        },
        info: {
            icon: <AlertCircle className="text-blue-600" size={20} />,
            bg: 'bg-blue-50/80 backdrop-blur-sm',
            border: 'border border-blue-200/50',
            text: 'text-blue-900',
            button: 'text-blue-600 hover:bg-blue-100/50',
        },
    };

    const style = styles[toast.type];

    return (
        <div
            className={`
                flex items-center gap-3 p-4 rounded-xl shadow-lg
                ${style.bg} ${style.border}
                animate-slideIn duration-300
            `}
        >
            <div className="flex-shrink-0">
                {style.icon}
            </div>
            <p className={`flex-1 text-sm font-medium ${style.text}`}>
                {toast.message}
            </p>
            <button
                onClick={onClose}
                className={`flex-shrink-0 p-1 rounded-lg transition-all ${style.button}`}
            >
                <X size={16} />
            </button>
        </div>
    );
};

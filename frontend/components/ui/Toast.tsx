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

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, type, message }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle className="text-success" size={20} />,
        error: <XCircle className="text-destructive" size={20} />,
        info: <AlertCircle className="text-primary" size={20} />,
    };

    const backgrounds = {
        success: 'bg-success/10 border-success/20',
        error: 'bg-destructive/10 border-destructive/20',
        info: 'bg-primary/10 border-primary/20',
    };

    return (
        <div
            className={`
        flex items-center gap-3 p-4 rounded-lg border shadow-lg
        bg-card backdrop-blur-sm
        animate-in slide-in-from-right duration-300
        ${backgrounds[toast.type]}
      `}
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium text-card-foreground">{toast.message}</p>
            <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
            >
                <X size={16} />
            </button>
        </div>
    );
};

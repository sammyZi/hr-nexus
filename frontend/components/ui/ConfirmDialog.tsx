"use client";

import { X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const variantStyles = {
        danger: {
            icon: "bg-red-100 text-red-600",
            button: "bg-red-600 hover:bg-red-700",
        },
        warning: {
            icon: "bg-yellow-100 text-yellow-600",
            button: "bg-yellow-600 hover:bg-yellow-700",
        },
        info: {
            icon: "bg-blue-100 text-blue-600",
            button: "bg-blue-600 hover:bg-blue-700",
        },
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-gray-600 leading-relaxed">{message}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 p-6 bg-gray-50 border-t">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        size="sm"
                    >
                        {cancelText}
                    </Button>
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-2 text-white rounded-lg font-medium transition-all shadow-sm ${styles.button}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

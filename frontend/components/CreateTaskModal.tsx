"use client";

import React, { useState } from 'react';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import { taskApi, TaskCreate } from '@/lib/api';
import { useToast } from './ui/Toast';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultCategory?: string;
}

const CATEGORIES = [
    { value: 'Recruiting', label: 'Recruiting', color: 'bg-blue-500' },
    { value: 'Onboarding', label: 'Onboarding', color: 'bg-green-500' },
    { value: 'Payroll', label: 'Payroll', color: 'bg-emerald-600' },
    { value: 'Benefits', label: 'Benefits', color: 'bg-pink-500' },
    { value: 'Learning_Development', label: 'Learning & Development', color: 'bg-yellow-500' },
    { value: 'Employee_Relations', label: 'Employee Relations', color: 'bg-purple-500' },
    { value: 'Performance', label: 'Performance', color: 'bg-orange-500' },
    { value: 'Offboarding', label: 'Offboarding', color: 'bg-red-500' },
];

const PRIORITIES = [
    { value: 'Low', label: 'Low', color: 'text-gray-600 bg-gray-100' },
    { value: 'Medium', label: 'Medium', color: 'text-blue-600 bg-blue-100' },
    { value: 'High', label: 'High', color: 'text-red-600 bg-red-100' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    defaultCategory,
}) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<TaskCreate>({
        title: '',
        description: '',
        category: defaultCategory || 'Recruiting',
        priority: 'Medium',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.category) {
            newErrors.category = 'Category is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);
        try {
            await taskApi.create(formData);
            showToast('success', 'Task created successfully!');
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                title: '',
                description: '',
                category: defaultCategory || 'Recruiting',
                priority: 'Medium',
            });
            setErrors({});
        } catch (error) {
            showToast('error', 'Failed to create task. Please try again.');
            console.error('Error creating task:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedCategory = CATEGORIES.find(c => c.value === formData.category);
    const selectedPriority = PRIORITIES.find(p => p.value === formData.priority);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <Plus size={20} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">Create New Task</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter task title..."
                            className={`w-full px-4 py-3 rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                                errors.title 
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                            }`}
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter task description..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category *
                        </label>
                        <div className="relative">
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border appearance-none bg-white transition-all focus:outline-none focus:ring-2 ${
                                    errors.category 
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                                }`}
                            >
                                {CATEGORIES.map((category) => (
                                    <option key={category.value} value={category.value}>
                                        {category.label}
                                    </option>
                                ))}
                            </select>
                            {selectedCategory && (
                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${selectedCategory.color}`} />
                            )}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                        {errors.category && (
                            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                        )}
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                        </label>
                        <div className="relative">
                            <select
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 appearance-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                            >
                                {PRIORITIES.map((priority) => (
                                    <option key={priority.value} value={priority.value}>
                                        {priority.label}
                                    </option>
                                ))}
                            </select>
                            {selectedPriority && (
                                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${selectedPriority.color.split(' ')[0]}`} />
                            )}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Create Task
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
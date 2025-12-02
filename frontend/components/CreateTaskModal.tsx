"use client";

import React, { useState } from 'react';
import { X, Plus, CheckCircle2 } from 'lucide-react';
import { taskApi, TaskCreate } from '@/lib/api';
import { useToast } from './ui/Toast';
import { Select, SelectOption } from './ui/Select';

interface Task {
    id: string;
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    status: string;
}

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultCategory?: string;
    editTask?: Task;
}

const CATEGORY_OPTIONS: SelectOption[] = [
    { value: 'Recruiting', label: 'Recruiting', color: 'bg-blue-500' },
    { value: 'Onboarding', label: 'Onboarding', color: 'bg-green-500' },
    { value: 'Payroll', label: 'Payroll', color: 'bg-emerald-600' },
    { value: 'Benefits', label: 'Benefits', color: 'bg-pink-500' },
    { value: 'Learning_Development', label: 'Learning & Development', color: 'bg-yellow-500' },
    { value: 'Employee_Relations', label: 'Employee Relations', color: 'bg-purple-500' },
    { value: 'Performance', label: 'Performance', color: 'bg-orange-500' },
    { value: 'Offboarding', label: 'Offboarding', color: 'bg-red-500' },
];

const PRIORITY_OPTIONS: SelectOption[] = [
    { value: 'Low', label: 'Low', color: 'bg-green-500' },
    { value: 'Medium', label: 'Medium', color: 'bg-blue-500' },
    { value: 'High', label: 'High', color: 'bg-red-500' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    defaultCategory,
    editTask,
}) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<TaskCreate>({
        title: editTask?.title || '',
        description: editTask?.description || '',
        category: editTask?.category || defaultCategory || 'Recruiting',
        priority: editTask?.priority || 'Medium',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Update form when editTask changes
    React.useEffect(() => {
        if (editTask) {
            setFormData({
                title: editTask.title,
                description: editTask.description || '',
                category: editTask.category || 'Recruiting',
                priority: editTask.priority || 'Medium',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                category: defaultCategory || 'Recruiting',
                priority: 'Medium',
            });
        }
        setErrors({});
    }, [editTask, defaultCategory]);

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
            if (editTask) {
                // Update existing task
                await taskApi.update(editTask.id, formData);
                showToast('success', 'Task updated successfully!');
            } else {
                // Create new task
                await taskApi.create(formData);
                showToast('success', 'Task created successfully!');
            }
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
            showToast('error', editTask ? 'Failed to update task. Please try again.' : 'Failed to create task. Please try again.');
            console.error('Error saving task:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl animate-slideUp max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <Plus size={20} />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">{editTask ? 'Edit Task' : 'Create New Task'}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
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
                        <Select
                            value={formData.category}
                            onChange={(value) => setFormData({ ...formData, category: value })}
                            options={CATEGORY_OPTIONS}
                            placeholder="Select a category..."
                            error={errors.category}
                            showIcon={true}
                        />
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Priority
                        </label>
                        <Select
                            value={formData.priority}
                            onChange={(value) => setFormData({ ...formData, priority: value })}
                            options={PRIORITY_OPTIONS}
                            placeholder="Select priority..."
                            showIcon={true}
                        />
                    </div>

                </form>

                {/* Actions - Sticky Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
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
                                {editTask ? 'Update Task' : 'Create Task'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
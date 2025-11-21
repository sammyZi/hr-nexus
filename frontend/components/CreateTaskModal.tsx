"use client";

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input, TextArea, Select } from './ui/Input';
import { Button } from './ui/Button';
import { taskApi, TaskCreate } from '@/lib/api';
import { useToast } from './ui/Toast';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    defaultCategory?: string;
}

const CATEGORIES = [
    { value: 'Recruiting', label: 'Recruiting' },
    { value: 'Onboarding', label: 'Onboarding' },
    { value: 'Payroll', label: 'Payroll' },
    { value: 'Benefits', label: 'Benefits' },
    { value: 'Learning_Development', label: 'Learning & Development' },
    { value: 'Employee_Relations', label: 'Employee Relations' },
    { value: 'Performance', label: 'Performance' },
    { value: 'Offboarding', label: 'Offboarding' },
];

const PRIORITIES = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
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
        } catch (error) {
            showToast('error', 'Failed to create task. Please try again.');
            console.error('Error creating task:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Task Title"
                    placeholder="Enter task title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    error={errors.title}
                />

                <TextArea
                    label="Description (Optional)"
                    placeholder="Enter task description..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <Select
                    label="Category"
                    options={CATEGORIES}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    error={errors.category}
                />

                <Select
                    label="Priority"
                    options={PRIORITIES}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                />

                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isLoading}
                        className="flex-1"
                    >
                        Create Task
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

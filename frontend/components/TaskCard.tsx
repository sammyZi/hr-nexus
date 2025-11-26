"use client";

import React, { useState } from 'react';
import { MoreVertical, Trash2, Edit } from 'lucide-react';
import { Task, taskApi } from '@/lib/api';
import { useToast } from './ui/Toast';
import { ConfirmDialog } from './ConfirmDialog';

interface TaskCardProps {
    task: Task;
    onUpdate: () => void;
}

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

const PILLAR_COLORS: Record<string, string> = {
    Recruiting: 'bg-blue-500',
    Onboarding: 'bg-green-500',
    Payroll: 'bg-emerald-600',
    Benefits: 'bg-pink-500',
    Learning_Development: 'bg-yellow-500',
    Employee_Relations: 'bg-purple-500',
    Performance: 'bg-orange-500',
    Offboarding: 'bg-red-500',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate }) => {
    const { showToast } = useToast();
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        try {
            await taskApi.updateStatus(task.id, newStatus);
            showToast('success', 'Task status updated');
            onUpdate();
        } catch (error) {
            showToast('error', 'Failed to update task status');
            console.error('Error updating status:', error);
        }
    };

    const handleDeleteClick = () => {
        setShowMenu(false);
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        try {
            await taskApi.delete(task.id);
            showToast('success', 'Task deleted successfully');
            setShowDeleteConfirm(false);
            onUpdate();
        } catch (error) {
            showToast('error', 'Failed to delete task');
            console.error('Error deleting task:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const pillarColor = PILLAR_COLORS[task.category] || 'bg-gray-500';
    const categoryLabel = task.category.replace('_', ' & ');

    return (
        <div className="group relative overflow-hidden rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md">
            {/* Colored accent bar */}
            <div className={`absolute left-0 top-0 h-full w-1 ${pillarColor}`} />

            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${pillarColor} bg-opacity-10 text-foreground`}>
                    {categoryLabel}
                </span>

                <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${task.priority === 'High' ? 'text-destructive' :
                            task.priority === 'Medium' ? 'text-warning' : 'text-success'
                        }`}>
                        {task.priority}
                    </span>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-8 z-20 bg-card border rounded-lg shadow-lg py-1 min-w-[120px]">
                                    <button
                                        onClick={handleDeleteClick}
                                        disabled={isDeleting}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <h3 className="mb-1 text-lg font-semibold text-card-foreground">{task.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {task.description || 'No description provided.'}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">ID: #{task.id}</span>

                <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-2 py-1 rounded border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
            </div>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                title="Delete Task"
                message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isDangerous={true}
                isLoading={isDeleting}
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
};

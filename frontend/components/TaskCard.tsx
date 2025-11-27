"use client";

import React, { useState } from 'react';
import { MoreVertical, Trash2, Star } from 'lucide-react';
import { Task, taskApi } from '@/lib/api';
import { useToast } from './ui/Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { Select, SelectOption } from './ui/Select';

interface TaskCardProps {
    task: Task;
    onUpdate: () => void;
}

const STATUS_OPTIONS: SelectOption[] = [
    { value: 'Pending', label: 'Pending', color: 'bg-gray-500' },
    { value: 'In Progress', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'Completed', label: 'Completed', color: 'bg-green-500' },
];

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
    const [isMarked, setIsMarked] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === task.status) return; // No change needed
        
        console.log(`[TaskCard] Changing task ${task.id} status: ${task.status} -> ${newStatus}`);
        try {
            await taskApi.updateStatus(task.id, newStatus);
            console.log(`[TaskCard] Status update API call successful`);
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
    
    // Priority-based accent bar color
    const priorityBarColor = task.priority === 'High' ? 'bg-red-500' : 
                             task.priority === 'Medium' ? 'bg-blue-500' : 'bg-green-500';

    return (
        <div className={`group relative overflow-visible rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md ${isMarked ? 'ring-2 ring-yellow-400' : ''}`}>
            {/* Colored accent bar - based on priority */}
            <div className={`absolute left-0 top-0 h-full w-1 ${priorityBarColor}`} />

            {/* Header */}
            <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${pillarColor} bg-opacity-10 text-foreground`}>
                            {categoryLabel}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-700' :
                                task.priority === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                            {task.priority}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMarked(!isMarked)}
                        className={`p-2 rounded-lg transition-all ${isMarked ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        title={isMarked ? 'Unmark task' : 'Mark task'}
                    >
                        <Star size={16} fill={isMarked ? 'currentColor' : 'none'} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {showMenu && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 top-10 z-20 bg-card border rounded-lg shadow-lg py-1 min-w-[140px]">
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
            <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                <span className="text-muted-foreground font-medium">ID: #{task.id}</span>

                <div className="w-48">
                    <Select
                        value={task.status}
                        onChange={handleStatusChange}
                        options={STATUS_OPTIONS}
                        placeholder="Select status..."
                        showIcon={true}
                    />
                </div>
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

"use client";

import { useState, useEffect } from "react";
import { Plus, Upload, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { FileUpload } from "@/components/ui/FileUpload";
import { taskApi, documentApi, Task } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth";

interface PillarPageProps {
    pillarName: string;
    pillarCategory: string;
    pillarDescription: string;
    pillarIcon: React.ReactNode;
}

export const PillarPage: React.FC<PillarPageProps> = ({
    pillarName,
    pillarCategory,
    pillarDescription,
    pillarIcon,
}) => {
    useAuth();
    const { showToast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [pillarCategory]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await taskApi.getAll(pillarCategory);
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
            showToast('error', 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskCreated = () => {
        fetchTasks();
        setShowCreateModal(false);
        showToast('success', 'Task created successfully');
    };

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        try {
            await taskApi.updateStatus(taskId, newStatus);
            fetchTasks();
            showToast('success', 'Task status updated');
        } catch (error) {
            console.error("Failed to update task status", error);
            showToast('error', 'Failed to update task');
        }
    };

    const handleDeleteTask = async (taskId: number) => {
        try {
            await taskApi.delete(taskId);
            fetchTasks();
            showToast('success', 'Task deleted');
        } catch (error) {
            console.error("Failed to delete task", error);
            showToast('error', 'Failed to delete task');
        }
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            await documentApi.upload(file, pillarCategory);
            showToast('success', 'Document uploaded successfully');
            setShowUpload(false);
        } catch (error) {
            console.error("Failed to upload document", error);
            showToast('error', 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    // Task statistics
    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        pending: tasks.filter(t => t.status === 'Pending').length,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                                {pillarIcon}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{pillarName}</h1>
                                <p className="text-gray-500 mt-1">{pillarDescription}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setShowUpload(!showUpload)}
                                variant="secondary"
                                className="gap-2"
                            >
                                <Upload size={18} />
                                Upload
                            </Button>
                            <Button
                                onClick={() => setShowCreateModal(true)}
                                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                            >
                                <Plus size={18} />
                                Create Task
                            </Button>
                        </div>
                    </div>

                    {/* Upload Panel */}
                    {showUpload && (
                        <div className="mt-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Upload Document</h3>
                            <FileUpload
                                onFileSelect={handleFileUpload}
                                accept=".pdf,.docx,.doc,.txt"
                                maxSizeMB={10}
                            />
                            {uploading && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                    Uploading...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gray-100">
                                <FileText size={18} className="text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-sm text-gray-500">Total Tasks</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-50">
                                <CheckCircle2 size={18} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                                <p className="text-sm text-gray-500">Completed</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-50">
                                <Clock size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                                <p className="text-sm text-gray-500">In Progress</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-50">
                                <AlertCircle size={18} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                                <p className="text-sm text-gray-500">Pending</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tasks */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <FileText className="mx-auto mb-4 text-gray-300" size={48} />
                        <p className="text-gray-500 mb-4">No tasks yet</p>
                        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                            <Plus size={18} />
                            Create First Task
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onUpdate={fetchTasks}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={showCreateModal}
                defaultCategory={pillarCategory}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleTaskCreated}
            />
        </div>
    );
};

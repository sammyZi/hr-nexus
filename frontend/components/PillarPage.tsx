"use client";

import { useState, useEffect } from "react";
import { Plus, Upload } from "lucide-react";
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
    useAuth(); // Protect this page
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

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            await documentApi.upload(file, pillarCategory);
            showToast('success', 'Document uploaded and processed successfully!');
            setShowUpload(false);
        } catch (error) {
            console.error("Failed to upload document", error);
            showToast('error', 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b px-6 py-5 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                        {pillarIcon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">{pillarName}</h1>
                        <p className="text-sm text-gray-600">{pillarDescription}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={() => setShowCreateModal(true)} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                        <Plus size={20} />
                        Create Task
                    </Button>
                    <Button
                        onClick={() => setShowUpload(!showUpload)}
                        variant="secondary"
                        className="gap-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 font-medium"
                    >
                        <Upload size={20} />
                        Upload Document
                    </Button>
                </div>
            </header>

            <div className="px-6">

            {/* Document Upload Section */}
            {showUpload && (
                <div className="mb-6 p-6 bg-white rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Upload Document for {pillarName}</h3>
                    <FileUpload
                        onFileSelect={handleFileUpload}
                        accept=".pdf,.docx,.doc,.txt"
                        maxSizeMB={10}
                    />
                    {uploading && (
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                            Processing document...
                        </div>
                    )}
                </div>
            )}

            {/* Task Board */}
            <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Tasks ({tasks.length})</h2>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tasks.map((task) => (
                            <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
                        ))}

                        {tasks.length === 0 && (
                            <div className="col-span-full py-12 text-center text-gray-600">
                                No tasks found for {pillarName}. Create one to get started!
                            </div>
                        )}
                    </div>
                )}
            </div>
            </div>

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchTasks}
                defaultCategory={pillarCategory}
            />
        </div>
    );
};

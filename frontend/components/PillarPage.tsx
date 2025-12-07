"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Upload, FileText, CheckCircle2, Clock, AlertCircle, Target, Search, X, Edit2, Trash2, Circle, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { FileUpload } from "@/components/ui/FileUpload";
import { taskApi, documentApi, Task } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { motion } from "framer-motion";

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
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterPriority, setFilterPriority] = useState<string>("All");
    const [filterStatus, setFilterStatus] = useState<string>("All");
    const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "danger" | "warning" | "info";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });

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
        setEditingTask(null);
        showToast('success', 'Task saved successfully');
    };

    const toggleTask = async (task: Task, currentStatus: string) => {
        const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";

        if (newStatus === "Completed") {
            setConfirmDialog({
                isOpen: true,
                title: "Complete Task",
                message: `Mark "${task.title}" as completed?`,
                variant: "info",
                onConfirm: async () => {
                    try {
                        await taskApi.updateStatus(task.id, newStatus);
                        fetchTasks();
                        showToast('success', 'Task completed');
                    } catch (error) {
                        console.error("Failed to update task", error);
                        showToast('error', 'Failed to update task');
                    }
                },
            });
            return;
        }

        try {
            await taskApi.updateStatus(task.id, newStatus);
            fetchTasks();
            showToast('success', 'Task status updated');
        } catch (error) {
            console.error("Failed to update task", error);
            showToast('error', 'Failed to update task');
        }
    };

    const handleDeleteTask = async (task: Task) => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Task",
            message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
            variant: "danger",
            onConfirm: async () => {
                try {
                    await taskApi.delete(task.id);
                    fetchTasks();
                    showToast('success', 'Task deleted');
                } catch (error) {
                    console.error("Failed to delete task", error);
                    showToast('error', 'Failed to delete task');
                }
            },
        });
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

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const priorityMatch = filterPriority === "All" || task.priority === filterPriority;
            const statusMatch = filterStatus === "All" || task.status === filterStatus;

            const searchLower = searchQuery.toLowerCase().trim();
            const searchMatch = !searchQuery ||
                task.title.toLowerCase().includes(searchLower) ||
                (task.description && task.description.toLowerCase().includes(searchLower)) ||
                (task.priority && task.priority.toLowerCase().includes(searchLower));

            return priorityMatch && statusMatch && searchMatch;
        });
    }, [tasks, filterPriority, filterStatus, searchQuery]);

    const priorities = useMemo(() => ["All", ...new Set(tasks.map(t => t.priority).filter(Boolean))], [tasks]);
    const statuses = useMemo(() => ["All", "Pending", "In Progress", "Completed"], []);

    const stats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'Completed').length,
        inProgress: tasks.filter(t => t.status === 'In Progress').length,
        pending: tasks.filter(t => t.status === 'Pending').length,
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case "High":
                return { color: "from-red-500 to-red-600", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
            case "Medium":
                return { color: "from-orange-500 to-orange-600", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" };
            case "Low":
                return { color: "from-green-500 to-green-600", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" };
            default:
                return { color: "from-gray-500 to-gray-600", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" };
        }
    };

    const TaskCard = useCallback(({ task, index }: { task: Task; index: number }) => {
        const config = getPriorityColor(task.priority);

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="group"
            >
                <div className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                    {task.priority && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.color}`} />
                    )}

                    <div className="flex items-start gap-4">
                        <button
                            onClick={() => toggleTask(task, task.status)}
                            className="flex-shrink-0 mt-1 group/checkbox"
                        >
                            <div className="relative">
                                {task.status === "Completed" ? (
                                    <CheckCircle2
                                        size={24}
                                        className="text-green-600"
                                    />
                                ) : (
                                    <>
                                        <Circle
                                            size={24}
                                            className="text-gray-300 group-hover/checkbox:text-blue-500 transition-colors"
                                        />
                                        <CheckCircle2
                                            size={24}
                                            className="absolute inset-0 text-blue-600 opacity-0 group-hover/checkbox:opacity-100 transition-opacity"
                                        />
                                    </>
                                )}
                            </div>
                        </button>

                        <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors ${task.status === "Completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
                                {task.title}
                            </h3>
                            {task.description && (
                                <p className={`text-sm leading-relaxed line-clamp-2 mb-3 ${task.status === "Completed" ? "text-gray-400" : "text-gray-600"}`}>
                                    {task.description}
                                </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                                {task.priority && (
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${config.bg} ${config.text} ${config.border} border`}>
                                        <AlertCircle size={12} />
                                        {task.priority}
                                    </span>
                                )}
                                {task.status && (
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${task.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" :
                                            task.status === "In Progress" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                                "bg-orange-50 text-orange-700 border-orange-200"
                                        } border`}>
                                        {task.status === "Completed" ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                        {task.status}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setEditingTask(task)}
                            className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="Edit task"
                        >
                            <Edit2 size={18} />
                        </button>

                        <button
                            onClick={() => handleDeleteTask(task)}
                            className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete task"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }, [toggleTask, handleDeleteTask, setEditingTask]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                                {pillarIcon}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">{pillarName}</h1>
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
                                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30"
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
            <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-gray-100">
                                <FileText size={20} className="text-gray-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                                <p className="text-sm text-gray-500">Total Tasks</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-green-50">
                                <CheckCircle2 size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                                <p className="text-sm text-gray-500">Completed</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-blue-50">
                                <Clock size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
                                <p className="text-sm text-gray-500">In Progress</p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-lg bg-orange-50">
                                <AlertCircle size={20} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
                                <p className="text-sm text-gray-500">Pending</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search & Filter */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
                >
                    <div className="flex flex-col lg:flex-row gap-3">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks..."
                                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all text-sm text-gray-900 placeholder-gray-400 bg-gray-50 hover:bg-white"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Priority Filter */}
                        <div className="relative lg:w-52">
                            {showPriorityDropdown && (
                                <div className="fixed inset-0 z-10" onClick={() => setShowPriorityDropdown(false)} />
                            )}
                            <button
                                onClick={() => {
                                    setShowPriorityDropdown(!showPriorityDropdown);
                                    setShowStatusDropdown(false);
                                }}
                                className={`relative w-full pl-9 pr-10 py-2.5 border-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 transition-all text-left ${filterPriority === "High" ? "border-red-200 bg-red-50 text-red-700 focus:ring-red-500/20 focus:border-red-500" :
                                        filterPriority === "Medium" ? "border-orange-200 bg-orange-50 text-orange-700 focus:ring-orange-500/20 focus:border-orange-500" :
                                            filterPriority === "Low" ? "border-green-200 bg-green-50 text-green-700 focus:ring-green-500/20 focus:border-green-500" :
                                                "border-gray-200 bg-white text-gray-700 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300"
                                    }`}
                            >
                                <AlertCircle size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${filterPriority === "High" ? "text-red-500" :
                                        filterPriority === "Medium" ? "text-orange-500" :
                                            filterPriority === "Low" ? "text-green-500" :
                                                "text-gray-400"
                                    }`} />
                                {filterPriority === "All" ? "Priority" : filterPriority}
                                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${showPriorityDropdown ? 'rotate-180' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {showPriorityDropdown && (
                                <div className="absolute top-full mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-[100] overflow-hidden">
                                    {(priorities as string[]).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => {
                                                setFilterPriority(p);
                                                setShowPriorityDropdown(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${filterPriority === p
                                                    ? p === "High" ? "bg-red-50 text-red-700" :
                                                        p === "Medium" ? "bg-orange-50 text-orange-700" :
                                                            p === "Low" ? "bg-green-50 text-green-700" :
                                                                "bg-blue-50 text-blue-700"
                                                    : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            <AlertCircle size={14} className={
                                                p === "High" ? "text-red-500" :
                                                    p === "Medium" ? "text-orange-500" :
                                                        p === "Low" ? "text-green-500" :
                                                            "text-gray-400"
                                            } />
                                            {p === "All" ? "All Priorities" : p}
                                            {filterPriority === p && (
                                                <CheckCircle2 size={14} className="ml-auto" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="relative lg:w-52">
                            {showStatusDropdown && (
                                <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                            )}
                            <button
                                onClick={() => {
                                    setShowStatusDropdown(!showStatusDropdown);
                                    setShowPriorityDropdown(false);
                                }}
                                className={`relative w-full pl-9 pr-10 py-2.5 border-2 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 transition-all text-left ${filterStatus === "All"
                                        ? "border-gray-200 bg-white text-gray-700 focus:ring-blue-500/20 focus:border-blue-500 hover:border-gray-300"
                                        : "border-blue-200 bg-blue-50 text-blue-700 focus:ring-blue-500/20 focus:border-blue-500"
                                    }`}
                            >
                                <Target size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${filterStatus === "All" ? "text-gray-400" : "text-blue-500"}`} />
                                {filterStatus === "All" ? "Status" : filterStatus}
                                <svg className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            {showStatusDropdown && (
                                <div className="absolute top-full mt-2 w-full bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-[100] overflow-hidden">
                                    {statuses.map(s => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setFilterStatus(s);
                                                setShowStatusDropdown(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${filterStatus === s
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            <Target size={14} className={filterStatus === s ? "text-blue-500" : "text-gray-400"} />
                                            {s === "All" ? "All Statuses" : s}
                                            {filterStatus === s && (
                                                <CheckCircle2 size={14} className="ml-auto" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Filters */}
                    <div className="mt-3 pt-3 border-t border-gray-100 min-h-10">
                        {(searchQuery || filterPriority !== "All" || filterStatus !== "All") && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">Active filters:</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {searchQuery && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
                                            <Search size={12} />
                                            "{searchQuery}"
                                            <button onClick={() => setSearchQuery("")} className="hover:text-blue-900">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    )}
                                    {filterPriority !== "All" && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-md">
                                            <AlertCircle size={12} />
                                            {filterPriority}
                                            <button onClick={() => setFilterPriority("All")} className="hover:text-orange-900">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    )}
                                    {filterStatus !== "All" && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-md">
                                            <Target size={12} />
                                            {filterStatus}
                                            <button onClick={() => setFilterStatus("All")} className="hover:text-purple-900">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    )}
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            setFilterPriority("All");
                                            setFilterStatus("All");
                                        }}
                                        className="text-xs text-gray-500 hover:text-gray-700 font-medium underline"
                                    >
                                        Clear all
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Tasks */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4" />
                        <p className="text-gray-500 font-medium">Loading tasks...</p>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl border border-gray-200 p-12 text-center"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <FileText size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {tasks.length === 0 ? "No tasks yet" : "No matching tasks"}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {tasks.length === 0 ? "Create your first task to get started" : "Try adjusting your filters"}
                        </p>
                        {tasks.length === 0 && (
                            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                                <Plus size={18} />
                                Create First Task
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTasks.map((task, index) => (
                            <TaskCard key={task.id} task={task} index={index} />
                        ))}
                    </div>
                )}
            </main>

            {/* Create/Edit Task Modal */}
            <CreateTaskModal
                isOpen={showCreateModal || !!editingTask}
                defaultCategory={pillarCategory}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditingTask(null);
                }}
                onSuccess={handleTaskCreated}
                editTask={editingTask || undefined}
            />

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
            />
        </div>
    );
};

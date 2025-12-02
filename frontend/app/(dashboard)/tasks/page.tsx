"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Trash2, Plus, Filter, Clock, CheckCheck, AlertCircle, Target, TrendingUp, Search, X, Edit2 } from "lucide-react";
import { taskApi } from "@/lib/api";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { motion } from "framer-motion";

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    category?: string;
    dueDate?: string;
    createdAt?: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterPriority, setFilterPriority] = useState<string>("All");
    const [filterPillar, setFilterPillar] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
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
        onConfirm: () => {},
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await taskApi.getAll();
            setTasks((data as any[]) || []);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (task: Task, currentStatus: string) => {
        const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
        
        // Ask for confirmation when marking as complete
        if (newStatus === "Completed") {
            setConfirmDialog({
                isOpen: true,
                title: "Complete Task",
                message: `Mark "${task.title}" as completed?`,
                variant: "info",
                onConfirm: async () => {
                    try {
                        await taskApi.updateStatus(task.id, newStatus);
                        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
                    } catch (error) {
                        console.error("Failed to update task", error);
                    }
                },
            });
            return;
        }
        
        // No confirmation needed for uncompleting
        try {
            await taskApi.updateStatus(task.id, newStatus);
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    const deleteTask = async (task: Task) => {
        setConfirmDialog({
            isOpen: true,
            title: "Delete Task",
            message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
            variant: "danger",
            onConfirm: async () => {
                try {
                    await taskApi.delete(task.id);
                    setTasks(tasks.filter(t => t.id !== task.id));
                } catch (error) {
                    console.error("Failed to delete task", error);
                }
            },
        });
    };

    const filteredTasks = tasks.filter(task => {
        // Priority filter
        const priorityMatch = filterPriority === "All" || task.priority === filterPriority;
        
        // Category filter
        const categoryMatch = filterPillar === "All" || task.category === filterPillar;
        
        // Search filter - searches in title, description, priority, and category
        const searchLower = searchQuery.toLowerCase().trim();
        const searchMatch = !searchQuery || 
            task.title.toLowerCase().includes(searchLower) ||
            (task.description && task.description.toLowerCase().includes(searchLower)) ||
            (task.priority && task.priority.toLowerCase().includes(searchLower)) ||
            (task.category && task.category.toLowerCase().includes(searchLower));

        return priorityMatch && categoryMatch && searchMatch && task.status !== "Completed";
    });

    const priorities = ["All", ...new Set(tasks.map(t => t.priority).filter(Boolean))];
    const categories = ["All", ...new Set(tasks.map(t => t.category).filter(Boolean))];

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case "High":
                return "bg-red-100 text-red-700 border-red-200";
            case "Medium":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            case "Low":
                return "bg-green-100 text-green-700 border-green-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const TaskCard = ({ task, index }: { task: Task; index: number }) => {
        const priorityConfig = {
            High: { color: "from-red-500 to-red-600", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
            Medium: { color: "from-orange-500 to-orange-600", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
            Low: { color: "from-green-500 to-green-600", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
        };

        const config = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.Medium;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="group"
            >
                <div className="relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                    {/* Priority indicator bar */}
                    {task.priority && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.color}`} />
                    )}

                    <div className="flex items-start gap-4">
                        <button
                            onClick={() => toggleTask(task, task.status)}
                            className="flex-shrink-0 mt-1 group/checkbox"
                        >
                            <div className="relative">
                                <Circle 
                                    size={24} 
                                    className="text-gray-300 group-hover/checkbox:text-blue-500 transition-colors" 
                                />
                                <CheckCircle2 
                                    size={24} 
                                    className="absolute inset-0 text-blue-600 opacity-0 group-hover/checkbox:opacity-100 transition-opacity" 
                                />
                            </div>
                        </button>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                                {task.title}
                            </h3>
                            {task.description && (
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
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
                                {task.category && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                        <Target size={12} />
                                        {task.category}
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
                            onClick={() => deleteTask(task)}
                            className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete task"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    const activeTasks = filteredTasks.filter(t => t.status !== "Completed").length;
    const completedTasks = filteredTasks.filter(t => t.status === "Completed").length;
    const completionRate = filteredTasks.length > 0 ? Math.round((completedTasks / filteredTasks.length) * 100) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tasks</h1>
                            <p className="text-gray-600">Manage and track your HR tasks efficiently</p>
                        </div>
                        <button 
                            onClick={() => setIsModalOpen(true)} 
                            className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                        >
                            <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                            New Task
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium mb-1">Total Tasks</p>
                                    <p className="text-4xl font-bold text-gray-900">{filteredTasks.length}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-xl">
                                    <Target size={28} className="text-blue-600" />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium mb-1">Active</p>
                                    <p className="text-4xl font-bold text-gray-900">{activeTasks}</p>
                                </div>
                                <div className="p-3 bg-orange-100 rounded-xl">
                                    <Clock size={28} className="text-orange-600" />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tasks by title, description, priority, or category..."
                            className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-sm text-gray-500 mt-2">
                            Found {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} matching "{searchQuery}"
                        </p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Filter size={18} className="text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">Priority</label>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                            >
                                {(priorities as string[]).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">Category</label>
                            <select
                                value={filterPillar}
                                onChange={(e) => setFilterPillar(e.target.value)}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                            >
                                {(categories as string[]).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </motion.div>

                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Active Tasks</h2>
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                    </div>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4" />
                            <p className="text-gray-500 font-medium">Loading tasks...</p>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 p-12 text-center"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                <CheckCheck size={32} className="text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
                            <p className="text-gray-600">No active tasks. Great job! 🎉</p>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredTasks.map((task, index) => (
                                <TaskCard key={task.id} task={task} index={index} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <CreateTaskModal 
                isOpen={isModalOpen || !!editingTask}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTask(null);
                }}
                onSuccess={() => {
                    fetchTasks();
                    setEditingTask(null);
                }}
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
}

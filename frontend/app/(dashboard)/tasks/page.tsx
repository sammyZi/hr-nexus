"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Trash2, Plus, Filter, Clock, CheckCheck } from "lucide-react";
import { taskApi } from "@/lib/api";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
    const [isModalOpen, setIsModalOpen] = useState(false);

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
            const confirmed = window.confirm(`Mark "${task.title}" as completed?`);
            if (!confirmed) return;
        }
        
        try {
            await taskApi.updateStatus(task.id, newStatus);
            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    const deleteTask = async (task: Task) => {
        const confirmed = window.confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`);
        if (!confirmed) return;
        
        try {
            await taskApi.delete(task.id);
            setTasks(tasks.filter(t => t.id !== task.id));
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const priorityMatch = filterPriority === "All" || task.priority === filterPriority;
        const categoryMatch = filterPillar === "All" || task.category === filterPillar;
        return priorityMatch && categoryMatch && task.status !== "Completed";
    });

    const completedTasks = tasks.filter(task => task.status === "Completed");
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

    const TaskCard = ({ task }: { task: Task }) => (
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
                <button
                    onClick={() => toggleTask(task, task.status)}
                    className="flex-shrink-0 mt-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                    <Circle size={24} />
                </button>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base">{task.title}</h3>
                    {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {task.priority && (
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                            </span>
                        )}
                        {task.category && (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {task.category}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => deleteTask(task)}
                    className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
                            <p className="text-gray-500 mt-1">Manage and track your HR tasks</p>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-medium shadow-sm">
                            <Plus size={18} />
                            New Task
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-gray-100 p-6">
                        <p className="text-sm text-gray-500">Total Tasks</p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">{tasks.length}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 p-6">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-orange-600" />
                            <div>
                                <p className="text-sm text-gray-500">Pending</p>
                                <p className="text-3xl font-bold text-orange-600 mt-1">{filteredTasks.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-100 p-6">
                        <div className="flex items-center gap-2">
                            <CheckCheck size={20} className="text-green-600" />
                            <div>
                                <p className="text-sm text-gray-500">Completed</p>
                                <p className="text-3xl font-bold text-green-600 mt-1">{completedTasks.length}</p>
                            </div>
                        </div>
                    </div>
                </div>



                <div className="bg-white rounded-lg border border-gray-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} className="text-gray-600" />
                        <h3 className="font-semibold text-gray-900">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Priority</label>
                            <select
                                value={filterPriority}
                                onChange={(e) => setFilterPriority(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {(priorities as string[]).map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-2">Category</label>
                            <select
                                value={filterPillar}
                                onChange={(e) => setFilterPillar(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {(categories as string[]).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Tasks</h2>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
                            <p className="text-gray-500">No active tasks. Great job! 🎉</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredTasks.map((task) => (
                                <TaskCard key={task.id} task={task} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <CreateTaskModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTasks}
            />
        </div>
    );
}

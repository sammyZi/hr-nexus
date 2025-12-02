"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { taskApi } from "@/lib/api";

interface Task {
    _id: string;
    id?: number;
    title: string;
    description?: string;
    status: string;
    priority?: string;
    category?: string;
    pillar?: string;
    dueDate?: string;
    createdAt?: string;
}

export default function CompletedTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await taskApi.getAll();
            setTasks(((data as any[]) || []).filter(t => t.status === "Completed"));
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = async (task: Task, currentStatus: string) => {
        const newStatus = currentStatus === "Completed" ? "Pending" : "Completed";
        try {
            if (task.id) {
                await taskApi.updateStatus(String(task.id), newStatus);
            }
            setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
        } catch (error) {
            console.error("Failed to update task", error);
        }
    };

    const deleteTask = async (task: Task) => {
        try {
            if (task.id) {
                await taskApi.delete(String(task.id));
            }
            setTasks(tasks.filter(t => t._id !== task._id));
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

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

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-4">
                        <Link href="/tasks" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Completed Tasks</h1>
                            <p className="text-gray-500 mt-1">View all your completed tasks</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="bg-white rounded-lg border border-gray-100 p-6 mb-8">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={24} className="text-green-600" />
                        <div>
                            <p className="text-sm text-gray-500">Total Completed</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{tasks.length}</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
                        <CheckCircle2 size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No completed tasks yet</p>
                        <p className="text-gray-400 text-sm mt-2">Complete tasks from the main tasks page to see them here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.map((task) => (
                            <div key={task._id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 line-through">{task.title}</h3>
                                        {task.description && (
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            {task.priority && (
                                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            )}
                                            {task.pillar && (
                                                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                    {task.pillar}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => toggleTask(task, task.status)}
                                        className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Circle size={16} />
                                        Mark Pending
                                    </button>
                                    <button
                                        onClick={() => deleteTask(task)}
                                        className="px-3 py-2 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

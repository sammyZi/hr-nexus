"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowLeft } from "lucide-react";
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
    createdAt?: string;
}

export default function TaskHistoryPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

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

    const completedTasks = tasks.filter(t => t.status === "Completed");

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-4">
                        <Link href="/tasks" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Task History</h1>
                            <p className="text-gray-500 mt-1">View all tasks and their history</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="bg-white rounded-lg border border-gray-100 p-6 mb-8">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={24} className="text-green-600" />
                        <div>
                            <p className="text-sm text-gray-500">Completed Tasks</p>
                            <p className="text-3xl font-bold text-green-600 mt-1">{completedTasks.length}</p>
                        </div>
                    </div>
                </div>

                {/* Completed Tasks */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </div>
                ) : completedTasks.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
                        <CheckCircle2 size={48} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No completed tasks yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {completedTasks.map((task) => (
                            <div key={task._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <CheckCircle2 size={24} className="text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {task.title}
                                        </h3>
                                        {task.description && (
                                            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
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
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

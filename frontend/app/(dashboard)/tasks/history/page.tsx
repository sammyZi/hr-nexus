"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowLeft, Search, X, Filter } from "lucide-react";
import Link from "next/link";
import { taskApi } from "@/lib/api";
import { motion } from "framer-motion";

interface Task {
    id: string;
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
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [filterPriority, setFilterPriority] = useState<string>("All");
    const [filterCategory, setFilterCategory] = useState<string>("All");

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

    const completedTasks = tasks.filter(t => {
        // Status filter
        const statusMatch = t.status === "Completed";
        
        // Priority filter
        const priorityMatch = filterPriority === "All" || t.priority === filterPriority;
        
        // Category filter
        const categoryMatch = filterCategory === "All" || t.category === filterCategory;
        
        // Search filter
        const searchLower = searchQuery.toLowerCase().trim();
        const searchMatch = !searchQuery || 
            t.title.toLowerCase().includes(searchLower) ||
            (t.description && t.description.toLowerCase().includes(searchLower)) ||
            (t.priority && t.priority.toLowerCase().includes(searchLower)) ||
            (t.category && t.category.toLowerCase().includes(searchLower));

        return statusMatch && priorityMatch && categoryMatch && searchMatch;
    });

    const priorities = ["All", ...new Set(tasks.map(t => t.priority).filter(Boolean))];
    const categories = ["All", ...new Set(tasks.map(t => t.category).filter(Boolean))];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center gap-4">
                        <Link href="/tasks" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Task History</h1>
                            <p className="text-gray-600 mt-1">View all completed tasks and their history</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                {/* Stats */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircle2 size={24} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Completed Tasks</p>
                            <p className="text-4xl font-bold text-gray-900 mt-1">{completedTasks.length}</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search completed tasks by title, description, priority, or category..."
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
                            Found {completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'} matching "{searchQuery}"
                        </p>
                    )}
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
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
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                            >
                                {(categories as string[]).map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Completed Tasks List */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Completed Tasks</h2>
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                            {completedTasks.length} {completedTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                    </div>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4" />
                            <p className="text-gray-500 font-medium">Loading tasks...</p>
                        </div>
                    ) : completedTasks.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm"
                        >
                            <CheckCircle2 size={48} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed tasks found</h3>
                            <p className="text-gray-500">
                                {searchQuery || filterPriority !== "All" || filterCategory !== "All" 
                                    ? "Try adjusting your search or filters" 
                                    : "Complete some tasks to see them here"}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="space-y-4">
                        {completedTasks.map((task) => (
                            <div key={task.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-xl transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        <CheckCircle2 size={24} className="text-green-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {task.title}
                                        </h3>
                                        {task.description && (
                                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">{task.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                                            {task.priority && (
                                                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            )}
                                            {task.category && (
                                                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
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
                </div>
            </main>
        </div>
    );
}

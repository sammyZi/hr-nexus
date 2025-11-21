"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TaskCard } from "@/components/TaskCard";
import { CreateTaskModal } from "@/components/CreateTaskModal";
import { taskApi, Task } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const PILLARS = [
    { name: "All", value: "All" },
    { name: "Recruiting", value: "Recruiting" },
    { name: "Onboarding", value: "Onboarding" },
    { name: "Payroll", value: "Payroll" },
    { name: "Benefits", value: "Benefits" },
    { name: "L&D", value: "Learning_Development" },
    { name: "Employee Relations", value: "Employee_Relations" },
    { name: "Performance", value: "Performance" },
    { name: "Offboarding", value: "Offboarding" },
];

export default function DashboardPage() {
    useAuth(); // Protect this page
    const [activeTab, setActiveTab] = useState("All");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [activeTab]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await taskApi.getAll(activeTab);
            setTasks(data);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b px-6 py-5 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">HR Command Center</h1>
                        <p className="text-sm text-gray-600">Manage your organization across all 8 HR Pillars.</p>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                        <Plus size={20} />
                        Create Task
                    </Button>
                </div>
            </header>

            <div className="px-6">

            {/* Horizontal Scrollable Tabs */}
            <div className="mb-6 overflow-x-auto pb-2">
                <div className="flex space-x-2 min-w-max">
                    {PILLARS.map((pillar) => {
                        const isActive = activeTab === pillar.value;
                        return (
                            <button
                                key={pillar.value}
                                onClick={() => setActiveTab(pillar.value)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium transition-all
                                    ${isActive
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                                    }
                                `}
                            >
                                {pillar.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Task Board */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
                    ))}

                    {tasks.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-600">
                            No tasks found for this category.
                        </div>
                    )}
                </div>
            )}
            </div>

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={fetchTasks}
            />
        </div>
    );
}


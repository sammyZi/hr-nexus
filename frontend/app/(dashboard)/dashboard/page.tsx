"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FileText,
    MessageSquare,
    Clock,
    CheckCircle2,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { documentApi, taskApi } from "@/lib/api";

// ============================================================================
// TYPES
// ============================================================================

interface StatCard {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ElementType;
    color: string;
}



// ============================================================================
// COMPONENTS
// ============================================================================

const StatCardComponent = ({ stat }: { stat: StatCard }) => {
    const Icon = stat.icon;
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        orange: "bg-orange-50 text-orange-600",
        green: "bg-green-50 text-green-600",
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    {stat.change && (
                        <p className={`text-sm mt-2 ${
                            stat.changeType === 'positive' ? 'text-green-600' :
                            stat.changeType === 'negative' ? 'text-red-600' :
                            'text-gray-500'
                        }`}>
                            {stat.change}
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardPage() {
    const [greeting, setGreeting] = useState("Good morning");
    const [stats, setStats] = useState<StatCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
        else if (hour >= 17) setGreeting("Good evening");
        
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const tasks = await taskApi.getAll();
            let documents = [];
            
            try {
                documents = await documentApi.getAll();
            } catch (error) {
                console.warn("Failed to fetch documents, continuing with tasks only", error);
            }

            const activeTasks = tasks.filter(t => t.status !== 'Completed').length;
            const completedTasks = tasks.filter(t => t.status === 'Completed').length;
            const completionRate = tasks.length > 0 
                ? Math.round((completedTasks / tasks.length) * 100) 
                : 0;

            const dashboardStats: StatCard[] = [
                {
                    title: "Total Documents",
                    value: documents.length,
                    icon: FileText,
                    color: "blue",
                },
                {
                    title: "Total Tasks",
                    value: tasks.length,
                    icon: MessageSquare,
                    color: "purple",
                },
                {
                    title: "Active Tasks",
                    value: activeTasks,
                    icon: Clock,
                    color: "orange",
                },
                {
                    title: "Completed",
                    value: `${completionRate}%`,
                    change: `${completedTasks} of ${tasks.length} tasks`,
                    changeType: "neutral",
                    icon: CheckCircle2,
                    color: "green",
                },
            ];

            setStats(dashboardStats);
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{greeting}! 👋</h1>
                            <p className="text-gray-500 mt-1">Here's what's happening with your HR operations</p>
                        </div>
                        <Link href="/ai-assistant">
                            <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-600/20">
                                <Sparkles size={18} />
                                Ask AI Assistant
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Stats Grid */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat, index) => (
                                <StatCardComponent key={index} stat={stat} />
                            ))}
                        </div>
                    )}
                </section>


            </main>
        </div>
    );
}

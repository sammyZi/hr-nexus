"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FileText,
    MessageSquare,
    Clock,
    CheckCircle2,
    Sparkles,
    TrendingUp,
    Users,
    Calendar,
    ArrowRight,
    Zap,
    Target,
    Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { documentApi, taskApi } from "@/lib/api";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { motion } from "framer-motion";

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

const StatCardComponent = ({ stat, index }: { stat: StatCard; index: number }) => {
    const Icon = stat.icon;
    const colorClasses = {
        blue: "from-blue-500 to-blue-600",
        purple: "from-purple-500 to-purple-600",
        orange: "from-orange-500 to-orange-600",
        green: "from-green-500 to-green-600",
    };

    return (
        <AnimatedCard delay={index * 0.1}>
            <div className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-2xl hover:border-gray-300 transition-all duration-300 overflow-hidden">
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                
                <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500 mb-2">{stat.title}</p>
                        <p className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</p>
                        {stat.change && (
                            <p className={`text-sm font-medium flex items-center gap-1 ${
                                stat.changeType === 'positive' ? 'text-green-600' :
                                stat.changeType === 'negative' ? 'text-red-600' :
                                'text-gray-500'
                            }`}>
                                {stat.changeType === 'positive' && <TrendingUp size={14} />}
                                {stat.change}
                            </p>
                        )}
                    </div>
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[stat.color as keyof typeof colorClasses]} shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={24} className="text-white" />
                    </div>
                </div>
            </div>
        </AnimatedCard>
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
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Overview</h2>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {stats.map((stat, index) => (
                                <StatCardComponent key={index} stat={stat} index={index} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <AnimatedCard delay={0.4}>
                            <Link href="/ai-assistant">
                                <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <Sparkles className="text-white mb-4" size={32} />
                                    <h3 className="text-xl font-bold text-white mb-2">AI Assistant</h3>
                                    <p className="text-blue-100 text-sm mb-4">Ask questions about your HR documents</p>
                                    <div className="flex items-center text-white font-medium group-hover:gap-2 transition-all">
                                        <span>Get Started</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        </AnimatedCard>

                        <AnimatedCard delay={0.5}>
                            <Link href="/documents">
                                <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-2xl hover:border-purple-300 transition-all duration-300">
                                    <div className="p-3 bg-purple-100 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                                        <FileText className="text-purple-600" size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Documents</h3>
                                    <p className="text-gray-600 text-sm mb-4">Add new HR documents to your library</p>
                                    <div className="flex items-center text-purple-600 font-medium group-hover:gap-2 transition-all">
                                        <span>Upload Now</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        </AnimatedCard>

                        <AnimatedCard delay={0.6}>
                            <Link href="/tasks">
                                <div className="group relative bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-2xl hover:border-green-300 transition-all duration-300">
                                    <div className="p-3 bg-green-100 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
                                        <Target className="text-green-600" size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Tasks</h3>
                                    <p className="text-gray-600 text-sm mb-4">Track and complete your HR tasks</p>
                                    <div className="flex items-center text-green-600 font-medium group-hover:gap-2 transition-all">
                                        <span>View Tasks</span>
                                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </Link>
                        </AnimatedCard>
                    </div>
                </section>

                {/* Activity Feed */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
                    <AnimatedCard delay={0.7}>
                        <div className="bg-white rounded-2xl border border-gray-200 p-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Activity className="text-blue-600" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">System Ready</p>
                                        <p className="text-sm text-gray-500 mt-1">Your HR Nexus dashboard is set up and ready to use</p>
                                        <p className="text-xs text-gray-400 mt-2">Just now</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Zap className="text-green-600" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">AI Assistant Available</p>
                                        <p className="text-sm text-gray-500 mt-1">Start asking questions about your HR documents</p>
                                        <p className="text-xs text-gray-400 mt-2">Today</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Users className="text-purple-600" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">Welcome to HR Nexus</p>
                                        <p className="text-sm text-gray-500 mt-1">Get started by uploading your first document</p>
                                        <p className="text-xs text-gray-400 mt-2">Today</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnimatedCard>
                </section>
            </main>
        </div>
    );
}

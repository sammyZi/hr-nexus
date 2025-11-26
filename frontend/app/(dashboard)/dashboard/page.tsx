"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    FileText,
    MessageSquare,
    TrendingUp,
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Sparkles,
    Upload,
    BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

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

interface QuickAction {
    title: string;
    description: string;
    href: string;
    icon: React.ElementType;
    color: string;
}

// ============================================================================
// DATA
// ============================================================================

const stats: StatCard[] = [
    {
        title: "Total Documents",
        value: "24",
        change: "+3 this week",
        changeType: "positive",
        icon: FileText,
        color: "blue",
    },
    {
        title: "AI Queries",
        value: "156",
        change: "+28 today",
        changeType: "positive",
        icon: MessageSquare,
        color: "purple",
    },
    {
        title: "Active Tasks",
        value: "12",
        change: "4 due today",
        changeType: "neutral",
        icon: Clock,
        color: "orange",
    },
    {
        title: "Completed",
        value: "89%",
        change: "+5% vs last month",
        changeType: "positive",
        icon: CheckCircle2,
        color: "green",
    },
];

const quickActions: QuickAction[] = [
    {
        title: "AI Assistant",
        description: "Ask questions about your documents",
        href: "/ai-assistant",
        icon: Sparkles,
        color: "blue",
    },
    {
        title: "Upload Document",
        description: "Add new HR documents",
        href: "/documents",
        icon: Upload,
        color: "green",
    },
    {
        title: "View Reports",
        description: "Analytics and insights",
        href: "/dashboard",
        icon: BarChart3,
        color: "purple",
    },
];

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

const QuickActionCard = ({ action }: { action: QuickAction }) => {
    const Icon = action.icon;
    const colorClasses = {
        blue: "from-blue-500 to-blue-600",
        green: "from-green-500 to-green-600",
        purple: "from-purple-500 to-purple-600",
    };

    return (
        <Link
            href={action.href}
            className="group bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all duration-300 flex items-center gap-4"
        >
            <div className={`p-4 rounded-xl bg-gradient-to-br ${colorClasses[action.color as keyof typeof colorClasses]} text-white shadow-lg`}>
                <Icon size={24} />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{action.description}</p>
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </Link>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DashboardPage() {
    const [greeting, setGreeting] = useState("Good morning");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 12 && hour < 17) setGreeting("Good afternoon");
        else if (hour >= 17) setGreeting("Good evening");
    }, []);

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {stats.map((stat, index) => (
                            <StatCardComponent key={index} stat={stat} />
                        ))}
                    </div>
                </section>

                {/* Quick Actions */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickActions.map((action, index) => (
                            <QuickActionCard key={index} action={action} />
                        ))}
                    </div>
                </section>

                {/* AI Assistant Promo */}
                <section>
                    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                        
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="max-w-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles size={24} />
                                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">AI-Powered</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">
                                    Get instant answers from your documents
                                </h3>
                                <p className="text-blue-100 mb-6">
                                    Upload HR policies, handbooks, and documents. Ask questions in natural language and get accurate answers with citations.
                                </p>
                                <Link href="/ai-assistant">
                                    <Button className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
                                        Try AI Assistant
                                        <ArrowRight size={18} className="ml-2" />
                                    </Button>
                                </Link>
                            </div>
                            <div className="hidden lg:block">
                                <div className="w-48 h-48 bg-white/10 rounded-3xl flex items-center justify-center">
                                    <MessageSquare size={64} className="text-white/50" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Recent Activity */}
                <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                        {[
                            { action: "Document uploaded", item: "Employee Handbook 2024.pdf", time: "2 hours ago", icon: FileText },
                            { action: "AI query answered", item: "What is the vacation policy?", time: "3 hours ago", icon: MessageSquare },
                            { action: "Task completed", item: "Q4 Performance Reviews", time: "5 hours ago", icon: CheckCircle2 },
                        ].map((activity, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                <div className="p-2 rounded-lg bg-gray-100">
                                    <activity.icon size={18} className="text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                                    <p className="text-sm text-gray-500">{activity.item}</p>
                                </div>
                                <span className="text-xs text-gray-400">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Briefcase,
    UserPlus,
    DollarSign,
    Heart,
    GraduationCap,
    Users,
    TrendingUp,
    UserMinus,
    MessageSquare,
    FileText,
    Menu,
    X,
    LogOut,
    ChevronRight,
    Sparkles,
    Settings,
} from 'lucide-react';

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, highlight: true },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
];

const hrPillars = [
    { name: 'Recruiting', href: '/pillars/recruiting', icon: Briefcase },
    { name: 'Onboarding', href: '/pillars/onboarding', icon: UserPlus },
    { name: 'Payroll', href: '/pillars/payroll', icon: DollarSign },
    { name: 'Benefits', href: '/pillars/benefits', icon: Heart },
    { name: 'Learning', href: '/pillars/learning-development', icon: GraduationCap },
    { name: 'Relations', href: '/pillars/employee-relations', icon: Users },
    { name: 'Performance', href: '/pillars/performance', icon: TrendingUp },
    { name: 'Offboarding', href: '/pillars/offboarding', icon: UserMinus },
];

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        router.push('/signin');
    };

    const NavItem = ({ item, compact = false }: { item: typeof mainNavigation[0] & { highlight?: boolean }, compact?: boolean }) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        return (
            <Link
                href={item.href}
                onClick={onClose}
                className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-200 group relative
                    ${isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : item.highlight
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }
                `}
            >
                <Icon size={compact ? 18 : 20} className={isActive ? '' : 'text-gray-400 group-hover:text-gray-600'} />
                <span className={`font-medium ${compact ? 'text-sm' : ''}`}>{item.name}</span>
                {item.highlight && !isActive && (
                    <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">AI</span>
                )}
                {isActive && (
                    <ChevronRight size={16} className="ml-auto opacity-70" />
                )}
            </Link>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
                    transform transition-transform duration-300 ease-out
                    lg:translate-x-0 flex flex-col
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <span className="text-white font-bold text-lg">H</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">HR Nexus</h1>
                            <p className="text-xs text-gray-400">AI-Powered HR</p>
                        </div>
                    </Link>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Primary Nav */}
                    <div className="space-y-1">
                        {mainNavigation.map((item) => (
                            <NavItem key={item.href} item={item} />
                        ))}
                    </div>

                    {/* HR Pillars */}
                    <div>
                        <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            HR Pillars
                        </h3>
                        <div className="space-y-1">
                            {hrPillars.map((item) => (
                                <NavItem key={item.href} item={item} compact />
                            ))}
                        </div>
                    </div>
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

// ============================================================================
// SIDEBAR TOGGLE
// ============================================================================

export const SidebarToggle: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="lg:hidden fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-white border border-gray-200 shadow-lg hover:bg-gray-50 transition-all"
        >
            <Menu size={20} className="text-gray-600" />
        </button>
    );
};

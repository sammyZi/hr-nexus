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
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Recruiting', href: '/pillars/recruiting', icon: Briefcase },
    { name: 'Onboarding', href: '/pillars/onboarding', icon: UserPlus },
    { name: 'Payroll', href: '/pillars/payroll', icon: DollarSign },
    { name: 'Benefits', href: '/pillars/benefits', icon: Heart },
    { name: 'Learning & Development', href: '/pillars/learning-development', icon: GraduationCap },
    { name: 'Employee Relations', href: '/pillars/employee-relations', icon: Users },
    { name: 'Performance', href: '/pillars/performance', icon: TrendingUp },
    { name: 'Offboarding', href: '/pillars/offboarding', icon: UserMinus },
    { name: 'AI Assistant', href: '/ai-assistant', icon: MessageSquare },
    { name: 'Documents', href: '/documents', icon: FileText },
];

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

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">H</span>
                            </div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                HR Nexus
                            </h1>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden text-gray-500 hover:text-gray-900"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto p-4">
                        <ul className="space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onClose}
                                            className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg
                        transition-all duration-200 font-medium
                        ${isActive
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }
                      `}
                                        >
                                            <Icon size={20} />
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 font-medium"
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export const SidebarToggle: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-card border shadow-md"
        >
            <Menu size={20} />
        </button>
    );
};

"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    FileText,
    Menu,
    X,
    LogOut,
    ChevronRight,
    Sparkles,
    Settings,
    Plus,
    CheckSquare,
    History,
} from 'lucide-react';
import { ConfirmDialog } from './ui/ConfirmDialog';

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, highlight: true },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Task History', href: '/tasks/history', icon: History },
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
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('organization_id');
        router.push('/signin');
    };

    const NavItem = ({ item }: { item: typeof mainNavigation[0] & { highlight?: boolean } }) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/tasks');

        return (
            <Link
                href={item.href}
                onClick={onClose}
                className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 group
                    ${isActive
                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                        : item.highlight
                            ? 'text-blue-700 hover:text-blue-800'
                            : 'text-gray-700 hover:bg-gray-100'
                    }
                `}
            >
                <Icon size={19} className={isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'} />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                    <ChevronRight size={17} className="text-blue-600 opacity-70" />
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
                    fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-white to-gray-50 border-r border-gray-200 z-50
                    transform transition-transform duration-300 ease-out
                    lg:translate-x-0 flex flex-col
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-sm">H</span>
                        </div>
                        <h1 className="text-base font-bold text-gray-900">HR Nexus</h1>
                    </Link>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Main Navigation */}
                <nav className="flex-1 overflow-y-auto p-3">
                    <div className="space-y-2">
                        {mainNavigation.map((item) => (
                            <NavItem key={item.href} item={item} />
                        ))}
                    </div>
                </nav>

                {/* Create Task Button */}
                <div className="p-3 border-t border-gray-200">
                    <Link
                        href="/tasks"
                        onClick={onClose}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Create Task</span>
                    </Link>
                </div>

                {/* Settings & Logout */}
                <div className="p-3 border-t border-gray-200 space-y-2">
                    <Link
                        href="/settings"
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-all duration-200 text-sm font-medium"
                    >
                        <Settings size={18} />
                        <span>Settings</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-sm font-medium"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <ConfirmDialog
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={confirmLogout}
                title="Sign Out"
                message="Are you sure you want to sign out?"
                confirmText="Sign Out"
                variant="warning"
            />
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

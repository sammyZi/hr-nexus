"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
    Briefcase,
    UserPlus,
    DollarSign,
    Heart,
    GraduationCap,
    Users,
    TrendingUp,
    UserX,
    ChevronDown,
    Search,
    Zap,
    Minimize2,
    Maximize2,
} from 'lucide-react';
import { ConfirmDialog } from './ui/ConfirmDialog';

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, highlight: true },
    { name: 'Documents', href: '/documents', icon: FileText },
];

const pillarNavigation = [
    { name: 'Recruiting', href: '/pillars/recruiting', icon: Briefcase, color: 'blue' },
    { name: 'Onboarding', href: '/pillars/onboarding', icon: UserPlus, color: 'green' },
    { name: 'Payroll', href: '/pillars/payroll', icon: DollarSign, color: 'emerald' },
    { name: 'Benefits', href: '/pillars/benefits', icon: Heart, color: 'rose' },
    { name: 'Learning & Development', href: '/pillars/learning-development', icon: GraduationCap, color: 'purple' },
    { name: 'Employee Relations', href: '/pillars/employee-relations', icon: Users, color: 'indigo' },
    { name: 'Performance', href: '/pillars/performance', icon: TrendingUp, color: 'orange' },
    { name: 'Offboarding', href: '/pillars/offboarding', icon: UserX, color: 'gray' },
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
    const [isPillarsExpanded, setIsPillarsExpanded] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCompact, setIsCompact] = useState(false);

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('organization_id');
        router.push('/signin');
    };

    // Filter pillars based on search
    const filteredPillars = useMemo(() => {
        if (!searchQuery.trim()) return pillarNavigation;
        const query = searchQuery.toLowerCase();
        return pillarNavigation.filter(pillar =>
            pillar.name.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    // Auto-expand pillars when searching
    useEffect(() => {
        if (searchQuery.trim()) {
            setIsPillarsExpanded(true);
        }
    }, [searchQuery]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Only trigger if Alt key is pressed
            if (!e.altKey) return;

            const key = e.key.toUpperCase();
            const navItem = mainNavigation.find(item => item.shortcut === key);

            if (navItem) {
                e.preventDefault();
                router.push(navItem.href);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [router]);

    const NavItem = ({ item, compact = false }: { item: typeof mainNavigation[0] & { highlight?: boolean; color?: string }; compact?: boolean }) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

        const content = (
            <Link
                href={item.href}
                onClick={onClose}
                className={`
                    flex items-center gap-3 px-3 rounded-xl text-sm font-medium
                    transition-all duration-200 group relative
                    ${compact ? 'py-3 justify-center' : 'py-2.5'}
                    ${isActive
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                        : item.highlight
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            : 'text-gray-700 hover:bg-gray-100'
                    }
                `}
            >
                <Icon size={compact ? 20 : 18} className={isActive ? 'text-white' : item.highlight ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'} />
                {!compact && <span className="flex-1">{item.name}</span>}
                {!compact && isActive && (
                    <ChevronRight size={16} className="text-white opacity-80" />
                )}
            </Link>
        );

        if (compact) {
            return (
                <div className="relative group/tooltip">
                    {content}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-xl">
                        <span>{item.name}</span>
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-900" />
                    </div>
                </div>
            );
        }

        return content;
    };

    const PillarItem = ({ item, compact = false }: { item: typeof pillarNavigation[0]; compact?: boolean }) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            emerald: 'from-emerald-500 to-emerald-600',
            rose: 'from-rose-500 to-rose-600',
            purple: 'from-purple-500 to-purple-600',
            indigo: 'from-indigo-500 to-indigo-600',
            orange: 'from-orange-500 to-orange-600',
            gray: 'from-gray-500 to-gray-600',
        };

        const content = (
            <Link
                href={item.href}
                onClick={onClose}
                className={`
                    flex items-center gap-2.5 px-3 rounded-lg text-sm font-medium
                    transition-all duration-200 group
                    ${compact ? 'py-2.5 justify-center' : 'py-2'}
                    ${isActive
                        ? `bg-gradient-to-r ${colorClasses[item.color as keyof typeof colorClasses]} text-white shadow-md`
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                `}
            >
                <Icon size={compact ? 18 : 16} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'} />
                {!compact && <span className="flex-1 truncate">{item.name}</span>}
                {!compact && isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
                {compact && isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
            </Link>
        );

        if (compact) {
            return (
                <div className="relative group/tooltip">
                    {content}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none shadow-xl">
                        <span>{item.name}</span>
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-900" />
                    </div>
                </div>
            );
        }

        return content;
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
                    fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
                    transform transition-all duration-300 ease-out
                    lg:translate-x-0 flex flex-col shadow-xl
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                    ${isCompact ? 'w-20' : 'w-72'}
                `}
            >
                {/* Logo & Compact Toggle */}
                <div className={`flex items-center justify-between px-4 py-4 border-b border-gray-200 ${isCompact ? 'bg-gradient-to-b from-blue-50 to-white' : 'bg-gradient-to-r from-blue-50 to-indigo-50'}`}>
                    {!isCompact && (
                        <Link href="/dashboard" className="flex items-center gap-2.5 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">H</span>
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-gray-900">HR Nexus</h1>
                                <p className="text-xs text-gray-500">Productivity Hub</p>
                            </div>
                        </Link>
                    )}
                    {isCompact && (
                        <div className="flex flex-col items-center w-full gap-2">
                            <Link href="/dashboard" className="flex items-center justify-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow">
                                    <span className="text-white font-bold text-lg">H</span>
                                </div>
                            </Link>
                            <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsCompact(!isCompact)}
                            className={`hidden lg:flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${isCompact
                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 hover:scale-110'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-110'
                                }`}
                            title={isCompact ? "Expand sidebar (Show labels)" : "Compact sidebar (Icons only)"}
                        >
                            {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Quick Search */}
                {!isCompact && (
                    <div className="px-3 py-3 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search pillars..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Navigation */}
                <nav className={`flex-1 px-3 py-4 ${isCompact ? 'overflow-visible' : 'overflow-y-auto'}`}>
                    {/* Quick Access */}
                    {!isCompact && (
                        <div className="mb-1">
                            <div className="flex items-center gap-2 px-3 mb-2">
                                <Zap size={14} className="text-blue-600" />
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                    Quick Access
                                </h3>
                            </div>
                        </div>
                    )}
                    <div className={isCompact ? "space-y-1" : "space-y-1 mb-6"}>
                        {mainNavigation.map((item) => (
                            <NavItem key={item.href} item={item} compact={isCompact} />
                        ))}
                    </div>

                    {/* HR Pillars Section */}
                    <div className={isCompact ? "mt-2" : ""}>
                        {isCompact && (
                            <div className="flex items-center justify-center mb-2">
                                <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                            </div>
                        )}
                        {!isCompact && (
                            <button
                                onClick={() => setIsPillarsExpanded(!isPillarsExpanded)}
                                className="w-full flex items-center justify-between px-3 py-2 mb-2 text-xs font-bold text-gray-900 uppercase tracking-wider hover:bg-gray-50 rounded-lg transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center">
                                        <Briefcase size={12} className="text-white" />
                                    </div>
                                    <span>HR Pillars</span>
                                    <span className="text-xs font-normal text-gray-500">({filteredPillars.length})</span>
                                </div>
                                <ChevronDown
                                    size={16}
                                    className={`text-gray-400 transition-transform ${isPillarsExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>
                        )}
                        {(isPillarsExpanded || isCompact) && (
                            <div className={isCompact ? "space-y-1" : "space-y-0.5"}>
                                {filteredPillars.map((item) => (
                                    <PillarItem key={item.href} item={item} compact={isCompact} />
                                ))}
                                {!isCompact && filteredPillars.length === 0 && (
                                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                                        No pillars found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Settings & Logout */}
                <div className="p-3 border-t border-gray-200 bg-gray-50 space-y-1.5">
                    <Link
                        href="/settings"
                        className={`w-full flex items-center gap-3 px-3 rounded-lg text-gray-700 hover:bg-white hover:shadow-sm transition-all duration-200 text-sm font-medium ${isCompact ? 'py-2 justify-center' : 'py-2.5'}`}
                        title="Settings"
                    >
                        <Settings size={18} />
                        {!isCompact && <span>Settings</span>}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-sm font-medium ${isCompact ? 'py-2 justify-center' : 'py-2.5'}`}
                        title="Logout"
                    >
                        <LogOut size={18} />
                        {!isCompact && <span>Logout</span>}
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

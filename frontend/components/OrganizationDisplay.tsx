"use client";

import { useOrganization } from '@/contexts/OrganizationContext';
import { Building2 } from 'lucide-react';

/**
 * Example component showing how to use the organization context
 * This can be used in the Sidebar or other components to display organization info
 */
export function OrganizationDisplay() {
    const { organization, loading, error } = useOrganization();

    if (loading) {
        return (
            <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-gray-300 rounded-lg" />
                <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-300 rounded w-16" />
                </div>
            </div>
        );
    }

    if (error || !organization) {
        return null;
    }

    return (
        <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
            {organization.logo_url ? (
                <img 
                    src={organization.logo_url} 
                    alt={organization.name}
                    className="w-10 h-10 rounded-lg object-cover"
                />
            ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Building2 size={20} className="text-white" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                    {organization.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {organization.slug}
                </p>
            </div>
        </div>
    );
}

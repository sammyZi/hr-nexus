"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

// Organization interface
export interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    settings?: Record<string, any>;
    created_at: string;
    is_active: boolean;
}

// Organization context type
interface OrganizationContextType {
    organization: Organization | null;
    loading: boolean;
    error: string | null;
    refreshOrganization: () => Promise<void>;
}

// Create context
const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

// Provider props
interface OrganizationProviderProps {
    children: ReactNode;
}

// Organization Provider Component
export function OrganizationProvider({ children }: OrganizationProviderProps) {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch organization data
    const fetchOrganization = async () => {
        // Only run on client side
        if (typeof window === 'undefined') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            // Check if user is authenticated
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.log('[OrganizationContext] No access token found');
                setLoading(false);
                return;
            }

            console.log('[OrganizationContext] Fetching organization with token:', token.substring(0, 20) + '...');

            // Fetch organization data from API
            const response = await api.get('/organizations/me');
            console.log('[OrganizationContext] Organization fetched successfully:', response.data);
            setOrganization(response.data);
        } catch (err: any) {
            console.error('[OrganizationContext] Failed to fetch organization:', err);
            console.error('[OrganizationContext] Error details:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                message: err.message,
            });
            setError(err.response?.data?.detail || 'Failed to load organization');
            setOrganization(null);
        } finally {
            setLoading(false);
        }
    };

    // Load organization on mount and when token changes
    useEffect(() => {
        fetchOrganization();
    }, []);

    // Refresh function that can be called externally
    const refreshOrganization = async () => {
        await fetchOrganization();
    };

    const value: OrganizationContextType = {
        organization,
        loading,
        error,
        refreshOrganization,
    };

    return (
        <OrganizationContext.Provider value={value}>
            {children}
        </OrganizationContext.Provider>
    );
}

// Custom hook to use organization context
export function useOrganization() {
    const context = useContext(OrganizationContext);
    if (context === undefined) {
        throw new Error('useOrganization must be used within an OrganizationProvider');
    }
    return context;
}

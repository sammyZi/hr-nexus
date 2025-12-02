// Auth utility functions and hooks
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push('/signin');
        }
    }, [router]);
};

export const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('access_token');
    }
    return null;
};

export const setToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', token);
        // Decode JWT to extract organization_id
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.organization_id) {
                localStorage.setItem('organization_id', payload.organization_id);
            }
        } catch (error) {
            console.error('Failed to decode token:', error);
        }
    }
};

export const removeToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('organization_id');
    }
};

export const getOrganizationId = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('organization_id');
    }
    return null;
};

export const isAuthenticated = (): boolean => {
    return !!getToken();
};
